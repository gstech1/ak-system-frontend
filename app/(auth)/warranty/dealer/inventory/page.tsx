"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  LogOut,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type DealerUser = {
  id: string;
  username: string;
  role: string;
  dealerId: string;
  dealerCode: string;
  companyName: string;
  permissions: string[];
};

type DealerAuth = { accessToken: string; user: DealerUser };
type Unit = {
  serialNumber: string;
  serialStatus: string;
  productCode: string | null;
  productName: string | null;
  modelCode: string | null;
  shipmentNo: string | null;
  warrantyPolicyCode: string | null;
  replacementForSerialNumber: string | null;
  warranty: null | {
    warrantyNo: string | null;
    status: string;
    warrantyStart: string;
    warrantyEnd: string;
  };
  replacementRequests: {
    returnNo: string;
    status: string;
    createdAt: string;
    reason: string;
    replacementSerials: string[];
  }[];
};
type Overview = {
  summary: {
    stockCount: number;
    activeWarrantyCount: number;
    expiringSoonCount: number;
    replacementCount: number;
  };
  units: Unit[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSerial(value: string) {
  return value.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function isDealerStock(unit: Unit) {
  return !unit.replacementForSerialNumber && (
    unit.serialStatus === "SHIPPED" ||
    ((unit.warrantyPolicyCode === "B" || unit.warrantyPolicyCode === "C") && unit.serialStatus === "REGISTERED")
  );
}

export default function DealerDashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<DealerAuth | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "STOCK" | "WARRANTY">("ALL");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dealerAuth");
      if (!stored) {
        router.replace("/warranty/dealer-login");
        return;
      }
      const parsed: DealerAuth = JSON.parse(stored);
      if (!parsed?.accessToken || !parsed?.user || parsed.user.role !== "DEALER") {
        localStorage.removeItem("dealerAuth");
        router.replace("/warranty/dealer-login");
        return;
      }
      setAuth(parsed);
    } catch {
      localStorage.removeItem("dealerAuth");
      router.replace("/warranty/dealer-login");
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  async function loadOverview(token: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/warranty/dealer/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.status === 401) {
        localStorage.removeItem("dealerAuth");
        router.replace("/warranty/dealer-login");
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to load dealer inventory.");
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dealer inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auth?.accessToken) void loadOverview(auth.accessToken);
  }, [auth]);

  function handleLogout() {
    localStorage.removeItem("dealerAuth");
    router.replace("/warranty/dealer-login");
  }

  const filteredUnits = useMemo(() => {
    const units = overview?.units ?? [];
    const keyword = search.trim().toLowerCase();
    return units.filter((unit) => {
      const isStock = isDealerStock(unit);
      if (filter === "STOCK" && !isStock) return false;
      if (filter === "WARRANTY" && !unit.warranty) return false;
      if (!keyword) return true;
      return [unit.serialNumber, unit.productCode, unit.productName, unit.modelCode]
        .some((value) => String(value ?? "").toLowerCase().includes(keyword));
    });
  }, [filter, overview, search]);

  const groupedUnits = useMemo(() => {
    const groups = new Map<string, { key: string; productName: string; productDetails: string; units: Unit[] }>();
    for (const unit of filteredUnits) {
      const productName = unit.productName || unit.productCode || "Product";
      const productDetails = [unit.productCode, unit.modelCode].filter(Boolean).join(" · ");
      const key = `${unit.productCode || productName}::${unit.modelCode || ""}`;
      const group = groups.get(key) ?? { key, productName, productDetails, units: [] };
      group.units.push(unit);
      groups.set(key, group);
    }
    return [...groups.values()];
  }, [filteredUnits]);

  if (checkingAuth) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4"><p className="text-sm font-semibold text-slate-600">Loading Dealer Portal...</p></main>;
  }
  if (!auth) return null;

  const dealer = auth.user;
  const summary = overview?.summary;

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-5 py-5 text-white sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><Store size={25} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Dealer Portal · {dealer.dealerCode}</p>
                <h1 className="truncate text-xl font-extrabold">{dealer.companyName}</h1>
                <p className="mt-0.5 text-xs text-emerald-100">Welcome, {dealer.username}</p>
              </div>
              <button onClick={handleLogout} aria-label="Log out" className="rounded-lg p-2 text-white/90 hover:bg-white/10"><LogOut size={19} /></button>
            </div>
          </div>

          <section className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">My Stock & Warranty</h2>
                <p className="mt-0.5 text-xs text-slate-500">Serial တစ်လုံးချင်း လက်ကျန်နဲ့ အာမခံအခြေအနေ</p>
              </div>
              <button onClick={() => auth.accessToken && void loadOverview(auth.accessToken)} disabled={loading} aria-label="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50">
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              <SummaryCard label="Dealer လက်ကျန်" value={summary?.stockCount} tone="emerald" />
              <SummaryCard label="အာမခံ အသက်ဝင်" value={summary?.activeWarrantyCount} tone="blue" />
              <SummaryCard label="ရက် ၃၀ အတွင်းကုန်မည်" value={summary?.expiringSoonCount} tone="amber" />
              <SummaryCard label="အစားထိုးလဲထား" value={summary?.replacementCount} tone="violet" />
            </div>
          </section>
        </header>

        <nav className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/warranty/dealer/register" icon={<ShieldCheck size={19} />} label="Warranty Register တင်ရန်" />
          <QuickLink href="/warranty/dealer/shipments" icon={<PackageCheck size={19} />} label="Shipment မှတ်တမ်း" />
          <QuickLink href="/warranty/dealer/records" icon={<ClipboardCheck size={19} />} label="Warranty မှတ်တမ်း" />
          <QuickLink href="/warranty/dealer/replacement" icon={<RefreshCw size={19} />} label="Replacement တောင်းရန်" />
        </nav>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-bold text-slate-800">ပစ္စည်းစာရင်း</h2>
              <p className="mt-0.5 text-xs text-slate-500">Shipment ရရှိထားသော serial များ</p>
            </div>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Serial / ပစ္စည်းအမည် ရှာရန်" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {(["ALL", "STOCK", "WARRANTY"] as const).map((value) => (
                <button key={value} onClick={() => setFilter(value)} className={`min-h-9 rounded-lg px-2 ${filter === value ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>
                  {value === "ALL" ? "အားလုံး" : value === "STOCK" ? "လက်ကျန်" : "အာမခံ"}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">စာရင်းဖတ်နေသည်…</div>
          ) : !error && groupedUnits.length === 0 ? (
            <div className="py-12 text-center">
              <PackageCheck className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-semibold text-slate-700">ပစ္စည်းစာရင်း မရှိသေးပါ</p>
              <p className="mt-1 text-xs text-slate-500">ရောင်းချပြီးသော serial များ ဒီနေရာမှာ ပေါ်လာပါမယ်။</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {groupedUnits.map((group) => (
                <section key={group.key} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2.5">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-800">{group.productName}</h3>
                      {group.productDetails && <p className="mt-0.5 truncate text-[11px] text-slate-500">{group.productDetails}</p>}
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">{group.units.length} serial(s)</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.units.map((unit) => {
                      const isStock = isDealerStock(unit);
                      const latestRequest = unit.replacementRequests[0];
                      return (
                        <article key={unit.serialNumber} className="flex items-start justify-between gap-3 px-3 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-mono text-sm font-bold tracking-wide text-slate-800">{formatSerial(unit.serialNumber)}</span>
                              {unit.warrantyPolicyCode && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Policy {unit.warrantyPolicyCode}</span>}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${unit.replacementForSerialNumber ? "bg-cyan-100 text-cyan-700" : unit.serialStatus === "REPLACED" ? "bg-violet-100 text-violet-700" : isStock ? "bg-emerald-100 text-emerald-700" : unit.warranty?.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : unit.warranty ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                                {unit.replacementForSerialNumber ? "အစားထိုးပေးထား" : unit.serialStatus === "REPLACED" ? "အစားထိုးပြီး" : isStock ? "လက်ကျန်" : unit.warranty?.status === "ACTIVE" ? "အာမခံရှိ" : unit.warranty?.status === "VOID" ? "အစားထိုးပြီး" : unit.warranty ? "အာမခံကုန်" : unit.serialStatus.replaceAll("_", " ")}
                              </span>
                            </div>
                            {unit.warranty && (
                              <p className="mt-1 text-[11px] text-slate-600">
                                {unit.warranty.status === "VOID" ? "မူလအာမခံကာလ" : "အာမခံ"}: {formatDate(unit.warranty.warrantyStart)} → {formatDate(unit.warranty.warrantyEnd)}
                              </p>
                            )}
                            {latestRequest && (
                              <p className="mt-1 text-[10px] text-violet-700">
                                Replacement {latestRequest.returnNo} · {latestRequest.status.replaceAll("_", " ")}
                              </p>
                            )}
                          </div>
                          {unit.shipmentNo && <span className="shrink-0 pt-0.5 text-[10px] text-slate-400">{unit.shipmentNo}</span>}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <Link href="/warranty/dealer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-600">← Dealer Dashboard သို့ပြန်ရန်</Link>

        <footer className="mt-5 text-center text-xs text-slate-400">
          Official warranty service by
          <p className="mt-1 font-semibold text-slate-500">Arkar Min Thuka Electro Trading Co., Ltd.</p>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value?: number; tone: "emerald" | "blue" | "amber" | "violet" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-800",
    blue: "bg-blue-50 text-blue-800",
    amber: "bg-amber-50 text-amber-800",
    violet: "bg-violet-50 text-violet-800",
  };
  return <div className={`min-h-[76px] rounded-xl p-3 ${colors[tone]}`}>
    <p className="text-[11px] font-semibold leading-4 opacity-80">{label}</p>
    <p className="mt-1 text-2xl font-extrabold leading-none">{value ?? "—"}</p>
  </div>;
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return <Link href={href} className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">
    <span className="flex items-center gap-2">{icon}{label}</span><ArrowRight size={16} className="text-slate-400" />
  </Link>;
}
