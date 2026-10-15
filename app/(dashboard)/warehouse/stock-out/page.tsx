"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PackageMinus,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type Product = {
  id: string;
  productCode: string;
  productName: string;
  category?: string | null;
  unit?: string | null;
  stockBalances?: {
    quantity: number;
    warehouseId: string;
  }[];
};

type StockOutItem = {
  id: string;
  quantity: number;
  barcode?: string;
  product?: {
    id: string;
    productCode?: string;
    productName?: string;
  };
};

type StockOutTransaction = {
  id: string;
  stockOutNo: string;
  createdAt?: string;
  salesDate?: string;
  customer?: string;
  destination?: string;
  remark?: string;
  status?: string;
  items?: StockOutItem[];
};

type SelectedItem = {
  productId: string;
  barcode: string;
  quantity: number;
};

export default function StockOutPage() {
  const [history, setHistory] = useState<
    StockOutTransaction[]
  >([]);

  const [products, setProducts] = useState<Product[]>(
    [],
  );

  const [historyOpen, setHistoryOpen] =
    useState(true);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [historySearch, setHistorySearch] =
    useState("");

  const [historyDateFrom, setHistoryDateFrom] =
    useState("");

  const [historyDateTo, setHistoryDateTo] =
    useState("");

  const [historyVisibleCount, setHistoryVisibleCount] =
    useState(10);

  const [salesDate, setSalesDate] =
    useState(
      new Date().toISOString().slice(0, 10),
    );

  const [customer, setCustomer] =
    useState("");

  const [remark, setRemark] =
    useState("");

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>([]);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const warehouseId =
    process.env.NEXT_PUBLIC_MTK_WAREHOUSE_ID ||
    "03398d3f-a459-42b4-9f89-f85bd524701c";

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API_URL}/stock-out`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load Stock OUT history.",
        );
      }

      const data = await response.json();

      setHistory(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Stock OUT history error:",
        error,
      );

      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadProducts() {
    try {
      setProductsLoading(true);

      const response = await fetch(
        `${API_URL}/other-products`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load products.",
        );
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Product loading error:",
        error,
      );

      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
    void loadProducts();
  }, []);

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) =>
          product.id === selectedProductId,
      ),
    [products, selectedProductId],
  );

  const availableStock =
    selectedProduct?.stockBalances?.reduce(
      (total, balance) =>
        total + Number(balance.quantity || 0),
      0,
    ) ?? 0;

  const filteredHistory = useMemo(() => {
    const search =
      historySearch.trim().toLowerCase();

    return history.filter((transaction) => {
      const stockOutNo =
        String(
          transaction.stockOutNo ?? "",
        ).toLowerCase();

      const customerName =
        String(
          transaction.customer ??
            transaction.destination ??
            "",
        ).toLowerCase();

      const dateValue =
        transaction.salesDate ||
        transaction.createdAt;

      const transactionDate = dateValue
        ? new Date(dateValue)
        : null;

      const fromMatch =
        !historyDateFrom ||
        (transactionDate &&
          transactionDate >=
            new Date(
              `${historyDateFrom}T00:00:00`,
            ));

      const toMatch =
        !historyDateTo ||
        (transactionDate &&
          transactionDate <=
            new Date(
              `${historyDateTo}T23:59:59`,
            ));

      const searchMatch =
        !search ||
        stockOutNo.includes(search) ||
        customerName.includes(search);

      return (
        searchMatch &&
        fromMatch &&
        toMatch
      );
    });
  }, [
    history,
    historySearch,
    historyDateFrom,
    historyDateTo,
  ]);

  function addItem() {
    setMessage("");
    setErrorMessage("");

    if (!selectedProduct) {
      setErrorMessage(
        "Please select a product.",
      );
      return;
    }

    const requestedQuantity =
      Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      setErrorMessage(
        "Quantity must be a positive whole number.",
      );
      return;
    }

    const existingItem =
      selectedItems.find(
        (item) =>
          item.productId ===
          selectedProduct.id,
      );

    const alreadySelected =
      existingItem?.quantity ?? 0;

    if (
      alreadySelected +
        requestedQuantity >
      availableStock
    ) {
      setErrorMessage(
        `Insufficient stock. Available: ${availableStock}.`,
      );
      return;
    }

    setSelectedItems((current) => {
      const existing = current.find(
        (item) =>
          item.productId ===
          selectedProduct.id,
      );

      if (existing) {
        return current.map((item) =>
          item.productId ===
          selectedProduct.id
            ? {
                ...item,
                quantity:
                  item.quantity +
                  requestedQuantity,
              }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: selectedProduct.id,
          barcode:
            selectedProduct.productCode,
          quantity:
            requestedQuantity,
        },
      ];
    });

    setSelectedProductId("");
    setQuantity("1");
  }

  function removeItem(productId: string) {
    setSelectedItems((current) =>
      current.filter(
        (item) =>
          item.productId !== productId,
      ),
    );
  }

  function clearForm() {
    setSalesDate(
      new Date()
        .toISOString()
        .slice(0, 10),
    );
    setCustomer("");
    setRemark("");
    setSelectedProductId("");
    setQuantity("1");
    setSelectedItems([]);
    setMessage("");
    setErrorMessage("");
  }

  async function submitStockOut() {
    setMessage("");
    setErrorMessage("");

    if (!warehouseId) {
      setErrorMessage(
        "MTK warehouse ID is not configured.",
      );
      return;
    }

    if (!customer.trim()) {
      setErrorMessage(
        "Customer / Destination is required.",
      );
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMessage(
        "Please add at least one product.",
      );
      return;
    }

    let createdById = "";
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "null");
      createdById =
        authUser?.id ||
        authUser?.userId ||
        localStorage.getItem("userId") ||
        localStorage.getItem("authUserId") ||
        "";
    } catch {
      createdById =
        localStorage.getItem("userId") ||
        localStorage.getItem("authUserId") ||
        "";
    }

    if (!createdById) {
      setErrorMessage(
        "User information not found. Please login again.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/stock-out`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            warehouseId,
            salesDate,
            customer:
              customer.trim(),
            remark:
              remark.trim() || null,
            createdById,
            items: selectedItems,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Stock OUT failed.",
        );
      }

      const stockOutNo =
        data?.stockOutNo ||
        data?.data?.stockOutNo ||
        "Completed";

      setMessage(
        `Stock OUT completed successfully. Transaction No: ${stockOutNo}`,
      );

      clearForm();

      await loadHistory();
    } catch (error) {
      console.error(
        "Stock OUT Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Stock OUT failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <PackageMinus
                size={28}
                className="text-emerald-600"
              />

              <h1 className="text-2xl font-bold text-slate-900">
                Stock OUT
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Issue products from MTK Solar Main Warehouse.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadProducts();
              void loadHistory();
            }}
            disabled={
              historyLoading ||
              productsLoading
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                historyLoading ||
                productsLoading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* STOCK OUT FORM */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-2">
            <PackageMinus
              size={20}
              className="text-emerald-600"
            />

            <h2 className="font-bold text-slate-900">
              Stock OUT Transaction
            </h2>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Date
              </label>

              <input
                type="date"
                value={salesDate}
                onChange={(event) =>
                  setSalesDate(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Customer / Destination
              </label>

              <input
                type="text"
                value={customer}
                onChange={(event) =>
                  setCustomer(
                    event.target.value,
                  )
                }
                placeholder="Customer or destination"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Remark
              </label>

              <input
                type="text"
                value={remark}
                onChange={(event) =>
                  setRemark(
                    event.target.value,
                  )
                }
                placeholder="Optional remark"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
              />
            </div>

          </div>

          {/* PRODUCT SELECTION */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_auto]">

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Product
                </label>

                <select
                  value={selectedProductId}
                  onChange={(event) =>
                    setSelectedProductId(
                      event.target.value,
                    )
                  }
                  disabled={
                    productsLoading
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                >
                  <option value="">
                    {productsLoading
                      ? "Loading products..."
                      : "Select Product"}
                  </option>

                  {products.map(
                    (product) => {
                      const stock =
                        product.stockBalances?.reduce(
                          (
                            total,
                            balance,
                          ) =>
                            total +
                            Number(
                              balance.quantity ||
                                0,
                            ),
                          0,
                        ) ?? 0;

                      return (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.productCode} —{" "}
                          {product.productName}{" "}
                          (Stock: {stock})
                        </option>
                      );
                    },
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 md:w-auto"
                >
                  <Plus size={17} />
                  Add Item
                </button>
              </div>

            </div>

            {selectedProduct && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedProduct.productCode}
                    {" — "}
                    {selectedProduct.productName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Unit:{" "}
                    {selectedProduct.unit ||
                      "pcs"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">
                    Available Stock
                  </p>

                  <p className="text-lg font-bold text-emerald-700">
                    {availableStock}
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* SELECTED ITEMS */}

          {selectedItems.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">

              <table className="w-full min-w-[700px] text-left">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Barcode
                    </th>

                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {selectedItems.map(
                    (item) => {
                      const product =
                        products.find(
                          (entry) =>
                            entry.id ===
                            item.productId,
                        );

                      return (
                        <tr
                          key={item.productId}
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {product?.productCode}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {product?.productName}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.barcode}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                              {item.quantity}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.productId,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2
                                size={15}
                              />
                              Remove
                            </button>
                          </td>

                        </tr>
                      );
                    },
                  )}
                </tbody>

              </table>
            </div>
          )}

          {/* CONFIRM */}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">

            <button
              type="button"
              onClick={clearForm}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() =>
                void submitStockOut()
              }
              disabled={
                submitting ||
                selectedItems.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Confirm Stock OUT
                </>
              )}
            </button>

          </div>

        </div>

        {/* ======================================================
            STOCK OUT HISTORY
            ====================================================== */}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <button
            type="button"
            onClick={() =>
              setHistoryOpen(
                (previous) => !previous,
              )
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
                  Stock OUT History
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Previous Stock OUT transactions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {history.length} Transactions
              </span>

              <span className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
                {historyOpen
                  ? "HIDE HISTORY"
                  : "SHOW HISTORY"}
              </span>
            </div>
          </button>

          {historyOpen && (
            <div className="border-t border-slate-200">

              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

                  <input
                    type="text"
                    value={historySearch}
                    onChange={(event) => {
                      setHistorySearch(
                        event.target.value,
                      );
                      setHistoryVisibleCount(10);
                    }}
                    placeholder="Search transaction / customer..."
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />

                  <input
                    type="date"
                    value={historyDateFrom}
                    onChange={(event) => {
                      setHistoryDateFrom(
                        event.target.value,
                      );
                      setHistoryVisibleCount(10);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />

                  <input
                    type="date"
                    value={historyDateTo}
                    onChange={(event) => {
                      setHistoryDateTo(
                        event.target.value,
                      );
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

              {historyLoading ? (
                <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500">
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Loading Stock OUT history...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <ClipboardList
                    size={36}
                    className="text-slate-300"
                  />

                  <p className="mt-3 font-semibold text-slate-600">
                    No Stock OUT history
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Completed Stock OUT transactions
                    will appear here.
                  </p>
                </div>
              ) : (
                <>
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
                            Customer
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

                        </tr>
                      </thead>

                      <tbody>
                        {filteredHistory
                          .slice(
                            0,
                            historyVisibleCount,
                          )
                          .map(
                            (transaction) => {
                              const transactionQuantity =
                                transaction.items?.reduce(
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
                                ) ?? 0;

                              return (
                                <tr
                                  key={
                                    transaction.id
                                  }
                                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                >

                                  <td className="px-5 py-4">
                                    <Link
                                      href={`/warehouse/stock-out/${transaction.id}`}
                                      className="inline-flex items-center gap-2 font-bold text-emerald-700 hover:underline"
                                    >
                                      {
                                        transaction.stockOutNo
                                      }

                                      <ArrowRight
                                        size={15}
                                      />
                                    </Link>

                                    {transaction.remark && (
                                      <div className="mt-1 max-w-xs truncate text-xs text-slate-400">
                                        {
                                          transaction.remark
                                        }
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-5 py-4 text-sm text-slate-600">
                                    {new Date(
                                      transaction.salesDate ||
                                        transaction.createdAt ||
                                        "",
                                    ).toLocaleDateString(
                                      "en-GB",
                                    )}
                                  </td>

                                  <td className="px-5 py-4 text-sm text-slate-600">
                                    {transaction.customer ||
                                      transaction.destination ||
                                      "—"}
                                  </td>

                                  <td className="px-5 py-4">
                                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                                      {
                                        transaction.items
                                          ?.length ??
                                        0
                                      }
                                    </span>
                                  </td>

                                  <td className="px-5 py-4">
                                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                                      {
                                        transactionQuantity
                                      }
                                    </span>
                                  </td>

                                  <td className="px-5 py-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                      <CheckCircle2
                                        size={14}
                                      />

                                      {
                                        transaction.status
                                      }
                                    </span>
                                  </td>

                                </tr>
                              );
                            },
                          )}
                      </tbody>

                    </table>
                  </div>

                  {filteredHistory.length >
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
                        className="min-w-[150px] rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        SHOW MORE
                      </button>
                    </div>
                  )}

                  {filteredHistory.length >
                    10 &&
                    historyVisibleCount >=
                      filteredHistory.length && (
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
  );
}
