"use client";

import { useEffect, useMemo, useState } from "react";
import MTKSolarShell from "@/components/layout/MTKSolarShell";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

const MTK_SOLAR_WAREHOUSE_ID =
  "03398d3f-a459-42b4-9f89-f85bd524701c";

type Product = {
  id: string;
  productCode: string;
  productName?: string | null;
  trackingType?: "UNIT" | "QUANTITY";
};

type ServiceReturnItem = {
  id: string;
  returnedQuantity: number;
  usedQuantity: number;
  returnedBarcodes?: string[] | null;
  usedBarcodes?: string[] | null;
  createdAt: string;
};

type ServiceIssueItem = {
  id: string;
  productId: string;
  quantity: number;
  issuedBarcodes?: string[] | null;
  product: Product;
  serviceReturns?: ServiceReturnItem[];
};

type ServiceIssue = {
  id: string;
  serviceIssueNo: string;
  serviceTeam: string;
  remark?: string | null;
  status: string;
  issuedDate: string;
  items: ServiceIssueItem[];
};

type ReturnInput = {
  issueItemId: string;
  productId: string;
  barcode: string;
  issuedQuantity: number;
  remainingQuantity: number;
  returnQuantity: number;
  usedQuantity: number;
  trackByBarcode: boolean;
  returnedBarcodes: string[];
  usedBarcodes: string[];
};

export default function ServiceReturnPage() {
  const [serviceIssues, setServiceIssues] = useState<ServiceIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState("");

  const warehouseId = MTK_SOLAR_WAREHOUSE_ID;

  const [createdById, setCreatedById] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scanDisposition, setScanDisposition] = useState<"RETURNED" | "USED">("RETURNED");
  const [items, setItems] = useState<ReturnInput[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    loadServiceIssues();

    const authUserRaw = localStorage.getItem("authUser");

    if (authUserRaw) {
      try {
        const authUser = JSON.parse(authUserRaw);
        setIsSuperAdmin(authUser?.role === "ADMIN");

        if (authUser?.id) {
          setCreatedById(authUser.id);
        }
      } catch {
        // Ignore invalid localStorage value.
      }
    }
  }, []);

  async function deleteReturn(returnItem: ServiceReturnItem) {
    if (!window.confirm("Delete this Service Return record? Returned quantities will be removed from warehouse stock.")) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { setError("Please sign in again to delete this record."); return; }
    try {
      setDeletingId(returnItem.id);
      const response = await fetch(`${API_BASE_URL}/service-return/${returnItem.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Unable to delete Service Return.");
      setMessage("Service Return deleted.");
      await loadServiceIssues();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete Service Return."); }
    finally { setDeletingId(""); }
  }

  async function loadServiceIssues() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/service-return`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load Service Issue history.",
        );
      }

      const data = await response.json();

      setServiceIssues(
        Array.isArray(data) ? data : [],
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to load Service Issue history.",
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedIssue = useMemo(() => {
    return serviceIssues.find(
      (issue) =>
        issue.id === selectedIssueId,
    );
  }, [
    serviceIssues,
    selectedIssueId,
  ]);

  function getProcessedQuantity(
    issueItem: ServiceIssueItem,
  ) {
    const returns =
      issueItem.serviceReturns || [];

    const returned = returns.reduce(
      (sum, row) =>
        sum +
        Number(
          row.returnedQuantity || 0,
        ),
      0,
    );

    const used = returns.reduce(
      (sum, row) =>
        sum +
        Number(
          row.usedQuantity || 0,
        ),
      0,
    );

    return {
      returned,
      used,
      remaining:
        Number(issueItem.quantity) -
        returned -
        used,
    };
  }

  function selectIssue(issueId: string) {
    setSelectedIssueId(issueId);

    setItems([]);
    setBarcode("");
    setScanDisposition("RETURNED");
    setMessage("");
    setError("");
  }

  function addBarcode() {
    const scanned = barcode.trim();

    if (!scanned) {
      return;
    }

    if (!selectedIssue) {
      setError(
        "Please select a Service Issue first.",
      );
      return;
    }

    const issueItem =
      selectedIssue.items.find(
        (item) =>
          item.issuedBarcodes?.includes(scanned) ||
          item.product.productCode === scanned ||
          item.product.id === scanned,
      );

    if (!issueItem) {
      setError(
        `Barcode/Product not found in Service Issue: ${scanned}`,
      );
      return;
    }

    const processed =
      getProcessedQuantity(issueItem);

    if (processed.remaining <= 0) {
      setError(
        `${issueItem.product.productCode} has already been completely processed.`,
      );

      setBarcode("");
      return;
    }

    const existing =
      items.find(
        (item) =>
          item.issueItemId ===
          issueItem.id,
      );

    const issuedBarcodes = Array.isArray(issueItem.issuedBarcodes)
      ? issueItem.issuedBarcodes
      : [];
    const trackByBarcode = issuedBarcodes.length > 0;

    if (trackByBarcode) {
      if (!issuedBarcodes.includes(scanned)) {
        setError(`${scanned} is not one of the barcodes issued on this Service Issue.`);
        setBarcode("");
        return;
      }
      const alreadyProcessed = (issueItem.serviceReturns || []).some((row) =>
        [...(row.returnedBarcodes || []), ...(row.usedBarcodes || [])].includes(scanned),
      );
      if (alreadyProcessed) {
        setError(`${scanned} has already been processed.`);
        setBarcode("");
        return;
      }
      if (existing?.returnedBarcodes.includes(scanned) || existing?.usedBarcodes.includes(scanned)) {
        setError(`${scanned} has already been scanned in this return.`);
        setBarcode("");
        return;
      }

      const returnedBarcodes = [...(existing?.returnedBarcodes || [])];
      const usedBarcodes = [...(existing?.usedBarcodes || [])];
      if (scanDisposition === "RETURNED") returnedBarcodes.push(scanned);
      else usedBarcodes.push(scanned);

      const nextItem: ReturnInput = {
        issueItemId: issueItem.id,
        productId: issueItem.productId,
        barcode: issueItem.product.productCode,
        issuedQuantity: Number(issueItem.quantity),
        remainingQuantity: processed.remaining,
        returnQuantity: returnedBarcodes.length,
        usedQuantity: usedBarcodes.length,
        trackByBarcode: true,
        returnedBarcodes,
        usedBarcodes,
      };
      setItems((current) => existing
        ? current.map((item) => item.issueItemId === issueItem.id ? nextItem : item)
        : [...current, nextItem]);
      setBarcode("");
      setError("");
      return;
    }

    if (issueItem.product.productCode !== scanned && issueItem.product.id !== scanned) {
      setError(`This Service Issue has no individual barcode history for ${scanned}. Scan the product code for quantity-tracked or older records.`);
      setBarcode("");
      return;
    }

    if (existing) {
      setError(
        `${issueItem.product.productCode} is already added.`,
      );

      setBarcode("");
      return;
    }

    setItems((current) => [
      ...current,
      {
        issueItemId: issueItem.id,
        productId: issueItem.productId,
        barcode:
          issueItem.product.productCode,
        issuedQuantity:
          Number(issueItem.quantity),
        remainingQuantity:
          processed.remaining,
        returnQuantity:
          processed.remaining,
        usedQuantity: 0,
        trackByBarcode: false,
        returnedBarcodes: [],
        usedBarcodes: [],
      },
    ]);

    setBarcode("");
    setError("");
  }

  function updateItem(
    issueItemId: string,
    field:
      | "returnQuantity"
      | "usedQuantity",
    value: number,
  ) {
    setItems((current) =>
      current.map((item) => {
        if (
          item.issueItemId !==
          issueItemId
        ) {
          return item;
        }

        const safeValue =
          Number.isFinite(value)
            ? Math.max(
                0,
                Math.floor(value),
              )
            : 0;

        const maximum =
          item.remainingQuantity;

        if (
          field ===
          "returnQuantity"
        ) {
          const returnQuantity =
            Math.min(
              safeValue,
              maximum,
            );

          return {
            ...item,
            returnQuantity,
            usedQuantity:
              maximum -
              returnQuantity,
          };
        }

        const usedQuantity =
          Math.min(
            safeValue,
            maximum,
          );

        return {
          ...item,
          usedQuantity,
          returnQuantity:
            maximum -
            usedQuantity,
        };
      }),
    );
  }

  function removeItem(
    issueItemId: string,
  ) {
    setItems((current) =>
      current.filter(
        (item) =>
          item.issueItemId !==
          issueItemId,
      ),
    );
  }

  async function submitReturn() {
    if (!selectedIssue) {
      setError(
        "Please select a Service Issue.",
      );
      return;
    }

    if (!warehouseId) {
      setError(
        "Warehouse ID is required.",
      );
      return;
    }

    if (!createdById) {
      setError(
        "Current user ID is required.",
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Please scan at least one item.",
      );
      return;
    }

    for (const item of items) {
      const processedCount = item.returnQuantity + item.usedQuantity;
      if (item.trackByBarcode
        ? processedCount !== item.returnedBarcodes.length + item.usedBarcodes.length || processedCount === 0 || processedCount > item.remainingQuantity
        : processedCount !== item.remainingQuantity) {
        setError(
          `${item.barcode}: Return + Used must equal remaining quantity (${item.remainingQuantity}).`,
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          `${API_BASE_URL}/service-return`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              warehouseId,
              serviceIssueId:
                selectedIssue.id,
              createdById,
              items: items.map(
                (item) => ({
                  issueItemId:
                    item.issueItemId,
                  returnQuantity:
                    item.returnQuantity,
                  usedQuantity:
                    item.usedQuantity,
                  ...(item.trackByBarcode
                    ? {
                        returnedBarcodes: item.returnedBarcodes,
                        usedBarcodes: item.usedBarcodes,
                      }
                    : {}),
                }),
              ),
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to save Service Return.",
        );
      }

      setMessage(
        data?.message ||
          "Service Return completed successfully.",
      );

      setItems([]);
      setBarcode("");

      await loadServiceIssues();
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to save Service Return.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
  <MTKSolarShell>
    {/* MAIN AREA */}
    <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* PAGE HEADER */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Service Return
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Return service-issued products or
              record products used during service.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {/* =================================================
              SERVICE ISSUE HISTORY
          ================================================= */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Service Issue History
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select a previous Service Issue
                  to process its returned / used
                  products.
                </p>
              </div>

              <button
                type="button"
                onClick={loadServiceIssues}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading Service Issues...
              </div>
            ) : serviceIssues.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                No Service Issue records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-3 py-3 font-semibold">
                        Issue No
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Date
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Service Team
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Items
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Status
                      </th>

                      <th className="px-3 py-3 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {serviceIssues.map(
                      (issue) => {
                        const active =
                          issue.id ===
                          selectedIssueId;

                        return (
                          <tr
                            key={issue.id}
                            className={`border-b border-slate-100 ${
                              active
                                ? "bg-emerald-50"
                                : ""
                            }`}
                          >
                            <td className="px-3 py-3 font-medium">
                              {
                                issue.serviceIssueNo
                              }
                            </td>

                            <td className="px-3 py-3">
                              {new Date(
                                issue.issuedDate,
                              ).toLocaleDateString()}
                            </td>

                            <td className="px-3 py-3">
                              {
                                issue.serviceTeam
                              }
                            </td>

                            <td className="px-3 py-3">
                              {
                                issue.items.length
                              }
                            </td>

                            <td className="px-3 py-3">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                {
                                  issue.status
                                }
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  selectIssue(
                                    issue.id,
                                  )
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-medium text-white ${
                                  active
                                    ? "bg-emerald-600"
                                    : "bg-slate-900 hover:bg-slate-700"
                                }`}
                              >
                                {active
                                  ? "Selected"
                                  : "Select"}
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =================================================
              SELECTED SERVICE ISSUE - HISTORY
          ================================================= */}
          {selectedIssue && (
            <>
              <section className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900">
                        {
                          selectedIssue.serviceIssueNo
                        }
                      </h2>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {
                          selectedIssue.status
                        }
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Service Team:{" "}
                      <span className="font-medium text-slate-700">
                        {
                          selectedIssue.serviceTeam
                        }
                      </span>
                    </p>

                    {selectedIssue.remark && (
                      <p className="mt-1 text-xs text-slate-400">
                        Remark:{" "}
                        {
                          selectedIssue.remark
                        }
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      Issued Date
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {new Date(
                        selectedIssue.issuedDate,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Issued Product History
                  </h3>

                  <span className="text-xs text-slate-500">
                    {
                      selectedIssue.items
                        .length
                    }{" "}
                    product item(s)
                  </span>
                </div>

{/* =================================================
    SERVICE RETURN TRANSACTION HISTORY
================================================= */}

<div className="mt-6">
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-sm font-semibold text-slate-900">
      Service Return History
    </h3>

    <span className="text-xs text-slate-500">
      Previous return / used transactions
    </span>
  </div>

  <div className="overflow-x-auto rounded-lg border border-slate-200">
    <table className="w-full min-w-[800px] text-sm">
      <thead className="bg-slate-50">
        <tr className="text-left">
          <th className="px-3 py-3 font-semibold">
            Product
          </th>

          <th className="px-3 py-3 font-semibold text-center">
            Returned
          </th>

          <th className="px-3 py-3 font-semibold text-center">
            Used
          </th>

          <th className="px-3 py-3 font-semibold">
            Date
          </th>
          {isSuperAdmin && <th className="px-3 py-3 text-right font-semibold">Action</th>}
        </tr>
      </thead>

      <tbody>
        {selectedIssue.items.flatMap((issueItem) =>
          (issueItem.serviceReturns || []).map(
            (returnItem) => (
              <tr
                key={returnItem.id}
                className="border-t border-slate-100"
              >
                <td className="px-3 py-3">
                  <div className="font-semibold text-slate-900">
                    {issueItem.product.productCode}
                  </div>

                  <div className="text-xs text-slate-500">
                    {issueItem.product.productName || "-"}
                  </div>
                </td>

                <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                  {returnItem.returnedQuantity}
                </td>

                <td className="px-3 py-3 text-center font-semibold text-orange-600">
                  {returnItem.usedQuantity}
                </td>

                <td className="px-3 py-3 text-slate-500">
                  {returnItem.createdAt
                    ? new Date(
                        returnItem.createdAt,
                      ).toLocaleString()
                    : "-"}
                </td>
                {isSuperAdmin && <td className="px-3 py-3 text-right"><button type="button" disabled={deletingId === returnItem.id} onClick={() => void deleteReturn(returnItem)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{deletingId === returnItem.id ? "Deleting…" : "Delete"}</button></td>}
              </tr>
            ),
          ),
        )}

        {selectedIssue.items.every(
          (issueItem) =>
            !issueItem.serviceReturns ||
            issueItem.serviceReturns.length === 0,
        ) && (
          <tr>
            <td
              colSpan={isSuperAdmin ? 5 : 4}
              className="px-3 py-8 text-center text-sm text-slate-400"
            >
              No service return transactions yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>


                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left">
                        <th className="px-3 py-3 font-semibold">
                          Product
                        </th>

                        <th className="px-3 py-3 font-semibold">
                          Product Name
                        </th>

                        <th className="px-3 py-3 font-semibold text-center">
                          Issued
                        </th>

                        <th className="px-3 py-3 font-semibold text-center">
                          Returned
                        </th>

                        <th className="px-3 py-3 font-semibold text-center">
                          Used
                        </th>

                        <th className="px-3 py-3 font-semibold text-center">
                          Remaining
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedIssue.items.map(
                        (issueItem) => {
                          const processed =
                            getProcessedQuantity(
                              issueItem,
                            );

                          return (
                            <tr
                              key={
                                issueItem.id
                              }
                              className="border-t border-slate-100"
                            >
                              <td className="px-3 py-3 font-semibold text-slate-900">
                                {
                                  issueItem
                                    .product
                                    .productCode
                                }
                              </td>

                              <td className="px-3 py-3 text-slate-600">
                                {issueItem.product
                                  .productName ||
                                  "-"}
                              </td>

                              <td className="px-3 py-3 text-center font-medium">
                                {
                                  issueItem.quantity
                                }
                              </td>

                              <td className="px-3 py-3 text-center text-emerald-700">
                                {
                                  processed.returned
                                }
                              </td>

                              <td className="px-3 py-3 text-center text-orange-600">
                                {
                                  processed.used
                                }
                              </td>

                              <td className="px-3 py-3 text-center">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    processed.remaining >
                                    0
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {
                                    processed.remaining
                                  }
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* =================================================
                  SCAN PRODUCT
              ================================================= */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-lg font-semibold text-slate-900">
                  Return / Used Product
                </h2>

                <p className="mb-4 text-sm text-slate-500">
                  For issued unit-tracked products, scan each unit barcode and choose whether it is returned to stock or used. Quantity-based items can still be selected by product code.
                </p>

                <div className="mb-3 flex gap-2">
                  <button type="button" onClick={() => setScanDisposition("RETURNED")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${scanDisposition === "RETURNED" ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-700"}`}>Return to Warehouse</button>
                  <button type="button" onClick={() => setScanDisposition("USED")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${scanDisposition === "USED" ? "bg-orange-500 text-white" : "border border-slate-200 text-slate-700"}`}>Used / Sold</button>
                </div>

                <div className="flex gap-2">
                  <input
                    value={barcode}
                    onChange={(event) =>
                      setBarcode(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.preventDefault();
                        addBarcode();
                      }
                    }}
                    autoFocus
                    placeholder="Scan issued unit barcode or product code..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={addBarcode}
                    className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
              </section>

              {/* =================================================
                  RETURN / USED ITEMS
              ================================================= */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Return / Used Items
                  </h2>

                  <span className="text-sm text-slate-500">
                    {items.length} item(s)
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Scan a barcode to add a
                    service item.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left">
                          <th className="px-3 py-3 font-semibold">
                            Product
                          </th>

                          <th className="px-3 py-3 font-semibold">
                            Issued
                          </th>

                          <th className="px-3 py-3 font-semibold">
                            Remaining
                          </th>

                          <th className="px-3 py-3 font-semibold">
                            Return
                          </th>

                          <th className="px-3 py-3 font-semibold">
                            Used / Sold
                          </th>

                          <th className="px-3 py-3 font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map(
                          (item) => (
                            <tr
                              key={
                                item.issueItemId
                              }
                              className="border-b border-slate-100"
                            >
                              <td className="px-3 py-3 font-semibold">
                                {item.barcode}
                                {item.trackByBarcode && (
                                  <div className="mt-1 max-w-sm text-xs font-normal text-slate-500">
                                    <div>Returned: {item.returnedBarcodes.join(", ") || "—"}</div>
                                    <div>Used: {item.usedBarcodes.join(", ") || "—"}</div>
                                  </div>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {
                                  item.issuedQuantity
                                }
                              </td>

                              <td className="px-3 py-3 font-semibold">
                                {item.trackByBarcode
                                  ? item.remainingQuantity - item.returnQuantity - item.usedQuantity
                                  : item.remainingQuantity}
                              </td>

                              <td className="px-3 py-3">
                                {item.trackByBarcode ? <span className="font-semibold text-emerald-700">{item.returnQuantity}</span> : <input
                                  type="number"
                                  min={0}
                                  max={
                                    item.remainingQuantity
                                  }
                                  value={
                                    item.returnQuantity
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateItem(
                                      item.issueItemId,
                                      "returnQuantity",
                                      Number(
                                        event
                                          .target
                                          .value,
                                      ),
                                    )
                                  }
                                  className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                                />}
                              </td>

                              <td className="px-3 py-3">
                                {item.trackByBarcode ? <span className="font-semibold text-orange-600">{item.usedQuantity}</span> : <input
                                  type="number"
                                  min={0}
                                  max={
                                    item.remainingQuantity
                                  }
                                  value={
                                    item.usedQuantity
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateItem(
                                      item.issueItemId,
                                      "usedQuantity",
                                      Number(
                                        event
                                          .target
                                          .value,
                                      ),
                                    )
                                  }
                                  className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                                />}
                              </td>

                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem(
                                      item.issueItemId,
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
{/* =================================================
    SERVICE RETURN HISTORY
================================================= */}

<div className="mt-6">
  <div className="mb-3 flex items-center justify-between">
    <div>
      <h3 className="text-sm font-semibold text-slate-900">
        Service Return History
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Previous return / used transactions for this Service Issue.
      </p>
    </div>

    <span className="text-xs text-slate-500">
      {selectedIssue.items.reduce(
        (total, issueItem) =>
          total + (issueItem.serviceReturns?.length || 0),
        0,
      )}{" "}
      transaction(s)
    </span>
  </div>

  <div className="overflow-x-auto rounded-lg border border-slate-200">
    <table className="w-full min-w-[850px] text-sm">
      <thead className="bg-slate-50">
        <tr className="text-left text-slate-700">
          <th className="px-3 py-3 font-semibold">
            Product
          </th>

          <th className="px-3 py-3 text-center font-semibold">
            Returned
          </th>

          <th className="px-3 py-3 text-center font-semibold">
            Used
          </th>

          <th className="px-3 py-3 font-semibold">
            Date
          </th>
          {isSuperAdmin && <th className="px-3 py-3 text-right font-semibold">Action</th>}
        </tr>
      </thead>

      <tbody>
        {selectedIssue.items.flatMap((issueItem) =>
          (issueItem.serviceReturns || []).map(
            (returnItem) => (
              <tr
                key={returnItem.id}
                className="border-t border-slate-100"
              >
                <td className="px-3 py-3">
                  <div className="font-semibold text-slate-900">
                    {issueItem.product.productCode}
                  </div>

                  <div className="mt-0.5 text-xs text-slate-500">
                    {issueItem.product.productName || "-"}
                  </div>
                </td>

                <td className="px-3 py-3 text-center font-semibold text-emerald-700">
                  {returnItem.returnedQuantity}
                </td>

                <td className="px-3 py-3 text-center font-semibold text-orange-600">
                  {returnItem.usedQuantity}
                </td>

                <td className="px-3 py-3 text-slate-500">
                  {new Date(
                    returnItem.createdAt,
                  ).toLocaleString()}
                </td>
                {isSuperAdmin && <td className="px-3 py-3 text-right"><button type="button" disabled={deletingId === returnItem.id} onClick={() => void deleteReturn(returnItem)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{deletingId === returnItem.id ? "Deleting…" : "Delete"}</button></td>}
              </tr>
            ),
          )
        )}

        {selectedIssue.items.every(
          (issueItem) =>
            !issueItem.serviceReturns ||
            issueItem.serviceReturns.length === 0,
        ) && (
          <tr>
            <td
              colSpan={isSuperAdmin ? 5 : 4}
              className="px-3 py-8 text-center"
            >
              <div className="text-sm text-slate-400">
                No service return transactions yet.
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Returned / Used items will appear here after
                completing a Service Return.
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

{/* =================================================
    COMPLETE
================================================= */}

<section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="text-sm text-slate-500">
    <div>
      Returned items will be added back to warehouse stock.
    </div>

    <div>
      Used items will be recorded as Sales OUT.
    </div>
  </div>

  <button
    type="button"
    onClick={submitReturn}
    disabled={
      saving ||
      items.length === 0
    }
    className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {saving
      ? "Saving..."
      : "Complete Service Return"}
  </button>
</section>
        </>
      )}
    </div>
      </main>
  </MTKSolarShell>
);
}
