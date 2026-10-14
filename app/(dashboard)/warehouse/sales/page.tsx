"use client";

import {
  ArrowLeft,
  Barcode,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type Product = {
  id: string;
  productCode: string;
  productName: string;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  unit?: string | null;
  sellingPrice: string | number;
  barcodeType?: string | null;
  trackingType?: string | null;
  stockBalances?: {
    quantity: number;
    warehouseId: string;
  }[];
};

type SaleItem = {
  id: string;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  price: number;
  availableStock: number;
  warehouseId: string;
};

export default function SalesPage() {
  const [customer, setCustomer] = useState("");
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  const total = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.price,
    0,
  );

  /* =========================================================
     PRODUCT LOADING
  ========================================================= */

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoadingProducts(true);

      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_BASE_URL}/other-products`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load products: ${response.status}`,
        );
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Failed to load products:",
        error,
      );

      setMessage(
        "Unable to load warehouse products.",
      );

      setMessageType("error");
    } finally {
      setLoadingProducts(false);
    }
  }

  /* =========================================================
     ADD PRODUCT
  ========================================================= */

  async function addProduct() {
    const searchValue = barcode.trim();

    if (!searchValue) {
      setMessage(
        "Scan or enter a barcode / product code.",
      );
      setMessageType("error");
      return;
    }

    setSearching(true);
    setMessage("");
    setMessageType("");

    try {
      const product = products.find(
        (item) =>
          item.productCode
            .toLowerCase() ===
            searchValue.toLowerCase() ||
          item.productCode
            .toLowerCase()
            .includes(searchValue.toLowerCase()),
      );

      if (!product) {
        setMessage(
          `Product not found: ${searchValue}`,
        );
        setMessageType("error");
        return;
      }

      const warehouseStock =
        product.stockBalances?.[0];

      const availableStock =
        product.stockBalances?.reduce(
          (total, stock) =>
            total + Number(stock.quantity || 0),
          0,
        ) ?? 0;

      const warehouseId =
        warehouseStock?.warehouseId;

      if (!warehouseId) {
        setMessage(
          `${product.productName} has no warehouse stock record.`,
        );
        setMessageType("error");
        return;
      }

      if (availableStock <= 0) {
        setMessage(
          `${product.productName} is out of stock.`,
        );
        setMessageType("error");
        return;
      }

      const price = Number(
        product.sellingPrice || 0,
      );

      const existingItem = items.find(
        (item) => item.id === product.id,
      );

      if (existingItem) {
        if (
          existingItem.quantity >=
          availableStock
        ) {
          setMessage(
            `Insufficient stock. Available: ${availableStock}`,
          );
          setMessageType("error");
          return;
        }

        setItems((current) =>
          current.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item,
          ),
        );
      } else {
        setItems((current) => [
          ...current,
          {
            id: product.id,
            productCode:
              product.productCode,
            productName:
              product.productName,
            barcode: searchValue,
            quantity: 1,
            price,
            availableStock,
            warehouseId,
          },
        ]);
      }

      setBarcode("");

      setMessage(
        `${product.productName} added to sale.`,
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Add product error:",
        error,
      );

      setMessage(
        "Unable to add product.",
      );

      setMessageType("error");
    } finally {
      setSearching(false);
    }
  }

  /* =========================================================
     BARCODE ENTER
  ========================================================= */

  function handleBarcodeKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void addProduct();
    }
  }

  /* =========================================================
     QUANTITY
  ========================================================= */

  const updateQuantity = (
    id: string,
    amount: number,
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextQuantity =
          item.quantity + amount;

        if (
          nextQuantity < 1 ||
          nextQuantity >
            item.availableStock
        ) {
          return item;
        }

        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };

  /* =========================================================
     REMOVE ITEM
  ========================================================= */

  const removeItem = (id: string) => {
    setItems((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    );
  };

  /* =========================================================
     GET LOGGED-IN USER
  ========================================================= */

  function getLoggedInUserId() {
    try {
      const authUserRaw =
        localStorage.getItem("authUser");

      if (!authUserRaw) {
        return "";
      }

      const authUser =
        JSON.parse(authUserRaw);

      return (
        authUser?.id ||
        authUser?.userId ||
        authUser?.user?.id ||
        ""
      );
    } catch (error) {
      console.error(
        "Failed to read authUser:",
        error,
      );

      return "";
    }
  }

  /* =========================================================
     CONFIRM SALE
  ========================================================= */

  async function confirmSale() {
    if (items.length === 0) {
      setMessage(
        "Please add at least one product.",
      );
      setMessageType("error");
      return;
    }

    const warehouseId =
      items[0]?.warehouseId;

    if (!warehouseId) {
      setMessage(
        "Warehouse ID is missing.",
      );
      setMessageType("error");
      return;
    }

    const sameWarehouse = items.every(
      (item) =>
        item.warehouseId === warehouseId,
    );

    if (!sameWarehouse) {
      setMessage(
        "All sale items must belong to the same warehouse.",
      );
      setMessageType("error");
      return;
    }

    const createdById =
      getLoggedInUserId();

    if (!createdById) {
      setMessage(
        "Login session user ID is missing. Please login again.",
      );
      setMessageType("error");
      return;
    }

    const token =
      localStorage.getItem("accessToken");

    if (!token) {
      setMessage(
        "Login session not found. Please login again.",
      );
      setMessageType("error");
      return;
    }

    setConfirming(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/stock-out`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            warehouseId,

            salesDate:
              new Date().toISOString(),

            customer:
              customer.trim() || null,

            remark: null,

            createdById,

            items: items.map((item) => ({
              productId: item.id,
              barcode: item.barcode,
              quantity: item.quantity,
            })),
          }),
        },
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Stock OUT failed.",
        );
      }

      const stockOutNo =
        data?.stockOutNo ||
        data?.stockOut?.stockOutNo ||
        "Created";

      setMessage(
        `Sale completed successfully. Voucher: ${stockOutNo}`,
      );

      setMessageType("success");

      setItems([]);
      setCustomer("");
      setBarcode("");

      await loadProducts();
    } catch (error) {
      console.error(
        "Confirm sale error:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete sale.",
      );

      setMessageType("error");
    } finally {
      setConfirming(false);
    }
  }

  /* =========================================================
     UI
  ========================================================= */

 return (
  <DashboardShell>
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
{/* =====================================================
    HEADER
===================================================== */}

<header className="mb-6 flex items-center justify-between gap-4">

  <div className="flex items-center gap-4">

    {/* Back to Warehouse */}
    <button
      type="button"
      onClick={() => {
        window.location.href = "/warehouse";
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
    >
      <ArrowLeft size={20} />
    </button>

    {/* Page Title */}
    <div>

      <div className="flex items-center gap-3">

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          New Sale
        </h1>

        {/* MENU */}
        <button
          type="button"
          onClick={() => {
            window.location.href = "/warehouse";
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Menu size={17} />
          <span>Menu</span>
        </button>

      </div>

      <p className="mt-1 text-sm text-slate-500">
        Create sales invoice
      </p>

    </div>

  </div>

</header>

        {/* =====================================================
            CUSTOMER
        ===================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Customer
          </label>

          <input
            type="text"
            value={customer}
            onChange={(e) =>
              setCustomer(e.target.value)
            }
            placeholder="Enter customer name..."
            className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* =====================================================
            PRODUCT SEARCH
        ===================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Barcode
                size={20}
                className="text-emerald-600"
              />

              <h2 className="font-bold text-slate-900">
                Add Product
              </h2>
            </div>

            <span className="text-xs text-slate-400">
              {loadingProducts
                ? "Loading products..."
                : `${products.length} products available`}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Barcode
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={barcode}
                onChange={(e) =>
                  setBarcode(e.target.value)
                }
                onKeyDown={
                  handleBarcodeKeyDown
                }
                placeholder="Scan barcode or enter product code..."
                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() =>
                void addProduct()
              }
              disabled={
                searching ||
                loadingProducts
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Search size={18} />

              {searching
                ? "Searching..."
                : "Add Product"}
            </button>
          </div>

          {/* ===================================================
              MESSAGE
          =================================================== */}

          {message && (
            <div
              className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${
                messageType === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* =====================================================
            SALE ITEMS
        ===================================================== */}

        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Sale Items
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Products included in this sale
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {items.length} Items
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShoppingCart size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">
                No products added
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Scan or search a product to add
                it to the sale.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* PRODUCT INFO */}

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {item.productName}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.productCode} ·{" "}
                      {item.barcode}
                    </p>

                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      Stock available:{" "}
                      {item.availableStock}
                    </p>
                  </div>

                  {/* QUANTITY / PRICE / REMOVE */}

                  <div className="flex items-center justify-between gap-5 sm:justify-end">

                    {/* QUANTITY */}

                    <div className="flex items-center rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            -1,
                          )
                        }
                        disabled={
                          item.quantity <= 1
                        }
                        className="flex h-10 w-10 items-center justify-center text-slate-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="w-10 text-center text-sm font-bold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            1,
                          )
                        }
                        disabled={
                          item.quantity >=
                          item.availableStock
                        }
                        className="flex h-10 w-10 items-center justify-center text-slate-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* PRICE */}

                    <div className="min-w-[110px] text-right">
                      <p className="font-bold text-slate-900">
                        {(
                          item.quantity *
                          item.price
                        ).toLocaleString()}
                      </p>

                      <p className="text-xs text-slate-400">
                        {item.price.toLocaleString()} each
                      </p>
                    </div>

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.id)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================
            TOTAL / CONFIRM
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Grand Total
              </p>

              <p className="mt-1 text-3xl font-black text-slate-900">
                {total.toLocaleString()} MMK
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void confirmSale()
              }
              disabled={
                items.length === 0 ||
                confirming
              }
              className="h-14 rounded-xl bg-emerald-600 px-8 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {confirming
                ? "Processing..."
                : "Confirm Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </DashboardShell>
  );
}