"use client";

import {
  ArrowLeft,
  Eye,
  FileText,
  Printer,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MTKSolarShell from "@/components/layout/MTKSolarShell";

type VoucherItem = {
  id: string;
  productId: string;
  barcode: string | null;
  quantity: number;
  product?: {
    productCode?: string;
    productName?: string;
  } | null;
};

type Voucher = {
  id: string;
  stockOutNo: string;
  warehouseId: string;
  salesDate: string;
  customer: string | null;
  remark: string | null;
  status: string;
  createdAt: string;
  items: VoucherItem[];
  warehouse?: {
    warehouseCode?: string;
    warehouseName?: string;
  } | null;
  createdBy?: {
    username?: string;
    role?: string;
  } | null;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

export default function VoucherHistoryPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================== VIEW DETAIL ====================

  const [selectedVoucher, setSelectedVoucher] =
    useState<Voucher | null>(null);

  // ==================== LOAD VOUCHERS ====================

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/stock-out`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load vouchers (${response.status})`,
        );
      }

      const data = await response.json();

      setVouchers(
        Array.isArray(data) ? data : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load voucher history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  // ==================== SEARCH ====================

  const filteredVouchers = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return vouchers;
    }

    return vouchers.filter((voucher) => {
      return (
        voucher.stockOutNo
          ?.toLowerCase()
          .includes(keyword) ||
        voucher.customer
          ?.toLowerCase()
          .includes(keyword) ||
        voucher.createdBy?.username
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [vouchers, search]);

  // ==================== PRINT VOUCHER ====================

  const printVoucher = (voucher: Voucher) => {
    const itemsHtml = voucher.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>
              ${item.product?.productCode || "-"}
            </td>
            <td>
              ${item.product?.productName || "-"}
            </td>
            <td>
              ${item.barcode || "-"}
            </td>
            <td class="qty">
              ${item.quantity}
            </td>
          </tr>
        `,
      )
      .join("");

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=700",
      );

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${voucher.stockOutNo}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 40px;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              color: #0f172a;
              background: white;
            }

            .container {
              max-width: 800px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #059669;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }

            .company {
              font-size: 24px;
              font-weight: 800;
            }

            .title {
              margin-top: 4px;
              font-size: 14px;
              color: #64748b;
            }

            .voucher-number {
              font-size: 20px;
              font-weight: 800;
              color: #059669;
              text-align: right;
            }

            .info {
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 16px;
              margin-bottom: 25px;
            }

            .info-box {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 14px;
            }

            .label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 5px;
            }

            .value {
              font-size: 14px;
              font-weight: 700;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th {
              background: #f1f5f9;
              text-align: left;
              font-size: 12px;
              padding: 10px;
              border-bottom: 1px solid #cbd5e1;
            }

            td {
              font-size: 12px;
              padding: 11px 10px;
              border-bottom: 1px solid #e2e8f0;
            }

            .qty {
              text-align: center;
              font-weight: 700;
            }

            .footer {
              margin-top: 35px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              font-size: 11px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
            }

            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>
          <div class="container">

            <div class="header">
              <div>
                <div class="company">
                  MTK Solar Warehouse System
                </div>

                <div class="title">
                  Warehouse Stock OUT Voucher
                </div>
              </div>

              <div class="voucher-number">
                ${voucher.stockOutNo}
              </div>
            </div>

            <div class="info">

              <div class="info-box">
                <div class="label">
                  Customer
                </div>

                <div class="value">
                  ${
                    voucher.customer ||
                    "Walk-in Customer"
                  }
                </div>
              </div>

              <div class="info-box">
                <div class="label">
                  Sales Date
                </div>

                <div class="value">
                  ${new Date(
                    voucher.salesDate,
                  ).toLocaleDateString()}
                </div>
              </div>

              <div class="info-box">
                <div class="label">
                  Warehouse
                </div>

                <div class="value">
                  ${
                    voucher.warehouse
                      ?.warehouseName ||
                    voucher.warehouse
                      ?.warehouseCode ||
                    "-"
                  }
                </div>
              </div>

              <div class="info-box">
                <div class="label">
                  Created By
                </div>

                <div class="value">
                  ${
                    voucher.createdBy
                      ?.username || "-"
                  }
                </div>
              </div>

            </div>

            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Barcode</th>
                  <th>Quantity</th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            ${
              voucher.remark
                ? `
                  <div
                    style="
                      margin-top:20px;
                      font-size:12px;
                    "
                  >
                    <strong>Remark:</strong>
                    ${voucher.remark}
                  </div>
                `
                : ""
            }

            <div class="footer">
              <span>
                Status: ${voucher.status}
              </span>

              <span>
                MTK Solar Warehouse System
              </span>
            </div>

          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
  <MTKSolarShell>
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">

        {/* ==================== HEADER ==================== */}

        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/warehouse";
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Voucher History
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage warehouse vouchers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadVouchers}
            disabled={loading}
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </header>

        {/* ==================== SEARCH ==================== */}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search voucher number, customer or user..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </section>

        {/* ==================== ERROR ==================== */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* ==================== VOUCHER LIST ==================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Sales Vouchers
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Warehouse Stock OUT records
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {filteredVouchers.length} Vouchers
              </span>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-emerald-600"
              />

              <p className="mt-4 text-sm text-slate-500">
                Loading vouchers...
              </p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">
                No vouchers found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                No Stock OUT vouchers match your search.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredVouchers.map(
                (voucher) => (
                  <div
                    key={voucher.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* ==================== VOUCHER INFO ==================== */}

                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <FileText size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900">
                          {voucher.stockOutNo}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {voucher.customer ||
                            "Walk-in Customer"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            {new Date(
                              voucher.salesDate,
                            ).toLocaleDateString()}
                          </span>

                          <span>
                            {voucher.items
                              ?.length || 0}{" "}
                            Product(s)
                          </span>

                          {voucher.createdBy
                            ?.username && (
                            <span>
                              By{" "}
                              {
                                voucher
                                  .createdBy
                                  .username
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ==================== STATUS / VIEW ==================== */}

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        {voucher.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVoucher(
                            voucher,
                          );
                        }}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                      >
                        <Eye size={17} />
                        View
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* ==================== VOUCHER DETAIL MODAL ==================== */}

      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* ==================== MODAL HEADER ==================== */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Stock OUT Voucher
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {selectedVoucher.stockOutNo}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedVoucher(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* ==================== MODAL BODY ==================== */}

            <div className="max-h-[65vh] overflow-y-auto px-6 py-6">

              {/* ==================== BASIC INFO ==================== */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedVoucher.customer ||
                      "Walk-in Customer"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Sales Date
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {new Date(
                      selectedVoucher.salesDate,
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Warehouse
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedVoucher.warehouse
                      ?.warehouseName ||
                      selectedVoucher.warehouse
                        ?.warehouseCode ||
                      "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Created By
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedVoucher.createdBy
                      ?.username || "-"}
                  </p>
                </div>
              </div>

              {/* ==================== STATUS ==================== */}

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">
                  Status
                </span>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                  {selectedVoucher.status}
                </span>
              </div>

              {/* ==================== PRODUCT ITEMS ==================== */}

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">
                      Sale Items
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Products issued from warehouse
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {selectedVoucher.items
                      ?.length || 0}{" "}
                    Items
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="divide-y divide-slate-100">
                    {selectedVoucher.items?.map(
                      (item, index) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-600">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {item.product
                                  ?.productName ||
                                  "Unknown Product"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {item.product
                                  ?.productCode ||
                                  "-"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Barcode:{" "}
                                {item.barcode ||
                                  "-"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">
                              Qty
                            </span>

                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-800">
                              {item.quantity}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* ==================== REMARK ==================== */}

              {selectedVoucher.remark && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Remark
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {selectedVoucher.remark}
                  </p>
                </div>
              )}
            </div>

            {/* ==================== MODAL FOOTER ==================== */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => {
                  setSelectedVoucher(null);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  printVoucher(
                    selectedVoucher,
                  );
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <Printer size={17} />
                Print Voucher
              </button>
              </div>
            </div>
          </div>
        )}
             </main>
    </MTKSolarShell>
  );
}