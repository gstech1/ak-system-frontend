"use client";

import { FormEvent, useState } from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

type WarrantyResult = {
  status: string;
  warrantyNo?: string | null;
  serialNumber: string;
  product?: string | null;
  productCode?: string | null;
  dealer?: string | null;
  customerName?: string | null;
  warrantyStart?: string | null;
  warrantyEnd?: string | null;
  registerDate?: string | null;
  remarks?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001";

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

function formatSerial(serialNumber: string) {
  const normalized = serialNumber
    .replace(/\s+/g, "")
    .trim();

  return normalized.replace(
    /^(\d{3})(\d{3})(\d{3})$/,
    "$1 $2 $3",
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

function getStatusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "EXPIRED":
      return "bg-red-100 text-red-700";

    case "NOT_REGISTERED":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function WarrantyPage() {
  const [serialNumber, setSerialNumber] =
    useState("");

  const [result, setResult] =
    useState<WarrantyResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleCheck(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedSerial = serialNumber
      .replace(/\s+/g, "")
      .trim();

    if (!normalizedSerial) {
      setError(
        "Please enter a serial number.",
      );
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/warranty/check/${encodeURIComponent(
          normalizedSerial,
        )}`,
        {
          method: "GET",
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
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
            "Unable to check warranty.",
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check warranty.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <PageTitle
          title="Warranty"
          subtitle="Check warranty status using a product serial number."
        />

        {/* Search */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Warranty Check
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter a registered serial number to
              check its warranty information.
            </p>
          </div>

          <form
            onSubmit={handleCheck}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={serialNumber}
              onChange={(event) =>
                setSerialNumber(
                  event.target.value,
                )
              }
              placeholder="Enter serial number"
              className="h-12 flex-1 rounded-xl border border-slate-300 px-4 font-mono text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-emerald-600 px-6 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Checking..."
                : "Check Warranty"}
            </button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Warranty Result
                </h2>

                <p className="mt-1 font-mono text-sm text-slate-500">
                  {formatSerial(
                    result.serialNumber,
                  )}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${
                  getStatusStyle(
                    result.status,
                  )
                }`}
              >
                {result.status.replace(
                  /_/g,
                  " ",
                )}
              </span>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {result.product || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product Code
                </p>

                <p className="mt-1 font-mono font-semibold text-slate-900">
                  {result.productCode ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Warranty No.
                </p>

                <p className="mt-1 font-mono font-semibold text-slate-900">
                  {result.warrantyNo ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Dealer
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {result.dealer || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {result.customerName ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Register Date
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(
                    result.registerDate,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Warranty Start
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(
                    result.warrantyStart,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Warranty End
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(
                    result.warrantyEnd,
                  )}
                </p>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Remarks
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {result.remarks || "—"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}