"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

export default function MediaLibraryPage() {
  return (
    <DashboardShell>
      <PageTitle
        title="Media Library"
        subtitle="Manage website images, videos and media assets."
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Media Library
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Media management will be available here.
        </p>
      </div>
    </DashboardShell>
  );
}