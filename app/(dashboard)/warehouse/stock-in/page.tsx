"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import MTKSolarShell from "@/components/layout/MTKSolarShell";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Barcode,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  Trash2,
  Warehouse,
  XCircle,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5001"
).replace(/\/+$/, "");

const MTK_SOLAR_WAREHOUSE_ID =
  "03398d3f-a459-42b4-9f89-f85bd524701c";

const MTK_SOLAR_WAREHOUSE_NAME =
  "MTK Solar Main Warehouse";

type Product = {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  brand: string | null;
  model: string | null;
  unit: string;
  warrantyMonths: number;
  sellingPrice: string | number;
  purchasePrice: string | number | null;
  barcodeType: "FACTORY" | "INTERNAL";
  trackingType: "UNIT" | "QUANTITY";
};

type StockInItem = {
  barcode: string;
  productCode: string;
  productId: string;
  productName: string;
  category: string;
  brand: string;
  model: string;
  unit: string;
  trackingType: "UNIT" | "QUANTITY";
  quantity: number;
};

type StockInHistoryItem = {
  id: string;
  stockInNo: string;
  receivedDate: string;
  source: string | null;
  remark: string | null;
  status: string;
  createdAt: string;
  warehouse?: {
    id: string;
    warehouseName?: string;
    warehouseCode?: string;
  };
  items?: Array<{
    id: string;
    barcode: string;
    quantity: number;
    product?: {
      productCode: string;
      productName: string;
      category: string;
      unit: string;
    };
  }>;
};

type AuthUser = {
  id?: string;
  userId?: string;
  username?: string;
  role?: string;
  status?: string;
};

function getLoggedInUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const authUserRaw =
      localStorage.getItem("authUser");

    if (!authUserRaw) {
      return null;
    }

    const authUser = JSON.parse(
      authUserRaw,
    ) as AuthUser;

    return (
      authUser.id ??
      authUser.userId ??
      null
    );
  } catch {
    return null;
  }
}

export default function StockInPage() {
  const [barcode, setBarcode] = useState("");

  const [warehouse] = useState(
    MTK_SOLAR_WAREHOUSE_ID,
  );

  const [receivedDate, setReceivedDate] =
    useState("");

  const [source, setSource] = useState("");
  const [remark, setRemark] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [items, setItems] = useState<
    StockInItem[]
  >([]);

  const [
    history,
    setHistory,
  ] = useState<StockInHistoryItem[]>([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [lookupLoading, setLookupLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [historyOpen, setHistoryOpen] = useState(false);  
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingStockInId, setDeletingStockInId] =
    useState<string | null>(null);

  const [historyVisibleCount, setHistoryVisibleCount] =
  useState(10);

const [historySearch, setHistorySearch] = useState("");
const [historyDateFrom, setHistoryDateFrom] = useState("");
const [historyDateTo, setHistoryDateTo] = useState("");

  useEffect(() => {
    try {
      const authUser = localStorage.getItem("authUser");
      if (authUser) {
        const parsedUser = JSON.parse(authUser) as AuthUser;
        setIsAdmin(String(parsedUser.role || "").toUpperCase() === "ADMIN");
      }
    } catch {
      setIsAdmin(false);
    }

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      today.getDate(),
    ).padStart(2, "0");

    setReceivedDate(
      `${year}-${month}-${day}`,
    );

    void loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const token =
        localStorage.getItem(
          "accessToken",
        );

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/stock-in?warehouseId=${encodeURIComponent(
          MTK_SOLAR_WAREHOUSE_ID,
        )}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const data =
        await response.json().catch(
          () => [],
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load Stock IN history.",
        );
      }

      setHistory(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Stock IN History Error:",
        error,
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteStockIn(transaction: StockInHistoryItem) {
    const shouldDelete = window.confirm(
      `Delete Stock IN ${transaction.stockInNo}? This will remove it from Stock IN history and subtract its quantity from warehouse stock.`,
    );

    if (!shouldDelete) return;

    try {
      setDeletingStockInId(transaction.id);
      setErrorMessage("");
      setSuccessMessage("");

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Login session not found. Please sign in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/stock-in/${encodeURIComponent(transaction.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to delete Stock IN.");
      }

      setSuccessMessage(
        `Stock IN ${transaction.stockInNo} was removed and its quantity was subtracted from warehouse stock.`,
      );
      await loadHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete Stock IN.",
      );
    } finally {
      setDeletingStockInId(null);
    }
  }

function filteredHistory() {
  const search = historySearch.trim().toLowerCase();

  return history.filter((record) => {
    const transactionNo =
      String(record.stockInNo ?? "").toLowerCase();

    const sourceValue =
      String(record.source ?? "").toLowerCase();

    const createdDate = record.createdAt
      ? new Date(record.createdAt)
      : null;

    const fromMatch =
      !historyDateFrom ||
      (createdDate &&
        createdDate >=
          new Date(`${historyDateFrom}T00:00:00`));

    const toMatch =
      !historyDateTo ||
      (createdDate &&
        createdDate <=
          new Date(`${historyDateTo}T23:59:59`));

    const searchMatch =
      !search ||
      transactionNo.includes(search) ||
      sourceValue.includes(search);

    return (
      searchMatch &&
      fromMatch &&
      toMatch
    );
  });
}

  async function lookupProduct(
    barcodeValue: string,
  ) {
    const cleanBarcode =
      barcodeValue.trim();

    if (!cleanBarcode) {
      return null;
    }

    try {
      setLookupLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const token =
        localStorage.getItem(
          "accessToken",
        );

      if (!token) {
        throw new Error(
          "Login session not found. Please login again.",
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/stock-in/product/${encodeURIComponent(
          cleanBarcode,
        )}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Product not found.",
        );
      }

      return data as Product;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to find product.",
      );

      return null;
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleAddItem() {
    const cleanBarcode =
      barcode.trim();

    if (!cleanBarcode) {
      setErrorMessage(
        "Please scan a product barcode.",
      );
      return;
    }

    const quantityNumber =
      Number(quantity);

    if (
      !Number.isInteger(quantityNumber) ||
      quantityNumber <= 0
    ) {
      setErrorMessage(
        "Please enter a valid quantity.",
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const product =
      await lookupProduct(cleanBarcode);

    if (!product) {
      return;
    }

    if (
      product.trackingType === "UNIT" &&
      quantityNumber !== 1
    ) {
      setErrorMessage(
        `UNIT product "${product.productCode}" must have quantity 1.`,
      );

      setQuantity("1");

      return;
    }

    const existingItem =
      items.find(
        (item) =>
          item.barcode ===
          cleanBarcode,
      );

    if (existingItem) {
      if (
        product.trackingType === "UNIT"
      ) {
        setErrorMessage(
          `UNIT barcode "${cleanBarcode}" cannot be added more than once in the same Stock IN transaction.`,
        );

        setBarcode("");
        setQuantity("1");

        return;
      }

      setItems(
        items.map((item) =>
          item.barcode ===
          cleanBarcode
            ? {
                ...item,
                quantity:
                  item.quantity +
                  quantityNumber,
              }
            : item,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          barcode:
            product.productCode,

          productCode:
            product.productCode,

          productId:
            product.id,

          productName:
            product.productName,

          category:
            product.category,

          brand:
            product.brand ?? "—",

          model:
            product.model ?? "—",

          unit:
            product.unit,

          trackingType:
            product.trackingType,

          quantity:
            product.trackingType ===
            "UNIT"
              ? 1
              : quantityNumber,
        },
      ]);
    }

    setBarcode("");
    setQuantity("1");
  }

  function handleRemoveItem(
    barcodeToRemove: string,
  ) {
    setItems(
      items.filter(
        (item) =>
          item.barcode !==
          barcodeToRemove,
      ),
    );
  }

  async function handleConfirmStockIn() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!warehouse) {
      setErrorMessage(
        "Warehouse is required.",
      );
      return;
    }

    if (!receivedDate) {
      setErrorMessage(
        "Received date is required.",
      );
      return;
    }

    if (items.length === 0) {
      setErrorMessage(
        "Please add at least one product.",
      );
      return;
    }

    const createdById =
      getLoggedInUserId();

    if (!createdById) {
      setErrorMessage(
        "Login session user ID could not be found. Please login again.",
      );
      return;
    }

    try {
      setSaving(true);

      const token =
        localStorage.getItem(
          "accessToken",
        );

      if (!token) {
        throw new Error(
          "Login session not found. Please login again.",
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/stock-in`,
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
              warehouse,

            receivedDate,

            source:
              source.trim() ||
              undefined,

            remark:
              remark.trim() ||
              undefined,

            createdById,

            items: items.map(
              (item) => ({
                barcode:
                  item.barcode,

                productCode:
                  item.productCode,

                quantity:
                  item.quantity,
              }),
            ),
          }),
        },
      );

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Stock IN failed.",
        );
      }

      const stockInNo =
        data?.stockInNo ||
        data?.stockIn?.stockInNo ||
        "N/A";

      setSuccessMessage(
        `Stock IN completed successfully. Transaction No: ${stockInNo}`,
      );

      setItems([]);
      setBarcode("");
      setQuantity("1");
      setSource("");
      setRemark("");

      await loadHistory();
    } catch (error) {
      console.error(
        "Stock IN Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Stock IN failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );

  return (
    <MTKSolarShell>
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <Link
              href="/warehouse"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <ArrowDownToLine
                  size={24}
                />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Stock IN
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Receive products into
                  MTK Solar warehouse
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
              <XCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-semibold">
                  Stock IN Error
                </p>

                <p className="mt-1 text-sm">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="font-semibold">
                  Stock IN Completed
                </p>

                <p className="mt-1 text-sm">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-2">
                <ClipboardList
                  size={20}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-900">
                  Receiving Information
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Enter the receiving details
                before adding products.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Warehouse
                </label>

                <div className="relative">
                  <Warehouse
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={
                      MTK_SOLAR_WAREHOUSE_NAME
                    }
                    readOnly
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-100 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Received Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={
                      receivedDate
                    }
                    onChange={(event) =>
                      setReceivedDate(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Source / Supplier
                </label>

                <input
                  type="text"
                  value={source}
                  onChange={(event) =>
                    setSource(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="Supplier or source..."
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-2">
                <Barcode
                  size={20}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-900">
                  Scan Product
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Scan a barcode or open Stock IN
                from Product Detail.
              </p>
            </div>

            <div className="flex gap-3 p-6">

              <div className="relative flex-1">
                <Barcode
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
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
                      event.preventDefault();

                      void handleAddItem();
                    }
                  }}
                  disabled={
                    saving ||
                    lookupLoading
                  }
                  placeholder="Scan barcode..."
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
                disabled={
                  saving ||
                  lookupLoading
                }
                className="h-12 w-20 rounded-xl border border-slate-300 bg-slate-50 px-3 text-center text-sm outline-none focus:border-emerald-500 focus:bg-white"
              />

              <button
                type="button"
                onClick={() =>
                  void handleAddItem()
                }
                disabled={
                  saving ||
                  lookupLoading
                }
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {lookupLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={18} />
                )}

                Add
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Stock IN Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Products included in this
                  receiving transaction.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 px-5 py-3 text-right">
                <p className="text-xs font-medium text-emerald-600">
                  Total Quantity
                </p>

                <p className="text-lg font-black text-emerald-700">
                  {totalQuantity}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <Package
                  size={36}
                  className="text-slate-300"
                />

                <p className="mt-3 font-semibold text-slate-600">
                  No products added
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Scan a product barcode above
                  to add it.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Barcode
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Product
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Brand
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Model
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Unit
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Tracking
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                 <tbody>
  {filteredHistory()
    .slice(0, historyVisibleCount)
    .map((transaction) => {
      const transactionQuantity =
        transaction.items?.reduce(
          (total, item) =>
            total +
            Number(item.quantity || 0),
          0,
        ) ?? 0;

      return (
        <tr
          key={transaction.id}
          className="border-b border-slate-100 transition hover:bg-slate-50"
        >
          <td className="px-5 py-4">
            <div className="font-bold text-slate-900">
              {transaction.stockInNo}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              {transaction.id}
            </div>
          </td>

          <td className="px-5 py-4 text-sm text-slate-600">
            {transaction.createdAt
              ? new Date(
                  transaction.createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-"}
          </td>

          <td className="px-5 py-4 text-sm font-medium text-slate-700">
            {transaction.source || "-"}
          </td>

          <td className="px-5 py-4 text-sm text-slate-600">
            {transaction.items?.length ?? 0}
          </td>

          <td className="px-5 py-4 text-sm font-bold text-slate-800">
            {transactionQuantity}
          </td>

          <td className="px-5 py-4">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {transaction.status || "COMPLETED"}
            </span>
          </td>
        </tr>
      );
    })}
</tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Remark
              </label>

              <textarea
                value={remark}
                onChange={(event) =>
                  setRemark(
                    event.target.value,
                  )
                }
                disabled={saving}
                rows={4}
                placeholder="Optional receiving note..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                void handleConfirmStockIn()
              }
              disabled={
                saving ||
                items.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2
                  size={18}
                />
              )}

              {saving
                ? "Processing..."
                : "Confirm Stock IN"}
            </button>
          </div>

            {/* ======================================================
    STOCK IN HISTORY
    ====================================================== */}

<div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
  <button
    type="button"
    onClick={() =>
      setHistoryOpen((prev) => !prev)
    }
    className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-50"
  >
    <div>
      <div className="flex items-center gap-2">
        <ClipboardList
          size={20}
          className="text-emerald-600"
        />

        <h2 className="font-bold text-slate-900">
          Stock IN History
        </h2>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Previous Stock IN transactions for MTK Solar Main Warehouse.
      </p>
    </div>

    <div className="flex items-center gap-3">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        {history.length} Transactions
      </span>

      <span
        className={`inline-flex min-w-[110px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition ${
          historyOpen
            ? "bg-slate-100 text-slate-600"
            : "bg-emerald-600 text-white shadow-sm"
        }`}
      >
        {historyOpen ? "HIDE HISTORY" : "SHOW HISTORY"}
      </span>
    </div>
  </button>

  {historyOpen && (
    <div className="border-t border-slate-200">

      {/* FILTER */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

          <input
            type="text"
            value={historySearch}
            onChange={(event) => {
              setHistorySearch(event.target.value);
              setHistoryVisibleCount(10);
            }}
            placeholder="Search transaction / source..."
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
          />

          <input
            type="date"
            value={historyDateFrom}
            onChange={(event) => {
              setHistoryDateFrom(event.target.value);
              setHistoryVisibleCount(10);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
          />

          <input
            type="date"
            value={historyDateTo}
            onChange={(event) => {
              setHistoryDateTo(event.target.value);
              setHistoryVisibleCount(10);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
          />

          <button
            type="button"
            onClick={() => {
              setHistorySearch("");
              setHistoryDateFrom("");
              setHistoryDateTo("");
              setHistoryVisibleCount(10);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
          >
            Clear Filters
          </button>

        </div>
      </div>

      {/* REFRESH */}
      <div className="flex items-center justify-between px-6 py-3">

        <div className="text-xs font-medium text-slate-500">
          {historySearch ||
          historyDateFrom ||
          historyDateTo
            ? `${filteredHistory().length} matching transactions`
            : `Showing latest ${Math.min(
                historyVisibleCount,
                history.length,
              )} transactions`}
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={historyLoading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50"
        >
          {historyLoading ? "Loading..." : "Refresh"}
        </button>

      </div>

      {/* CONTENT */}
      {historyLoading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading Stock IN history...
        </div>
      ) : filteredHistory().length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <ClipboardList
            size={36}
            className="text-slate-300"
          />

          <p className="mt-3 font-semibold text-slate-600">
            No Stock IN history found
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Try changing your search or date filters.
          </p>
        </div>
      ) : (
        <>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Transaction No.
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Source
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Items
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  {isAdmin && (
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  )}

                </tr>
              </thead>

              <tbody>
                {filteredHistory()
                  .slice(0, historyVisibleCount)
                  .map((transaction) => {
                    const transactionQuantity =
                      transaction.items?.reduce(
                        (total, item) =>
                          total +
                          Number(item.quantity || 0),
                        0,
                      ) ?? 0;

                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <Link
                            href={`/warehouse/stock-in/${transaction.id}`}
                            className="inline-flex items-center gap-2 font-bold text-emerald-700 transition hover:text-emerald-900 hover:underline"
                          >
                            {transaction.stockInNo}
                            <ArrowRight size={15} />
                          </Link>

                          {transaction.remark && (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-400">
                              {transaction.remark}
                            </div>
                          )}

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {new Date(
                            transaction.receivedDate,
                          ).toLocaleDateString("en-GB")}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {transaction.source || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                            {transaction.items?.length ?? 0}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                            {transactionQuantity}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 size={14} />
                            {transaction.status}
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => void deleteStockIn(transaction)}
                              disabled={deletingStockInId === transaction.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              {deletingStockInId === transaction.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        )}

                      </tr>
                    );
                  })}
              </tbody>

            </table>
          </div>

          {/* SHOW MORE */}
          {filteredHistory().length > historyVisibleCount && (
            <div className="flex justify-center border-t border-slate-200 bg-slate-50 px-6 py-5">
              <button
                type="button"
                onClick={() =>
                  setHistoryVisibleCount(
                    (current) => current + 10,
                  )
                }
                className="inline-flex min-w-[150px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                SHOW MORE
              </button>
            </div>
          )}

          {/* ALL SHOWN */}
          {filteredHistory().length > 10 &&
            historyVisibleCount >=
              filteredHistory().length && (
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs font-semibold text-slate-400">
                ALL HISTORY SHOWN
              </div>
            )}

        </>
      )}

    </div>
  )}
</div>
</div>
</div>
</MTKSolarShell>
);
}
