"use client";

import {
  Fragment,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  approveSerialReject,
  createSerialBulk,
  deleteSerial,
  getDashboardSummary,
  getProducts,
  getSerials,
  getWarrantyPolicies,
  rejectSerial,
  updateSerialWarrantyPolicy,
  type Product,
  type Serial,
  type WarrantyPolicy,
} from "@/lib/api";
import {
  BrowserMultiFormatReader,
} from "@zxing/browser";

import PermissionGuard from "@/components/auth/PermissionGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import { getCurrentAuthUser } from "@/lib/current-user";

function formatSerial(serial: string) {
  const value = serial.replace(/\s+/g, "");

  if (!/^\d+$/.test(value)) {
    return serial;
  }

  if (value.length !== 9) {
    return serial;
  }

  return `${value.slice(0, 3)} ${value.slice(
    3,
    6,
  )} ${value.slice(6, 9)}`;
}

function normalizeSerialInput(value: string) {
  return value.replace(/\D/g, "");
}

function addMonths(value: string | null | undefined, months: number) {
  if (!value || !Number.isFinite(months)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  return date.toISOString();
}

function formatWarrantyDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function earlierDate(first: string | null, second: string | null) {
  if (!first) return second;
  if (!second) return first;
  return new Date(first).getTime() <= new Date(second).getTime() ? first : second;
}

function getSerialWarrantyDates(serial: Serial, product?: Product | null) {
  const policy = serial.warrantyPolicy ?? product?.warrantyPolicy;
  const code = (policy?.code ?? product?.warrantyPolicyCode ?? "").toUpperCase();
  const months = policy?.warrantyMonths ?? product?.warrantyPolicyMonths ?? product?.warrantyMonths ?? 12;
  const shipmentIsComplete =
    serial.status === "SHIPPED" || serial.status === "REGISTERED";
  const purchaseDate =
    serial.shippedAt ??
    (shipmentIsComplete ? serial.shipmentItem?.shipment?.shipmentDate ?? null : null);

  if (code === "A") {
    return { start: purchaseDate, end: addMonths(purchaseDate, months) };
  }
  if (code === "B" || code === "C") {
    const deadlineMonths = product?.warrantyRegistrationDeadlineMonths ?? product?.warrantyPolicy?.registrationDeadlineMonths ?? 12;
    return {
      start: purchaseDate,
      end: serial.warranty?.registerDate
        ? earlierDate(
            addMonths(serial.warranty.registerDate, months),
            addMonths(purchaseDate, months + deadlineMonths),
          )
        : addMonths(purchaseDate, months),
    };
  }
  if (code === "D" || code === "E") {
    return { start: serial.warranty?.warrantyStart ?? null, end: serial.warranty?.warrantyEnd ?? null };
  }

  const dealerPurchaseStart = (policy?.startRule ?? product?.warrantyStartRule) === "DEALER_PURCHASE";
  return {
    start: serial.warranty?.warrantyStart ?? (dealerPurchaseStart ? purchaseDate : null),
    end: serial.warranty?.warrantyEnd ?? (dealerPurchaseStart ? addMonths(purchaseDate, months) : null),
  };
}

export default function SerialsPage() {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warrantyPolicies, setWarrantyPolicies] = useState<WarrantyPolicy[]>([]);

    const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSerialId, setDeletingSerialId] =
    useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEditWarrantyType, setCanEditWarrantyType] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingWarrantySerial, setEditingWarrantySerial] = useState<Serial | null>(null);
  const [selectedWarrantyPolicyId, setSelectedWarrantyPolicyId] = useState("");
  const [warrantyPolicySaving, setWarrantyPolicySaving] = useState(false);
  const [warrantyPolicyError, setWarrantyPolicyError] = useState("");

  /* ======================================================
     REJECT / APPROVE REJECT
     ====================================================== */

  const [rejectSerialItem, setRejectSerialItem] =
    useState<Serial | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [rejectSaving, setRejectSaving] =
    useState(false);

  const [rejectError, setRejectError] =
    useState("");

  const [rejectSuccess, setRejectSuccess] =
    useState("");

  const [productId, setProductId] = useState("");

  /* ======================================================
     PAGINATION / FILTER
     ====================================================== */

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [serialCounts, setSerialCounts] = useState<{ total: number; inStock: number; shipped: number } | null>(null);

  const [search, setSearch] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rangeStartInput, setRangeStartInput] = useState("");
  const [rangeEndInput, setRangeEndInput] = useState("");
  const [status, setStatus] = useState("");

  /* ======================================================
     SCANNER
     ====================================================== */

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const scannerRef =
    useRef<BrowserMultiFormatReader | null>(null);

  const scannerControlsRef =
    useRef<{ stop: () => void } | null>(null);

  const scanTargetRef =
    useRef<"start" | "end" | null>(null);

  const scannerSessionRef =
    useRef(0);

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [scanTarget, setScanTarget] =
    useState<"start" | "end" | null>(null);

  /* ======================================================
     SERIAL FORM
     ====================================================== */

  const [startSerial, setStartSerial] =
    useState("");

  const [endSerial, setEndSerial] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ======================================================
     LOAD DATA
     ====================================================== */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        serialsData,
        dashboardSummary,
        productsData,
        warrantyPoliciesData,
      ] = await Promise.all([
        getSerials(
          page,
          50,
          search,
          "",
          status,
          rangeStart,
          rangeEnd,
        ),
        getDashboardSummary().catch(() => null),
        getProducts(),
        getWarrantyPolicies(),
      ]);

      setSerials(serialsData.data);
      setTotal(serialsData.total);
      setTotalPages(
        serialsData.totalPages,
      );
      setSerialCounts(dashboardSummary ? {
        total: dashboardSummary.serials.total,
        inStock: dashboardSummary.serials.inStock,
        shipped: dashboardSummary.serials.shipped,
      } : null);

      setProducts(productsData);
      setWarrantyPolicies(warrantyPoliciesData.filter((policy) => policy.isActive));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load serial data.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    rangeStart,
    rangeEnd,
    status,
  ]);

  function applySerialFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Boolean(rangeStartInput.trim()) !== Boolean(rangeEndInput.trim())) {
      setError("Enter both the first and last serial number for a range search.");
      return;
    }
    setError("");
    setPage(1);
    setSearch(searchInput.trim());
    setRangeStart(rangeStartInput.trim());
    setRangeEnd(rangeEndInput.trim());
  }

  function clearSerialFilters() {
    setSearchInput("");
    setRangeStartInput("");
    setRangeEndInput("");
    setSearch("");
    setRangeStart("");
    setRangeEnd("");
    setPage(1);
  }

  useEffect(() => {
    try {
      const authUser = getCurrentAuthUser();

      setIsAdmin(authUser?.role === "ADMIN");
      setCanEditWarrantyType(
        ["ADMIN", "BOSS", "MANAGER"].includes(authUser?.role ?? ""),
      );
    } catch {
      setIsAdmin(false);
      setCanEditWarrantyType(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ======================================================
     FORM RESET
     ====================================================== */

  function resetSerialFields() {
    setStartSerial("");
    setEndSerial("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setProductId("");
    resetSerialFields();
    setError("");
  }

  /* ======================================================
     OPEN SCANNER
     ====================================================== */

  function openScanner(
    target: "start" | "end",
  ) {
    setError("");

    scanTargetRef.current = target;
    setScanTarget(target);

    if (target === "start") {
      setStartSerial("");
    } else {
      setEndSerial("");
    }

    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;

    setScannerOpen(false);

    setTimeout(() => {
      setScannerOpen(true);
    }, 150);
  }

  /* ======================================================
     BARCODE SCANNER
     ====================================================== */

  useEffect(() => {
    if (
      !scannerOpen ||
      !videoRef.current
    ) {
      return;
    }

    const sessionId =
      scannerSessionRef.current + 1;

    scannerSessionRef.current =
      sessionId;

    let cancelled = false;

    let controls:
      | { stop: () => void }
      | null = null;

    const reader =
      new BrowserMultiFormatReader();

    scannerRef.current = reader;

    const startScanner =
      async () => {
        try {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                500,
              ),
          );

          if (
            cancelled ||
            scannerSessionRef.current !==
              sessionId ||
            !videoRef.current
          ) {
            return;
          }

          const cameraControls =
            await reader.decodeFromConstraints(
              {
                video: {
                  facingMode: {
                    ideal: "environment",
                  },
                },
              },
              videoRef.current,
              (result) => {
                if (
                  !result ||
                  cancelled ||
                  scannerSessionRef.current !==
                    sessionId
                ) {
                  return;
                }

                const scannedValue =
                  result
                    .getText()
                    .replace(/\s+/g, "")
                    .trim();

                /* Serial must be exactly 9 digits */
                if (
                  !/^\d{9}$/.test(
                    scannedValue,
                  )
                ) {
                  return;
                }

                const target =
                  scanTargetRef.current;

                if (
                  target === "start"
                ) {
                  setStartSerial(
                    scannedValue,
                  );
                } else if (
                  target === "end"
                ) {
                  setEndSerial(
                    scannedValue,
                  );
                } else {
                  return;
                }

                setError("");

                cancelled = true;

                cameraControls.stop();
                controls?.stop();

                scannerControlsRef.current =
                  null;

                scannerRef.current =
                  null;

                setScannerOpen(false);
                scanTargetRef.current =
                  null;
              },
            );

          if (
            cancelled ||
            scannerSessionRef.current !==
              sessionId
          ) {
            cameraControls.stop();
            return;
          }

          controls =
            cameraControls;

          scannerControlsRef.current =
            cameraControls;
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error(err);

          setError(
            "Unable to access camera. Please allow camera permission and try again.",
          );

          setScannerOpen(false);
          scanTargetRef.current =
            null;
        }
      };

    startScanner();

    return () => {
      cancelled = true;

      controls?.stop();
      scannerControlsRef.current?.stop();

      scannerControlsRef.current =
        null;

      scannerRef.current =
        null;
    };
  }, [scannerOpen]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const start = normalizeSerialInput(
      startSerial,
    );

    const end = normalizeSerialInput(
      endSerial,
    );

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (!start || !end) {
      setError(
        "Please enter both Start Serial and End Serial.",
      );
      return;
    }

    if (
      start.length !== 9 ||
      end.length !== 9
    ) {
      setError(
        "Serial numbers must contain 9 digits.",
      );
      return;
    }

    const startNumber = Number(start);
    const endNumber = Number(end);

    if (endNumber < startNumber) {
      setError(
        "End Serial must be greater than or equal to Start Serial.",
      );
      return;
    }

    const quantity =
      endNumber - startNumber + 1;

    if (quantity > 1000000) {
      setError(
        "Maximum 1,000,000 serial numbers can be registered at once.",
      );
      return;
    }

    try {
      setSaving(true);

      const result =
        await createSerialBulk({
          startSerial: start,
          endSerial: end,
          productId,
        });

      await loadData();

      if (result.duplicates > 0) {
        setSuccess(
          `${result.registered} serial${
            result.registered > 1 ? "s" : ""
          } registered successfully. ${
            result.duplicates
          } duplicate${
            result.duplicates > 1
              ? "s were"
              : " was"
          } skipped.`,
        );
      } else {
        setSuccess(
          `${result.registered} serial${
            result.registered > 1 ? "s" : ""
          } registered successfully.`,
        );
      }

      setStartSerial("");
      setEndSerial("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to register serials.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ======================================================
     REJECT / APPROVE REJECT HANDLERS
     ====================================================== */

  async function handleRejectSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!rejectSerialItem) {
      return;
    }

    if (!rejectReason.trim()) {
      setRejectError(
        "Please enter a rejection reason.",
      );
      return;
    }

    try {
      setRejectSaving(true);
      setRejectError("");
      setRejectSuccess("");

      await rejectSerial(
        rejectSerialItem.serialNumber,
        rejectReason.trim(),
      );

      setRejectSuccess(
        `Serial ${formatSerial(
          rejectSerialItem.serialNumber,
        )} rejection request submitted successfully.`,
      );

      setRejectSerialItem(null);
      setRejectReason("");

      await loadData();
    } catch (err) {
      console.error(err);

      setRejectError(
        err instanceof Error
          ? err.message
          : "Unable to request serial rejection.",
      );
    } finally {
      setRejectSaving(false);
    }
  }

  async function handleApproveReject(
    serialNumber: string,
  ) {
    try {
      setRejectSaving(true);
      setRejectError("");
      setRejectSuccess("");

      await approveSerialReject(
        serialNumber,
      );

      setRejectSuccess(
        `Serial ${formatSerial(
          serialNumber,
        )} rejection approved successfully.`,
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setRejectError(
        err instanceof Error
          ? err.message
          : "Unable to approve serial rejection.",
      );
    } finally {
      setRejectSaving(false);
    }
  }

  async function handleDeleteSerial(serial: Serial) {
    if (!isAdmin) {
      return;
    }

    const formattedSerial = formatSerial(
      serial.serialNumber,
    );

    if (
      !window.confirm(
        `Delete serial ${formattedSerial}? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingSerialId(serial.id);
      setError("");
      setSuccess("");

      await deleteSerial(serial.serialNumber);

      setSuccess(
        `Serial ${formattedSerial} deleted successfully.`,
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete serial.",
      );
    } finally {
      setDeletingSerialId(null);
    }
  }

  function openWarrantyTypeEditor(serial: Serial) {
    const product = serial.product || serial.shipmentItem?.product;
    if (!product) {
      setError("This serial is not linked to a product, so its warranty type cannot be edited.");
      return;
    }

    setError("");
    setSuccess("");
    setWarrantyPolicyError("");
    setSelectedWarrantyPolicyId(
      serial.warrantyPolicyId ?? serial.warrantyPolicy?.id ?? product.warrantyPolicyId ?? product.warrantyPolicy?.id ?? "",
    );
    setEditingWarrantySerial(serial);
  }

  async function handleWarrantyTypeSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingWarrantySerial || !selectedWarrantyPolicyId) return;

    try {
      setWarrantyPolicySaving(true);
      setWarrantyPolicyError("");
      await updateSerialWarrantyPolicy(
        editingWarrantySerial.serialNumber,
        selectedWarrantyPolicyId,
      );
      setEditingWarrantySerial(null);
      setSuccess(`Warranty type updated for serial ${formatSerial(editingWarrantySerial.serialNumber)}.`);
      await loadData();
    } catch (err) {
      setWarrantyPolicyError(
        err instanceof Error ? err.message : "Unable to update warranty type.",
      );
    } finally {
      setWarrantyPolicySaving(false);
    }
  }

  function formatProductCompact(product: Product) {
  const specs = [
    product.ratedCurrent,
    product.ratedVoltage,
    product.poles
      ? `${product.poles}P`
      : null,
  ].filter(Boolean);

  const identity = [
    product.productCode,
    product.name,
    product.modelCode,
  ].filter(Boolean);

  return [...identity, ...specs].join(" · ");
}

  return (
  <DashboardShell>
    <PermissionGuard permission="SERIALS_VIEW">
      <div className="space-y-6">

        {/* Camera Scanner Modal */}
        {scannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Scan Serial Number
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Scan{" "}
                    {scanTarget === "start"
                      ? "Start"
                      : "End"}{" "}
                    Serial
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setScannerOpen(false)
                  }
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="bg-black p-3">
                <video
                  ref={videoRef}
                  className="aspect-video w-full rounded-xl object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              <div className="px-5 py-4 text-center text-sm text-slate-500">
                Point the camera at the serial barcode.
              </div>

            </div>
          </div>
        )}

        {/* Reject Serial Modal */}
        {rejectSerialItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="border-b border-slate-200 px-6 py-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Reject Serial
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Serial Number:{" "}
                  <span className="font-mono font-semibold text-slate-700">
                    {formatSerial(
                      rejectSerialItem.serialNumber,
                    )}
                  </span>
                </p>
              </div>

              <form
                onSubmit={handleRejectSubmit}
                className="space-y-5 p-6"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Rejection Reason
                  </label>

                  <textarea
                    value={rejectReason}
                    onChange={(event) => {
                      setRejectReason(
                        event.target.value,
                      );
                      setRejectError("");
                    }}
                    placeholder="Enter rejection reason..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    autoFocus
                  />
                </div>

                {rejectError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {rejectError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectSerialItem(null);
                      setRejectReason("");
                      setRejectError("");
                    }}
                    disabled={rejectSaving}
                    className="h-11 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      rejectSaving ||
                      !rejectReason.trim()
                    }
                    className="h-11 rounded-xl bg-red-600 px-5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rejectSaving
                      ? "Submitting..."
                      : "Submit Reject"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Edit Warranty Type Modal */}
        {editingWarrantySerial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-200 px-6 py-5">
                <h3 className="text-lg font-bold text-slate-900">Edit Warranty Type</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Serial {formatSerial(editingWarrantySerial.serialNumber)} · {(editingWarrantySerial.product || editingWarrantySerial.shipmentItem?.product)?.productCode}
                </p>
              </div>
              <form onSubmit={handleWarrantyTypeSave} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="serial-warranty-policy">
                    Warranty Type
                  </label>
                  <select
                    id="serial-warranty-policy"
                    value={selectedWarrantyPolicyId}
                    onChange={(event) => setSelectedWarrantyPolicyId(event.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select warranty type</option>
                    {warrantyPolicies.map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.code} — {policy.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  This change applies only to this serial number. Other serials linked to the same product keep their current warranty type.
                </div>

                {warrantyPolicyError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {warrantyPolicyError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingWarrantySerial(null)}
                    disabled={warrantyPolicySaving}
                    className="h-11 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={warrantyPolicySaving || !selectedWarrantyPolicyId}
                    className="h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {warrantyPolicySaving ? "Saving..." : "Save Type"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Header */}
<div className="flex items-center justify-between">
  <PageTitle
    title="Serial Numbers"
    subtitle="Register and manage warehouse serial numbers."
  />

  <button
    type="button"
    onClick={() => {
      setError("");
      setSuccess("");
      setProductId("");
      setStartSerial("");
      setEndSerial("");
      setScanTarget(null);
      scanTargetRef.current = null;
      setScannerOpen(false);
      setShowForm(true);
    }}
    className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
  >
    + Register Serial
  </button>
</div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* Register Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Register Warehouse Serials
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a product and register a serial range.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Product */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product
              </label>
              <select
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productCode} — {product.name}
                  </option>
                ))}
              </select>
            </div>

               {/* Serial Range */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* Start Serial */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Serial
                  </label>

                  <div className="flex gap-2">
                    <input
                      value={formatSerial(startSerial)}
                      onChange={(event) => {
                        setStartSerial(
                          normalizeSerialInput(
                            event.target.value,
                          ),
                        );
                        setError("");
                      }}
                      placeholder="000 000 001"
                      inputMode="numeric"
                      maxLength={11}
                      className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-mono outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        openScanner("start")
                      }
                      className="h-12 w-14 shrink-0 rounded-xl border border-slate-300 bg-white text-xl transition hover:bg-slate-50"
                      title="Scan Start Serial"
                      aria-label="Scan Start Serial"
                    >
                      📷
                    </button>
                  </div>
                </div>

                {/* End Serial */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Serial
                  </label>

                  <div className="flex gap-2">
                    <input
                      value={formatSerial(endSerial)}
                      onChange={(event) => {
                        setEndSerial(
                          normalizeSerialInput(
                            event.target.value,
                          ),
                        );
                        setError("");
                      }}
                      placeholder="Leave blank for single serial"
                      inputMode="numeric"
                      maxLength={11}
                      className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-mono outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        openScanner("end")
                      }
                      className="h-12 w-14 shrink-0 rounded-xl border border-slate-300 bg-white text-xl transition hover:bg-slate-50"
                      title="Scan End Serial"
                      aria-label="Scan End Serial"
                    >
                      📷
                    </button>
                  </div>
                </div>
              </div>

              {/* Received Date */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="text-sm font-semibold text-slate-700">
                  Received Date
                </div>

                <div className="mt-1 text-sm text-emerald-700">
                  Automatically set to today when registered.
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="h-12 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 rounded-xl bg-emerald-600 px-6 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Registering..."
                    : "Register Serials"}
                </button>
              </div>
          </form>
        </div>
      )}

   {/* Serial List */}
<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 px-6 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold text-slate-900">Serial List</h2>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">Total: {serialCounts?.total ?? "—"}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">In Stock: {serialCounts?.inStock ?? "—"}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">Shipped: {serialCounts?.shipped ?? "—"}</span>
      </div>
    </div>
    <form onSubmit={applySerialFilters} className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
      <input
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="Search one serial number..."
        aria-label="Search one serial number"
        className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500"
      />
      <input
        value={rangeStartInput}
        onChange={(event) => setRangeStartInput(event.target.value)}
        placeholder="Start serial number"
        aria-label="Start serial number"
        className="h-11 rounded-xl border border-slate-300 px-3 font-mono text-sm outline-none focus:border-emerald-500"
      />
      <input
        value={rangeEndInput}
        onChange={(event) => setRangeEndInput(event.target.value)}
        placeholder="End serial number"
        aria-label="End serial number"
        className="h-11 rounded-xl border border-slate-300 px-3 font-mono text-sm outline-none focus:border-emerald-500"
      />
      <button type="submit" className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">
        Search
      </button>
      <button type="button" onClick={clearSerialFilters} className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">
        Clear
      </button>
    </form>
    <p className="mt-2 text-xs text-slate-500">Range search includes both the start and end serial numbers.</p>
  </div>

  {loading ? (
    <div className="p-6 text-sm text-slate-500">
      Loading serials...
    </div>
  ) : serials.length === 0 ? (
    <div className="p-10 text-center text-sm text-slate-500">
      {search || rangeStart || rangeEnd ? "No serial numbers match this search." : "No serial numbers registered yet."}
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1300px] text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-[120px] whitespace-nowrap px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Serial Number
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Product
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Received
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Shipped
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Type
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              W-start
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              W-end
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Status
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {serials.map((serial) => {
            const product =
              serial.product ||
              serial.shipmentItem?.product;
            const warrantyDates = getSerialWarrantyDates(serial, product);

            return (
  <tr
    key={serial.id}
    className="hover:bg-slate-50"
  >
    {/* Serial Number */}
    <td className="w-[120px] whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-900">
      {formatSerial(serial.serialNumber)}
    </td>

    {/* Product */}
    <td className="px-5 py-4 text-sm text-slate-700">
      {serial.status === "REJECTED" ? (
        <span className="font-semibold text-red-600">
          REJECTED
        </span>
      ) : serial.status === "REJECT_PENDING" ? (
        <span className="font-semibold text-amber-600">
          REJECT PENDING
        </span>
      ) : product ? (
        <span className="whitespace-nowrap">
          {formatProductCompact(product)}
        </span>
      ) : (
        "—"
      )}
    </td>

    {/* Received */}
    <td className="px-5 py-4 text-sm text-slate-600">
      {serial.receivedAt
        ? new Date(
            serial.receivedAt,
          ).toLocaleDateString()
        : "-"}
    </td>

    {/* Shipped */}
    <td className="px-5 py-4 text-sm text-slate-600">
      {serial.shippedAt
        ? new Date(
            serial.shippedAt,
          ).toLocaleDateString()
        : "-"}
    </td>

    {/* Warranty policy type */}
    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
      {serial.warrantyPolicy?.code ?? product?.warrantyPolicyCode ?? product?.warrantyPolicy?.code ?? "—"}
    </td>

    {/* Warranty start */}
    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
      {formatWarrantyDate(warrantyDates.start)}
    </td>

    {/* Warranty end */}
    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
      {formatWarrantyDate(warrantyDates.end)}
    </td>

    {/* Status */}
    <td className="px-5 py-4">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
          serial.status === "REJECTED"
            ? "bg-red-100 text-red-700"
            : serial.status ===
                "REJECT_PENDING"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {serial.status}
      </span>
    </td>

    {/* Actions */}
    <td className="px-5 py-4">
      <div className="flex items-center gap-2">
        {canEditWarrantyType && serial.status === "IN_STOCK" && (
          <button
            type="button"
            onClick={() => openWarrantyTypeEditor(serial)}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            Edit Type
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => handleDeleteSerial(serial)}
            disabled={deletingSerialId === serial.id}
            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingSerialId === serial.id
              ? "Deleting..."
              : "Delete"}
          </button>
        )}

        {(serial.status === "IN_STOCK" ||
          serial.status === "REGISTERED") && (
          <button
            type="button"
            onClick={() => {
              setRejectSerialItem(serial);
              setRejectReason("");
              setRejectError("");
              setRejectSuccess("");
            }}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
          >
            Reject
          </button>
        )}

        {serial.status ===
          "REJECT_PENDING" && (
          <button
            type="button"
            onClick={() =>
              handleApproveReject(
                serial.serialNumber,
              )
            }
            disabled={rejectSaving}
            className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rejectSaving
              ? "Approving..."
              : "Approve Reject"}
          </button>
        )}

        {serial.status === "REJECTED" && (
          <span className="text-xs font-semibold text-slate-400">
            Rejected
          </span>
        )}

        {![
          "IN_STOCK",
          "REGISTERED",
          "REJECT_PENDING",
          "REJECTED",
        ].includes(serial.status) && (
          <span className="text-xs text-slate-400">
            —
          </span>
        )}
      </div>
    </td>
  </tr>
);
            })}
        </tbody>
      </table>
    </div>
  )}
  {!loading && totalPages > 0 && (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
      <p className="text-sm text-slate-600">
        Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
        {Array.from(new Set([1, page - 2, page - 1, page, page + 1, page + 2, totalPages]))
          .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
          .sort((a, b) => a - b)
          .map((pageNumber, index, pages) => (
            <Fragment key={pageNumber}>
              {index > 0 && pageNumber - pages[index - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
              <button type="button" onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? "page" : undefined} className={`min-w-10 rounded-lg border px-3 py-2 text-sm ${page === pageNumber ? "border-emerald-600 bg-emerald-600 font-bold text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                {pageNumber}
              </button>
            </Fragment>
          ))}
        <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">Next</button>
      </div>
    </div>
  )}
</div>
            </div>
    </PermissionGuard>
  </DashboardShell>
);
}
