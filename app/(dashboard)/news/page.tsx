import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import DataTable from "@/components/tables/DataTable";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { Plus, Search } from "lucide-react";

const columns = [
  { key: "cover", title: "Cover" },
  { key: "title", title: "Title" },
  { key: "publish", title: "Publish Date" },
  { key: "status", title: "Status" },
  { key: "action", title: "Action" },
];

export default function NewsPage() {
  return (
    <PermissionGuard permission="WEBSITE_MANAGEMENT">
      <DashboardShell>
        <PageTitle
          title="News Management"
          subtitle="Manage news, promotions and announcements."
        />

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search news..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 outline-none focus:border-emerald-500"
            />
          </div>

          <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
            <Plus size={18} />
            Add News
          </button>
        </div>

        <DataTable columns={columns} />
      </DashboardShell>
    </PermissionGuard>
  );
}