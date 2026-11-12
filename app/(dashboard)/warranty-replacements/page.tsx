"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";

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
  remainingMonths?: number | null;
};

type DealerOption = { id: string; dealerCode: string; companyName: string };
type SerialOption = {
  serialNumber: string;
  status: string;
  product?: { id?: string; name?: string; category?: string; productCode?: string; warrantyPolicyCode?: string | null; warrantyPolicy?: { code?: string | null } | null } | null;
  warrantyPolicy?: { code?: string | null } | null;
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
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [serialInput, setSerialInput] = useState("");
  const [serialInfo, setSerialInfo] = useState<SerialOption | null>(null);
  const [serialCheckState, setSerialCheckState] = useState<"idle" | "checking" | "ready" | "error">("idle");
  const [remainingMonths, setRemainingMonths] = useState("3");
  const [savingIssue, setSavingIssue] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");

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

  async function loadDealers() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Login session မတွေ့ပါ။ ပြန်ဝင်ပါ။");
      const response = await fetch(`${API_BASE_URL}/warranty/replacements/dealers`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Dealer စာရင်းဖတ်မရပါ။");
      setDealers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dealer စာရင်းဖတ်မရပါ။");
    }
  }

  useEffect(() => { void loadRows(); void loadDealers(); }, []);

  useEffect(() => {
    const serialNumber = serialInput.replace(/\s+/g, "").trim();
    setSerialInfo(null);
    setIssueMessage("");
    if (serialNumber.length < 3 || !showIssueForm) {
      setSerialCheckState("idle");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSerialCheckState("checking");
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Login session မတွေ့ပါ။ ပြန်ဝင်ပါ။");
        const response = await fetch(`${API_BASE_URL}/serials/scan/${encodeURIComponent(serialNumber)}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "Serial ကို မတွေ့ပါ။");
        if (!cancelled) {
          setSerialInfo(data);
          setSerialCheckState("ready");
        }
      } catch {
        if (!cancelled) {
          setSerialInfo(null);
          setSerialCheckState("error");
        }
      }
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [serialInput, showIssueForm]);

  const policyCode = String(serialInfo?.warrantyPolicy?.code ?? serialInfo?.product?.warrantyPolicyCode ?? serialInfo?.product?.warrantyPolicy?.code ?? "").toUpperCase();
  const serialCanIssue = serialInfo?.status === "IN_STOCK" && Boolean(serialInfo?.product) && ["G", "H"].includes(policyCode);

  async function handleIssueLegacyReplacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serialCanIssue) return;
    setSavingIssue(true);
    setError("");
    setIssueMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Login session မတွေ့ပါ။ ပြန်ဝင်ပါ။");
      const response = await fetch(`${API_BASE_URL}/warranty/replacements/legacy-issue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId: selectedDealerId, serialNumber: serialInfo!.serialNumber, remainingMonths: Number(remainingMonths) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "အစားထိုးထုတ်ပေးမှု မသိမ်းနိုင်ပါ။");
      setIssueMessage(`${data.serialNumber} ကို ${data.remainingMonths} လ သတ်မှတ်ပြီး ${dateText(data.warrantyEnd)} အထိ အာမခံမှတ်တမ်းတင်ပြီးပါပြီ။`);
      setSerialInput("");
      setSerialInfo(null);
      setRemainingMonths("3");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "အစားထိုးထုတ်ပေးမှု မသိမ်းနိုင်ပါ။");
    } finally {
      setSavingIssue(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><ClipboardCheck size={22} /></div>
            <div><h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Warranty Replacement History</h1><p className="mt-1 text-sm text-slate-500">Dealer များပြီးစီးထားသော အာမခံအစားထိုးလဲလှယ်မှုများ</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setShowIssueForm((value) => !value); setIssueMessage(""); }} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">{showIssueForm ? "ပိတ်ရန်" : "+ အာမခံအဟောင်း အစားထိုးထုတ်ရန်"}</button>
            <button type="button" onClick={() => void loadRows()} disabled={loading} aria-label="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </header>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {issueMessage && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{issueMessage}</div>}
        {showIssueForm && <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="font-bold text-slate-900">အာမခံအဟောင်းအတွက် အသစ်ထုတ်ပေးရန်</h2>
          <p className="mt-1 text-sm text-slate-500">ဘားကုတ်ပါသော ဂိုဒေါင်လက်ကျန်ကို ရွေးပြီး အစားထိုးပစ္စည်းတစ်ခုချင်းစီအတွက် ကျန်အာမခံလကို သတ်မှတ်ပါ။</p>
          <form onSubmit={handleIssueLegacyReplacement} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Dealer
              <select required value={selectedDealerId} onChange={(event) => setSelectedDealerId(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                <option value="">Dealer ရွေးပါ</option>
                {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.dealerCode} — {dealer.companyName}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">အသစ်ပစ္စည်း Serial ဘားကုတ်
              <input required autoComplete="off" value={serialInput} onChange={(event) => setSerialInput(event.target.value)} placeholder="ဘားကုတ်ဖတ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ" className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 font-mono font-normal" />
            </label>
            <div className="rounded-xl bg-slate-50 p-3 text-sm md:col-span-2">
              {serialCheckState === "checking" && <span className="text-slate-500">Serial အချက်အလက်စစ်နေသည်…</span>}
              {serialCheckState === "error" && <span className="text-red-700">Serial ကို ရှာမတွေ့ပါ။ ဘားကုတ်ကို ပြန်စစ်ပါ။</span>}
              {serialInfo && <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-700"><span>ပစ္စည်း: <b>{serialInfo.product?.name ?? serialInfo.product?.category ?? serialInfo.product?.productCode ?? "—"}</b></span><span>Serial: <b className="font-mono">{serialInfo.serialNumber}</b></span><span>Policy: <b>{policyCode || "—"}</b></span><span>လက်ကျန်: <b>{serialInfo.status}</b></span></div>}
              {serialInfo && !serialCanIssue && <p className="mt-1 text-red-700">ဂိုဒေါင်လက်ကျန်ဖြစ်ပြီး G/H မူဝါဒရှိသော Serial ကိုသာ ရွေးနိုင်ပါသည်။</p>}
            </div>
            <label className="block text-sm font-semibold text-slate-700">ပေးမည့် ကျန်အာမခံလ
              <input required type="number" min="1" max="1200" step="1" value={remainingMonths} onChange={(event) => setRemainingMonths(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3" />
            </label>
            <div className="flex items-end"><button type="submit" disabled={savingIssue || !serialCanIssue || !selectedDealerId || !remainingMonths} className="h-11 w-full rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{savingIssue ? "သိမ်းနေသည်…" : "အစားထိုးထုတ်ပေးပြီး သိမ်းရန်"}</button></div>
          </form>
        </section>}
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
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-5">
                    <Info label="Request No." value={row.returnNo} /><Info label="Serial" value={row.serialNumber} /><Info label="Policy" value={row.remainingMonths ? "G/H" : "—"} /><Info label="ကျန်အာမခံလ" value={row.remainingMonths ? `${row.remainingMonths} လ` : "—"} /><Info label="အစားထိုးသည့်ရက်" value={dateText(row.createdAt)} />
                  </div>
                  <div className="mt-3"><p className="text-xs font-semibold text-slate-500">အကြောင်းရင်း</p><p className="mt-1 text-sm text-slate-800">{row.reason}</p>{row.description && <p className="mt-1 text-sm text-slate-600">{row.description}</p>}</div>
                  {row.replacementSerial && <p className="mt-2 text-sm font-semibold text-emerald-700">Replacement serial: {row.replacementSerial}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-semibold text-slate-700">{value}</p></div>;
}
