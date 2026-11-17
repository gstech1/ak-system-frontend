"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import MTKSolarShell from "@/components/layout/MTKSolarShell";

import {
  Barcode,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");
const PAGE_SIZE = 10;

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
  purchasePrice?: string | null;
  barcodeType: "FACTORY" | "INTERNAL";
  isActive: boolean;
  createdAt: string;
  stockBalances: WarehouseStock[];
};

type AuthUser = {
  role?: string;
};

type ProductEditDraft = {
  productName: string;
  category: string;
  brand: string;
  model: string;
  unit: string;
  warrantyMonths: string;
  sellingPrice: string;
  purchasePrice: string;
};

export default function ProductListPage() {
  const [products, setProducts] = useState<OtherProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [tableViewportWidth, setTableViewportWidth] = useState(0);
  const tableTopScrollRef = useRef<HTMLDivElement>(null);
  const tableBottomScrollRef = useRef<HTMLDivElement>(null);
  const productTableRef = useRef<HTMLTableElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEditProducts, setCanEditProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OtherProduct | null>(null);
  const [editDraft, setEditDraft] = useState<ProductEditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setErrorMessage("");
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/other-products`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
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
    let cancelled = false;
    const roleCheck = window.setTimeout(() => {
      try {
        const authUser = localStorage.getItem("authUser");
        if (authUser) {
          const parsedUser = JSON.parse(authUser) as AuthUser;
          const role = String(parsedUser.role || "").toUpperCase();
          if (!cancelled) {
            setIsAdmin(role === "ADMIN");
            setCanEditProducts(["ADMIN", "BOSS", "MANAGER"].includes(role));
          }
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setCanEditProducts(false);
        }
      }
    }, 0);

    const productLoad = window.setTimeout(() => {
      if (!cancelled) void loadProducts();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(roleCheck);
      window.clearTimeout(productLoad);
    };
  }, []);

  async function deleteProduct(product: OtherProduct) {
    const shouldDelete = window.confirm(
      `Delete ${product.productName} (${product.productCode}) from the active Product List? Stock IN history will be kept.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingProductId(product.id);
      setErrorMessage("");
      setSuccessMessage("");

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Login session not found. Please sign in again.");
      }

      const response = await fetch(
        `${API_URL}/other-products/${encodeURIComponent(product.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to delete product.");
      }

      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.id !== product.id),
      );
      const remainingFilteredCount = filteredProducts.filter(
        (item) => item.id !== product.id,
      ).length;
      const lastPageAfterDelete = Math.max(
        1,
        Math.ceil(remainingFilteredCount / PAGE_SIZE),
      );
      setCurrentPage((page) => Math.min(page, lastPageAfterDelete));
      setSuccessMessage(
        "Product removed from the active list. Stock IN history was kept.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete product.",
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  function openEditProduct(product: OtherProduct) {
    setEditingProduct(product);
    setEditDraft({
      productName: product.productName,
      category: product.category,
      brand: product.brand || "",
      model: product.model || "",
      unit: product.unit,
      warrantyMonths: String(product.warrantyMonths),
      sellingPrice: String(product.sellingPrice),
      purchasePrice: product.purchasePrice == null ? "" : String(product.purchasePrice),
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function saveProductEdit() {
    if (!editingProduct || !editDraft) return;
    if (!editDraft.productName.trim() || !editDraft.category.trim() || !editDraft.unit.trim()) {
      setErrorMessage("Product name, category, and unit are required.");
      return;
    }

    const warrantyMonths = Number(editDraft.warrantyMonths);
    const sellingPrice = Number(editDraft.sellingPrice);
    const purchasePrice = editDraft.purchasePrice.trim() === "" ? null : Number(editDraft.purchasePrice);
    if (!Number.isInteger(warrantyMonths) || warrantyMonths < 0 ||
        !Number.isFinite(sellingPrice) || sellingPrice < 0 ||
        (purchasePrice !== null && (!Number.isFinite(purchasePrice) || purchasePrice < 0))) {
      setErrorMessage("Warranty and prices must be valid non-negative numbers.");
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMessage("");
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("Login session not found. Please sign in again.");

      const response = await fetch(
        `${API_URL}/other-products/${encodeURIComponent(editingProduct.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productName: editDraft.productName.trim(),
            category: editDraft.category.trim(),
            brand: editDraft.brand.trim() || null,
            model: editDraft.model.trim() || null,
            unit: editDraft.unit.trim(),
            warrantyMonths,
            sellingPrice,
            purchasePrice,
          }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to update product.");

      setProducts((current) => current.map((item) => item.id === editingProduct.id ? { ...item, ...data } : item));
      setSuccessMessage(`${data.productName} updated successfully.`);
      setEditingProduct(null);
      setEditDraft(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update product.");
    } finally {
      setSavingEdit(false);
    }
  }

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

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const pageButtons: (number | "ellipsis")[] = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [
        1,
        ...(currentPage > 3 ? ["ellipsis" as const] : []),
        ...Array.from(
          { length: Math.max(0, Math.min(totalPages - 1, currentPage + 1) - Math.max(2, currentPage - 1) + 1) },
          (_, index) => Math.max(2, currentPage - 1) + index,
        ),
        ...(currentPage < totalPages - 2 ? ["ellipsis" as const] : []),
        totalPages,
      ];

  useEffect(() => {
    const viewport = tableBottomScrollRef.current;
    const table = productTableRef.current;
    if (!viewport || !table) return;

    const updateDimensions = () => {
      setTableScrollWidth(table.scrollWidth);
      setTableViewportWidth(viewport.clientWidth);
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(viewport);
    observer.observe(table);
    return () => observer.disconnect();
  }, [loading, filteredProducts.length, currentPage]);

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
                    setCurrentPage(1);
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

          {successMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
              {successMessage}
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
                <div
                  ref={tableTopScrollRef}
                  aria-label="Scroll product table horizontally"
                  className={`overflow-x-auto overflow-y-hidden border-b border-slate-200 ${tableScrollWidth > tableViewportWidth ? "" : "hidden"}`}
                  onScroll={(event) => {
                    const bottom = tableBottomScrollRef.current;
                    if (bottom && bottom.scrollLeft !== event.currentTarget.scrollLeft) {
                      bottom.scrollLeft = event.currentTarget.scrollLeft;
                    }
                  }}
                >
                  <div style={{ width: `${tableScrollWidth}px` }} className="h-4" />
                </div>
                <div
                  ref={tableBottomScrollRef}
                  className="overflow-x-auto"
                  onScroll={(event) => {
                    const top = tableTopScrollRef.current;
                    if (top && top.scrollLeft !== event.currentTarget.scrollLeft) {
                      top.scrollLeft = event.currentTarget.scrollLeft;
                    }
                  }}
                >
                  <table ref={productTableRef} className="w-full min-w-[1320px] text-left">
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

                        {(isAdmin || canEditProducts) && (
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        )}
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

                            {(isAdmin || canEditProducts) && (
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                {canEditProducts && <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditProduct(product);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>}
                                {isAdmin && <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void deleteProduct(product);
                                  }}
                                  disabled={deletingProductId === product.id}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                  {deletingProductId === product.id ? "Deleting..." : "Delete"}
                                </button>}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-sm text-slate-600">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}
                    </p>
                    <nav aria-label="Product list pages" className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      {pageButtons.map((page, index) => page === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-slate-400" aria-hidden="true">…</span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                          className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold transition ${currentPage === page ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700"}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
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
      {editingProduct && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-product-title" className="text-xl font-bold text-slate-900">Edit Product</h2>
                <p className="mt-1 text-sm text-slate-500">Product code and barcode behavior stay unchanged to protect stock history.</p>
              </div>
              <button type="button" onClick={() => { setEditingProduct(null); setEditDraft(null); }} disabled={savingEdit} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
            </div>
            {errorMessage && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["Product Name", "productName"], ["Category", "category"], ["Brand", "brand"], ["Model", "model"],
                ["Unit", "unit"], ["Warranty (months)", "warrantyMonths"], ["Selling Price", "sellingPrice"], ["Purchase Price", "purchasePrice"],
              ] as const).map(([label, key]) => (
                <label key={key} className="block text-sm font-semibold text-slate-700">
                  {label}
                  <input type={key === "sellingPrice" || key === "purchasePrice" || key === "warrantyMonths" ? "number" : "text"} min={key === "warrantyMonths" ? 0 : undefined} step={key === "sellingPrice" || key === "purchasePrice" ? "0.01" : "1"} value={editDraft[key]} onChange={(event) => setEditDraft((current) => current ? { ...current, [key]: event.target.value } : current)} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setEditingProduct(null); setEditDraft(null); }} disabled={savingEdit} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void saveProductEdit()} disabled={savingEdit} className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{savingEdit ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </MTKSolarShell>
  );
}
