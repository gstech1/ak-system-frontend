
"use client";

import { useEffect, useState } from "react";
import MTKSolarShell from "@/components/layout/MTKSolarShell";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type DashboardSummary = {
  products?: {
    total?: number;
  };
  serials?: {
    total?: number;
    inStock?: number;
    shipped?: number;
    rejectPending?: number;
    rejected?: number;
  };
  dealers?: {
    total?: number;
  };
  shipments?: {
    total?: number;
  };
  warranty?: {
    active?: number;
  };
  returns?: {
    pending?: number;
  };
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
          `${API_BASE_URL}/dashboard/summary`,
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

  const productsTotal =
    summary?.products?.total ?? 0;

  const stockTotal =
    summary?.serials?.inStock ?? 0;

  const salesOut =
    summary?.serials?.shipped ?? 0;

  const serviceIssue =
    summary?.serials?.rejectPending ?? 0;

  const serviceReturn =
    summary?.returns?.pending ?? 0;

  const stockCount =
    summary?.serials?.total ?? 0;

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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <ReportCard
              title="Stock Summary"
              value={
                loading
                  ? "..."
                  : stockTotal
              }
              description="Current warehouse stock"
            />

            <ReportCard
              title="Stock IN"
              value={
                loading
                  ? "..."
                  : productsTotal
              }
              description="Registered products"
            />

            <ReportCard
              title="Sales OUT"
              value={
                loading
                  ? "..."
                  : salesOut
              }
              description="Shipped serials"
            />

            <ReportCard
              title="Service Issue"
              value={
                loading
                  ? "..."
                  : serviceIssue
              }
              description="Pending reject items"
            />

            <ReportCard
              title="Service Return"
              value={
                loading
                  ? "..."
                  : serviceReturn
              }
              description="Pending returns"
            />

            <ReportCard
              title="Stock Count"
              value={
                loading
                  ? "..."
                  : stockCount
              }
              description="Total registered serials"
            />

          </div>

        </div>
      </div>
    </MTKSolarShell>
  );
}
