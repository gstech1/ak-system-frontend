"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import StatCard from "@/components/common/StatCard";
import QuickActionCard from "@/components/common/QuickActionCard";
import { getCurrentAuthUser } from "@/lib/current-user";

import {
  DashboardSummary,
  getDashboardSummary,
  getPendingWarrantyExtensionRequests,
  getWarrantyExtensionReminders,
  type WarrantyExtensionRequest,
  type WarrantyExtensionReminder,
} from "@/lib/api";

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canViewRecentActivity, setCanViewRecentActivity] = useState(false);
  const [extensionReminders, setExtensionReminders] = useState<WarrantyExtensionReminder[]>([]);
  const [pendingExtensionRequests, setPendingExtensionRequests] = useState<WarrantyExtensionRequest[]>([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    let canViewManagementSummary = false;

    try {
      const authUser = getCurrentAuthUser();
      canViewManagementSummary = ["ADMIN", "BOSS", "MANAGER"].includes(
        authUser?.role?.trim().toUpperCase() ?? "",
      );
      setCanViewRecentActivity(canViewManagementSummary);
    } catch {
      setCanViewRecentActivity(false);
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardSummary();
        const [reminders, requests] = canViewManagementSummary
          ? await Promise.all([
              getWarrantyExtensionReminders().catch(() => []),
              getPendingWarrantyExtensionRequests().catch(() => []),
            ])
          : [[], []];

        if (mounted) {
          setSummary(data);
          setExtensionReminders(reminders);
          setPendingExtensionRequests(requests);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const value = (number: number | undefined) => {
    if (loading) {
      return "—";
    }

    return number ?? 0;
  };

  const formatActivity = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatActivityTime = (createdAt: string) => {
    return new Date(createdAt).toLocaleString();
  };

  const productInventory = summary?.products.inventory ?? [];
  const visibleProducts = productInventory.filter((product) => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      product.productCode,
      product.modelCode,
      product.name,
      product.category,
      product.ratedCurrent,
      product.ratedVoltage,
      product.breakingCapacity,
      product.poles == null ? "" : `${product.poles}p`,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  return (
    <DashboardShell>
      <PageTitle
        title="Dashboard"
        subtitle="System overview and business activity."
      />

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* System Overview */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            System Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current status of products, serials, dealers,
            shipments and warranty.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Products"
            value={value(summary?.products.total)}
          />

          <StatCard
            title="Total Serials"
            value={value(summary?.serials.total)}
          />

          <StatCard
            title="In Stock"
            value={value(summary?.serials.inStock)}
          />

          <StatCard
            title="Shipped"
            value={value(summary?.serials.shipped)}
          />

          <StatCard
            title="Dealers"
            value={value(summary?.dealers.total)}
          />

          <StatCard
            title="Shipments"
            value={value(summary?.shipments.total)}
          />

          <StatCard
            title="Active Warranty"
            value={value(summary?.warranty.active)}
          />

          <StatCard
            title="Pending Returns"
            value={value(summary?.returns.pending)}
          />
        </div>
      </section>

      {/* Product serial stock breakdown */}
      <details className="group mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Product Serial Stock</h2>
            <p className="mt-1 text-sm text-slate-500">Open to see serial quantities for each product in Serial Management.</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
            {loading ? "—" : productInventory.length} <span>product types</span>
          </span>
          <ChevronDown size={20} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-200 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">In-stock quantity is shown first. Other serial statuses are listed separately.</p>
            <input
              type="search"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search product code, name, or rating..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 sm:max-w-sm"
            />
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Loading product quantities...</div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm font-medium text-red-700">Unable to load product quantities.</div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No matching products found.</div>
          ) : (
            <div className="max-h-[32rem] overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Total Serials</th>
                    <th className="px-4 py-3 text-right">In Stock</th>
                    <th className="px-3 py-3 text-right">Shipped</th>
                    <th className="px-3 py-3 text-right">Registered</th>
                    <th className="px-3 py-3 text-right">Service Issued</th>
                    <th className="px-3 py-3 text-right">Returned</th>
                    <th className="px-3 py-3 text-right">Replaced</th>
                    <th className="px-3 py-3 text-right">Reject Pending</th>
                    <th className="px-3 py-3 text-right">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{product.productCode} · {product.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[product.modelCode, product.category, product.poles == null ? null : `${product.poles}P`, product.ratedCurrent, product.ratedVoltage, product.breakingCapacity].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{product.serials.total}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex min-w-10 justify-center rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">{product.serials.inStock}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.shipped}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.registered}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.serviceIssued}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.returned}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.replaced}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.rejectPending}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{product.serials.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && productSearch.trim() && (
            <p className="mt-3 text-xs text-slate-500"><span>Showing</span> {visibleProducts.length} <span>of</span> {productInventory.length} <span>product types.</span></p>
          )}
        </div>
      </details>

      {/* Attention Required */}
      <section id="attention-required" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Attention Required
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Items that may require review or action.
          </p>
        </div>

        <div className={`grid gap-4 ${canViewRecentActivity ? "lg:grid-cols-2 xl:grid-cols-5" : "lg:grid-cols-3"}`}>
          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-4">
            <div>
              <p className="font-semibold text-slate-900">
                Reject Pending
              </p>

              <p className="text-sm text-slate-500">
                Serial rejection requests waiting for approval.
              </p>
            </div>

            <span className="text-2xl font-black text-amber-600">
              {value(summary?.serials.rejectPending)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-4">
            <div>
              <p className="font-semibold text-slate-900">
                Rejected Serials
              </p>

              <p className="text-sm text-slate-500">
                Serials already approved as rejected.
              </p>
            </div>

            <span className="text-2xl font-black text-red-600">
              {value(summary?.serials.rejected)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-4">
            <div>
              <p className="font-semibold text-slate-900">
                Pending Returns
              </p>

              <p className="text-sm text-slate-500">
                Warranty returns waiting for processing.
              </p>
            </div>

            <span className="text-2xl font-black text-blue-600">
              {value(summary?.returns.pending)}
            </span>
          </div>

          {canViewRecentActivity && <a href="/shipments" className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-4 transition hover:bg-amber-100">
            <div>
              <p className="font-semibold text-slate-900">G/H Stock Warranty Reminders</p>
              <p className="text-sm text-slate-500">Dealer stock due for review before warranty extension.</p>
            </div>
            <span className="text-2xl font-black text-amber-600">{loading ? "—" : extensionReminders.length}</span>
          </a>}

          {canViewRecentActivity && <a href="/shipments" className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-4 transition hover:bg-violet-100">
            <div>
              <p className="font-semibold text-slate-900">Pending G/H Extension Requests</p>
              <p className="text-sm text-slate-500">Dealer requests waiting for staff review.</p>
            </div>
            <span className="text-2xl font-black text-violet-600">{loading ? "—" : pendingExtensionRequests.length}</span>
          </a>}
        </div>
      </section>

      {/* Quick Actions + System Status */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <QuickActionCard
              title="Serial Management"
              description="Register and manage product serial numbers."
              href="/serials"
            />

            <QuickActionCard
              title="Shipments"
              description="Manage dealer shipments and shipment items."
              href="/shipments"
            />

            <QuickActionCard
              title="Dealers"
              description="Manage dealer information and accounts."
              href="/dealers"
            />

            <QuickActionCard
              title="Warranty"
              description="Manage warranty registrations and service."
              href="/warranty"
            />

            <QuickActionCard
              title="Warranty Policies"
              description="Manage warranty rules and policies."
              href="/dashboard/warranty-policies"
            />

            <QuickActionCard
              title="Website Management"
              description="Manage website content and media."
              href="/dashboard/website"
            />
          </div>
        </section>

        {/* System Status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            System Status
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Backend API
              </span>

              <span className={`font-semibold ${loading ? "text-amber-600" : error ? "text-red-600" : "text-emerald-600"}`}>
                {loading ? "Checking" : error ? "Unavailable" : "Connected"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Database
              </span>

              <span className={`font-semibold ${loading ? "text-amber-600" : error ? "text-red-600" : "text-emerald-600"}`}>
                {loading ? "Checking" : error ? "Unavailable" : "Connected"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Dashboard API
              </span>

              <span
                className={`font-semibold ${
                  loading
                    ? "text-amber-600"
                    : error
                      ? "text-red-600"
                      : "text-emerald-600"
                }`}
              >
                {loading
                  ? "Loading"
                  : error
                    ? "Error"
                    : "Running"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {canViewRecentActivity && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest system activities recorded in the audit log.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            Loading recent activity...
          </div>
        ) : !summary?.recentActivity?.length ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="font-semibold text-slate-700">
              No recent activity
            </p>

            <p className="mt-1 text-sm text-slate-500">
              System activities will appear here when recorded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {formatActivity(activity.action)}
                    </span>

                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-500">
                      {activity.module}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {activity.user?.username ?? "System"}
                    {activity.recordId
                      ? ` · Record ${activity.recordId}`
                      : ""}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-medium text-slate-400">
                  {formatActivityTime(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>}
    </DashboardShell>
  );
}
