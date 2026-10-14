"use client";

import { useRouter } from "next/navigation";

type CategorySelectorProps = {
  categories: {
    id: string;
    slug: string;
    title: string;
  }[];
  currentSlug: string;
};

export default function CategorySelector({
  categories,
  currentSlug,
}: CategorySelectorProps) {
  const router = useRouter();

  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const slug = event.target.value;

    if (!slug) return;

    router.push(
      `/dashboard/website/products/${slug}`,
    );
  }

  return (
    <div>
      <label
        htmlFor="product-category"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Product Category
      </label>

      <select
        id="product-category"
        value={currentSlug}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
      >
        {categories.map((category) => (
          <option
            key={category.id}
            value={category.slug}
          >
            {category.title}
          </option>
        ))}
      </select>
    </div>
  );
}