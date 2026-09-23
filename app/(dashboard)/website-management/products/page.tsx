"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import {
  WebsiteProductCategory,
  WebsiteProductItem,
  getWebsiteProductCategories,
} from "@/lib/api";

export default function WebsiteManagementProductsPage() {
  const [categories, setCategories] = useState<
    WebsiteProductCategory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await getWebsiteProductCategories();

      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load website products.",
      );
    } finally {
      setLoading(false);
    }
  }

  const products: WebsiteProductItem[] =
    categories.flatMap((category) =>
      category.products.map((product) => ({
        ...product,
        categoryId: category.id,
      })),
    );

  return (
    <DashboardShell>
      <PageTitle
        title="Website Products"
        subtitle="Manage products displayed on the website."
      />

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Product Categories
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Website product categories and their published
              products.
            </p>
          </div>

          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {categories.length} Categories
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading website products...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-700">
              No website product categories found.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Website product categories will appear here when
              they are added.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {category.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      /{category.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        category.isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {category.isPublished
                        ? "Published"
                        : "Draft"}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {category.products.length} Products
                    </span>
                  </div>
                </div>

                {category.products.length > 0 && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {category.products.map((product) => (
                      <div
                        key={product.id}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        <div className="aspect-[16/10] bg-slate-100">
                          {product.mainImage ? (
                            <img
                              src={product.mainImage}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-slate-900">
                              {product.title}
                            </h4>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
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

                          {product.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                              {product.description}
                            </p>
                          )}

                          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                            <span>
                              {product.images?.length ?? 0} Images
                            </span>

                            <span>
                              Order {product.sortOrder}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Website Product Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Products currently available through the Website CMS.
            </p>
          </div>

          <div className="text-2xl font-black text-slate-900">
            {products.length}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}