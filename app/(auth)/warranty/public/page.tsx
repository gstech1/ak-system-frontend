"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";

import {
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";

import { X } from "lucide-react";

import { checkWarranty } from "@/lib/api";
import WarrantyResultCard from "@/components/warranty/WarrantyResultCard";

import {
  ArrowRight,
  FileText,
} from "lucide-react";

export default function PublicWarrantyPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  async function handleCheck(value?: string) {
    const serial = (value ?? serialNumber).trim();

    if (!serial) {
      inputRef.current?.focus();
      return;
    }

    // Prevent checking the same input multiple times.
    if (hasChecked) {
      return;
    }

    try {
      setLoading(true);

      const response = await checkWarranty(serial);

      setResult(response);
      setHasChecked(true);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (error) {
      console.error(error);

      setResult({
        status: "NOT_FOUND",
        message: "Unable to verify warranty.",
      });

      setHasChecked(true);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } finally {
      setLoading(false);
    }
  }

  function clearSerial() {
    setSerialNumber("");
    setResult(null);
    setHasChecked(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    scannerRef.current = null;

    const video = videoRef.current;

    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;

      stream.getTracks().forEach((track) => track.stop());

      video.srcObject = null;
    }

    setCameraOpen(false);
  }

  useEffect(() => {
    if (!cameraOpen) {
      return;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        if (!videoRef.current) {
          return;
        }

        const hints = new Map();

        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
        ]);

        hints.set(DecodeHintType.TRY_HARDER, true);

        const scanner = new BrowserMultiFormatReader(hints);

        scannerRef.current = scanner;

        const controls = await scanner.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (scanResult) => {
            if (cancelled || !scanResult) {
              return;
            }

            const scannedValue = scanResult.getText().trim();

            if (!scannedValue) {
              return;
            }

            setSerialNumber(scannedValue);

            controls.stop();
            controlsRef.current = null;
            scannerRef.current = null;

            const video = videoRef.current;

            if (video?.srcObject) {
              const stream = video.srcObject as MediaStream;

              stream.getTracks().forEach((track) => track.stop());

              video.srcObject = null;
            }

            setCameraOpen(false);

            handleCheck(scannedValue);
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Camera error:", error);

        controlsRef.current?.stop();
        controlsRef.current = null;
        scannerRef.current = null;

        setCameraOpen(false);

        alert(
          "Unable to access camera. Please allow camera permission and try again.",
        );
      }
    }

    startScanner();

    return () => {
      cancelled = true;

      controlsRef.current?.stop();
      controlsRef.current = null;

      const video = videoRef.current;

      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;

        stream.getTracks().forEach((track) => track.stop());

        video.srcObject = null;
      }

      scannerRef.current = null;
    };
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* Logo */}
        <div className="pt-5">
          <div className="flex justify-center">
            <Image
              src="/images/logo/suntree-logo.png"
              alt="Suntree Myanmar"
              width={160}
              height={160}
              priority
            />
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 py-3 shadow-md">
          <h1 className="text-center text-lg font-bold tracking-[0.2em] text-white">
            PUBLIC WARRANTY CHECK
          </h1>
        </div>

        {/* Body */}
        <div className="p-5">

          <p className="text-center text-sm leading-6 text-slate-500">
            Verify your product warranty instantly.
            <br />

            <span className="font-medium text-slate-700">
              Official warranty verification service by
            </span>

            <br />

            <span className="font-semibold">
              Arkar Min Thuka Electro Trading Co., Ltd.
            </span>
          </p>

          {/* Serial Number */}
          <div className="mt-6">

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Product Serial Number
            </label>

            <div className="flex gap-2">

              {/* Input + Clear X */}
              <div className="relative min-w-0 flex-1">

                <input
                  ref={inputRef}
                  type="text"
                  value={serialNumber}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                  onChange={(e) => {
                    // Do not allow changing the serial after checking.
                    if (hasChecked) {
                      return;
                    }

                    setSerialNumber(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();

                      if (!hasChecked) {
                        handleCheck();
                      }
                    }
                  }}
                  placeholder="Enter Product Serial Number"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 uppercase outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                {/* Clear X */}
                {serialNumber && !loading && (
                  <button
                    type="button"
                    aria-label="Clear serial number"
                    onClick={clearSerial}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-red-500 active:scale-95"
                  >
                    <X
                      size={18}
                      strokeWidth={2.5}
                    />
                  </button>
                )}

              </div>

              {/* Camera */}
              <button
                type="button"
                onClick={() => {
                  if (hasChecked) {
                    return;
                  }

                  setResult(null);
                  setCameraOpen(true);
                }}
                disabled={loading || hasChecked}
                aria-label="Scan barcode with camera"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-600 bg-white text-xl transition hover:bg-emerald-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                📷
              </button>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Enter manually, scan with camera, or use a USB/Bluetooth barcode scanner.
            </p>

          </div>

          {/* Check Button */}
          <button
            type="button"
            onClick={() => handleCheck()}
            disabled={loading || hasChecked}
            className="mt-5 h-12 w-full rounded-xl bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading
              ? "Checking Warranty..."
              : hasChecked
                ? "CHECKED"
                : "CHECK WARRANTY"}
          </button>

          {/* Result */}
          {result && (
            <div
              ref={resultRef}
              className="mt-6"
            >
              <WarrantyResultCard
                status={result.status}
                {...result}
              />
            </div>
          )}

          {/* Clear instruction */}
          {hasChecked && (
            <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-700">
              This serial has already been checked.
              <br />
              Clear it using the ✕ button before checking another product.
            </div>
          )}

{/* Warranty Policy */}
<Link
  href="/warranty-policy"
  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
>
  <FileText size={18} />
  Warranty Policy
  <ArrowRight size={17} />
</Link>

          {/* Back */}
          <Link
            href="/warranty/dealer-login"
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Dealer Login
          </Link>

        </div>
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Camera Header */}
            <div className="bg-emerald-700 px-5 py-4 text-center text-white">

              <h2 className="text-lg font-bold">
                Scan Product Barcode
              </h2>

              <p className="mt-1 text-xs text-emerald-100">
                Place the barcode inside the frame
              </p>

            </div>

            {/* Camera */}
            <div className="relative aspect-[4/3] overflow-hidden bg-black">

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Scan Frame */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="h-24 w-72 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />

              </div>

            </div>

            {/* Camera Controls */}
            <div className="p-4">

              <button
                type="button"
                onClick={stopCamera}
                className="h-12 w-full rounded-xl border border-slate-300 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                CANCEL
              </button>

            </div>

          </div>

        </div>
      )}
    </main>
  );
}