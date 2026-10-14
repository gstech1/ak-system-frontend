"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageCheck, RefreshCw } from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type ReceivedShipment = {
  id: string;
  shipmentNo: string;
  shipmentDate: string;
  status: string;
  items: {
    id: string;
    quantity: number;
    product: {
      productCode: string;
      name: string;
      modelCode: string;
      ratedCurrent?: string | null;
      ratedVoltage?: string | null;
    };
    serials: {
      id: string;
      serialNumber: string;
      status: string;
      shippedAt: string | null;
    }[];
  }[];
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatSerial(value: string) {
  return value.replace(/(\d{3})(?=\d)/g, "$1 ");
}

export default function DealerShipmentsPage() {
  const [shipments, setShipments] = useState<ReceivedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadShipments() {
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
        `${API_BASE_URL}/shipments/dealer/received`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (response.status === 401) {
        window.location.href = "/warranty/dealer-login";
        return;
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load received shipments.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected shipments response.");
      }

      setShipments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load received shipments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadShipments();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-violet-800 to-violet-700 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <PackageCheck size={27} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Received Shipments</h1>
              <p className="mt-1 text-sm text-violet-100">
                Products and serial numbers shipped to your dealer account.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Shipment History</h2>
              <p className="mt-1 text-sm text-slate-500">
                {shipments.length} shipment{shipments.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadShipments()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
              <RefreshCw size={19} className="animate-spin" />
              Loading shipments...
            </div>
          ) : !error && shipments.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <PackageCheck size={35} className="text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No shipments received yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Completed shipments for this dealer will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment) => (
                <article
                  key={shipment.id}
                  className="rounded-xl border border-slate-200 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Shipment Number
                      </p>
                      <h3 className="mt-1 font-bold text-slate-800">
                        {shipment.shipmentNo}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        COMPLETED
                      </span>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatDate(shipment.shipmentDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {shipment.items.map((item) => (
                      <div key={item.id}>
                        <p className="font-semibold text-slate-800">
                          {item.product.productCode} · {item.product.name} · {item.product.modelCode}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.quantity} unit{item.quantity === 1 ? "" : "s"}
                          {item.product.ratedCurrent ? ` · ${item.product.ratedCurrent}` : ""}
                          {item.product.ratedVoltage ? ` · ${item.product.ratedVoltage}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.serials.map((serial) => (
                            <span
                              key={serial.id}
                              className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700 ring-1 ring-slate-200"
                            >
                              {formatSerial(serial.serialNumber)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
      </div>
    </main>
  );
}
