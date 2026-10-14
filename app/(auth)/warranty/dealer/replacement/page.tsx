"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, RefreshCw, Send, ShieldAlert } from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type ReplacementRequest = {
  id: string;
  returnNo: string;
  serialNumber: string;
  productName: string | null;
  productCode: string | null;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  replacementSerial: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function prettyStatus(value: string) {
  return ({ PENDING: "စစ်ဆေးရန်", APPROVED: "ခွင့်ပြု", REJECTED: "ငြင်းပယ်", COMPLETED: "ပြီးစီး", CANCELLED: "ပယ်ဖျက်" } as Record<string, string>)[value] ?? value.replaceAll("_", " ");
}

export default function DealerWarrantyReplacementPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [replacementSerialNumber, setReplacementSerialNumber] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [externalFireDamage, setExternalFireDamage] = useState(false);
  const [requests, setRequests] = useState<ReplacementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setErrorMessage("");
    try {
      const stored = localStorage.getItem("dealerAuth");
      const token = stored ? JSON.parse(stored)?.accessToken : null;
      if (!token) {
        window.location.href = "/warranty/dealer-login";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/warranty/dealer/replacements`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.status === 401) {
        window.location.href = "/warranty/dealer-login";
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "တောင်းဆိုမှုစာရင်း ဖတ်မရပါ။");
      if (!Array.isArray(data)) throw new Error("တောင်းဆိုမှုစာရင်းကို ဖတ်မရပါ။");
      setRequests(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Server ကို ဆက်သွယ်မရပါ။");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadRequests(); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const stored = localStorage.getItem("dealerAuth");
      const token = stored ? JSON.parse(stored)?.accessToken : null;
      if (!token) {
        window.location.href = "/warranty/dealer-login";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/warranty/dealer/replacements`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: serialNumber.trim(),
          replacementSerialNumber: replacementSerialNumber.trim(),
          reason,
          description: description.trim(),
          externalFireDamage,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "Replacement တောင်းဆိုမှု မတင်နိုင်ပါ။");
      setSuccessMessage(`ပစ္စည်းလဲလှယ်ပြီးပါပြီ။ ${data.damagedSerialNumber} → ${data.replacementSerialNumber} · Warranty ကုန်ဆုံးရက် ${formatDate(data.warrantyEnd)} · ${data.returnNo}`);
      setSerialNumber("");
      setReplacementSerialNumber("");
      setReason("");
      setDescription("");
      setExternalFireDamage(false);
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Server ကို ဆက်သွယ်မရပါ။");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-2xl">
        <header className="rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><ClipboardCheck size={25} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Dealer Warranty Service</p><h1 className="text-xl font-extrabold">Replacement တောင်းဆိုရန်</h1></div>
          </div>
        </header>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <p>အာကာမင်းသုခမှ တရားဝင်တင်သွင်းဖြန့်ချိသော ပစ္စည်းဖြစ်ရမည့်အပြင် Warranty Register တင်သွင်းထားပြီး သက်တမ်းမှာလည်း အကျုံးဝင်ရမည့်အပြင် သတ်မှတ်ထားသော အာမခံပေးသည့် ပေါ်လစီနှင့် အပြည့်အဝ ကိုက်ညီမှသာ အစားထိုးလဲလှယ်နိုင်ပါသည်။ ပြင်ပမီးလောင်ပျက်စီးမှုကို အစားထိုးလဲလှယ်ပေးမည်မဟုတ်ပါ။ အချက်အလက်နှစ်ခုလုံးမှန်ကန်ပါက dealer က စစ်ဆေးပြီး ချက်ချင်းလဲလှယ်နိုင်ပါသည်။</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="replacement-serial" className="mb-1.5 block text-sm font-semibold text-slate-700">ပျက်စီးပစ္စည်း Serial Number</label>
              <input id="replacement-serial" value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} placeholder="ပျက်စီး serial ကို scan လုပ်ပါ" autoComplete="off" required disabled={submitting} className="h-12 w-full rounded-xl border border-slate-300 px-4 font-mono text-sm uppercase outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50" />
            </div>
            <div>
              <label htmlFor="replacement-new-serial" className="mb-1.5 block text-sm font-semibold text-slate-700">အသစ်လဲမည့် Serial Number</label>
              <input id="replacement-new-serial" value={replacementSerialNumber} onChange={(event) => setReplacementSerialNumber(event.target.value)} placeholder="Dealer လက်ကျန်ထဲက serial ကို scan လုပ်ပါ" autoComplete="off" required disabled={submitting} className="h-12 w-full rounded-xl border border-slate-300 px-4 font-mono text-sm uppercase outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50" />
              <p className="mt-1 text-xs text-slate-400">အမျိုးအစားတူပြီး Dealer လက်ကျန်ထဲရှိသော ပစ္စည်းဖြစ်ရပါမယ်။</p>
            </div>
            <div>
              <label htmlFor="replacement-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">အကြောင်းရင်း</label>
              <select id="replacement-reason" value={reason} onChange={(event) => setReason(event.target.value)} required disabled={submitting} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50">
                <option value="">အကြောင်းရင်းရွေးပါ</option>
                <option value="အတွင်းလောင်ပျက်စီး">အတွင်းလောင်ပျက်စီး</option>
                <option value="ချိတ်ဆက်မှုပြတ်တောက်">ချိတ်ဆက်မှုပြတ်တောက်</option>
                <option value="အခြား">အခြား</option>
              </select>
            </div>
            <div>
              <label htmlFor="replacement-description" className="mb-1.5 block text-sm font-semibold text-slate-700">အသေးစိတ် (မဖြစ်မနေမဟုတ်)</label>
              <textarea id="replacement-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="ပြဿနာအကြောင်း အသေးစိတ်ရေးပါ" rows={3} disabled={submitting} className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50" />
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600">
              <input type="checkbox" checked={externalFireDamage} onChange={(event) => setExternalFireDamage(event.target.checked)} disabled={submitting} className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span>ပျက်စီးမှုသည် ပြင်ပမီးလောင်မှုကြောင့် ဖြစ်ပါသည်။ (ဤအခြေအနေတွင် အစားထိုးလဲလှယ်၍မရပါ။)</span>
            </label>

            {errorMessage && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
            {successMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{successMessage}</div>}

              <button type="submit" disabled={submitting || externalFireDamage} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Send size={17} />{submitting ? "လဲလှယ်နေသည်…" : "စစ်ဆေးပြီး ချက်ချင်းလဲလှယ်မည်"}
            </button>
          </form>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-bold text-slate-800">လဲလှယ်မှုမှတ်တမ်း</h2><p className="mt-0.5 text-xs text-slate-500">Dealer မှ လဲလှယ်ပြီးသော serial များ</p></div>
            <button type="button" onClick={() => void loadRequests()} disabled={loading} aria-label="Refresh requests" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
          </div>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">ဖတ်နေသည်…</p> : requests.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">လဲလှယ်မှုမှတ်တမ်း မရှိသေးပါ။</p> : (
            <div className="mt-3 space-y-3">
              {requests.map((request) => (
                <article key={request.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-bold text-slate-800">{request.productName || request.productCode || "Product"}</p><p className="mt-1 font-mono text-sm text-slate-600">{request.serialNumber}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${request.status === "PENDING" ? "bg-amber-100 text-amber-800" : request.status === "APPROVED" ? "bg-blue-100 text-blue-800" : request.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{prettyStatus(request.status)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500"><span>{request.returnNo}</span><span>{formatDate(request.createdAt)}</span></div>
                  {request.replacementSerial && <p className="mt-2 text-xs font-semibold text-emerald-700">Replacement serial: {request.replacementSerial}</p>}
                  {request.description && <p className="mt-2 text-xs leading-5 text-slate-600">{request.description}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <Link href="/warranty/dealer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-600"><ArrowLeft size={17} /> Dealer Dashboard သို့ပြန်ရန်</Link>
      </div>
    </main>
  );
}
