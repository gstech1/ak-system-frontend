"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, LogOut, Phone, Mail, MapPin, User } from "lucide-react";
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

type DealerInfo = {
  id: string;
  dealerCode: string;
  companyName: string;
  ownerName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  township: string;
  stateRegion: string;
  status: string;
  remarks?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5001";

export default function DealerInfoPage() {
  const router = useRouter();

  const [auth, setAuth] = useState<DealerAuth | null>(null);
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDealerInfo() {
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
          parsed.user.role !== "DEALER" ||
          !parsed.user.dealerId
        ) {
          localStorage.removeItem("dealerAuth");
          router.replace("/warranty/dealer-login");
          return;
        }

        setAuth(parsed);

        const response = await fetch(
          `${API_BASE_URL}/dealers/${parsed.user.dealerId}`,
          {
            headers: {
              Authorization: `Bearer ${parsed.accessToken}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to load dealer information (${response.status})`,
          );
        }

        setDealer(data);
      } catch (err) {
        console.error("Dealer information error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dealer information",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDealerInfo();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("dealerAuth");
    router.replace("/warranty/dealer-login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-lg">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading Dealer Information...
          </p>
        </div>
      </main>
    );
  }

  if (!auth) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-md">

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-6 text-white">

            <button
              type="button"
              onClick={() => router.push("/warranty/dealer")}
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-emerald-100 transition hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Dealer Portal
            </button>

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Building2 size={30} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
                  Dealer Information
                </p>

                <h1 className="mt-1 truncate text-xl font-extrabold">
                  {dealer?.companyName || auth.user.companyName}
                </h1>

                <p className="mt-1 text-xs text-emerald-100">
                  Dealer Code:{" "}
                  {dealer?.dealerCode || auth.user.dealerCode}
                </p>
              </div>

            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Information */}
          {dealer && (
            <div className="space-y-4 p-5">

              <InfoRow
                icon={<Building2 size={20} />}
                label="Company Name"
                value={dealer.companyName}
              />

              <InfoRow
                icon={<User size={20} />}
                label="Owner Name"
                value={dealer.ownerName}
              />

              <InfoRow
                icon={<User size={20} />}
                label="Contact Person"
                value={dealer.contactPerson || "-"}
              />

              <InfoRow
                icon={<Phone size={20} />}
                label="Phone"
                value={dealer.phone}
              />

              <InfoRow
                icon={<Mail size={20} />}
                label="Email"
                value={dealer.email || "-"}
              />

              <InfoRow
                icon={<MapPin size={20} />}
                label="Address"
                value={dealer.address || "-"}
              />

              <InfoRow
                icon={<MapPin size={20} />}
                label="Township"
                value={dealer.township}
              />

              <InfoRow
                icon={<MapPin size={20} />}
                label="State / Region"
                value={dealer.stateRegion}
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Account Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    dealer.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {dealer.status}
                </span>
              </div>

              {dealer.remarks && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Remarks
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {dealer.remarks}
                  </p>
                </div>
              )}

            </div>
          )}

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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}