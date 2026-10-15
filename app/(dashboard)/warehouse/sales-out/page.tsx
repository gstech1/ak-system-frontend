"use client";
import MTKSolarShell from "@/components/layout/MTKSolarShell";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Package,
  Printer,
  RefreshCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { printThermalReceipt } from "@/lib/thermalReceipt";



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

interface SalesItem {
  product: Product;
  quantity: number;
}

interface StockOutRecord {
  id: string;
  stockOutNo: string;
  salesDate: string;
  customer?: string | null;
  remark?: string | null;
  status: string;
  createdAt: string;
  warehouse?: {
    warehouseName: string;
  };
  createdBy?: {
    username: string;
  };
  items: {
    id: string;
    barcode: string;
    quantity: number;
    product?: {
      productCode: string;
      productName: string;
      unit: string;
    };
  }[];
}

interface AuthUser {
  id?: string;
  userId?: string;
  username?: string;
  role?: string;
  status?: string;
}

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

export default function SalesOutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SalesItem[]>([]);

  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState("");
  const [salesDate, setSalesDate] = useState("");
  const [remark, setRemark] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
    const [stockOutHistory, setStockOutHistory] =
  useState<StockOutRecord[]>([]);

const [selectedStockOut, setSelectedStockOut] =
  useState<StockOutRecord | null>(null);

const [historyOpen, setHistoryOpen] =
  useState(false);

const [historyVisibleCount, setHistoryVisibleCount] =
  useState(10);  

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      today.getDate(),
    ).padStart(2, "0");

    setSalesDate(
      `${year}-${month}-${day}`,
    );
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(
          `${API_URL}/other-products`,
          {
            cache: "no-store",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load products.",
          );
        }

        setProducts(
          Array.isArray(data)
            ? data
            : [],
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

async function loadStockOutHistory() {
  try {
    const response = await fetch(
      `${API_URL}/stock-out`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load Sales OUT history.",
      );
    }

    const data = await response.json();

    setStockOutHistory(
      Array.isArray(data) ? data : [],
    );
  } catch (error) {
    console.error(
      "Sales OUT History Error:",
      error,
    );
  }
}

    loadProducts();
    loadStockOutHistory();
  }, []);

  function getAvailableStock(
    product: Product,
  ) {
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

    const product = products.find(
      (item) =>
        item.productCode.toLowerCase() ===
        code.toLowerCase(),
    );

    if (!product) {
      setErrorMessage(
        `Product not found: ${code}`,
      );
      return;
    }

    const stock =
      getAvailableStock(product);

    if (stock <= 0) {
      setErrorMessage(
        `${product.productName} has no available stock in MTK Solar Main Warehouse.`,
      );
      return;
    }

    const existing = items.find(
      (item) =>
        item.product.id ===
        product.id,
    );

    if (
      product.trackingType ===
      "UNIT"
    ) {
      if (existing) {
        setErrorMessage(
          `${product.productCode} is already added.`,
        );
        return;
      }

      setItems([
        ...items,
        {
          product,
          quantity: 1,
        },
      ]);
    } else {
      const requestedQuantity =
        Math.max(
          1,
          Number(quantity) || 1,
        );

      const existingQuantity =
        existing?.quantity || 0;

      if (
        existingQuantity +
          requestedQuantity >
        stock
      ) {
        setErrorMessage(
          `Insufficient stock. Available: ${stock}`,
        );
        return;
      }

      if (existing) {
        setItems(
          items.map((item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    requestedQuantity,
                }
              : item,
          ),
        );
      } else {
        setItems([
          ...items,
          {
            product,
            quantity:
              requestedQuantity,
          },
        ]);
      }
    }

    setBarcode("");
    setQuantity(1);
  }

  function removeItem(
    productId: string,
  ) {
    setItems(
      items.filter(
        (item) =>
          item.product.id !==
          productId,
      ),
    );
  }

  function updateQuantity(
    productId: string,
    value: number,
  ) {
    const product = items.find(
      (item) =>
        item.product.id ===
        productId,
    )?.product;

    if (!product) {
      return;
    }

    if (
      product.trackingType ===
      "UNIT"
    ) {
      return;
    }

    const stock =
      getAvailableStock(product);

    const newQuantity =
      Math.max(
        1,
        Math.min(
          value || 1,
          stock,
        ),
      );

    setItems(
      items.map((item) =>
        item.product.id ===
        productId
          ? {
              ...item,
              quantity:
                newQuantity,
            }
          : item,
      ),
    );
  }

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );

  const totalAmount =
    items.reduce(
      (total, item) =>
        total +
        Number(
          item.product
            .sellingPrice || 0,
        ) *
          item.quantity,
      0,
    );

  function printSalesOutReceipt(transaction: StockOutRecord) {
    const opened = printThermalReceipt({
      brand: "MTK Solar Warehouse System",
      title: "SALES OUT RECEIPT",
      number: transaction.stockOutNo,
      date: new Date(transaction.salesDate).toLocaleDateString(),
      recipientLabel: "Customer",
      recipient: transaction.customer || "Walk-in Customer",
      status: transaction.status,
      note: transaction.remark,
      lines: transaction.items.map((item) => ({
        name: item.product?.productName || item.product?.productCode || "Product",
        code: item.product?.productCode,
        serial: item.barcode,
        quantity: item.quantity,
      })),
    });
    if (!opened) window.alert("Allow pop-ups for this dashboard to print the receipt.");
  }

  async function handleConfirm() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!salesDate) {
      setErrorMessage(
        "Sales date is required.",
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
          `${API_URL}/stock-out`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              warehouseId:
                MTK_SOLAR_WAREHOUSE_ID,
              salesDate,
              customer:
                customer.trim() ||
                undefined,
              remark:
                remark.trim() ||
                undefined,
              createdById,
              items: items.map(
                (item) => ({
                  productId:
                    item.product.id,
                  barcode:
                    item.product
                      .productCode,
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
          data?.message ||
            "Sales OUT failed.",
        );
      }

      const stockOutNo =
        data?.stockOutNo ||
        data?.stockOut
          ?.stockOutNo ||
        "N/A";

      setSuccessMessage(
  `Sales OUT completed successfully. Transaction No: ${stockOutNo}`,
);

setItems([]);
setBarcode("");
setQuantity(1);
setCustomer("");
setRemark("");

      const productsResponse =
        await fetch(
          `${API_URL}/other-products`,
          {
            cache: "no-store",
          },
        );

      if (
        productsResponse.ok
      ) {
        const productsData =
          await productsResponse.json();

        setProducts(
          Array.isArray(
            productsData,
          )
            ? productsData
            : [],
        );
      }
    } catch (error) {
      console.error(
        "Sales OUT Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sales OUT failed.",
      );
    } finally {
      setSaving(false);
    }
  }

 return (
  <MTKSolarShell>
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

        {/* Header */}
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
              <ShoppingCart
                size={24}
              />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Sales OUT
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Issue products out of
                MTK Solar warehouse
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <p className="font-semibold">
              Sales OUT Error
            </p>

            <p className="mt-1 text-sm">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
            <p className="font-semibold">
              Sales OUT
            </p>

            <p className="mt-1 text-sm">
              {successMessage}
            </p>
          </div>
        )}

     {/* ======================================================
    SALES OUT HISTORY
    ====================================================== */}

<div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

  <button
    type="button"
    onClick={() => {
      setHistoryOpen((prev) => !prev);

      if (!historyOpen) {
        setHistoryVisibleCount(10);
      }
    }}
    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
  >
    <div>
      <div className="flex items-center gap-2">
        <Package
          size={20}
          className="text-emerald-600"
        />

        <h2 className="font-bold text-slate-900">
          Sales OUT History
        </h2>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Previous products issued from the warehouse.
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-3">

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        {stockOutHistory.length} Transactions
      </span>

      <span
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
          historyOpen
            ? "bg-slate-100 text-slate-600"
            : "bg-emerald-600 text-white shadow-sm"
        }`}
      >
        {historyOpen ? (
          <>
            <ChevronUp size={15} />
            HIDE HISTORY
          </>
        ) : (
          <>
            <ChevronDown size={15} />
            SHOW HISTORY
          </>
        )}
      </span>

    </div>
  </button>

  {historyOpen && (
    <div className="border-t border-slate-200">

      {stockOutHistory.length === 0 ? (

        <div className="px-6 py-10 text-center text-sm text-slate-500">
          No Sales OUT transactions found.
        </div>

      ) : (

        <>
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4">
                    Transaction No.
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4">
                    Products
                  </th>

                  <th className="px-6 py-4 text-center">
                    Qty
                  </th>

                  <th className="px-6 py-4">
                    Created By
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {stockOutHistory
                  .slice(0, historyVisibleCount)
                  .map((transaction) => {

                    const totalQuantity =
                      transaction.items.reduce(
                        (total, item) =>
                          total + item.quantity,
                        0,
                      );

                    return (
                      <tr
                        key={transaction.id}
                        onClick={() =>
                          setSelectedStockOut(
                            transaction,
                          )
                        }
                        className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                      >

                        <td className="px-6 py-4">

                          <div className="font-bold text-slate-900">
                            {transaction.stockOutNo}
                          </div>

                          {transaction.customer && (
                            <div className="mt-1 text-xs text-slate-500">
                              {transaction.customer}
                            </div>
                          )}

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(
                            transaction.salesDate,
                          ).toLocaleDateString(
                            "en-GB",
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <div className="space-y-1">

                            {transaction.items.map(
                              (item) => (
                                <div
                                  key={item.id}
                                  className="text-sm text-slate-700"
                                >
                                  <span className="font-medium">
                                    {
                                      item.product
                                        ?.productName ||
                                      item.product
                                        ?.productCode ||
                                      item.barcode
                                    }
                                  </span>

                                  <span className="ml-2 text-xs text-slate-400">
                                    × {item.quantity}
                                  </span>
                                </div>
                              ),
                            )}

                          </div>

                        </td>

                        <td className="px-6 py-4 text-center">

                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                            {totalQuantity}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.createdBy
                            ?.username || "-"}
                        </td>

                        <td className="px-6 py-4">

                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            {transaction.status}
                          </span>

                        </td>

                      </tr>
                    );
                  })}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              HISTORY FOOTER
              ================================================== */}

          {stockOutHistory.length > 10 && (
            <div className="flex items-center justify-center border-t border-slate-200 px-6 py-4">

              {historyVisibleCount <
              stockOutHistory.length ? (
                <button
                  type="button"
                  onClick={() =>
                    setHistoryVisibleCount(
                      (prev) =>
                        Math.min(
                          prev + 10,
                          stockOutHistory.length,
                        ),
                    )
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  SHOW MORE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setHistoryVisibleCount(10)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                >
                  SHOW LESS
                </button>
              )}

            </div>
          )}

        </>
      )}

    </div>
  )}

</div>

{/* Sales OUT Detail Modal */}
{selectedStockOut && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Sales OUT Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedStockOut.stockOutNo}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedStockOut(null)
          }
          className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ×
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Transaction No.
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {selectedStockOut.stockOutNo}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Sales Date
            </p>

            <p className="mt-1 text-slate-700">
              {new Date(
                selectedStockOut.salesDate,
              ).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Warehouse
            </p>

            <p className="mt-1 text-slate-700">
              {selectedStockOut.warehouse
                ?.warehouseName || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Created By
            </p>

            <p className="mt-1 text-slate-700">
              {selectedStockOut.createdBy
                ?.username || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Customer
            </p>

            <p className="mt-1 text-slate-700">
              {selectedStockOut.customer || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Status
            </p>

            <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {selectedStockOut.status}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-bold text-slate-900">
            Products
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                  <th className="px-4 py-3">
                    Product
                  </th>

                  <th className="px-4 py-3">
                    Barcode
                  </th>

                  <th className="px-4 py-3 text-center">
                    Quantity
                  </th>
                </tr>
              </thead>

              <tbody>
                {selectedStockOut.items.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {item.product
                            ?.productName ||
                            item.product
                              ?.productCode ||
                            "-"}
                        </div>

                        <div className="text-xs text-slate-400">
                          {item.product
                            ?.productCode || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.barcode}
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {item.quantity}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase text-slate-400">
            Remark
          </p>

          <p className="mt-1 text-sm text-slate-700">
            {selectedStockOut.remark || "-"}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => printSalesOutReceipt(selectedStockOut)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          <Printer size={17} /> Print 80 mm Receipt
        </button>
        <button
          type="button"
          onClick={() =>
            setSelectedStockOut(null)
          }
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {/* Sales Information */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-2">
              <CircleDollarSign
                size={20}
                className="text-emerald-600"
              />

              <h2 className="font-bold text-slate-900">
                Sales Information
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Enter customer information before issuing products.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                placeholder="Customer or destination..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sales Date
              </label>

              <input
                type="date"
                value={salesDate}
                onChange={(event) =>
                  setSalesDate(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

          </div>
        </div>

        {/* Scan Product */}
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
              Scan a barcode or enter a product barcode manually.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 md:flex-row">

            <div className="relative flex-1">
              <Barcode
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                autoFocus
                type="text"
                value={barcode}
                onChange={(event) =>
                  setBarcode(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    addProduct();
                  }
                }}
                placeholder="Scan barcode..."
                className="h-12 w-full rounded-xl border border-emerald-400 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none ring-2 ring-emerald-50"
              />
            </div>

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
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-center text-sm font-semibold outline-none focus:border-emerald-500 md:w-24"
            />

            <button
              type="button"
              onClick={addProduct}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <ShoppingCart
                size={18}
              />
              Add
            </button>

          </div>
        </div>

        {/* Sales Items */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="font-bold text-slate-900">
                  Sales OUT Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Products included in this sales transaction.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right">
                <p className="text-[11px] font-semibold text-emerald-600">
                  Total Quantity
                </p>

                <p className="text-lg font-black text-emerald-700">
                  {totalQuantity}
                </p>
              </div>

            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading products...
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <Package
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-500">
                No products added
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Scan a barcode above to add a product.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Barcode
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tracking
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Qty
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Price
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Total
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const price =
                      Number(
                        item.product
                          .sellingPrice ||
                          0,
                      );

                   return (
  <tr
    key={
      item.product.id
    }
    className="border-b border-slate-100 last:border-0"
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
      <span
        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
          item.product
            .trackingType ===
          "UNIT"
            ? "bg-blue-50 text-blue-600"
            : "bg-amber-50 text-amber-600"
        }`}
      >
        {
          item.product
            .trackingType
        }
      </span>
    </td>

    <td className="px-5 py-4">
      {(() => {
        const availableStock =
          item.product.stockBalances?.reduce(
            (total, balance) =>
              total +
              Number(
                balance.quantity || 0,
              ),
            0,
          ) ?? 0;

        return (
          <div className="flex flex-col items-start gap-1.5">
            {item.product
              .trackingType ===
            "UNIT" ? (
              <span className="inline-flex min-w-10 justify-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                1
              </span>
            ) : (
              <input
                type="number"
                min={1}
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
                      event.target
                        .value,
                    ),
                  )
                }
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-bold outline-none focus:border-emerald-500"
              />
            )}

            <span className="text-[11px] font-semibold text-slate-400">
              Available:{" "}
              <span className="text-emerald-600">
                {availableStock}{" "}
                {item.product.unit}
              </span>
            </span>
          </div>
        );
      })()}
    </td>

    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
      {price.toLocaleString()}{" "}
      MMK
    </td>

    <td className="px-5 py-4 text-sm font-bold text-slate-900">
      {(
        price *
        item.quantity
      ).toLocaleString()}{" "}
      MMK
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
        className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition hover:text-red-700"
      >
        <Trash2
          size={15}
        />
        Remove
      </button>
    </td>
  </tr>
);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Remark */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Remark
          </label>

          <textarea
            value={remark}
            onChange={(event) =>
              setRemark(
                event.target.value,
              )
            }
            rows={4}
            placeholder="Optional sales note..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Summary + Confirm */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Sales Amount
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {totalAmount.toLocaleString()}{" "}
                MMK
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {totalQuantity} item(s)
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart
                size={18}
              />

                         {saving
              ? "Processing..."
              : "Confirm Sales OUT"}
          </button>
        </div>
      </div>
    </div>
  </MTKSolarShell>
  );
}
