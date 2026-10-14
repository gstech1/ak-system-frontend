"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import MTKSolarShell from "@/components/layout/MTKSolarShell";

import {
  Barcode,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type WarehouseStock = {
  quantity: number;
  warehouseId: string;
};

type OtherProduct = {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  brand: string | null;
  model: string | null;
  unit: string;
  warrantyMonths: number;
  sellingPrice: string;
  barcodeType: "FACTORY" | "INTERNAL";
  isActive: boolean;
  createdAt: string;
  stockBalances: WarehouseStock[];
};

export default function ProductListPage() {
  const [products, setProducts] = useState<OtherProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  async function loadProducts() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_URL}/other-products`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load products.");
      }

      const data = await response.json();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      product.productCode
        .toLowerCase()
        .includes(keyword) ||
      product.productName
        .toLowerCase()
        .includes(keyword) ||
      product.category
        .toLowerCase()
        .includes(keyword) ||
      (product.brand || "")
        .toLowerCase()
        .includes(keyword) ||
      (product.model || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  const visibleProducts = filteredProducts.slice(
    0,
    visibleCount,
  );

  return (
    <MTKSolarShell>
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          {/* Header */}

          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                  <Package size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Product List
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Other Electrical Products
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/warehouse/products/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <PackagePlus size={18} />
              Register Product
            </Link>
          </div>

          {/* Search & Refresh */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(10);
                  }}
                  placeholder="Search by barcode, product, category, brand or model..."
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                type="button"
                onClick={loadProducts}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Error */}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-semibold">
                Unable to load products
              </p>

              <p className="mt-1">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Product Count */}

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Registered Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredProducts.length} product
                {filteredProducts.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>
          </div>

          {/* Product Table */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="px-6 py-16 text-center">
                <RefreshCw
                  size={30}
                  className="mx-auto animate-spin text-emerald-600"
                />

                <p className="mt-4 text-sm text-slate-500">
                  Loading products...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Package
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-600">
                  {search
                    ? "No matching products found"
                    : "No products registered yet"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {search
                    ? "Try another search keyword."
                    : "Register your first electrical product to get started."}
                </p>

                {!search && (
                  <Link
                    href="/warehouse/products/register"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Plus size={17} />
                    Register Product
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Barcode
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Product
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Category
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Brand
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Model
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Unit
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Stock
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Default Price
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Warranty
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Barcode Type
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleProducts.map((product) => {
                        const stockQuantity =
                          product.stockBalances?.reduce(
                            (total, stock) =>
                              total +
                              Number(
                                stock.quantity || 0,
                              ),
                            0,
                          ) ?? 0;

                        return (
                          <tr
                            key={product.id}
                            onClick={() => {
                              window.location.href = `/warehouse/products/${product.id}`;
                            }}
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();

                                window.location.href = `/warehouse/products/${product.id}`;
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                          >
                            {/* Barcode */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Barcode
                                  size={16}
                                  className="text-emerald-600"
                                />

                                <span className="font-mono text-sm font-semibold text-slate-800">
                                  {product.productCode}
                                </span>
                              </div>
                            </td>

                            {/* Product */}

                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {product.productName}
                              </p>
                            </td>

                            {/* Category */}

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {product.category}
                            </td>

                            {/* Brand */}

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {product.brand || "-"}
                            </td>

                            {/* Model */}

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {product.model || "-"}
                            </td>

                            {/* Unit */}

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {product.unit}
                            </td>

                            {/* Stock */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex min-w-[70px] items-center justify-center rounded-full px-3 py-1 text-sm font-bold ${
                                  stockQuantity > 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {stockQuantity.toLocaleString()}
                              </span>
                            </td>

                            {/* Default Price */}

                            <td className="px-5 py-4">
                              <span className="font-semibold text-slate-900">
                                {Number(
                                  product.sellingPrice,
                                ).toLocaleString()}{" "}
                                MMK
                              </span>
                            </td>

                            {/* Warranty */}

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {product.warrantyMonths} Months
                            </td>

                            {/* Barcode Type */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                  product.barcodeType ===
                                  "FACTORY"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {product.barcodeType ===
                                "FACTORY"
                                  ? "FACTORY"
                                  : "INTERNAL"}
                              </span>
                            </td>

                            {/* Status */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                  product.isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {product.isActive
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* SHOW MORE */}

                {filteredProducts.length > visibleCount && (
                  <div className="flex justify-center border-t border-slate-200 bg-slate-50 px-6 py-5">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount(
                          (current) => current + 10,
                        )
                      }
                      className="inline-flex min-w-[150px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      SHOW MORE
                    </button>
                  </div>
                )}

                {/* ALL PRODUCTS SHOWN */}

                {filteredProducts.length > 10 &&
                  visibleCount >=
                    filteredProducts.length && (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs font-semibold text-slate-400">
                      ALL PRODUCTS SHOWN
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Register Product Shortcut */}

          <div className="mt-6 flex justify-end">
            <Link
              href="/warehouse/products/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              <PackagePlus size={17} />
              Register New Product
            </Link>
          </div>
        </div>
      </div>
    </MTKSolarShell>
  );
}