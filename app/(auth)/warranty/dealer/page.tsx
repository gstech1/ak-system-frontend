"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";

type DealerUser = {
  id: string;
  username: string;
  role: string;
  dealerId: string;
  dealerCode: string;
  companyName: string;
  permissions: string[];
};

type DealerAuth = {
  accessToken: string;
  user: DealerUser;
};

export default function DealerDashboardPage() {
  const router = useRouter();

  const [auth, setAuth] = useState<DealerAuth | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dealerAuth");

      if (!stored) {
        router.replace("/warranty/dealer-login");
        return;
      }

      const parsed: DealerAuth = JSON.parse(stored);

      if (
        !parsed?.accessToken ||
        !parsed?.user ||
        parsed.user.role !== "DEALER"
      ) {
        localStorage.removeItem("dealerAuth");
        router.replace("/warranty/dealer-login");
        return;
      }

      setAuth(parsed);
    } catch (error) {
      console.error("Dealer auth error:", error);

      localStorage.removeItem("dealerAuth");
      router.replace("/warranty/dealer-login");
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("dealerAuth");
    router.replace("/warranty/dealer-login");
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-lg">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading Dealer Portal...
          </p>
        </div>
      </main>
    );
  }

  if (!auth) {
    return null;
  }

  const dealer = auth.user;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-md">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-6 text-white">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Store size={30} />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
                  Dealer Portal
                </p>

                <h1 className="mt-1 truncate text-xl font-extrabold">
                  {dealer.companyName}
                </h1>

                <p className="mt-1 text-xs text-emerald-100">
                  Dealer Code: {dealer.dealerCode}
                </p>

              </div>

            </div>

          </div>

          {/* Welcome */}
          <div className="border-b border-slate-100 px-5 py-5">

            <p className="text-sm text-slate-500">
              Welcome back,
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-800">
              {dealer.username}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Manage your Suntree warranty services
            </p>

          </div>

          {/* Menu */}
          <div className="space-y-3 p-5">

            {/* Warranty Check */}
            <Link
              href="/warranty/dealer/check"
              className="group flex items-center gap-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4 transition hover:bg-emerald-100 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ShieldCheck size={26} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800">
                  Warranty Check
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Check warranty status of your products.
                </p>
              </div>

              <ArrowRight
                size={21}
                className="shrink-0 text-emerald-600 transition group-hover:translate-x-1"
              />
            </Link>

            {/* Warranty Replacement */}
            <Link
              href="/warranty/dealer/replacement"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <RefreshCw size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800">
                  Warranty Replacement
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Submit and track warranty replacement requests.
                </p>
              </div>

              <ArrowRight
                size={21}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
              />
            </Link>

            {/* Warranty Records */}
            <Link
              href="/warranty/dealer/records"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ClipboardCheck size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800">
                  My Warranty Records
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  View warranty registrations and service records.
                </p>
              </div>

              <ArrowRight
                size={21}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
              />
            </Link>

            {/* Dealer Information */}
            <Link
              href="/warranty/dealer/info"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Store size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800">
                  Dealer Information
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  View your dealer account and store information.
                </p>
              </div>

              <ArrowRight
                size={21}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
              />
            </Link>

          </div>

          {/* Logout */}
          <div className="px-5 pb-5">

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.99]"
            >
              <LogOut size={18} />
              LOG OUT
            </button>

          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 text-center">

          <p className="text-xs text-slate-400">
            Official warranty service by
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Arkar Min Thuka Electro Trading Co., Ltd.
          </p>

        </div>

      </div>
    </main>
  );
}