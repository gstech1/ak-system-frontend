"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageProvider";

type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
  websiteManagement?: boolean;
};

export default function Header() {
  const pathname = usePathname();
  const { language, setLanguage } = useDashboardLanguage();

  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (storedUser) {
        // User is intentionally synchronized from localStorage.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to read auth user:", error);
    }
  }, []);

  // Only MTK Solar Warehouse uses MTK header.
  const isMTKSolar =
    pathname === "/warehouse" ||
    pathname.startsWith("/warehouse/");

  const systemName = isMTKSolar
    ? "MTK Solar"
    : "SuntreeMyanmar";

  const isAdmin = user?.role === "ADMIN";

  const displayName = isAdmin
    ? "Super Admin"
    : user?.username || "User";

  const displayRole = isAdmin
    ? "Administrator"
    : user?.role
      ? user.role.charAt(0) +
        user.role.slice(1).toLowerCase()
      : "User";

  const avatarLetter = displayName
    .charAt(0)
    .toUpperCase();

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    window.location.href = "/login";
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <h1
          className={`text-3xl font-bold tracking-tight ${
            isMTKSolar
              ? "text-blue-700"
              : "text-emerald-700"
          }`}
        >
          {systemName} Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {displayName}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                language === "en"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              EN
            </button>

            <button
              type="button"
              onClick={() => setLanguage("my")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                language === "my"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              မြန်မာ
            </button>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-72 rounded-xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-emerald-500"
          />
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-100"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
            {avatarLetter}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {displayName}
            </p>

            <p className="text-xs text-slate-500">
              {displayRole}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </header>
  );
}
