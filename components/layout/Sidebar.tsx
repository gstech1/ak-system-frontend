"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_MENU } from "@/constants/menu";

type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
};

export default function Sidebar() {
  const pathname = usePathname();

  let authUser: AuthUser | null = null;

  if (typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (storedUser) {
        authUser = JSON.parse(storedUser);
      }
    } catch {
      authUser = null;
    }
  }

  const role = authUser?.role ?? "";
  const permissions = authUser?.permissions ?? [];

  /*
   * SUPER ADMIN / ADMIN
   *
   * ADMIN is treated as the highest system access.
   */
  const isAdmin = role === "ADMIN";

  /*
   * Permission helper
   *
   * ADMIN can see everything.
   * Other users only see what they have permission for.
   */
  const hasPermission = (permission?: string) => {
    if (!permission) {
      return true;
    }

    if (isAdmin) {
      return true;
    }

    return permissions.includes(permission);
  };

  /*
   * Dealer users must NOT use the main management sidebar.
   *
   * Dealer has a separate Dealer Portal.
   */
  if (role === "DEALER") {
    return null;
  }

  const visibleMenu = SIDEBAR_MENU.filter((item) =>
    hasPermission(item.permission),
  );

  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-black tracking-wide text-emerald-400">
          SuntreeMyanmar
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Warranty System
        </p>
      </div>

      {/* User Role */}
      <div className="border-b border-slate-800 px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Signed in as
        </p>

        <p className="mt-1 font-semibold text-white">
          {authUser?.username ?? "User"}
        </p>

        <p className="mt-1 text-xs font-medium text-emerald-400">
          {role || "Unknown Role"}
        </p>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {visibleMenu.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                active
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />

              <span className="font-medium">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* No Access */}
        {visibleMenu.length === 0 && (
          <div className="rounded-xl bg-slate-800 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-slate-300">
              No Access
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              No management permissions have been assigned to this account.
            </p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-5">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="font-semibold text-white">
            SuntreeMyanmar Warranty System
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Version 1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}