"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  ClipboardCheck,
  FileText,
  Send,
  ShieldAlert,
} from "lucide-react";

export default function DealerWarrantyReplacementPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanSerial = serialNumber.trim();

    if (!cleanSerial) {
      setErrorMessage("Please enter Product Serial Number.");
      return;
    }

    if (!reason) {
      setErrorMessage("Please select a replacement reason.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    // Replacement API will be connected in the next step.
    console.log("Warranty Replacement Request:", {
      serialNumber: cleanSerial,
      reason,
      description: description.trim(),
    });

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  }

  function resetForm() {
    setSerialNumber("");
    setReason("");
    setDescription("");
    setErrorMessage("");
    setSubmitted(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-md">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-5 py-6 text-center text-white">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <ClipboardCheck size={30} />
            </div>

            <h1 className="mt-3 text-2xl font-extrabold">
              Warranty Replacement
            </h1>

            <p className="mt-1 text-sm text-emerald-50">
              Dealer Warranty Portal
            </p>

          </div>

          {/* Body */}
          <div className="p-5">

            {submitted ? (
              /* Success */
              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ClipboardCheck size={34} />
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-slate-800">
                  Request Submitted
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your warranty replacement request has been
                  submitted successfully.
                </p>

                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-left">

                  <p className="text-xs font-semibold text-slate-400">
                    Product Serial Number
                  </p>

                  <p className="mt-1 font-bold uppercase text-slate-800">
                    {serialNumber}
                  </p>

                  <p className="mt-4 text-xs font-semibold text-slate-400">
                    Replacement Reason
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {reason}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-5 h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  SUBMIT ANOTHER REQUEST
                </button>

              </div>
            ) : (
              <>
                {/* Introduction */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">

                  <div className="flex gap-3">

                    <ShieldAlert
                      size={21}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-800">
                      Submit a warranty replacement request for a
                      customer's defective product. The request will
                      be reviewed by the Suntree warranty team.
                    </p>

                  </div>

                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="mt-6"
                >

                  {/* Serial Number */}
                  <div>

                    <label
                      htmlFor="replacement-serial"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Product Serial Number
                    </label>

                    <div className="flex gap-2">

                      <input
                        id="replacement-serial"
                        type="text"
                        value={serialNumber}
                        onChange={(event) => {
                          setSerialNumber(event.target.value);
                          setErrorMessage("");
                        }}
                        placeholder="Enter Product Serial Number"
                        autoComplete="off"
                        spellCheck={false}
                        disabled={loading}
                        className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-sm uppercase text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                      />

                      <button
                        type="button"
                        disabled={loading}
                        aria-label="Scan product barcode"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-600 bg-white text-emerald-600 transition hover:bg-emerald-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Camera size={23} />
                      </button>

                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Enter the serial number or scan the product
                      barcode.
                    </p>

                  </div>

                  {/* Reason */}
                  <div className="mt-5">

                    <label
                      htmlFor="replacement-reason"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Replacement Reason
                    </label>

                    <select
                      id="replacement-reason"
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                        setErrorMessage("");
                      }}
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        Select replacement reason
                      </option>

                      <option value="Defective Product">
                        Defective Product
                      </option>

                      <option value="Product Not Working">
                        Product Not Working
                      </option>

                      <option value="Physical Damage">
                        Physical Damage
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>

                  {/* Description */}
                  <div className="mt-5">

                    <label
                      htmlFor="replacement-description"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Problem Description
                    </label>

                    <textarea
                      id="replacement-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe the product problem..."
                      rows={4}
                      disabled={loading}
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                    />

                  </div>

                  {/* Error */}
                  {errorMessage && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                      <p className="text-center text-sm font-medium text-red-600">
                        {errorMessage}
                      </p>

                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    <Send size={18} />

                    {loading
                      ? "Submitting Request..."
                      : "SUBMIT REPLACEMENT REQUEST"}
                  </button>

                </form>

                {/* Information */}
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4">

                  <div className="flex gap-3">

                    <FileText
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>

                      <p className="text-xs font-bold text-slate-700">
                        Replacement Process
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Submit the request first. The warranty team
                        will review the product warranty and update
                        the replacement status.
                      </p>

                    </div>

                  </div>

                </div>

              </>
            )}

            {/* Back */}
            <Link
              href="/warranty/dealer"
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <ArrowLeft size={17} />
              Back to Dealer Dashboard
            </Link>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">

          <p className="text-xs text-slate-400">
            Official warranty service by
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Arkar Min Thuka Electro Trading Co., Ltd.
          </p>

        </div>

      </div>
    </main>
  );
}