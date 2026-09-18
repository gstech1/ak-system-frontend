"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError(
        "Username and password are required.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Invalid username or password.",
        );
      }

      if (!data?.accessToken) {
        throw new Error(
          "Login succeeded but no access token was returned.",
        );
      }

      localStorage.setItem(
        "accessToken",
        data.accessToken,
      );

      if (data.user) {
        localStorage.setItem(
          "authUser",
          JSON.stringify(data.user),
        );
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to login.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">
            SuntreeMyanmar Warranty System
          </h1>

          <p className="mt-2 text-slate-500">
            Sign in to access the management system.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
        >
          <h2 className="text-xl font-bold text-slate-900">
            Login
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter your account credentials.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                autoComplete="username"
                placeholder="Enter username"
                className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                placeholder="Enter password"
                className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </main>
  );
}
