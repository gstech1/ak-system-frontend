"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  Warehouse,
  XCircle,
} from "lucide-react";

import MTKSolarShell from "@/components/layout/MTKSolarShell";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

const MTK_SOLAR_WAREHOUSE_NAME =
  "MTK Solar Main Warehouse";

interface StockInProduct {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  unit: string;
  trackingType?: "UNIT" | "QUANTITY";
}

interface StockInItem {
  id: string;
  barcode: string;
  quantity: number;
  product: StockInProduct;
}

interface StockInTransaction {
  id: string;
  stockInNo: string;
  receivedDate: string;
  source?: string | null;
  remark?: string | null;
  status: string;
  createdAt: string;
  warehouse?: {
    id: string;
    name?: string;
  } | null;
  createdBy?: {
    id: string;
    username: string;
    role: string;
  } | null;
  items: StockInItem[];
}

export default function StockInDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [transaction, setTransaction] =
    useState<StockInTransaction | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { id } = await params;

        const token =
          localStorage.getItem("accessToken");

        if (!token) {
          throw new Error(
            "Login session not found. Please login again.",
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/stock-in/${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

        const data =
          await response.json().catch(
            () => null,
          );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load Stock IN detail.",
          );
        }

        setTransaction(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Stock IN detail.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTransaction();
  }, [params]);

  const totalQuantity =
    transaction?.items.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0,
    ) ?? 0;

  if (loading) {
    return (
      <MTKSolarShell>
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="animate-spin text-emerald-600"
                />
                Loading Stock IN detail...
              </div>
            </div>
          </div>
        </div>
      </MTKSolarShell>
    );
  }

  if (errorMessage || !transaction) {
    return (
      <MTKSolarShell>
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">

            <Link
              href="/warehouse/stock-in"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Stock IN
            </Link>

            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-5 text-red-800">
              <XCircle
                size={21}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-bold">
                  Stock IN Detail Error
                </p>

                <p className="mt-1 text-sm">
                  {errorMessage ||
                    "Stock IN transaction not found."}
                </p>
              </div>
            </div>

          </div>
        </div>
      </MTKSolarShell>
    );
  }

  return (
    <MTKSolarShell>
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          {/* ======================================================
              HEADER
              ====================================================== */}

          <div className="mb-8">

            <Link
              href="/warehouse/stock-in"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Stock IN
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <ClipboardList size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Stock IN Detail
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View completed Stock IN transaction
                </p>
              </div>

            </div>
          </div>

          {/* ======================================================
              TRANSACTION SUMMARY
              ====================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Transaction No.
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {transaction.stockInNo}
                  </h2>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={15} />
                  {transaction.status}
                </span>

              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

              <SummaryCard
                icon={<CalendarDays size={19} />}
                label="Received Date"
                value={new Date(
                  transaction.receivedDate,
                ).toLocaleDateString("en-GB")}
              />

              <SummaryCard
                icon={<Warehouse size={19} />}
                label="Warehouse"
                value={
                  transaction.warehouse?.name ||
                  MTK_SOLAR_WAREHOUSE_NAME
                }
              />

              <SummaryCard
                icon={<Package size={19} />}
                label="Items"
                value={`${transaction.items.length}`}
              />

              <SummaryCard
                icon={<Package size={19} />}
                label="Total Quantity"
                value={`${totalQuantity}`}
              />

            </div>

            <div className="grid gap-4 border-t border-slate-200 p-6 sm:grid-cols-2">

              <InfoBox
                label="Source"
                value={
                  transaction.source || "—"
                }
              />

              <InfoBox
                label="Remark"
                value={
                  transaction.remark || "—"
                }
              />

            </div>

          </div>

          {/* ======================================================
              ITEMS
              ====================================================== */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-2">

                <Package
                  size={20}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-900">
                  Stock IN Items
                </h2>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Products received in this transaction.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Barcode
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Product Code
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Brand / Model
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Unit
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {transaction.items.map(
                    (item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-5 py-4 text-sm font-semibold text-slate-400">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <Barcode
                              size={17}
                              className="text-emerald-600"
                            />

                            <span className="font-bold text-slate-800">
                              {item.barcode || "—"}
                            </span>

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {
                              item.product
                                .productCode
                            }
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div className="font-bold text-slate-900">
                            {
                              item.product
                                .productName
                            }
                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {
                            item.product
                              .category
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">

                          {item.product.brand ||
                            "—"}

                          {item.product.model
                            ? ` / ${item.product.model}`
                            : ""}

                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                            {item.quantity}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                          {
                            item.product
                              .unit
                          }
                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>
          </div>

          {/* ======================================================
              FOOTER ACTION
              ====================================================== */}

          <div className="mt-6 flex justify-start">

            <Link
              href="/warehouse/stock-in"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Stock IN
            </Link>

          </div>

        </div>
      </div>
    </MTKSolarShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-center gap-2 text-emerald-600">

        {icon}

        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

      </div>

      <p className="mt-2 break-words text-sm font-black text-slate-800">
        {value}
      </p>

    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}