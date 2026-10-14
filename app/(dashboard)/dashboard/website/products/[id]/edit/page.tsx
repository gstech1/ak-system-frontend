"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWebsiteCmsAuthHeaders } from "@/lib/website-cms-api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

type Category = {
  id: string;
  title: string;
  slug: string;
  heading: string | null;
  description: string[];
  heroImage: string | null;
  overviewImage: string | null;
  overviewTitle: string | null;
  overviewDescription: string | null;
  contentType: string;
  isPublished: boolean;
  sortOrder: number;
};

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [overviewImage, setOverviewImage] = useState("");
  const [overviewTitle, setOverviewTitle] = useState("");
  const [overviewDescription, setOverviewDescription] = useState("");
  const [contentType, setContentType] = useState("gallery");
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    async function loadCategory() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/website-cms/categories`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load categories.");
        }

        const categories: Category[] = await response.json();

        const found = categories.find(
          (item) => item.slug === params.id,
        );

        if (!found) {
          throw new Error("Category not found.");
        }

        setCategory(found);

        setTitle(found.title);
        setSlug(found.slug);
        setHeading(found.heading ?? "");
        setDescription(found.description?.join("\n") ?? "");
        setHeroImage(found.heroImage ?? "");
        setOverviewImage(found.overviewImage ?? "");
        setOverviewTitle(found.overviewTitle ?? "");
        setOverviewDescription(found.overviewDescription ?? "");
        setContentType(found.contentType);
        setIsPublished(found.isPublished);
        setSortOrder(String(found.sortOrder));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load category.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!category) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/website-cms/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getWebsiteCmsAuthHeaders(),
          },
          body: JSON.stringify({
            title,
            slug,
            heading: heading || undefined,
            description: description
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
            heroImage: heroImage || undefined,
            overviewImage: overviewImage || undefined,
            overviewTitle: overviewTitle || undefined,
            overviewDescription:
              overviewDescription || undefined,
            contentType,
            isPublished,
            sortOrder: Number(sortOrder),
          }),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "Failed to update category.",
        );
      }

      router.push(`/dashboard/website/products/${slug}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save category.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Loading category...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !category) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/website/products/${category?.slug}`,
              )
            }
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Back to Category
          </button>

          <div className="mt-4">
            <p className="text-sm font-medium text-emerald-600">
              Website CMS
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Edit Category
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Update category information without changing
              the existing product images.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Category Information
            </h2>

            <div className="grid gap-5">

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Heading
                </label>

                <input
                  value={heading}
                  onChange={(event) =>
                    setHeading(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="One paragraph per line"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Each line will be saved as a separate
                  description item.
                </p>
              </div>

            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Images
            </h2>

            <div className="grid gap-5">

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Hero Image
                </label>

                <input
                  value={heroImage}
                  onChange={(event) =>
                    setHeroImage(event.target.value)
                  }
                  placeholder="/images/products/hero/example.png"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Overview Image
                </label>

                <input
                  value={overviewImage}
                  onChange={(event) =>
                    setOverviewImage(event.target.value)
                  }
                  placeholder="/images/products/example.jpg"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Overview Content
            </h2>

            <div className="grid gap-5">

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Overview Title
                </label>

                <input
                  value={overviewTitle}
                  onChange={(event) =>
                    setOverviewTitle(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Overview Description
                </label>

                <textarea
                  value={overviewDescription}
                  onChange={(event) =>
                    setOverviewDescription(event.target.value)
                  }
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Publishing
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Content Type
                </label>

                <select
                  value={contentType}
                  onChange={(event) =>
                    setContentType(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="gallery">Gallery</option>
                  <option value="specification">
                    Specification
                  </option>
                  <option value="overview">Overview</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Sort Order
                </label>

                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
              </div>

            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) =>
                  setIsPublished(event.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-slate-700">
                Published
              </span>
            </label>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/website/products/${category?.slug}`,
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
