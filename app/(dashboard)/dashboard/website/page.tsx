const sections = [
  {
    title: "Products",
    description:
      "Add, edit and manage products displayed on the AK Energy website.",
    href: "/dashboard/website/products",
    icon: "▣",
  },
  {
    title: "Projects",
    description:
      "Add, edit and manage projects displayed on the AK Energy website.",
    href: "/dashboard/website/projects",
    icon: "⌂",
  },
  {
    title: "Ads & Promotions",
    description:
      "Manage the two promotional images displayed above Our Products.",
    href: "/dashboard/website/ads",
    icon: "📢",
  },
];

export default function WebsiteManagementPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {/* Back to SWMS Dashboard */}
          <a
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to SWMS Dashboard
          </a>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            ArkarMinThukha Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Website Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the products and projects displayed on the
            AKMTK Energy website from one place.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Website Content
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Choose what you want to manage.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <a
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                  {section.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {section.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {section.description}
                  </p>

                  <span className="mt-5 inline-flex items-center text-sm font-semibold text-slate-900">
                    Manage
                    <span className="ml-2 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
