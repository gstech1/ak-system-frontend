"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";

import {
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Package,
  RefreshCw,
  Search,
  ScanLine,
  X,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type WarehouseStock = {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;

  warehouse: {
    id: string;
    warehouseCode: string;
    warehouseName: string;
  };

  product: {
    id: string;
    productCode: string;
    productName: string;
    category: string | null;
    brand: string | null;
    model: string | null;
    unit: string;
    trackingType: string;
  };
};

type CheckedProduct = {
  productId: string;
  stockId: string;
  productCode: string;
  productName: string;
  trackingType: string;
  systemQty: number;
  checkedQty: number;
  physicalQty?: number;
};

export default function StockCountPage() {
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showStockList, setShowStockList] =
    useState(true);

  const [stockCheckOpen, setStockCheckOpen] =
    useState(false);

  const [barcode, setBarcode] = useState("");

  const [checkedProducts, setCheckedProducts] =
    useState<Record<string, CheckedProduct>>({});

  const [quantityProduct, setQuantityProduct] =
    useState<WarehouseStock | null>(null);

  const [physicalQuantity, setPhysicalQuantity] =
    useState("");

  const [scanMessage, setScanMessage] =
    useState("");

  const barcodeInputRef =
    useRef<HTMLInputElement>(null);

  /* =====================================================
     LOAD WAREHOUSE STOCK
  ===================================================== */

  const loadStock = async () => {
    try {
      setError("");

      const response = await fetch(
       `${API_BASE_URL}/warehouse-stock?warehouseCode=SUNTREE-MAIN`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load warehouse stock (${response.status})`,
        );
      }

      const data =
        (await response.json()) as WarehouseStock[];

      setStocks(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load warehouse stock.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStock();
  };

  /* =====================================================
     FILTER STOCK
  ===================================================== */

  const filteredStocks = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return stocks;
    }

    return stocks.filter((stock) => {
      return (
        stock.product.productCode
          .toLowerCase()
          .includes(keyword) ||
        stock.product.productName
          .toLowerCase()
          .includes(keyword) ||
        (stock.product.brand || "")
          .toLowerCase()
          .includes(keyword) ||
        (stock.product.model || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [stocks, search]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalProducts = stocks.length;

  const totalQuantity = stocks.reduce(
    (total, stock) =>
      total + Number(stock.quantity || 0),
    0,
  );

  const checkedList = Object.values(
    checkedProducts,
  );

  const checkedProductCount =
    checkedList.length;

  const checkedQuantity = checkedList.reduce(
    (total, item) =>
      total + Number(item.checkedQty || 0),
    0,
  );

  /* =====================================================
     REMAINING PRODUCTS
  ===================================================== */

  const remainingProducts = stocks
    .map((stock) => {
      const checked =
        checkedProducts[stock.productId];

      const checkedQty =
        checked?.checkedQty || 0;

      const remaining =
        Math.max(
          Number(stock.quantity || 0) -
            checkedQty,
          0,
        );

      return {
        stock,
        checkedQty,
        remaining,
      };
    })
    .filter(
      (item) => item.remaining > 0,
    );

  /* =====================================================
     FIND PRODUCT BY BARCODE
  ===================================================== */

  const findProductByBarcode = (
    value: string,
  ) => {
    const normalized = value
      .trim()
      .toLowerCase();

    if (!normalized) {
      return null;
    }

    return (
      stocks.find(
        (stock) =>
          stock.product.productCode
            .trim()
            .toLowerCase() ===
          normalized,
      ) || null
    );
  };

  /* =====================================================
     UNIT SCAN
  ===================================================== */

  const handleUnitScan = (
    stock: WarehouseStock,
  ) => {
    setCheckedProducts((previous) => {
      const existing =
        previous[stock.productId];

      const currentQty =
        existing?.checkedQty || 0;

      const nextQty = currentQty + 1;

      return {
        ...previous,

        [stock.productId]: {
          productId:
            stock.productId,

          stockId:
            stock.id,

          productCode:
            stock.product.productCode,

          productName:
            stock.product.productName,

          trackingType:
            stock.product.trackingType,

          systemQty:
            Number(stock.quantity || 0),

          checkedQty:
            nextQty,
        },
      };
    });

    setScanMessage(
      `${stock.product.productCode} scanned successfully.`,
    );
  };

  /* =====================================================
     QUANTITY PRODUCT
  ===================================================== */

  const openQuantityCount = (
    stock: WarehouseStock,
  ) => {
    setQuantityProduct(stock);

    const existing =
      checkedProducts[stock.productId];

    setPhysicalQuantity(
      existing
        ? String(existing.checkedQty)
        : "",
    );
  };

  const confirmQuantityCount = () => {
    if (!quantityProduct) {
      return;
    }

    const qty =
      Number(physicalQuantity);

    if (
      !Number.isFinite(qty) ||
      qty < 0
    ) {
      setScanMessage(
        "Please enter a valid physical quantity.",
      );

      return;
    }

    setCheckedProducts(
      (previous) => ({
        ...previous,

        [quantityProduct.productId]: {
          productId:
            quantityProduct.productId,

          stockId:
            quantityProduct.id,

          productCode:
            quantityProduct.product.productCode,

          productName:
            quantityProduct.product.productName,

          trackingType:
            quantityProduct.product.trackingType,

          systemQty:
            Number(
              quantityProduct.quantity || 0,
            ),

          checkedQty:
            qty,

          physicalQty:
            qty,
        },
      }),
    );

    setScanMessage(
      `${quantityProduct.product.productCode} count saved.`,
    );

    setQuantityProduct(null);
    setPhysicalQuantity("");

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  /* =====================================================
     BARCODE SCAN HANDLER
  ===================================================== */

  const handleBarcodeScan = () => {
    const value = barcode.trim();

    if (!value) {
      return;
    }

    const stock =
      findProductByBarcode(value);

    if (!stock) {
      setScanMessage(
        `Barcode "${value}" was not found in warehouse stock.`,
      );

      setBarcode("");

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);

      return;
    }

    if (
      stock.product.trackingType ===
      "QUANTITY"
    ) {
      openQuantityCount(stock);
    } else {
      handleUnitScan(stock);
    }

    setBarcode("");

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleBarcodeKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleBarcodeScan();
    }
  };

  /* =====================================================
     CLEAR CHECK
  ===================================================== */

  const clearCheckData = () => {
    const confirmed =
      window.confirm(
        "Clear all current stock check data?",
      );

    if (!confirmed) {
      return;
    }

    setCheckedProducts({});
    setScanMessage("");
    setBarcode("");

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  /* =====================================================
     DIFFERENCE
  ===================================================== */

  const getDifference = (
    item: CheckedProduct,
  ) => {
    return (
      item.checkedQty -
      item.systemQty
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */

 return (
  <DashboardShell>
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ClipboardCheck size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Stock Count
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Warehouse stock checking system.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* =================================================
            MODE BUTTONS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">

          <button
            type="button"
            onClick={() =>
              setShowStockList(
                (value) => !value,
              )
            }
            className={`flex min-h-[92px] items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
              showStockList
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-emerald-300"
            }`}
          >

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              {showStockList ? (
                <Eye size={25} />
              ) : (
                <EyeOff size={25} />
              )}
            </div>

            <div className="flex-1">

              <div className="text-lg font-bold text-slate-900">
                Warehouse Stock List
              </div>

              <div className="mt-1 text-sm text-slate-500">
                View or hide current warehouse stock.
              </div>

            </div>

          </button>

          <button
            type="button"
            onClick={() => {
              setStockCheckOpen(
                (value) => !value,
              );

              setTimeout(() => {
                barcodeInputRef.current?.focus();
              }, 100);
            }}
            className={`flex min-h-[92px] items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
              stockCheckOpen
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ScanLine size={25} />
            </div>

            <div className="flex-1">

              <div className="text-lg font-bold text-slate-900">
                Stock Check System
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Scan barcode / QR and check physical stock.
              </div>

            </div>

          </button>

        </div>

        {/* =================================================
            STOCK CHECK SYSTEM
        ================================================= */}

        {stockCheckOpen && (
          <section className="mb-6 rounded-2xl border border-blue-200 bg-white shadow-sm">

            <div className="border-b border-blue-100 bg-blue-50/60 p-5">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Barcode size={21} />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900">
                      Stock Check System
                    </h2>

                    <p className="text-xs text-slate-500">
                      UNIT = scan each barcode. QUANTITY = scan then enter physical quantity.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={clearCheckData}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear Check
                </button>

              </div>

            </div>

            <div className="p-5">

              {/* SCANNER */}

              <div className="flex flex-col gap-3 md:flex-row">

                <div className="relative flex-1">

                  <ScanLine
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
                  />

                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(event) =>
                      setBarcode(
                        event.target.value,
                      )
                    }
                    onKeyDown={
                      handleBarcodeKeyDown
                    }
                    autoComplete="off"
                    placeholder="Scan barcode / QR code..."
                    className="w-full rounded-xl border border-slate-200 py-4 pl-12 pr-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <button
                  type="button"
                  onClick={handleBarcodeScan}
                  className="rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  Scan
                </button>

              </div>

              {scanMessage && (
                <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {scanMessage}
                </div>
              )}

              {/* CHECK SUMMARY */}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Products Checked
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {checkedProductCount}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Checked Quantity
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {checkedQuantity}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Not Fully Checked
                  </p>

                  <p className="mt-1 text-2xl font-bold text-orange-600">
                    {remainingProducts.length}
                  </p>

                </div>

              </div>

              {/* CHECKED PRODUCTS */}

              <div className="mt-6">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Checked Products
                    </h3>

                    <p className="text-xs text-slate-500">
                      Scanned / entered products are grouped here.
                    </p>
                  </div>

                </div>

                {checkedList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">

                    <ScanLine
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No products checked yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Start scanning a warehouse barcode.
                    </p>

                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[850px] text-sm">

                      <thead className="bg-slate-50">

                        <tr className="border-b border-slate-200 text-left">

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            No.
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Product
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Tracking
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            System
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Checked
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Difference
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {checkedList.map(
                          (item, index) => {
                            const difference =
                              getDifference(
                                item,
                              );

                            return (
                              <tr
                                key={
                                  item.productId
                                }
                                className="border-b border-slate-100 last:border-0"
                              >

                                <td className="px-4 py-4 font-semibold text-slate-500">
                                  {index + 1}
                                </td>

                                <td className="px-4 py-4">

                                  <div className="font-semibold text-slate-900">
                                    {
                                      item.productCode
                                    }
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {
                                      item.productName
                                    }
                                  </div>

                                </td>

                                <td className="px-4 py-4">

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {
                                      item.trackingType
                                    }
                                  </span>

                                </td>

                                <td className="px-4 py-4 text-center font-semibold text-slate-700">
                                  {
                                    item.systemQty
                                  }
                                </td>

                                <td className="px-4 py-4 text-center font-bold text-blue-600">
                                  {
                                    item.checkedQty
                                  }
                                </td>

                                <td className="px-4 py-4 text-center">

                                  <span
                                    className={`font-bold ${
                                      difference ===
                                      0
                                        ? "text-emerald-600"
                                        : difference <
                                            0
                                          ? "text-red-600"
                                          : "text-orange-600"
                                    }`}
                                  >
                                    {difference > 0
                                      ? `+${difference}`
                                      : difference}
                                  </span>

                                </td>

                              </tr>
                            );
                          },
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

              {/* REMAINING */}

              <div className="mt-8">

                <div className="mb-3">

                  <h3 className="font-bold text-slate-900">
                    Remaining / Not Fully Checked
                  </h3>

                  <p className="text-xs text-slate-500">
                    Products still remaining from the original warehouse stock list.
                  </p>

                </div>

                {remainingProducts.length ===
                0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">

                    <CheckCircle2
                      size={21}
                      className="text-emerald-600"
                    />

                    <div>
                      <p className="font-semibold text-emerald-800">
                        All checked quantities are complete.
                      </p>

                      <p className="text-xs text-emerald-600">
                        No remaining quantity from the current count.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-orange-200">

                    <table className="w-full min-w-[750px] text-sm">

                      <thead className="bg-orange-50">

                        <tr className="border-b border-orange-100 text-left">

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            No.
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Product
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            System Qty
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Checked
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-orange-700">
                            Remaining
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {remainingProducts.map(
                          (
                            item,
                            index,
                          ) => (
                            <tr
                              key={
                                item.stock.id
                              }
                              className="border-b border-slate-100 last:border-0"
                            >

                              <td className="px-4 py-4 font-semibold text-slate-500">
                                {index + 1}
                              </td>

                              <td className="px-4 py-4">

                                <div className="font-semibold text-slate-900">
                                  {
                                    item.stock
                                      .product
                                      .productCode
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    item.stock
                                      .product
                                      .productName
                                  }
                                </div>

                              </td>

                              <td className="px-4 py-4 text-center font-semibold text-slate-700">
                                {
                                  item.stock
                                    .quantity
                                }
                              </td>

                              <td className="px-4 py-4 text-center font-semibold text-blue-600">
                                {
                                  item.checkedQty
                                }
                              </td>

                              <td className="px-4 py-4 text-center font-bold text-orange-600">
                                {
                                  item.remaining
                                }
                              </td>

                            </tr>
                          ),
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            WAREHOUSE STOCK LIST
        ================================================= */}

        {showStockList && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <h2 className="text-base font-bold text-slate-900">
                    Warehouse Stock List
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Current stock available in the warehouse.
                  </p>

                </div>

                <div className="relative w-full sm:w-80">

                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search product..."
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>

              </div>

            </div>

            {error && (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="px-5 py-16 text-center text-sm text-slate-500">
                Loading warehouse stock...
              </div>
            ) : filteredStocks.length ===
              0 ? (
              <div className="px-5 py-16 text-center">

                <Package
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No stock found.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px] text-sm">

                  <thead className="bg-slate-50">

                    <tr className="border-b border-slate-200 text-left">

                      <th className="px-5 py-3 text-center font-semibold text-slate-700">
                        No.
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Product
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Product Name
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Category
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Tracking
                      </th>

                      <th className="px-5 py-3 text-center font-semibold text-slate-700">
                        System Qty
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredStocks.map(
                      (stock, index) => (
                        <tr
                          key={stock.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-5 py-4 text-center font-semibold text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">

                            <div className="font-semibold text-slate-900">
                              {
                                stock.product
                                  .productCode
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                stock.product
                                  .brand
                              }{" "}
                              {
                                stock.product
                                  .model
                              }
                            </div>

                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {
                              stock.product
                                .productName
                            }
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {
                              stock.product
                                .category ||
                              "-"
                            }
                          </td>

                          <td className="px-5 py-4">

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                              {
                                stock.product
                                  .trackingType
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-center">

                            <span className="font-bold text-slate-900">
                              {
                                stock.quantity
                              }
                            </span>

                            <span className="ml-1 text-xs text-slate-400">
                              {
                                stock.product
                                  .unit
                              }
                            </span>

                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>
        )}

        {/* =================================================
            QUANTITY MODAL
        ================================================= */}

        {quantityProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 p-5">

                <div>

                  <h3 className="font-bold text-slate-900">
                    Physical Quantity
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      quantityProduct.product
                        .productCode
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuantityProduct(
                      null,
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="p-5">

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="text-sm font-semibold text-slate-900">
                    {
                      quantityProduct.product
                        .productName
                    }
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    System Quantity:
                    <span className="ml-2 font-bold text-slate-900">
                      {
                        quantityProduct.quantity
                      }
                    </span>
                  </div>

                </div>

                <label className="mt-5 block text-sm font-semibold text-slate-700">
                  Current Physical Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  value={physicalQuantity}
                  onChange={(event) =>
                    setPhysicalQuantity(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      confirmQuantityCount();
                    }
                  }}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter quantity"
                />

                <div className="mt-5 flex gap-3">

                  <button
                    type="button"
                    onClick={() => {
                      setQuantityProduct(
                        null,
                      );

                      setPhysicalQuantity(
                        "",
                      );
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmQuantityCount
                    }
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    Confirm Count
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
      </main>
  </DashboardShell>
);
}