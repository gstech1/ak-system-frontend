"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useEffect, useState } from "react";

type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
  websiteManagement?: boolean;
};

export default function Header() {
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

  const avatarLetter = displayName.charAt(0).toUpperCase();

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");

    window.location.href = "/login";
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Welcome back, {displayName}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-72 rounded-xl border border-slate-200 pl-10 pr-4 outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
            {avatarLetter}
          </div>

          <div>
            <p className="text-sm font-semibold">
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