"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  Package,
  ShieldCheck,
  CircleDollarSign,
  Tag,
} from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

interface OtherProduct {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  unit: string;
  warrantyMonths: number;
  sellingPrice: string | number;
  barcodeType: "FACTORY" | "INTERNAL";
  trackingType: "UNIT" | "QUANTITY";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockBalances?: {
    quantity: number;
    warehouseId: string;
  }[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<OtherProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const { id } = await params;

        const response = await fetch(
          `${API_URL}/other-products/${id}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load product.",
          );
        }

        setProduct(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load product.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading product...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/warehouse/products"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Product Not Found
            </p>

            <p className="mt-1 text-sm">
              {errorMessage || "Unable to load this product."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sellingPrice = Number(product.sellingPrice);

  const stockQuantity =
    product.stockBalances?.reduce(
      (total, stock) => total + stock.quantity,
      0,
    ) ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/warehouse/products"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
              <Package size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Product Detail
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View registered product information
              </p>
            </div>
          </div>
        </div>

        {/* Product Header */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {product.productName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {product.brand || "No Brand"}
                  {product.model
                    ? ` • ${product.model}`
                    : ""}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${
                  product.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {product.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>

          {/* Information */}
          <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">

            <InfoCard
              icon={<Barcode size={20} />}
              label="Barcode"
              value={product.productCode}
            />

            <InfoCard
              icon={<Tag size={20} />}
              label="Category"
              value={product.category}
            />

            <InfoCard
              icon={<Package size={20} />}
              label="Unit"
              value={product.unit}
            />

            <InfoCard
              icon={<Package size={20} />}
              label="Current Stock"
              value={`${stockQuantity} ${product.unit}`}
            />

            <InfoCard
              icon={<CircleDollarSign size={20} />}
              label="Default Selling Price"
              value={`${sellingPrice.toLocaleString()} MMK`}
            />

            <InfoCard
              icon={<ShieldCheck size={20} />}
              label="Warranty"
              value={`${product.warrantyMonths} Months`}
            />

            <InfoCard
              icon={<Barcode size={20} />}
              label="Barcode Type"
              value={
                product.barcodeType === "FACTORY"
                  ? "Factory Barcode"
                  : "Internal Barcode"
              }
            />

            <InfoCard
              label="Tracking Type"
              value={
                product.trackingType === "UNIT"
                  ? "Unit Tracking"
                  : "Quantity Tracking"
              }
            />

            <InfoCard
              label="Brand"
              value={product.brand || "-"}
            />

            <InfoCard
              label="Model"
              value={product.model || "-"}
            />

            <InfoCard
              label="Product ID"
              value={product.id}
            />

          </div>
        </div>

        {/* Product Operations */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-bold text-slate-900">
              Product Operations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Warehouse operations for this product.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">

            <OperationButton
              title="Stock IN"
              description="Receive stock"
              href={`/warehouse/stock-in?productId=${product.id}`}
            />

            <OperationButton
              title="Sales OUT"
              description="Create sales issue"
            />

            <OperationButton
              title="Service Issue"
              description="Issue to technician"
            />

            <OperationButton
              title="Service Return"
              description="Return unused stock"
            />

          </div>
        </div>

      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-emerald-600">
            {icon}
          </span>
        )}

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 break-all text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function OperationButton({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
      >
        <p className="font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

        <p className="mt-3 text-[11px] font-semibold text-emerald-600">
          OPEN
        </p>
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left opacity-70"
    >
      <p className="font-bold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      <p className="mt-3 text-[11px] font-semibold text-slate-400">
        COMING NEXT
      </p>
    </button>
  );
}