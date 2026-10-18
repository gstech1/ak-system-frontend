import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getWebsiteCmsImageUrl,
  getWebsiteProductCategories,
} from "@/lib/website-cms-api";
import ProductManager from "./ProductManager";
import CategorySelector from "./CategorySelector";
import ProductEditor from "./ProductEditor";

function ImageBox({
  src,
  label,
}: {
  src?: string | null;
  label: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-500">
        {label}
      </div>

      <div className="flex h-64 items-center justify-center p-4">
        {src ? (
          <img
            src={src}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-sm text-slate-400">
            No image
          </span>
        )}
      </div>
    </div>
  );
}

const galleryCategorySlugs = [
  "ev-charger",
  "dc-circuit-breaker",
  "ac-circuit-breaker",
  "dc-spd",
  "dc-isolator",
  "ats",
  "ac-voltage-protector",
];

const breakerCategorySlugs = [
  "dc-circuit-breaker",
  "ac-circuit-breaker",
  "dc-spd",
  "dc-isolator",
  "ats",
  "ac-voltage-protector",
];

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const categories =
    await getWebsiteProductCategories();

  const category = categories.find(
    (item: any) => item.slug === id,
  );

  if (!category) {
    notFound();
  }

  const isGalleryCategory =
    galleryCategorySlugs.includes(
      category.slug,
    );

  const isBreakerCategory =
    breakerCategorySlugs.includes(
      category.slug,
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/website/products"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Back to Products
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-emerald-600">
              Website CMS
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {category.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {isBreakerCategory
                ? "Manage products and product images."
                : category.slug ===
                    "ev-charger"
                  ? "Manage EV Charger products and detail images."
                  : "Manage product images."}
            </p>
          </div>
        </div>

       {/* Breaker Category Selector */}
{isBreakerCategory && (
  <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
        Product Group
      </p>

      <h2 className="mt-1 text-lg font-semibold text-slate-900">
        Circuit Protection
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Select a product category to manage.
      </p>
    </div>

    <CategorySelector
      categories={categories
        .filter((item: any) =>
          breakerCategorySlugs.includes(
            item.slug,
          ),
        )
        .map((item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
        }))}
      currentSlug={category.slug}
    />
  </section>
)}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Products
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {category.products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Published
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                category.products.filter(
                  (product: any) =>
                    product.isPublished,
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Category
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {category.title}
            </p>
          </div>

        </div>

        {/* Products */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isGalleryCategory
                  ? "Each product has 1 main image and 4 detail images."
                  : "Each product uses 2 images."}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {category.products.length} items
            </span>
          </div>

          {category.products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-sm text-slate-500">
                No products yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {category.products.map(
                (
                  product: any,
                  index: number,
                ) => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >

                    {/* Product Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

                      <div>
                        <p className="text-xs text-slate-400">
                          Product {index + 1}
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {product.title}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.isPublished
                          ? "Published"
                          : "Draft"}
                      </span>

                    </div>

                    <div className="space-y-4 p-4">

                      {/* Main Product Image */}
                      <ImageBox
  src={getWebsiteCmsImageUrl(product.mainImage)}
  label="Main Product Image"
/>

                      {/* Gallery Detail Images */}
                      {isGalleryCategory && (
                        <div className="space-y-3">

                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              Detail Images
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              4 images for this
                              product
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">

                            {[0, 1, 2, 3].map(
                              (
                                imageIndex,
                              ) => (
                                <ImageBox
                                  key={
                                    imageIndex
                                  }
                                  src={getWebsiteCmsImageUrl(
  product.images?.[imageIndex]?.imageUrl,
)}
                                  label={`Detail Image ${
                                    imageIndex +
                                    1
                                  }`}
                                />
                              ),
                            )}

                          </div>

                        </div>
                      )}

                      {/* Specification */}
                      {!isGalleryCategory && (
                        <ImageBox
  src={getWebsiteCmsImageUrl(
    product.specificationImage,
  )}
  label="Specification Image"
/>
                      )}

                    </div>

                    <div className="border-t border-slate-200 p-4">
  <ProductEditor
    product={product}
    isGallery={isGalleryCategory}
  />
</div>

                  </div>
                ),
              )}

            </div>
          )}

        </section>

        {/* Add Product */}
        <ProductManager
          categoryId={category.id}
          categorySlug={category.slug}
        />

      </div>
    </main>
  );
}
