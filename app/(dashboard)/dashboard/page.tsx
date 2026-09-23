"use client";

import { useEffect, useState } from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import StatCard from "@/components/common/StatCard";
import QuickActionCard from "@/components/common/QuickActionCard";

import {
  DashboardSummary,
  getDashboardSummary,
} from "@/lib/api";

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardSummary();

        if (mounted) {
          setSummary(data);
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

      {/* Attention Required */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Attention Required
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Items that may require review or action.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
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
              href="/website-management"
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

              <span className="font-semibold text-emerald-600">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Database
              </span>

              <span className="font-semibold text-emerald-600">
                Connected
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

      {/* Recent Activity */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
      </section>
    </DashboardShell>
  );
}