"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  FileText,
  PackagePlus,
  PackageSearch,
  RotateCcw,
  ShoppingCart,
  Wrench,
} from "lucide-react";

type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
};

type ActionItem = {
  title: string;
  description: string;
  icon: typeof PackageSearch;
  href: string;
};

type MtkSummary = {
  warehouse: string | null;
  products: { total: number };
  stock: { quantity: number };
  stockIn: { transactions: number; quantity: number };
  salesOut: { transactions: number; quantity: number };
  serviceIssue: { transactions: number; issuedQuantity: number; outstandingQuantity: number };
  serviceReturn: { records: number; returnedQuantity: number; usedQuantity: number };
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

export default function WarehousePage() {
  const [authUser, setAuthUser] =
    useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<MtkSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("authUser");

      if (!storedUser) return;

      const user = JSON.parse(
        storedUser,
      ) as AuthUser;

      setAuthUser(user);
    } catch (error) {
      console.error(
        "Failed to read authUser:",
        error,
      );
    }
  }, []);

  useEffect(() => {
    async function loadSummary() {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;
        const response = await fetch(`${API_BASE_URL}/dashboard/mtk-summary`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "Unable to load MTK stock summary.");
        setSummary(data);
      } catch (error) {
        setSummaryError(error instanceof Error ? error.message : "Unable to load MTK stock summary.");
      }
    }
    loadSummary();
  }, []);

  const role = String(
    authUser?.role || "",
  ).toUpperCase();

  // ============================================================
  // SENIOR / AUTHORIZED USER
  // ============================================================

  const isSenior =
    role === "ADMIN" ||
    [
      "WAREHOUSE_SENIOR",
      "WAREHOUSE_SUPERVISOR",
      "WAREHOUSE_MANAGER",
      "SUPERVISOR",
      "MANAGER",
    ].includes(role);

  // ============================================================
  // WAREHOUSE OPERATIONS
  // Normal staff + Senior staff
  // ============================================================

  const warehouseOperations: ActionItem[] = [
    {
      title: "Stock IN",
      description:
        "Receive products into warehouse",
      icon: PackagePlus,
      href: "/warehouse/stock-in",
    },
    {
      title: "Stock OUT",
      description:
        "Issue products from warehouse",
      icon: Boxes,
      href: "/warehouse/sales-out",
    },
    {
      title: "Service Issue",
      description:
        "Issue products to service team",
      icon: Wrench,
      href: "/warehouse/service-issue",
    },
    {
      title: "Service Return",
      description:
        "Return unused service products",
      icon: RotateCcw,
      href: "/warehouse/service-return",
    },
    
  ];

  // ============================================================
  // WAREHOUSE PROCESS
  // Senior / Authorized staff
  // ============================================================

  const warehouseProcess: ActionItem[] = [
    {
      title: "Products",
      description:
        "View and manage warehouse products",
      icon: PackageSearch,
      href: "/warehouse/products",
    },
    {
      title: "Register Product",
      description:
        "Register a new warehouse product",
      icon: PackagePlus,
      href: "/warehouse/products/register",
    },
  ];

  // ============================================================
  // DATA MANAGEMENT
  // Senior / Authorized staff
  // ============================================================

  const dataManagement: ActionItem[] = [
    {
      title: "Voucher History",
      description:
        "View and reprint warehouse vouchers",
      icon: FileText,
      href: "/warehouse/vouchers",
    },
    {
  title: "Stock Count",
  description:
    "Check physical warehouse stock",
  icon: ClipboardCheck,
  href: "/warehouse/stock-count",
},

  ];

  // ============================================================
  // NAVIGATION
  // ============================================================

  const goTo = (href: string) => {
    window.location.href = href;
  };

  // ============================================================
  // ACTION CARD
  // ============================================================

  const renderActionCard = (
    action: ActionItem,
  ) => {
    const Icon = action.icon;

    return (
      <button
        key={action.title}
        type="button"
        onClick={() => goTo(action.href)}
        className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition duration-200 group-hover:bg-emerald-600 group-hover:text-white">
            <Icon
              size={20}
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-900">
              {action.title}
            </h3>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {action.description}
            </p>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
            <ArrowRight size={15} />
          </div>
        </div>
      </button>
    );
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto min-h-screen max-w-7xl px-5 py-6 sm:px-8 lg:px-10">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Boxes
                size={28}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                MTK Solar Warehouse System
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Warehouse Operations
              </p>
            </div>
          </div>
        </header>

        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">MTK Stock Overview</h2>
              <p className="mt-1 text-sm text-slate-500">
                {summary?.warehouse ? `${summary.warehouse} · MTK warehouse data` : "Live stock and movement totals"}
              </p>
            </div>
            <button type="button" onClick={() => goTo("/warehouse/reports")} className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
              View reports →
            </button>
          </div>
          {summaryError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{summaryError}</div>
          ) : !summary ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Loading MTK stock summary…</div>
          ) : !summary.warehouse ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">MTK-MAIN warehouse is not configured. Ask an administrator to check the warehouse setup.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Current Stock", summary.stock.quantity, "units in warehouse"],
                ["Stock IN", summary.stockIn.quantity, `${summary.stockIn.transactions} receipts`],
                ["Sales OUT", summary.salesOut.quantity, `${summary.salesOut.transactions} completed issues`],
                ["Service Outstanding", summary.serviceIssue.outstandingQuantity, `${summary.serviceIssue.transactions} service issues`],
              ].map(([label, amount, detail]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{amount}</p>
                  <p className="mt-1 text-xs text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ======================================================
            NEW SALE
        ====================================================== */}

        <section className="mb-8">
          <button
            type="button"
            onClick={() =>
              goTo("/warehouse/sales")
            }
            className="group w-full rounded-3xl bg-emerald-600 p-6 text-left text-white shadow-xl shadow-emerald-600/15 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-2xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-5">
              <div className="flex min-w-0 items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:h-20 sm:w-20">
                  <ShoppingCart
                    size={34}
                    strokeWidth={2}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
                    Daily Sales
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                    New Sale
                  </h2>

                  <p className="mt-2 text-sm text-emerald-50 sm:text-base">
                    Create a sales invoice and issue
                    products
                  </p>
                </div>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 transition group-hover:translate-x-1 group-hover:bg-white/25 sm:h-14 sm:w-14">
                <ArrowRight size={25} />
              </div>
            </div>
          </button>
        </section>

        {/* ======================================================
            MAIN THREE GROUPS
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ====================================================
              WAREHOUSE OPERATIONS
          ==================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Boxes
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Warehouse Operations
                  </h2>

                  <p className="text-xs text-slate-500">
                    Daily warehouse work
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {warehouseOperations.map(
                renderActionCard,
              )}
            </div>
          </section>

          {/* ====================================================
              WAREHOUSE PROCESS
          ==================================================== */}

          {isSenior && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <PackageSearch
                      size={22}
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Warehouse Process
                    </h2>

                    <p className="text-xs text-slate-500">
                      Product & warehouse setup
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {warehouseProcess.map(
                  renderActionCard,
                )}
              </div>
            </section>
          )}

          {/* ====================================================
              DATA MANAGEMENT
          ==================================================== */}

          {isSenior && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <FileText
                      size={22}
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Data Management
                    </h2>

                    <p className="text-xs text-slate-500">
                      Records & warehouse data
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {dataManagement.map(
                  renderActionCard,
                )}
              </div>
            </section>
          )}
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-center text-xs text-slate-400">
            MTK Solar Warehouse System
          </p>
        </div>
      </div>
    </div>
  );
}
