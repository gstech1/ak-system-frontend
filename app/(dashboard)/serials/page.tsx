"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  approveSerialReject,
  createSerialBulk,
  getProducts,
  getSerials,
  rejectSerial,
  type Product,
  type Serial,
} from "@/lib/api";
import {
  BrowserMultiFormatReader,
} from "@zxing/browser";

import PermissionGuard from "@/components/auth/PermissionGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

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

export default function SerialsPage() {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const selectedProduct = products.find(
    (product) => product.id === productId,
  );

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
        productsData,
      ] = await Promise.all([
        getSerials(
          page,
          50,
          search,
          productId,
          status,
        ),
        getProducts(),
      ]);

      setSerials(serialsData.data);
      setTotal(serialsData.total);
      setTotalPages(
        serialsData.totalPages,
      );

      setProducts(productsData);
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
    productId,
    status,
  ]);

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

  function formatProductCompact(product: Product) {
  const type =
    product.category ||
    product.name ||
    product.productCode;

  const specs = [
    product.ratedCurrent,
    product.ratedVoltage,
    product.poles
      ? `${product.poles}P`
      : null,
  ].filter(Boolean);

  return `${type} · ${specs.join(" · ")}`;
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
    <h2 className="font-bold text-slate-900">
      Serial List
    </h2>
  </div>

  {loading ? (
    <div className="p-6 text-sm text-slate-500">
      Loading serials...
    </div>
  ) : serials.length === 0 ? (
    <div className="p-10 text-center text-sm text-slate-500">
      No serial numbers registered yet.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
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

            return (
  <tr
    key={serial.id}
    className="hover:bg-slate-50"
  >
    {/* Serial Number */}
    <td className="px-5 py-4 font-mono font-semibold text-slate-900">
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
</div>
            </div>
    </PermissionGuard>
  </DashboardShell>
);
}