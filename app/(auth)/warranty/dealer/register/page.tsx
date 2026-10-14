"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type SerialPreview = {
  serialNumber: string;
  productName: string;
  productCode: string;
  productDescription: string | null;
  policyCode: string | null;
  policyName: string | null;
  warrantyMonths: number;
  startRule: string;
  registrationDeadlineMonths: number | null;
  registrationDeadline: string | null;
  replacementLimit: number | null;
  dealerPurchaseDate: string | null;
  registrationRequired: boolean;
  registrationWindowExpired: boolean;
  canRegister: boolean;
  status: string;
  warrantyStart: string;
  warrantyEnd: string;
  message: string;
};

type RegistrationResult = Pick<SerialPreview, "serialNumber" | "productName" | "warrantyStart" | "warrantyEnd" | "status"> & { warrantyNo: string };

function dateText(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("my-MM", { day: "numeric", month: "long", year: "numeric" });
}

function startRuleText(rule: string) {
  if (rule === "DEALER_PURCHASE") return "Dealer ဝယ်ယူသည့်နေ့မှ စတင်";
  if (rule === "DEALER_REGISTRATION") return "Dealer Register လုပ်သည့်နေ့မှ စတင်";
  if (rule === "CUSTOMER_SALE") return "Customer ကို ရောင်းချသည့်နေ့မှ စတင်";
  return rule;
}

function periodText(months: number) {
  if (months % 12 === 0) return `${months / 12} နှစ်`;
  return `${months} လ`;
}

export default function DealerWarrantyRegisterPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [preview, setPreview] = useState<SerialPreview | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("dealerAuth");
    if (!stored || !JSON.parse(stored)?.accessToken) window.location.href = "/warranty/dealer-login";
  }, []);

  useEffect(() => {
    const serialFromDashboard = new URLSearchParams(window.location.search).get("serial");
    if (serialFromDashboard) setSerialNumber(serialFromDashboard);
  }, []);

  useEffect(() => {
    const normalized = serialNumber.replace(/\s+/g, "").trim();
    setPreview(null);
    setResult(null);
    setError("");
    if (normalized.length < 3) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setChecking(true);
      try {
        const stored = localStorage.getItem("dealerAuth");
        const token = stored ? JSON.parse(stored)?.accessToken : null;
        if (!token) {
          window.location.href = "/warranty/dealer-login";
          return;
        }
        const response = await fetch(`${API_BASE_URL}/warranty/dealer/register/preview/${encodeURIComponent(normalized)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "Serial ကို စစ်ဆေးမရပါ။");
        if (!cancelled) setPreview(data);
      } catch (lookupError) {
        if (!cancelled) setError(lookupError instanceof Error ? lookupError.message : "Serial ကို စစ်ဆေးမရပါ။");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [serialNumber]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview?.canRegister) return;
    setSubmitting(true);
    setError("");
    try {
      const stored = localStorage.getItem("dealerAuth");
      const token = stored ? JSON.parse(stored)?.accessToken : null;
      if (!token) {
        window.location.href = "/warranty/dealer-login";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/warranty/dealer/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber: preview.serialNumber }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "Warranty Register လုပ်မရပါ။");
      setResult(data);
      setPreview({ ...preview, canRegister: false, status: data.status, warrantyStart: data.warrantyStart, warrantyEnd: data.warrantyEnd, message: "Warranty Register အောင်မြင်ပါပြီ။" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Server ကို ဆက်သွယ်မရပါ။");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-xl">
        <header className="rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 p-5 text-white shadow-sm">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={25} /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Dealer Warranty Service</p><h1 className="text-xl font-extrabold">Warranty Register</h1></div></div>
        </header>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm leading-6 text-slate-600">Serial Number ကို scan သို့မဟုတ် ရိုက်ထည့်ပါ။ Product နဲ့ အာမခံကာလကို စစ်ပြီး ဒီနေရာမှာ ပြပေးပါမယ်။ Customer အချက်အလက် မလိုပါ။</p>

          <form onSubmit={handleSubmit} className="mt-5">
            <label htmlFor="serial-number" className="mb-1.5 block text-sm font-semibold text-slate-700">Serial Number</label>
            <div className="flex gap-2">
              <input id="serial-number" required value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} placeholder="ဥပမာ - 000 000 013" autoComplete="off" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-mono text-sm uppercase outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
              {preview?.canRegister && <button type="submit" disabled={submitting || checking} className="h-12 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Register…" : "Register"}</button>}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Barcode scanner ကို တန်းဖတ်နိုင်ပါတယ်။</p>
          </form>

          {checking && <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Serial အချက်အလက် စစ်ဆေးနေသည်…</div>}
          {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {preview && !checking && <div className={`mt-4 rounded-xl border p-4 ${preview.status === "EXPIRED" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <div className="flex items-start gap-2"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-700" /><p className="text-sm font-semibold text-slate-800">{preview.message}</p></div>
            <div className="mt-3 space-y-2 border-t border-emerald-100 pt-3 text-sm">
              <InfoRow label="Product" value={preview.productDescription || preview.productName} />
              {preview.policyName && <InfoRow label="Warranty Policy" value={`${preview.policyCode ? `${preview.policyCode} — ` : ""}${preview.policyName}`} />}
              <InfoRow label="Warranty စတင်ချိန်" value={startRuleText(preview.startRule)} />
              <InfoRow label="Warranty ကာလ" value={periodText(preview.warrantyMonths)} />
              {preview.registrationRequired && preview.registrationDeadlineMonths && <InfoRow label="Dealer ဝယ်ယူပြီး Register လုပ်ရန်ကာလ" value={`${preview.registrationDeadlineMonths} လအတွင်း${preview.registrationDeadline ? ` · ${dateText(preview.registrationDeadline)} နောက်ဆုံး` : ""}`} />}
              <InfoRow label="အစားထိုးခွင့်" value={preview.replacementLimit == null ? "အကန့်အသတ်မရှိ" : `${preview.replacementLimit} ကြိမ်`} />
              <InfoRow label="အာမခံစတင်ရက်" value={dateText(preview.warrantyStart)} />
              <InfoRow label="အာမခံကုန်ဆုံးရက်" value={dateText(preview.warrantyEnd)} strong />
              {preview.status === "ACTIVE" && !preview.registrationRequired && <p className="rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-emerald-800">ဒီ policy အရ Register လုပ်ရန်မလိုပါ။ အထက်ပါအာမခံကာလအတွင်း အကျုံးဝင်ပါသည်။</p>}
              {result && <InfoRow label="Register No." value={result.warrantyNo} />}
            </div>
          </div>}
        </section>

        <Link href="/warranty/dealer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-600"><ArrowLeft size={17} /> Dealer Dashboard သို့ပြန်ရန်</Link>
      </div>
    </main>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className={`text-right ${strong ? "font-bold text-emerald-800" : "font-semibold text-slate-800"}`}>{value}</span></div>;
}
