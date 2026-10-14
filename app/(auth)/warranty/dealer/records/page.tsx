"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  ShieldCheck,
  FileText,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type WarrantyRecord = {
  id: string;
  warrantyNo: string;
  serialNumber: string;
  product: string | null;
  productCode: string | null;
  customerName: string;
  customerPhone: string;
  installationAddress: string | null;
  registerDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: string;
  remarks: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "EXPIRED":
      return "bg-amber-100 text-amber-700";
    case "VOID":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DealerWarrantyRecordsPage() {
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadRecords() {
    setLoading(true);
    setError("");

    try {
      const stored = localStorage.getItem("dealerAuth");

      if (!stored) {
        window.location.href = "/warranty/dealer-login";
        return;
      }

      const auth = JSON.parse(stored);
      const token = auth?.accessToken;

      if (!token) {
        window.location.href = "/warranty/dealer-login";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/warranty/dealer/records`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      if (response.status === 401) {
        window.location.href = "/warranty/dealer-login";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load warranty records.",
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected warranty records response.");
      }

      setRecords(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to Warranty Server.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    return [
      record.warrantyNo,
      record.serialNumber,
      record.product,
      record.productCode,
      record.customerName,
      record.customerPhone,
      record.status,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(keyword),
    );
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck size={27} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold">
                My Warranty Records
              </h1>
              <p className="mt-1 text-sm text-emerald-100">
                View warranty registrations belonging to your dealer account.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Warranty History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {records.length} record{records.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRecords()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="relative mb-5">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search warranty, serial, product or customer..."
              className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadRecords()}
                className="mt-2 text-sm font-bold text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
              <RefreshCw size={19} className="animate-spin" />
              Loading warranty records...
            </div>
          ) : !error && filteredRecords.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <FileText size={35} className="text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                {records.length === 0
                  ? "No warranty records yet"
                  : "No matching records"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {records.length === 0
                  ? "Your registered warranties will appear here."
                  : "Try another search keyword."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Warranty Number
                      </p>
                      <h3 className="mt-1 break-all font-bold text-slate-800">
                        {record.warrantyNo}
                      </h3>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle(record.status)}`}
                    >
                      {record.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">Serial Number</p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                        {record.serialNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Product</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {record.product || record.productCode || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Customer</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {record.customerName || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Customer Phone</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {record.customerPhone || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Registered Date</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(record.registerDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Warranty Period</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(record.warrantyStart)}
                        {" – "}
                        {formatDate(record.warrantyEnd)}
                      </p>
                    </div>
                  </div>

                  {record.installationAddress && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-400">
                        Installation Address
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {record.installationAddress}
                      </p>
                    </div>
                  )}

                  {record.remarks && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-400">Remarks</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {record.remarks}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/warranty/dealer"
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Back to Dealer Dashboard
        </Link>

        <footer className="mt-6 text-center text-xs text-slate-400">
          Official warranty service by
          <p className="mt-1 font-semibold text-slate-500">
            Arkar Min Thuka Electro Trading Co., Ltd.
          </p>
        </footer>
      </div>
    </main>
  );
}
