"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  LockKeyhole,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type LoginResponse = {
  accessToken?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    permissions?: string[];
    websiteManagement?: boolean;
    dealerId?: string;
    dealerCode?: string;
    companyName?: string;
  };
  message?: string | string[];
};

export default function DealerLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage(
        "Please enter Dealer User ID and Password.",
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_BASE_URL}/auth/dealer-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: cleanUsername,
            password: cleanPassword,
          }),
        },
      );

      const data: LoginResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        let message =
          "Invalid dealer username or password.";

        if (Array.isArray(data.message)) {
          message = data.message.join(", ");
        } else if (typeof data.message === "string") {
          message = data.message;
        }

        throw new Error(message);
      }

      /* --------------------------------
         Validate Login Response
      -------------------------------- */

      if (!data.accessToken || !data.user) {
        throw new Error(
          "Invalid login response from Warranty Server.",
        );
      }

      /* --------------------------------
         Dealer Role Check
      -------------------------------- */

      if (data.user.role !== "DEALER") {
        throw new Error(
          "This account is not authorized for Dealer Portal.",
        );
      }

      /* --------------------------------
         Save Dealer Authentication
      -------------------------------- */

      localStorage.setItem(
        "dealerAuth",
        JSON.stringify({
          accessToken: data.accessToken,
          user: {
            id: data.user.id,
            username: data.user.username,
            role: data.user.role,
            permissions: data.user.permissions ?? [],
            websiteManagement:
              data.user.websiteManagement ?? false,

            // These fields are ready for Dealer Profile
            // when dealer information is connected.
            dealerId: data.user.dealerId ?? "",
            dealerCode: data.user.dealerCode ?? "",
            companyName:
              data.user.companyName ??
              data.user.username,
          },
        }),
      );

      /* --------------------------------
         Go to Dealer Dashboard
      -------------------------------- */

      router.replace("/warranty/dealer");

    } catch (error) {
      console.error(
        "Dealer Login Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to Warranty Server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8">
      <div className="absolute inset-0">
        <Image
          src="/images/backgrounds/dealer-login-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">

        {/* Company branding */}
        <div className="mb-6 rounded-2xl border border-white/40 bg-white/95 px-5 py-3 shadow-xl backdrop-blur">
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/images/logo/suntree-logo.png"
              alt="Suntree Myanmar"
              width={150}
              height={62}
              priority
              className="h-12 w-32 object-contain"
            />
            <div className="h-10 w-px bg-slate-200" />
            <Image
              src="/images/logo/ak-logo2.png"
              alt="Arkar Min Thuka Electro Trading Co., Ltd."
              width={110}
              height={58}
              priority
              className="h-12 w-24 object-contain"
            />
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-600">
            Arkar Min Thuka Electro Trading Co., Ltd.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(390px,0.9fr)] lg:gap-12">
          {/* Dealer partnership information */}
          <section className="order-2 rounded-3xl border border-white/20 bg-slate-950/45 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8 lg:order-1">
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              Suntree Myanmar Dealer Partnership
            </p>
            <h2 className="mt-5 text-2xl font-extrabold leading-snug sm:text-3xl">
              Suntree Myanmar နဲ့ Dealer အဖြစ် လက်တွဲပါ
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-100 sm:text-base">
              Suntree Myanmar ကို တရုတ်နိုင်ငံရှိ Suntree လုပ်ငန်းစုမှ မြန်မာနိုင်ငံအတွက် တရားဝင်{" "}
              <a
                href="https://suntreemyanmar.com/about/authorized-distributor"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-200 underline decoration-emerald-300/70 underline-offset-4 hover:text-white"
              >
                Authorized Distributor
              </a>
              {" "}အဖြစ် ခန့်အပ်ထားသော Arkar Min Thuka Electro Trading Co., Ltd. ဖြစ်ပါတယ်။
            </p>

            <ul className="mt-6 space-y-4">
              <li className="flex gap-3 text-sm leading-6 text-slate-100 sm:text-base">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <span>မူရင်း Suntree ပစ္စည်းများကို မိတ်ဆက်ရောင်းချနိုင်မယ့် အခွင့်အလမ်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-6 text-slate-100 sm:text-base">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <span>မူလစက်ရုံမှပေးထားသော အာမခံအပြင် Suntree Myanmar မှလည်း ထပ်တိုးအာမခံ ရရှိနိုင်မှု</span>
              </li>
              <li className="flex gap-3 text-sm leading-6 text-slate-100 sm:text-base">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <span>Dealer Portal မှ warranty ကို စစ်ဆေးနိုင်ခြင်း၊ ဆိုင်ရှင်များကိုယ်တိုင် မှတ်ပုံတင်နိုင်ခြင်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-6 text-slate-100 sm:text-base">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <span>Warranty အစားထိုး/ဝန်ဆောင်မှုများကို ငြင်းခုန်စရာမလိုဘဲ တိုက်ရိုက်တောင်းဆိုပြီး အာမခံဖြင့် လဲလှယ်ဆောင်ရွက်နိုင်ခြင်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-6 text-slate-100 sm:text-base">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <span>Dealer ကိုယ်တိုင် အချက်အလက်နှင့် ဝန်ဆောင်မှုမှတ်တမ်းများကို အချိန်နှင့်တစ်ပြေးညီ စီမံနိုင်ခြင်း</span>
              </li>
            </ul>

            <p className="mt-7 text-sm font-semibold leading-6 text-white sm:text-base">
              Dealer အဖြစ် ပါဝင်ဖို့ စိတ်ဝင်စားပါသလား?
            </p>
            <a
              href="https://suntreemyanmar.com/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-400"
            >
              ကျွန်ုပ်တို့ထံ ဆက်သွယ်ပါ
            </a>
          </section>

          <div className="order-1 mx-auto w-full max-w-md lg:order-2">
        {/* Header */}
        <div className="mb-6 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
            <Store
              size={32}
              strokeWidth={2}
            />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Dealer Login
          </h1>

          <p className="mt-2 text-sm text-white/85">
            Suntree Myanmar Dealer Portal
          </p>

          <p className="mt-1 text-xs text-white/70">
            Authorized Dealer Access
          </p>

        </div>

        {/* Login Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-5 text-center text-white">

            <div className="flex items-center justify-center gap-2">
              <LockKeyhole size={20} />

              <h2 className="text-lg font-bold">
                Dealer Portal
              </h2>
            </div>

            <p className="mt-1 text-xs text-emerald-50">
              Sign in to manage your warranty services
            </p>

          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6"
          >

            {/* Dealer User ID */}
            <div>

              <label
                htmlFor="dealer-username"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Dealer User ID
              </label>

              <input
                id="dealer-username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter Dealer User ID"
                autoComplete="username"
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
              />

            </div>

            {/* Password */}
            <div className="mt-5">

              <label
                htmlFor="dealer-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="dealer-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                />

                {/* Show / Hide Password */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-center text-sm font-medium leading-5 text-red-600">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !username.trim() ||
                !password.trim()
              }
              className="mt-6 h-12 w-full rounded-xl bg-emerald-600 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {loading
                ? "Signing In..."
                : "DEALER SIGN IN"}
            </button>

            {/* Password help */}
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-600">
                Password မေ့နေပါသလား?
              </p>
              <a
                href="https://suntreemyanmar.com/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                ကျွန်ုပ်တို့ထံ ဆက်သွယ်ပါ
              </a>
            </div>

            {/* Dealer Access Information */}
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-center">

              <p className="text-xs leading-5 text-slate-500">
                Authorized dealers can access:
              </p>

              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                Warranty Check • Warranty Replacement •
                Dealer Information
              </p>

            </div>

            {/* Back to Public Warranty Check */}
            <Link
              href="/warranty/public"
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <ArrowLeft size={17} />
              Back to Warranty Check
            </Link>

          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">

          <p className="text-xs text-white/70">
            Official warranty service by
          </p>

          <p className="mt-1 text-xs font-semibold text-white/85">
            Arkar Min Thuka Electro Trading Co., Ltd.
          </p>

        </div>

          </div>
        </div>

      </div>
    </main>
  );
}
