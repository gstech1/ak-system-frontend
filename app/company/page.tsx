"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

export default function CompanyPage() {
  return (
    <DashboardShell>
      <PageTitle
        title="Company"
        subtitle="Manage company information and profile content."
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Company Information
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Company information management will be available here.
        </p>
      </div>
    </DashboardShell>
  );
}