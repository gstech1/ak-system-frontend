"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";

import {
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  Printer,
  RefreshCw,
  Search,
  ScanLine,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type CheckedProduct = {
  productId: string;
  productCode: string;
  productName: string;
  trackingType: string;
  systemQty: number;
  checkedQty: number;
  physicalQty?: number;
};

export default function StockCountPage() {
  const [serialInventory, setSerialInventory] = useState<DashboardSummary["products"]["inventory"]>([]);
  const [serialInventoryLoading, setSerialInventoryLoading] = useState(true);
  const [serialInventoryError, setSerialInventoryError] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [stockCheckOpen, setStockCheckOpen] =
    useState(false);

  const [barcode, setBarcode] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [checkedProducts, setCheckedProducts] =
    useState<Record<string, CheckedProduct>>({});

  const [scanMessage, setScanMessage] =
    useState("");
  const [scanLoading, setScanLoading] = useState(false);

  const scannedSerialsRef = useRef<Set<string>>(new Set());

  const barcodeInputRef =
    useRef<HTMLInputElement>(null);

  const loadSerialInventory = async () => {
    try {
      setSerialInventoryError("");
      const summary = await getDashboardSummary();
      setSerialInventory(summary.products.inventory);
    } catch (err) {
      setSerialInventoryError(
        err instanceof Error ? err.message : "Unable to load serial stock.",
      );
    } finally {
      setSerialInventoryLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSerialInventory();
  }, []);

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);
    setSerialInventoryLoading(true);
    await loadSerialInventory();
  };

  /* =====================================================
     FILTER STOCK
  ===================================================== */

  const filteredSerialInventory = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return serialInventory.filter((product) => {
      return (
        !keyword ||
        product.productCode
          .toLowerCase()
          .includes(keyword) ||
        product.name
          .toLowerCase()
          .includes(keyword) ||
        (product.modelCode || "")
          .toLowerCase()
          .includes(keyword) ||
        (product.category || "")
          .toLowerCase()
          .includes(keyword)
      );
    }).sort((a, b) => a.productCode.localeCompare(b.productCode, undefined, { numeric: true, sensitivity: "base" }));
  }, [serialInventory, search]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalSerialsInStock = serialInventory.reduce(
    (total, product) => total + product.serials.inStock,
    0,
  );

  const checkedList = Object.values(
    checkedProducts,
  );

  const checkedProductCount =
    checkedList.length;

  const checkedQuantity = checkedList.reduce(
    (total, item) =>
      total + Number(item.checkedQty || 0),
    0,
  );

  /* =====================================================
     REMAINING PRODUCTS
  ===================================================== */

  const remainingProducts = serialInventory
    .map((product) => ({
      product,
      checkedQty: checkedProducts[product.id]?.checkedQty ?? 0,
      remaining: Math.max(product.serials.inStock - (checkedProducts[product.id]?.checkedQty ?? 0), 0),
    }))
    .filter((item) => item.remaining > 0);

  const handleUnitScan = (
    serial: { id: string; serialNumber: string; status: string; productId: string; product?: { productCode: string; name: string } | null },
  ): "counted" | "duplicate" | "not-in-stock" | "product-missing" => {
    const product = serialInventory.find((item) => item.id === serial.productId);
    if (!product) {
      setScanMessage(`Product for serial ${serial.serialNumber} is not in the product list.`);
      return "product-missing";
    }

    if (serial.status !== "IN_STOCK") {
      setScanMessage(`${serial.serialNumber} is ${serial.status.toLowerCase().replace(/_/g, " ")}, not in stock.`);
      return "not-in-stock";
    }

    const normalizedSerial = serial.serialNumber.replace(/\s/g, "").toUpperCase();
    if (scannedSerialsRef.current.has(normalizedSerial)) {
      setScanMessage(`${serial.serialNumber} was already scanned.`);
      return "duplicate";
    }
    scannedSerialsRef.current.add(normalizedSerial);

    setCheckedProducts((previous) => {
      const existing = previous[product.id];
      const nextQty = (existing?.checkedQty || 0) + 1;

      return {
        ...previous,
        [product.id]: {
          productId: product.id,
          productCode: product.productCode,
          productName: product.name,
          trackingType: "SERIAL",
          systemQty: product.serials.inStock,
          checkedQty: nextQty,
        },
      };
    });

    setScanMessage(`${serial.serialNumber} counted for ${product.productCode}.`);
    return "counted";
  };

  /* =====================================================
     BARCODE SCAN HANDLER
  ===================================================== */

  const handleBarcodeScan = async () => {
    const value = barcode.trim();

    if (!value || scanLoading) return;
    setBarcode("");
    setScanLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Login session not found. Please sign in again.");
      const response = await fetch(`${API_BASE_URL}/serials/scan/${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || `Serial lookup failed (${response.status}).`);
      }
      handleUnitScan(await response.json());
    } catch (err) {
      setScanMessage(err instanceof Error ? err.message : "Unable to verify serial barcode.");
    } finally {
      setScanLoading(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  };

  const handleSerialRangeScan = async () => {
    const startSerial = rangeStart.trim().replace(/\s+/g, "");
    const endSerial = rangeEnd.trim().replace(/\s+/g, "");
    if (!startSerial || !endSerial || scanLoading) return;
    if (startSerial > endSerial) {
      setScanMessage("Start serial must be less than or equal to end serial.");
      return;
    }

    setScanLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Login session not found. Please sign in again.");
      const fetchPage = async (page: number) => {
        const params = new URLSearchParams({
          startSerial,
          endSerial,
          status: "IN_STOCK",
          page: String(page),
          limit: "100",
        });
        const response = await fetch(`${API_BASE_URL}/serials?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || `Serial range lookup failed (${response.status}).`);
        }
        return response.json() as Promise<{
          data: Array<{ id: string; serialNumber: string; status: string; productId: string; product?: { productCode: string; name: string } | null }>;
          total: number;
          totalPages: number;
        }>;
      };

      const firstPage = await fetchPage(1);
      if (firstPage.total > 1000) {
        throw new Error("This range contains more than 1,000 in-stock serials. Split it into smaller ranges.");
      }
      const otherPages = await Promise.all(
        Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) => fetchPage(index + 2)),
      );
      const serials = [...firstPage.data, ...otherPages.flatMap((page) => page.data)];
      let added = 0;
      let alreadyCounted = 0;
      let missingProducts = 0;
      for (const serial of serials) {
        const result = handleUnitScan(serial);
        if (result === "counted") added += 1;
        else if (result === "duplicate") alreadyCounted += 1;
        else if (result === "product-missing") missingProducts += 1;
      }
      setRangeStart("");
      setRangeEnd("");
      setScanMessage(
        serials.length === 0
          ? "No in-stock serials were found in that range."
          : `Range checked: ${added} added, ${alreadyCounted} already counted${missingProducts ? `, ${missingProducts} product(s) unmatched` : ""}.`,
      );
    } catch (err) {
      setScanMessage(err instanceof Error ? err.message : "Unable to check the serial range.");
    } finally {
      setScanLoading(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  };

  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleBarcodeKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleBarcodeScan();
    }
  };

  /* =====================================================
     CLEAR CHECK
  ===================================================== */

  const clearCheckData = () => {
    const confirmed =
      window.confirm(
        "Clear all current stock check data?",
      );

    if (!confirmed) {
      return;
    }

    setCheckedProducts({});
    scannedSerialsRef.current.clear();
    setScanMessage("");
    setBarcode("");

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  /* =====================================================
     DIFFERENCE
  ===================================================== */

  const getDifference = (
    item: CheckedProduct,
  ) => {
    return (
      item.checkedQty -
      item.systemQty
    );
  };

  const printStockCountReport = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      window.alert("Allow pop-ups for this dashboard to print the A4 report.");
      return;
    }
    const escapeHtml = (value: unknown) => String(value ?? "-").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character] ?? character);
    const rows = checkedList.map((item, index) => {
      const difference = getDifference(item);
      return `<tr><td>${index + 1}</td><td>${escapeHtml(item.productCode)}</td><td>${escapeHtml(item.productName)}</td><td>${escapeHtml(item.trackingType)}</td><td class="num">${item.systemQty}</td><td class="num">${item.checkedQty}</td><td class="num ${difference < 0 ? "short" : difference > 0 ? "surplus" : ""}">${difference > 0 ? `+${difference}` : difference}</td></tr>`;
    }).join("");
    const shortageCount = checkedList.filter((item) => getDifference(item) < 0).length;
    const surplusCount = checkedList.filter((item) => getDifference(item) > 0).length;
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Suntree Stock Count</title><style>
      @page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#172033}h1{margin:0;font-size:22px}.sub{color:#64748b;margin:5px 0 18px}.summary{display:flex;gap:18px;margin:0 0 16px;padding:12px;border:1px solid #cbd5e1;border-radius:6px}.summary strong{display:block;margin-top:4px}.bad{color:#b91c1c}.good{color:#047857}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left}th{background:#f1f5f9;font-size:10px;text-transform:uppercase}.num{text-align:center;font-weight:700}.short{color:#b91c1c}.surplus{color:#c2410c}.footer{margin-top:18px;color:#64748b;font-size:10px}@media print{tr{break-inside:avoid}}
      </style></head><body><h1>Suntree Myanmar · Stock Count Report</h1><p class="sub">Printed ${escapeHtml(new Date().toLocaleString())} · ${checkedList.length} checked product(s)</p><div class="summary"><div>Shortage<strong class="bad">${shortageCount} product(s)</strong></div><div>Surplus<strong>${surplusCount} product(s)</strong></div><div>Not fully checked<strong>${remainingProducts.length} product(s)</strong></div><div>Checked quantity<strong>${checkedQuantity}</strong></div></div><table><thead><tr><th>No.</th><th>Product code</th><th>Product</th><th>Tracking</th><th>System</th><th>Counted</th><th>Difference</th></tr></thead><tbody>${rows}</tbody></table><p class="footer">Difference = counted quantity − system quantity. Negative values indicate shortage.</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => window.setTimeout(() => printWindow.print(), 200);
  };

  /* =====================================================
     RENDER
  ===================================================== */

 return (
  <DashboardShell>
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ClipboardCheck size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Stock Count
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Check physical serial stock against Serial Management.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* =================================================
            MODE BUTTONS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={() => {
              setStockCheckOpen(
                (value) => !value,
              );

              setTimeout(() => {
                barcodeInputRef.current?.focus();
              }, 100);
            }}
            className={`flex min-h-[92px] items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
              stockCheckOpen
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ScanLine size={25} />
            </div>

            <div className="flex-1">

              <div className="text-lg font-bold text-slate-900">
                Stock Check System
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Scan barcode / QR and check physical stock.
              </div>

            </div>

          </button>

        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Product Serial Stock</h2>
              <p className="mt-1 text-sm text-slate-500">Remaining Suntree serial stock, sorted by product code.</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                {serialInventoryLoading ? "—" : `${totalSerialsInStock} in stock`}
              </span>
              <div className="relative min-w-[240px] flex-1 sm:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product code or name..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
          <div className="p-4">
            {serialInventoryLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading serial stock...</div>
            ) : serialInventoryError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serialInventoryError}</div>
            ) : filteredSerialInventory.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No matching serial products found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Product code</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3 text-right">Remaining stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSerialInventory.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold">{product.productCode}</td>
                        <td className="px-4 py-3">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {[product.poles == null ? null : `${product.poles}P`, product.ratedCurrent, product.ratedVoltage].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{product.serials.inStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            STOCK CHECK SYSTEM
        ================================================= */}

        {stockCheckOpen && (
          <section className="mb-6 rounded-2xl border border-blue-200 bg-white shadow-sm">

            <div className="border-b border-blue-100 bg-blue-50/60 p-5">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Barcode size={21} />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900">
                      Stock Check System
                    </h2>

                    <p className="text-xs text-slate-500">
                      Scan each serial barcode once. Only serials currently in stock are counted.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={clearCheckData}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear Check
                </button>

              </div>

            </div>

            <div className="p-5">

              {/* SCANNER */}

              <div className="flex flex-col gap-3 md:flex-row">

                <div className="relative flex-1">

                  <ScanLine
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
                  />

                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(event) =>
                      setBarcode(
                        event.target.value,
                      )
                    }
                    onKeyDown={
                      handleBarcodeKeyDown
                    }
                    disabled={scanLoading}
                    autoComplete="off"
                    placeholder="Scan barcode / QR code..."
                    className="w-full rounded-xl border border-slate-200 py-4 pl-12 pr-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <button
                  type="button"
                  onClick={handleBarcodeScan}
                  disabled={scanLoading || !barcode.trim()}
                  className="rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {scanLoading ? "Checking..." : "Scan"}
                </button>

              </div>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="mb-3">
                  <h3 className="font-bold text-slate-900">Scan a serial range</h3>
                  <p className="mt-1 text-xs text-slate-500">Enter the first and last serial number. Up to 1,000 in-stock serials can be checked per range.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <label className="block text-sm font-medium text-slate-700">
                    Start serial
                    <input
                      type="text"
                      value={rangeStart}
                      onChange={(event) => setRangeStart(event.target.value)}
                      disabled={scanLoading}
                      placeholder="First serial number"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    End serial
                    <input
                      type="text"
                      value={rangeEnd}
                      onChange={(event) => setRangeEnd(event.target.value)}
                      disabled={scanLoading}
                      placeholder="Last serial number"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSerialRangeScan}
                    disabled={scanLoading || !rangeStart.trim() || !rangeEnd.trim()}
                    className="self-end rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {scanLoading ? "Checking..." : "Check Range"}
                  </button>
                </div>
              </div>

              {scanMessage && (
                <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {scanMessage}
                </div>
              )}

              {/* CHECK SUMMARY */}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Products Checked
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {checkedProductCount}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Checked Quantity
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {checkedQuantity}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Not Fully Checked
                  </p>

                  <p className="mt-1 text-2xl font-bold text-orange-600">
                    {remainingProducts.length}
                  </p>

                </div>

              </div>

              {/* CHECKED PRODUCTS */}

              <div className="mt-6">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Checked Products
                    </h3>

                    <p className="text-xs text-slate-500">
                      Scanned / entered products are grouped here.
                    </p>
                  </div>

                  {checkedList.length > 0 && <button type="button" onClick={printStockCountReport} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"><Printer size={16} />Print A4 Report</button>}

                </div>

                {checkedList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">

                    <ScanLine
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No products checked yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Start scanning an in-stock serial barcode.
                    </p>

                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[850px] text-sm">

                      <thead className="bg-slate-50">

                        <tr className="border-b border-slate-200 text-left">

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            No.
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Product
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Tracking
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            System
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Checked
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Difference
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {checkedList.map(
                          (item, index) => {
                            const difference =
                              getDifference(
                                item,
                              );

                            return (
                              <tr
                                key={
                                  item.productId
                                }
                                className="border-b border-slate-100 last:border-0"
                              >

                                <td className="px-4 py-4 font-semibold text-slate-500">
                                  {index + 1}
                                </td>

                                <td className="px-4 py-4">

                                  <div className="font-semibold text-slate-900">
                                    {
                                      item.productCode
                                    }
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {
                                      item.productName
                                    }
                                  </div>

                                </td>

                                <td className="px-4 py-4">

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {
                                      item.trackingType
                                    }
                                  </span>

                                </td>

                                <td className="px-4 py-4 text-center font-semibold text-slate-700">
                                  {
                                    item.systemQty
                                  }
                                </td>

                                <td className="px-4 py-4 text-center font-bold text-blue-600">
                                  {
                                    item.checkedQty
                                  }
                                </td>

                                <td className="px-4 py-4 text-center">

                                  <span
                                    className={`font-bold ${
                                      difference ===
                                      0
                                        ? "text-emerald-600"
                                        : difference <
                                            0
                                          ? "text-red-600"
                                          : "text-orange-600"
                                    }`}
                                  >
                                    {difference > 0
                                      ? `+${difference}`
                                      : difference}
                                  </span>

                                </td>

                              </tr>
                            );
                          },
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

              {/* REMAINING */}

              <div className="mt-8">

                <div className="mb-3">

                  <h3 className="font-bold text-slate-900">
                    Remaining / Not Fully Checked
                  </h3>

                  <p className="text-xs text-slate-500">
                    In-stock serials not scanned yet.
                  </p>

                </div>

                {remainingProducts.length ===
                0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">

                    <CheckCircle2
                      size={21}
                      className="text-emerald-600"
                    />

                    <div>
                      <p className="font-semibold text-emerald-800">
                        All checked quantities are complete.
                      </p>

                      <p className="text-xs text-emerald-600">
                        No remaining in-stock serials to check.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-orange-200">

                    <table className="w-full min-w-[750px] text-sm">

                      <thead className="bg-orange-50">

                        <tr className="border-b border-orange-100 text-left">

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            No.
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Product
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            System Qty
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Checked
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-orange-700">
                            Remaining
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {remainingProducts.map(
                          (
                            item,
                            index,
                          ) => (
                            <tr
                              key={item.product.id}
                              className="border-b border-slate-100 last:border-0"
                            >

                              <td className="px-4 py-4 font-semibold text-slate-500">
                                {index + 1}
                              </td>

                              <td className="px-4 py-4">

                                <div className="font-semibold text-slate-900">
                                  {
                                    item.product.productCode
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    item.product.name
                                  }
                                </div>

                              </td>

                              <td className="px-4 py-4 text-center font-semibold text-slate-700">
                                {item.product.serials.inStock}
                              </td>

                              <td className="px-4 py-4 text-center font-semibold text-blue-600">
                                {
                                  item.checkedQty
                                }
                              </td>

                              <td className="px-4 py-4 text-center font-bold text-orange-600">
                                {
                                  item.remaining
                                }
                              </td>

                            </tr>
                          ),
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

      </div>
      </main>
  </DashboardShell>
);
}
