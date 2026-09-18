"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-md">

        {/* Header */}
        <div className="mb-6 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
            <Store
              size={32}
              strokeWidth={2}
            />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Dealer Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Suntree Myanmar Dealer Portal
          </p>

          <p className="mt-1 text-xs text-slate-400">
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