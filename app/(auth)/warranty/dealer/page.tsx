"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, LogOut, PackageCheck, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { useRouter } from "next/navigation";

type DealerUser = {
  username: string;
  role: string;
  dealerCode: string;
  companyName: string;
};
type DealerAuth = { accessToken: string; user: DealerUser };
type RegistrationReminder = {
  serialNumber: string;
  productName: string | null;
  productCode: string | null;
  registrationDeadline: string;
  daysRemaining: number;
};

export default function DealerDashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<DealerAuth | null>(null);
  const [checking, setChecking] = useState(true);
  const [registrationReminders, setRegistrationReminders] = useState<RegistrationReminder[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dealerAuth");
      if (!stored) {
        router.replace("/warranty/dealer-login");
        return;
      }
      const parsed: DealerAuth = JSON.parse(stored);
      if (!parsed?.accessToken || parsed.user?.role !== "DEALER") {
        localStorage.removeItem("dealerAuth");
        router.replace("/warranty/dealer-login");
        return;
      }
      setAuth(parsed);
    } catch {
      localStorage.removeItem("dealerAuth");
      router.replace("/warranty/dealer-login");
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!auth?.accessToken) return;
    let cancelled = false;
    fetch(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/+$/, "")}/warranty/dealer/overview`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) return null;
      return response.json();
    }).then((data) => {
      if (!cancelled && Array.isArray(data?.registrationReminders)) {
        setRegistrationReminders(data.registrationReminders);
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [auth]);

  function logout() {
    localStorage.removeItem("dealerAuth");
    router.replace("/warranty/dealer-login");
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Loading Dealer Portal...</main>;
  if (!auth) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-xl">
        <header className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><Store size={25} /></div>
              <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Dealer Portal · {auth.user.dealerCode}</p><h1 className="truncate text-xl font-extrabold">{auth.user.companyName}</h1><p className="mt-1 text-xs text-emerald-100">မင်္ဂလာပါ၊ {auth.user.username}</p></div>
              <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 text-white/90 hover:bg-white/10"><LogOut size={19} /></button>
            </div>
          </div>
          <div className="px-5 py-4"><h2 className="text-lg font-bold text-slate-800">ဘာလုပ်မလဲ ရွေးပါ</h2><p className="mt-1 text-sm text-slate-500">လိုအပ်တဲ့လုပ်ဆောင်မှုကိုသာ ဖွင့်နိုင်ပါတယ်။</p></div>
        </header>

        {registrationReminders.length > 0 && <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm" aria-label="Warranty registration reminders">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle size={21} /></div>
            <div className="min-w-0 flex-1"><h2 className="font-bold text-amber-900">Warranty သက်တမ်းတိုးရန် သတိပေးချက်</h2><p className="mt-1 text-xs leading-5 text-amber-800">Dealer ဝယ်ယူပြီး ၁ နှစ်မပြည့်မီ Register လုပ်ပေးပါ။ မလုပ်ပါက ဒီ serial ကို သတ်မှတ်ရက်ကျော်ပြီး Register လုပ်၍မရနိုင်ပါ။</p></div>
          </div>
          <div className="mt-3 space-y-2">
            {registrationReminders.map((item) => <div key={item.serialNumber} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3">
              <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{item.productName || item.productCode || "Product"}</p><p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{item.serialNumber}</p><p className="mt-0.5 text-[11px] text-amber-800">{item.daysRemaining < 0 ? "Register သတ်မှတ်ရက် ကျော်လွန်ပါပြီ" : `Register လုပ်ရန် ${item.daysRemaining} ရက်သာ ကျန်ပါသည်`} · နောက်ဆုံးရက် ${new Date(item.registrationDeadline).toLocaleDateString("my-MM")}</p></div>
              {item.daysRemaining >= 0 && <Link href={`/warranty/dealer/register?serial=${encodeURIComponent(item.serialNumber)}`} className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">Register</Link>}
            </div>)}
          </div>
        </section>}

        <nav className="mt-4 space-y-3">
          <ActionCard href="/warranty/dealer/register" icon={<ShieldCheck size={24} />} color="emerald" title="Warranty Register တင်ရန်" description="Serial ထည့်ပြီး Product ရဲ့ အာမခံစည်းကမ်းနဲ့ သက်တမ်းကို ကြည့်ကာ Register လုပ်ပါ။" />
          <ActionCard href="/warranty/dealer/replacement" icon={<RefreshCw size={24} />} color="amber" title="ပျက်စီးပစ္စည်း လဲလှယ်ရန်" description="ပျက်စီး serial နဲ့ dealer လက်ကျန်ထဲက အသစ် serial ကို scanပြီး ချက်ချင်းလဲပါ။" />
          <ActionCard href="/warranty/dealer/inventory" icon={<PackageCheck size={24} />} color="blue" title="ပစ္စည်းစာရင်း ကြည့်ရန်" description="လက်ကျန်၊ ရောင်းချပြီးသောပစ္စည်းနဲ့ အာမခံကာလတွေကို ကြည့်ပါ။" />
        </nav>

        <button type="button" onClick={logout} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={17} /> LOG OUT</button>
        <footer className="mt-6 text-center text-xs text-slate-400">Official warranty service by<p className="mt-1 font-semibold text-slate-500">Arkar Min Thuka Electro Trading Co., Ltd.</p></footer>
      </div>
    </main>
  );
}

function ActionCard({ href, icon, color, title, description }: { href: string; icon: ReactNode; color: "emerald" | "amber" | "blue"; title: string; description: string }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  };
  return <Link href={href} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 active:scale-[0.99] sm:p-5">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${styles[color]}`}>{icon}</div>
    <div className="min-w-0 flex-1"><h3 className="font-bold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
    <ArrowRight size={19} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
  </Link>;
}
