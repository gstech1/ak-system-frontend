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

      <div className="relative z-10 mx-auto w-full max-w-[1440px]">

        {/* Large company header, without the public site's navigation menu */}
        <header className="mb-8 flex min-h-24 flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/95 px-5 py-4 shadow-xl backdrop-blur sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Image
              src="/images/logo/ak-logo2.png"
              alt="Arkar Min Thuka logo"
              width={120}
              height={86}
              priority
              className="h-[68px] w-[90px] shrink-0 object-contain sm:h-[78px] sm:w-[112px]"
            />
            <div className="hidden h-14 w-px bg-slate-200 sm:block" />
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-tight tracking-wide text-slate-900 sm:text-2xl lg:text-3xl">
                ARKAR MIN THU KHA
              </p>
              <p className="mt-1 text-sm text-slate-500 sm:text-base lg:text-lg">
                Electro Trading Co., Ltd.
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <Image
              src="/images/logo/suntree-logo.png"
              alt="Suntree Myanmar"
              width={220}
              height={90}
              priority
              className="h-14 w-[150px] object-contain sm:h-[82px] sm:w-[210px] lg:w-[220px]"
            />
            <Image
              src="/images/logo/suntree-charger-myanmar.png"
              alt="Suntree Charger Myanmar"
              width={220}
              height={90}
              priority
              className="h-14 w-[150px] object-contain sm:h-[82px] sm:w-[210px] lg:w-[220px]"
            />
            <a
              href="https://suntreemyanmar.com"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 sm:h-12 sm:px-7 sm:text-base"
            >
              Home Page
            </a>
          </div>
        </header>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(390px,0.9fr)] lg:gap-12">
          {/* Dealer partnership information */}
          <section className="order-2 rounded-3xl border border-white/20 bg-slate-950/45 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8 lg:order-1">
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-200">
              Dealer အခွင့်အလမ်းများ
            </p>
            <h2 className="mt-4 text-xl font-extrabold leading-snug sm:text-2xl">
              Suntree Myanmar Dealer အခွင့်အလမ်း
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-100">
              တရုတ်နိုင်ငံရှိ Suntree လုပ်ငန်းစုက မြန်မာနိုင်ငံအတွက် Arkar Min Thuka Electro Trading Co., Ltd. ကို တရားဝင်{" "}
              <a
                href="https://suntreemyanmar.com/about/authorized-distributor"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-200 underline decoration-emerald-300/70 underline-offset-4 hover:text-white"
              >
                Authorized Distributor
              </a>
              {" "}အဖြစ် ခန့်အပ်ထားပါတယ်။
            </p>

            <ul className="mt-5 space-y-3">
              <li className="flex gap-3 text-sm leading-5 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>မူရင်း Suntree ပစ္စည်းများကို မိတ်ဆက်ရောင်းချနိုင်ခြင်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-5 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>စက်ရုံအာမခံအပြင် Suntree Myanmar မှ ထပ်တိုးအာမခံ ရရှိနိုင်ခြင်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-5 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>Dealer Portal မှ warranty စစ်ဆေးနိုင်ပြီး ဆိုင်ရှင်များကိုယ်တိုင် မှတ်ပုံတင်နိုင်ခြင်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-5 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>Warranty အစားထိုး/ဝန်ဆောင်မှုများကို တိုက်ရိုက်တောင်းဆိုပြီး အာမခံဖြင့် လဲလှယ်နိုင်ခြင်း</span>
              </li>
              <li className="flex gap-3 text-sm leading-5 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>Dealer အချက်အလက်နှင့် ဝန်ဆောင်မှုမှတ်တမ်းများကို အချိန်နှင့်တစ်ပြေးညီ စီမံနိုင်ခြင်း</span>
              </li>
            </ul>

            <p className="mt-6 text-sm font-semibold leading-6 text-white">
              Dealer အဖြစ် ပါဝင်ဖို့ စိတ်ဝင်စားပါသလား?{" "}
              <a
                href="https://suntreemyanmar.com/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-200 underline decoration-emerald-300/70 underline-offset-4 hover:text-white"
              >
                ကျွန်ုပ်တို့ထံ ဆက်သွယ်ပါ
              </a>
            </p>
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
            <p className="mt-4 text-center text-sm">
              <a
                href="https://suntreemyanmar.com/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-900"
              >
                Password မေ့နေပါသလား?
              </a>
            </p>

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
