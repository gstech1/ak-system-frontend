import Link from "next/link";
import { getWebsiteProductCategories } from "@/lib/website-cms-api";

const circuitProtectionSlugs = [
  "dc-circuit-breaker",
  "ac-circuit-breaker",
  "dc-spd",
  "dc-isolator",
  "ats",
  "ac-voltage-protector",
];

const mainProductSlugs = [
  "inverter",
  "battery",
  "ev-charger",
];

function CategoryRow({
  category,
}: {
  category: any;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
            {category.heroImage ? (
              <img
                src={category.heroImage}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                {category.title
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {category.title}
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              {category.products.length} products
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            category.isPublished
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {category.isPublished
            ? "Published"
            : "Draft"}
        </span>

        <Link
          href={`/dashboard/website/products/${category.slug}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          Manage
        </Link>

        <Link
          href="/products/circuit-protection"
          target="_blank"
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          View
        </Link>
      </div>
    </div>
  );
}

function ProductSection({
  title,
  description,
  categories,
}: {
  title: string;
  description: string;
  categories: any[];
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Section Bar */}
      <div className="border-b border-slate-200 bg-slate-900 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-300">
          {description}
        </p>
      </div>

      {/* Category Rows */}
      <div>
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
          />
        ))}
      </div>
    </section>
  );
}

export default async function WebsiteProductsPage() {
  const categories =
    await getWebsiteProductCategories();

  const totalItems = categories.reduce(
    (total: number, category: any) =>
      total + category.products.length,
    0,
  );

  const publishedCategories =
    categories.filter(
      (category: any) =>
        category.isPublished,
    ).length;

  const draftCategories =
    categories.filter(
      (category: any) =>
        !category.isPublished,
    ).length;

  const circuitProtectionCategories =
    categories.filter((category: any) =>
      circuitProtectionSlugs.includes(
        category.slug,
      ),
    );

  const mainProductCategories =
    categories.filter((category: any) =>
      mainProductSlugs.includes(
        category.slug,
      ),
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-7">
          <Link
            href="/dashboard/website"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Website Management
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-emerald-600">
              Website CMS
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Products
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage website products and product images.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Categories
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Products
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalItems}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Published
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {publishedCategories}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Draft
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {draftCategories}
            </p>
          </div>
        </div>

        {/* Circuit Protection */}
        <ProductSection
          title="Circuit Protection"
          description="Manage circuit breakers, protection devices and related products."
          categories={
            circuitProtectionCategories
          }
        />

        {/* Main Product Categories */}
        <ProductSection
          title="Main Products"
          description="Manage primary product categories and their products."
          categories={
            mainProductCategories
          }
        />

        {/* Other Categories */}
        <ProductSection
          title="Other Products"
          description="Manage additional website product categories."
          categories={categories.filter(
            (category: any) =>
              !circuitProtectionSlugs.includes(
                category.slug,
              ) &&
              !mainProductSlugs.includes(
                category.slug,
              ),
          )}
        />

      </div>
    </main>
  );
}