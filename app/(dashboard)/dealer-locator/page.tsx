"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

export default function DealerLocatorPage() {
  return (
    <DashboardShell>
      <PageTitle
        title="Dealer Locator"
        subtitle="Find and manage dealer locations across Myanmar."
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Dealer Locator
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Dealer location search and map features will be available here.
        </p>
      </div>
    </DashboardShell>
  );
}