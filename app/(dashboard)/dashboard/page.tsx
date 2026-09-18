import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import StatCard from "@/components/common/StatCard";
import QuickActionCard from "@/components/common/QuickActionCard";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <PageTitle
        title="Dashboard"
        subtitle="Manage your website content and monitor system activity."
      />

      {/* Statistics */}
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard title="News" value={3} />
        <StatCard title="Projects" value={28} />
        <StatCard title="Company" value={1} />
        <StatCard title="Media Files" value={152} />
      </div>

      {/* Main Content */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">

        {/* Left */}
        <div className="space-y-8 lg:col-span-2">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              Quick Actions
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <QuickActionCard
                title="News"
                description="Create and manage company news."
                href="/news"
              />

              <QuickActionCard
                title="Projects"
                description="Manage completed projects."
                href="/projects"
              />

              <QuickActionCard
                title="Company"
                description="Update company information."
                href="/company"
              />

              <QuickActionCard
                title="Media Library"
                description="Manage uploaded images."
                href="/media"
              />

              <QuickActionCard
                title="Warranty Policies"
                description="Manage warranty rules and policies."
                href="/dashboard/warranty-policies"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              Recent Activity
            </h2>

            <div className="space-y-5">

              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold">
                  News Updated
                </p>

                <p className="text-sm text-slate-500">
                  Today • 09:20 AM
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold">
                  New Project Added
                </p>

                <p className="text-sm text-slate-500">
                  Yesterday • 02:15 PM
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <p className="font-semibold">
                  Company Profile Updated
                </p>

                <p className="text-sm text-slate-500">
                  2 days ago
                </p>
              </div>

            </div>
          </section>

        </div>

        {/* Right */}
        <div className="space-y-8">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              System Status
            </h2>

            <div className="space-y-4">

              <div className="flex items-center justify-between">
                <span>Website</span>
                <span className="font-semibold text-emerald-600">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>CMS</span>
                <span className="font-semibold text-emerald-600">
                  Running
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Storage</span>
                <span className="font-semibold">
                  152 Files
                </span>
              </div>

            </div>

          </section>

        </div>

      </div>
    </DashboardShell>
  );
}