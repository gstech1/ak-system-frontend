"use client";

import Link from "next/link";
import { useState } from "react";

import MTKSolarShell from "@/components/layout/MTKSolarShell";

import {
  ArrowLeft,
  Barcode,
  PackagePlus,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

export default function ProductRegisterPage() {
  const [barcodeType, setBarcodeType] = useState<
    "FACTORY" | "INTERNAL"
  >("FACTORY");

  const [productName, setProductName] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [model, setModel] =
    useState("");

  const [unit, setUnit] =
    useState("pcs");

  const [warrantyMonths, setWarrantyMonths] =
    useState("12");

  const [sellingPrice, setSellingPrice] =
    useState("");

  const [barcode, setBarcode] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  function generateInternalBarcode() {
    const timestamp =
      Date.now().toString().slice(-8);

    const random =
      Math.floor(
        100 + Math.random() * 900,
      );

    setBarcode(
      `AKOP-${timestamp}-${random}`,
    );

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleRegisterProduct() {
    setSuccessMessage("");
    setErrorMessage("");

    if (!productName.trim()) {
      setErrorMessage(
        "Please enter Product Name.",
      );
      return;
    }

    if (!category.trim()) {
      setErrorMessage(
        "Please enter Category.",
      );
      return;
    }

    if (!sellingPrice.trim()) {
      setErrorMessage(
        "Please enter Selling Price.",
      );
      return;
    }

    let finalBarcode =
      barcode.trim();

    if (
      barcodeType === "INTERNAL" &&
      !finalBarcode
    ) {
      const timestamp =
        Date.now().toString().slice(-8);

      const random =
        Math.floor(
          100 + Math.random() * 900,
        );

      finalBarcode =
        `AKOP-${timestamp}-${random}`;
    }

    if (
      barcodeType === "FACTORY" &&
      !finalBarcode
    ) {
      setErrorMessage(
        "Please scan or enter the Factory Barcode.",
      );
      return;
    }

    const sellingPriceNumber =
      Number(sellingPrice);

    const warrantyNumber =
      Number(warrantyMonths || 0);

    if (
      Number.isNaN(
        sellingPriceNumber,
      ) ||
      sellingPriceNumber < 0
    ) {
      setErrorMessage(
        "Please enter a valid Selling Price.",
      );
      return;
    }

    if (
      Number.isNaN(warrantyNumber) ||
      warrantyNumber < 0
    ) {
      setErrorMessage(
        "Please enter a valid Warranty Period.",
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          `${API_URL}/other-products`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productCode:
                finalBarcode,

              productName:
                productName.trim(),

              category:
                category.trim(),

              brand:
                brand.trim() ||
                undefined,

              model:
                model.trim() ||
                undefined,

              unit:
                unit.trim() ||
                "pcs",

              warrantyMonths:
                warrantyNumber,

              sellingPrice:
                sellingPriceNumber,

              barcodeType,

              trackingType:
                "UNIT",
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Product registration failed. Please try again.",
        );
      }

      setSuccessMessage(
        `Product registered successfully. Barcode: ${data.productCode}`,
      );

      setProductName("");
      setCategory("");
      setBrand("");
      setModel("");
      setUnit("pcs");
      setWarrantyMonths("12");
      setSellingPrice("");
      setBarcode("");
      setBarcodeType("FACTORY");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Product registration failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <MTKSolarShell>
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="mb-8">
            <Link
              href="/warehouse/products"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={17} />
              Back to Product List
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <PackagePlus size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Product Register
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Register Other Electrical Products
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              SUCCESS
          ===================================================== */}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="font-semibold">
                  Registration Successful
                </p>

                <p className="mt-1 text-sm">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* =====================================================
              ERROR
          ===================================================== */}

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-semibold">
                  Registration Error
                </p>

                <p className="mt-1 text-sm">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* =====================================================
              PRODUCT INFORMATION
          ===================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Product Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the basic information of the product.
              </p>
            </div>

            <div className="p-6">
              <div className="grid gap-5 md:grid-cols-2">

                <FormField
                  label="Product Name"
                  placeholder="e.g. Digital Multimeter"
                  value={productName}
                  onChange={setProductName}
                />

                <FormField
                  label="Category"
                  placeholder="e.g. Measuring Equipment"
                  value={category}
                  onChange={setCategory}
                />

                <FormField
                  label="Brand"
                  placeholder="e.g. Schneider"
                  value={brand}
                  onChange={setBrand}
                />

                <FormField
                  label="Model"
                  placeholder="e.g. XYZ-100"
                  value={model}
                  onChange={setModel}
                />

                <FormField
                  label="Unit"
                  placeholder="e.g. pcs"
                  value={unit}
                  onChange={setUnit}
                />

                <FormField
                  label="Warranty Period"
                  placeholder="e.g. 12"
                  type="number"
                  suffix="Months"
                  value={warrantyMonths}
                  onChange={setWarrantyMonths}
                />

                <FormField
                  label="Default Selling Price"
                  placeholder="0"
                  type="number"
                  suffix="MMK"
                  value={sellingPrice}
                  onChange={setSellingPrice}
                />

              </div>
            </div>
          </div>

          {/* =====================================================
              BARCODE
          ===================================================== */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-2">
                <Barcode
                  size={20}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-900">
                  Barcode Registration
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Choose whether the product already has a factory barcode.
              </p>
            </div>

            <div className="p-6">

              <div className="grid gap-4 md:grid-cols-2">

                {/* Factory */}

                <button
                  type="button"
                  onClick={() => {
                    setBarcodeType(
                      "FACTORY",
                    );

                    setBarcode("");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className={`rounded-2xl border-2 p-5 text-left transition ${
                    barcodeType === "FACTORY"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        barcodeType ===
                        "FACTORY"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Barcode size={20} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        Existing Factory Barcode
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Product already has a barcode
                      </p>
                    </div>

                  </div>
                </button>

                {/* Internal */}

                <button
                  type="button"
                  onClick={() => {
                    setBarcodeType(
                      "INTERNAL",
                    );

                    setBarcode("");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className={`rounded-2xl border-2 p-5 text-left transition ${
                    barcodeType === "INTERNAL"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        barcodeType ===
                        "INTERNAL"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Barcode size={20} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        Generate Internal Barcode
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Create a barcode for products without one
                      </p>
                    </div>

                  </div>
                </button>

              </div>

              {/* Factory Barcode */}

              {barcodeType ===
                "FACTORY" && (
                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Factory Barcode
                  </label>

                  <div className="relative">

                    <Barcode
                      size={20}
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
                      placeholder="Scan or enter factory barcode..."
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    USB barcode scanner can be used directly in this field.
                  </p>

                </div>
              )}

              {/* Internal Barcode */}

              {barcodeType ===
                "INTERNAL" && (
                <div className="mt-5 rounded-xl bg-slate-50 p-5">

                  <p className="text-sm font-semibold text-slate-700">
                    Internal Barcode
                  </p>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">

                    <input
                      type="text"
                      value={barcode}
                      readOnly
                      placeholder="Click Generate Barcode"
                      className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
                    />

                    <button
                      type="button"
                      onClick={
                        generateInternalBarcode
                      }
                      disabled={saving}
                      className="h-12 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Generate Barcode
                    </button>

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    After registration, the generated barcode can be printed and attached to the product.
                  </p>

                </div>
              )}

            </div>
          </div>

          {/* =====================================================
              SAVE
          ===================================================== */}

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              onClick={
                handleRegisterProduct
              }
              disabled={saving}
              className="flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-7 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />

              {saving
                ? "Registering..."
                : "Register Product"}
            </button>

          </div>

        </div>
      </div>
    </MTKSolarShell>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
  suffix,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  suffix?: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
            suffix
              ? "pr-20"
              : ""
          }`}
        />

        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}

      </div>
    </div>
  );
}