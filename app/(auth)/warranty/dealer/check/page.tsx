"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";

import { checkWarranty } from "@/lib/api";
import WarrantyResultCard from "@/components/warranty/WarrantyResultCard";

export default function DealerWarrantyCheckPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dealerAuth");

      if (!stored) {
        window.location.href = "/warranty/dealer-login";
      }
    } catch {
      window.location.href = "/warranty/dealer-login";
    }
  }, []);

  async function handleCheck(value?: string) {
    const serial = (value ?? serialNumber).trim();

    if (!serial) {
      setErrorMessage("Please enter Product Serial Number.");
      inputRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setResult(null);

      const response = await checkWarranty(serial);

      setResult(response);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (error) {
      console.error("Warranty check error:", error);

      setErrorMessage(
        "Unable to connect to Warranty Server.",
      );
    } finally {
      setLoading(false);
    }
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

            const scannedValue = scanResult
              .getText()
              .trim();

            if (!scannedValue) {
              return;
            }

            setSerialNumber(scannedValue);

            controls.stop();
            controlsRef.current = null;
            scannerRef.current = null;

            const video = videoRef.current;

            if (video?.srcObject) {
              const stream =
                video.srcObject as MediaStream;

              stream
                .getTracks()
                .forEach((track) => track.stop());

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

        setErrorMessage(
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

        stream
          .getTracks()
          .forEach((track) => track.stop());

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
      <div className="mx-auto w-full max-w-md">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-5 py-6 text-center text-white">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck size={30} />
            </div>

            <h1 className="mt-3 text-2xl font-extrabold">
              Warranty Check
            </h1>

            <p className="mt-1 text-sm text-emerald-50">
              Dealer Warranty Portal
            </p>

          </div>

          {/* Body */}
          <div className="p-5">

            <p className="text-center text-sm leading-6 text-slate-500">
              Check your customer&apos;s product warranty
              using the serial number or barcode.
            </p>

            {/* Serial Number */}
            <div className="mt-6">

              <label
                htmlFor="dealer-serial"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Product Serial Number
              </label>

              <div className="flex gap-2">

                <input
                  ref={inputRef}
                  id="dealer-serial"
                  type="text"
                  value={serialNumber}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                  onChange={(event) => {
                    setSerialNumber(event.target.value);
                    setErrorMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleCheck();
                    }
                  }}
                  placeholder="Enter Product Serial Number"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-sm uppercase text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setErrorMessage("");
                    setCameraOpen(true);
                  }}
                  aria-label="Scan barcode with camera"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-600 bg-white text-emerald-600 transition hover:bg-emerald-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera size={23} />
                </button>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Manual entry, camera scan, or USB/Bluetooth
                barcode scanner supported.
              </p>

            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-center text-sm font-medium text-red-600">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Check Button */}
            <button
              type="button"
              onClick={() => handleCheck()}
              disabled={loading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <Search size={19} />

              {loading
                ? "Checking Warranty..."
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

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="bg-emerald-700 px-5 py-4 text-center text-white">

              <h2 className="text-lg font-bold">
                Scan Product Barcode
              </h2>

              <p className="mt-1 text-xs text-emerald-100">
                Place the barcode inside the frame
              </p>

            </div>

            <div className="relative aspect-[4/3] overflow-hidden bg-black">

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-72 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>

            </div>

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