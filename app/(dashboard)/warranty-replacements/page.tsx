"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, RefreshCw } from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type RequestRow = {
  id: string;
  returnNo: string;
  dealerCode: string;
  dealerName: string;
  serialNumber: string;
  productName: string | null;
  productCode: string | null;
  warrantyEnd: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  replacementSerial: string | null;
};

function dateText(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const statusLabels: Record<string, string> = {
  PENDING: "စစ်ဆေးရန်", APPROVED: "ခွင့်ပြုပြီး", REJECTED: "ငြင်းပယ်ပြီး", COMPLETED: "ပြီးစီး", CANCELLED: "ပယ်ဖျက်",
};

export default function WarrantyReplacementRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Login session မတွေ့ပါ။ ပြန်ဝင်ပါ။");
      const response = await fetch(`${API_BASE_URL}/warranty/replacements`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Replacement တောင်းဆိုမှုတွေ ဖတ်မရပါ။");
      if (!Array.isArray(data)) throw new Error("စာရင်းပုံစံ မမှန်ပါ။");
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server ကို ဆက်သွယ်မရပါ။");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadRows(); }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><ClipboardCheck size={22} /></div>
            <div><h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Warranty Replacement History</h1><p className="mt-1 text-sm text-slate-500">Dealer များပြီးစီးထားသော အာမခံအစားထိုးလဲလှယ်မှုများ</p></div>
          </div>
          <button type="button" onClick={() => void loadRows()} disabled={loading} aria-label="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
        </header>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="font-bold text-slate-800">အစားထိုးလဲလှယ်မှုမှတ်တမ်း</h2>
            <p className="mt-1 text-xs text-slate-500">စုစုပေါင်း {rows.length} ခု</p>
          </div>
          {loading ? <p className="p-10 text-center text-sm text-slate-500">ဖတ်နေသည်…</p> : rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">အစားထိုးလဲလှယ်မှု မရှိသေးပါ။</p> : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <article key={row.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-bold text-slate-800">{row.productName || row.productCode || "Product"}</p><p className="mt-1 text-xs text-slate-500">{row.dealerCode} · {row.dealerName}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === "PENDING" ? "bg-amber-100 text-amber-800" : row.status === "APPROVED" ? "bg-blue-100 text-blue-800" : row.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{statusLabels[row.status] ?? row.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4">
                    <Info label="Request No." value={row.returnNo} /><Info label="Serial" value={row.serialNumber} /><Info label="Warranty ကုန်မည့်ရက်" value={dateText(row.warrantyEnd)} /><Info label="တင်သည့်ရက်" value={dateText(row.createdAt)} />
                  </div>
                  <div className="mt-3"><p className="text-xs font-semibold text-slate-500">အကြောင်းရင်း</p><p className="mt-1 text-sm text-slate-800">{row.reason}</p>{row.description && <p className="mt-1 text-sm text-slate-600">{row.description}</p>}</div>
                  {row.replacementSerial && <p className="mt-2 text-sm font-semibold text-emerald-700">Replacement serial: {row.replacementSerial}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-semibold text-slate-700">{value}</p></div>;
}
