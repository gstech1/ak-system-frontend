
"use client";

import { useEffect, useState } from "react";
import MTKSolarShell from "@/components/layout/MTKSolarShell";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type DashboardSummary = {
  warehouse: string | null;
  products: { total: number };
  stock: { quantity: number };
  stockIn: { transactions: number; quantity: number };
  salesOut: { transactions: number; quantity: number };
  serviceIssue: { transactions: number; issuedQuantity: number; outstandingQuantity: number };
  serviceReturn: { records: number; returnedQuantity: number; usedQuantity: number };
};

type ReportCardProps = {
  title: string;
  value: number | string;
  description: string;
};

function ReportCard({
  title,
  value,
  description,
}: ReportCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-2xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function ReportsPage() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const accessToken =
          localStorage.getItem("accessToken");

        if (!accessToken) {
          throw new Error(
            "Login session not found. Please sign in again.",
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/dashboard/mtk-summary`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          },
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load reports (${response.status}).`,
          );
        }

        setSummary(data);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load reports.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  return (
    <MTKSolarShell>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">

          <header className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Warehouse reports and stock information
            </p>
          </header>

          {!loading && !error && !summary?.warehouse && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
              MTK-MAIN warehouse is not configured. Ask an administrator to check the warehouse setup.
            </div>
          )}

          {loading && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
              Loading reports...
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {summary && !error && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <ReportCard
              title="Current Stock"
              value={loading ? "..." : summary?.stock.quantity ?? 0}
              description="Units currently in MTK-MAIN"
            />

            <ReportCard
              title="Stock IN"
              value={loading ? "..." : summary?.stockIn.quantity ?? 0}
              description={`${summary?.stockIn.transactions ?? 0} completed receipt(s) · total units received`}
            />

            <ReportCard
              title="Sales OUT"
              value={loading ? "..." : summary?.salesOut.quantity ?? 0}
              description={`${summary?.salesOut.transactions ?? 0} completed issue(s) · total units sent out`}
            />

            <ReportCard
              title="Service Issue"
              value={loading ? "..." : summary?.serviceIssue.outstandingQuantity ?? 0}
              description={`${summary?.serviceIssue.transactions ?? 0} completed issue(s) · units not yet returned or used`}
            />

            <ReportCard
              title="Service Return"
              value={loading ? "..." : summary?.serviceReturn.returnedQuantity ?? 0}
              description={`${summary?.serviceReturn.records ?? 0} processed line(s) · returned units (used: ${summary?.serviceReturn.usedQuantity ?? 0})`}
            />

            <ReportCard
              title="Product Types"
              value={loading ? "..." : summary?.products.total ?? 0}
              description="Active MTK products"
            />

          </div>}

        </div>
      </div>
    </MTKSolarShell>
  );
}
