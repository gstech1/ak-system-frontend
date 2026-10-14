"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  ClipboardList,
  History,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";

import MTKSolarShell from "@/components/layout/MTKSolarShell";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

const MTK_SOLAR_WAREHOUSE_ID =
  "03398d3f-a459-42b4-9f89-f85bd524701c";

interface Product {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  unit: string;
  sellingPrice: string | number;
  barcodeType: "FACTORY" | "INTERNAL";
  trackingType: "UNIT" | "QUANTITY";
  stockBalances?: {
    quantity: number;
    warehouseId: string;
  }[];
}

interface ServiceItem {
  product: Product;
  quantity: number;
  availableStock: number;
}

interface HistoryProduct {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
}

interface ServiceIssueHistoryItem {
  id: string;
  quantity: number;
  product: HistoryProduct;
}

interface ServiceIssueHistory {
  id: string;
  serviceIssueNo: string;
  serviceTeam: string;
  remark?: string | null;
  status: string;
  issuedDate: string;
  createdAt: string;
  items: ServiceIssueHistoryItem[];
}

export default function ServiceIssuePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [history, setHistory] =
    useState<ServiceIssueHistory[]>([]);

  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [serviceTeam, setServiceTeam] = useState("");
  const [remark, setRemark] = useState("");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] =
    useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [historyVisibleCount, setHistoryVisibleCount] =
    useState(10);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadProducts() {
    try {
      const response = await fetch(
        `${API_URL}/other-products`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load products.",
        );
      }

      setProducts(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API_URL}/service-issue`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load service issue history.",
        );
      }

      setHistory(
        Array.isArray(data) ? data : [],
      );

      setHistoryVisibleCount(10);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load service issue history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
    void loadHistory();
  }, []);

  function getAvailableStock(product: Product) {
    return (
      product.stockBalances?.find(
        (balance) =>
          balance.warehouseId ===
          MTK_SOLAR_WAREHOUSE_ID,
      )?.quantity ?? 0
    );
  }

  function addProduct() {
    setErrorMessage("");
    setSuccessMessage("");

    const code = barcode.trim();

    if (!code) {
      setErrorMessage(
        "Please scan or enter a barcode.",
      );
      return;
    }

    setSearching(true);

    const product = products.find(
      (item) =>
        item.productCode.toLowerCase() ===
          code.toLowerCase() ||
        item.productCode
          .toLowerCase()
          .includes(code.toLowerCase()),
    );

    if (!product) {
      setErrorMessage(
        `Product not found: ${code}`,
      );
      setSearching(false);
      return;
    }

    const availableStock =
      getAvailableStock(product);

    if (availableStock <= 0) {
      setErrorMessage(
        `${product.productName} has no available stock.`,
      );
      setSearching(false);
      return;
    }

    const existing = items.find(
      (item) =>
        item.product.id === product.id,
    );

    if (product.trackingType === "UNIT") {
      if (existing) {
        setErrorMessage(
          `${product.productCode} is already added.`,
        );
        setSearching(false);
        return;
      }

      setItems((current) => [
        ...current,
        {
          product,
          quantity: 1,
          availableStock,
        },
      ]);
    } else {
      const requestedQuantity = Math.max(
        1,
        Number(quantity) || 1,
      );

      const existingQuantity =
        existing?.quantity || 0;

      if (
        existingQuantity +
          requestedQuantity >
        availableStock
      ) {
        setErrorMessage(
          `Insufficient stock. Available: ${availableStock} ${product.unit}.`,
        );
        setSearching(false);
        return;
      }

      if (existing) {
        setItems((current) =>
          current.map((item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    requestedQuantity,
                  availableStock,
                }
              : item,
          ),
        );
      } else {
        setItems((current) => [
          ...current,
          {
            product,
            quantity:
              requestedQuantity,
            availableStock,
          },
        ]);
      }
    }

    setBarcode("");
    setQuantity(1);
    setSearching(false);
  }

  function updateQuantity(
    productId: string,
    nextQuantity: number,
  ) {
    setErrorMessage("");

    setItems((current) =>
      current.map((item) => {
        if (
          item.product.id !== productId
        ) {
          return item;
        }

        const safeQuantity = Math.max(
          1,
          Number(nextQuantity) || 1,
        );

        if (
          safeQuantity >
          item.availableStock
        ) {
          setErrorMessage(
            `Available stock: ${item.availableStock} ${item.product.unit}.`,
          );

          return item;
        }

        return {
          ...item,
          quantity: safeQuantity,
        };
      }),
    );
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter(
        (item) =>
          item.product.id !==
          productId,
      ),
    );
  }

  async function handleConfirm() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!serviceTeam.trim()) {
      setErrorMessage(
        "Please enter the service team or technician.",
      );
      return;
    }

    if (items.length === 0) {
      setErrorMessage(
        "Please add at least one product.",
      );
      return;
    }

    const token =
      localStorage.getItem(
        "accessToken",
      );

    if (!token) {
      setErrorMessage(
        "Login session not found. Please login again.",
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_URL}/service-issue`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              warehouseId:
                MTK_SOLAR_WAREHOUSE_ID,
              serviceTeam:
                serviceTeam.trim(),
              remark:
                remark.trim() ||
                undefined,
              items: items.map(
                (item) => ({
                  productId:
                    item.product.id,
                  quantity:
                    item.quantity,
                }),
              ),
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Service Issue failed.",
        );
      }

      const serviceIssueNo =
        data?.serviceIssueNo ||
        data?.serviceIssue
          ?.serviceIssueNo ||
        "N/A";

      setSuccessMessage(
        `Service Issue completed successfully. Transaction No: ${serviceIssueNo}`,
      );

      setItems([]);
      setBarcode("");
      setQuantity(1);
      setServiceTeam("");
      setRemark("");

      await loadProducts();
      await loadHistory();
    } catch (error) {
      console.error(
        "Service Issue Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Service Issue failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalQuantity = items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );

  const historyTotalQuantity =
    useMemo(
      () =>
        history.reduce(
          (total, issue) =>
            total +
            issue.items.reduce(
              (itemTotal, item) =>
                itemTotal +
                item.quantity,
              0,
            ),
          0,
        ),
      [history],
    );

  function formatDate(
    value: string,
  ) {
    return new Date(
      value,
    ).toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <MTKSolarShell>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">

          <div className="mb-8">
            <Link
              href="/warehouse"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Warehouse
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <Wrench
                  size={27}
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Service Issue
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Issue warehouse products to the service team.
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          {/* ADD PRODUCT */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-2">
                <Barcode
                  size={20}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-900">
                  Add Product
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Scan the product barcode or enter the product code.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-[1fr_140px_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Barcode / Product Code
                </label>

                <input
                  autoFocus
                  value={barcode}
                  onChange={(event) =>
                    setBarcode(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      addProduct();
                    }
                  }}
                  placeholder="Scan barcode..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.max(
                        1,
                        Number(
                          event.target.value,
                        ) || 1,
                      ),
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={
                    loading ||
                    searching ||
                    saving
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                >
                  <Plus size={18} />

                  {searching
                    ? "Checking..."
                    : "Add Product"}
                </button>
              </div>
            </div>

            {loading && (
              <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-400">
                Loading warehouse products...
              </div>
            )}
          </section>

          {/* SERVICE INFORMATION */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-2">
                <UserRound
                  size={20}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-900">
                  Service Information
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Record where the products are being issued.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Technician / Service Team
                </label>

                <input
                  value={serviceTeam}
                  onChange={(event) =>
                    setServiceTeam(
                      event.target.value,
                    )
                  }
                  placeholder="Enter technician or service team"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Remark
                </label>

                <input
                  value={remark}
                  onChange={(event) =>
                    setRemark(
                      event.target.value,
                    )
                  }
                  placeholder="Optional remark"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </section>

          {/* CURRENT ITEMS */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList
                    size={20}
                    className="text-emerald-600"
                  />

                  <h2 className="font-bold text-slate-900">
                    Service Issue Items
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Products selected for service.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {items.length} Items
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  Total Qty: {totalQuantity}
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <Package
                  size={42}
                  className="text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-600">
                  No products added
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Scan a product barcode above to add it.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Barcode
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Product
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Qty
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Available
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={
                          item.product.id
                        }
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Barcode
                              size={16}
                              className="text-emerald-600"
                            />

                            <span className="text-sm font-semibold text-slate-800">
                              {
                                item.product
                                  .productCode
                              }
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800">
                            {
                              item.product
                                .productName
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.product.brand ||
                              "No Brand"}

                            {item.product.model
                              ? ` • ${item.product.model}`
                              : ""}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {
                            item.product
                              .category
                          }
                        </td>

                        <td className="px-5 py-4">
                          {item.product
                            .trackingType ===
                          "UNIT" ? (
                            <span className="inline-flex min-w-10 justify-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                              1
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              max={
                                item.availableStock
                              }
                              value={
                                item.quantity
                              }
                              onChange={(
                                event,
                              ) =>
                                updateQuantity(
                                  item.product
                                    .id,
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                              className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-bold outline-none focus:border-emerald-500"
                            />
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            {item.availableStock}{" "}
                            {item.product.unit}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                item.product
                                  .id,
                              )
                            }
                            disabled={saving}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2
                              size={15}
                            />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() =>
                void handleConfirm()
              }
              disabled={
                saving ||
                items.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={18} />

              {saving
                ? "Processing..."
                : "Confirm Service Issue"}
            </button>
          </div>

          {/* SERVICE ISSUE HISTORY */}
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <History
                    size={20}
                    className="text-emerald-600"
                  />

                  <h2 className="font-bold text-slate-900">
                    Service Issue History
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Previous products issued to the service team.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {history.length} Transactions
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  Total Qty:{" "}
                  {historyTotalQuantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    void loadHistory()
                  }
                  disabled={historyLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      historyLoading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>
              </div>
            </div>

            {historyLoading ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                Loading service issue history...
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <History
                  size={42}
                  className="text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-600">
                  No service issue history
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Completed service issues will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Transaction No.
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Service Team
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Products
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Total Qty
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {history
                        .slice(
                          0,
                          historyVisibleCount,
                        )
                        .map((issue) => {
                          const issueTotal =
                            issue.items.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                Number(
                                  item.quantity ||
                                    0,
                                ),
                              0,
                            );

                          return (
                            <tr
                              key={
                                issue.id
                              }
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                            >
                              <td className="px-5 py-4">
                                <span className="font-mono text-sm font-bold text-slate-800">
                                  {
                                    issue.serviceIssueNo
                                  }
                                </span>

                                {issue.remark && (
                                  <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                                    {
                                      issue.remark
                                    }
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">
                                {formatDate(
                                  issue.issuedDate,
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <UserRound
                                    size={16}
                                    className="text-emerald-600"
                                  />

                                  <span className="text-sm font-semibold text-slate-700">
                                    {
                                      issue.serviceTeam
                                    }
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="space-y-1.5">
                                  {issue.items.map(
                                    (
                                      item,
                                    ) => (
                                      <div
                                        key={
                                          item.id
                                        }
                                        className="flex items-center gap-2"
                                      >
                                        <span className="font-mono text-xs font-bold text-emerald-700">
                                          {
                                            item
                                              .product
                                              .productCode
                                          }
                                        </span>

                                        <span className="text-xs text-slate-500">
                                          {
                                            item
                                              .product
                                              .productName
                                          }
                                        </span>

                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                          ×
                                          {
                                            item.quantity
                                          }
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                  {
                                    issueTotal
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                  {
                                    issue.status
                                  }
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {history.length >
                  historyVisibleCount && (
                  <div className="flex justify-center border-t border-slate-200 bg-slate-50 px-6 py-5">
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryVisibleCount(
                          (current) =>
                            current + 10,
                        )
                      }
                      className="inline-flex min-w-[150px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      SHOW MORE
                    </button>
                  </div>
                )}

                {history.length > 10 &&
                  historyVisibleCount >=
                    history.length && (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs font-semibold text-slate-400">
                      ALL HISTORY SHOWN
                    </div>
                  )}
              </>
            )}
          </section>
        </div>
      </div>
    </MTKSolarShell>
  );
}

