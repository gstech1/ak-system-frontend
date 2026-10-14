"use client";

import {
  useEffect,
  useState,
} from "react";

import { usePathname } from "next/navigation";
import { Truck } from "lucide-react";

import { SIDEBAR_MENU } from "@/constants/menu";

type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
};

export default function Sidebar() {
  const pathname = usePathname();

  /*
   * Auth user is loaded only on the client.
   *
   * This prevents hydration mismatch because
   * localStorage does not exist during SSR.
   */
  const [authUser, setAuthUser] =
    useState<AuthUser | null>(null);

  const [authLoaded, setAuthLoaded] =
    useState(false);

  /*
   * Load authenticated user
   * after the component mounts.
   */
  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "authUser",
        );

      if (storedUser) {
        setAuthUser(
          JSON.parse(storedUser),
        );
      }
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  /*
   * While authentication data is loading,
   * keep the server and first client render
   * identical.
   */
  if (!authLoaded) {
    return (
      <aside className="flex h-screen w-72 flex-col bg-slate-900 text-white">
        {/* System Switcher */}
<div className="border-b border-slate-800 p-4">
  <a
    href="/warehouse/products"
    className="mb-2 block rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 transition hover:bg-blue-500/20"
  >
    <p className="text-lg font-bold text-blue-400">
      MTK Solar
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Solar Warehouse System
    </p>
  </a>

  <a
    href="/dashboard"
    className="block rounded-xl bg-slate-800 px-4 py-3 transition hover:bg-slate-700"
  >
    <p className="text-lg font-bold text-emerald-400">
      SuntreeMyanmar
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Warranty System
    </p>
  </a>
</div>



        {/* Loading User Area */}
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Signed in as
          </p>

          <p className="mt-1 font-semibold text-white">
            User
          </p>

          <p className="mt-1 text-xs font-medium text-emerald-400">
            Unknown Role
          </p>
        </div>

        {/* Loading Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-5" />

        {/* Footer */}
        <div className="border-t border-slate-800 p-5">
          <div className="rounded-xl bg-slate-800 p-4">
            <p className="font-semibold text-white">
              GS Art & Management System
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Version 1.0.0
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const role = authUser?.role ?? "";

  const permissions =
    authUser?.permissions ?? [];

  /*
   * SUPER ADMIN / ADMIN
   *
   * ADMIN is treated as the highest
   * system access.
   */
  const isAdmin =
    role === "ADMIN";

  /*
   * Permission helper
   *
   * ADMIN can see everything.
   * Other users only see what they
   * have permission for.
   */
  const hasPermission = (
    permission?: string,
  ) => {
    if (!permission) {
      return true;
    }

    if (isAdmin) {
      return true;
    }

    return permissions.includes(
      permission,
    );
  };

  /*
   * Dealer users must NOT use
   * the main management sidebar.
   *
   * Dealer has a separate
   * Dealer Portal.
   */
  if (role === "DEALER") {
    return null;
  }

  /*
   * Filter each section by permission.
   */
  const visibleSections =
    SIDEBAR_MENU
      .map((section) => ({
        ...section,

        items:
          section.items.filter(
            (item) =>
              hasPermission(
                item.permission,
              ),
          ),
      }))
      .filter(
        (section) =>
          section.items.length > 0,
      );

  /*
   * Find the most specific
   * matching menu route.
   *
   * Example:
   *
   * /serials/reject-approvals
   *
   * matches both:
   * /serials
   * /serials/reject-approvals
   *
   * We always choose the longest
   * matching route so only
   * Reject Approvals becomes active.
   */
  const visibleItems =
    visibleSections.flatMap(
      (section) =>
        section.items,
    );

  const activeHref =
    visibleItems
      .filter(
        (item) =>
          pathname === item.href ||
          pathname.startsWith(
            `${item.href}/`,
          ),
      )
      .sort(
        (a, b) =>
          b.href.length -
          a.href.length,
      )[0]?.href ?? null;

  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-900 text-white">
      {/* System Switcher */}<div className="border-b border-slate-800 p-4"><a href="/warehouse/products" className="mb-2 block rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 transition hover:bg-blue-500/20"><p className="text-lg font-bold text-blue-400">MTK Solar</p><p className="mt-1 text-xs text-slate-400">Solar Warehouse System</p></a><a href="/dashboard" className="block rounded-xl bg-slate-800 px-4 py-3 transition hover:bg-slate-700"><p className="text-lg font-bold text-emerald-400">SuntreeMyanmar</p><p className="mt-1 text-xs text-slate-400">Warranty System</p></a></div>

      {/* User Role */}
      <div className="border-b border-slate-800 px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Signed in as
        </p>

        <p className="mt-1 font-semibold text-white">
          {authUser?.username ??
            "User"}
        </p>

        <p className="mt-1 text-xs font-medium text-emerald-400">
          {role ||
            "Unknown Role"}
        </p>
      </div>

      {/* Frequent Suntree stock-out action */}
      {hasPermission("SHIPMENTS_VIEW") && (
        <div className="px-4 pt-4">
          <a
            href="/shipments"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all ${
              pathname === "/shipments" || pathname.startsWith("/shipments/")
                ? "bg-emerald-600 text-white shadow-lg"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            <Truck size={18} />
            <span>Stock Out</span>
          </a>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {visibleSections.map(
          (section) => (
            <div
              key={
                section.section
              }
              className="mb-6 last:mb-0"
            >
              {/* Section Heading */}
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {section.section}
              </p>

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const active =
                      activeHref ===
                      item.href;

                    return (
                      <a
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                          active
                            ? "bg-emerald-600 text-white shadow-lg"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={
                            18
                          }
                        />

                        <span className="font-medium">
                          {
                            item.title
                          }
                        </span>
                      </a>
                    );
                  },
                )}
              </div>
            </div>
          ),
        )}

        {/* No Access */}
        {visibleSections.length ===
          0 && (
          <div className="rounded-xl bg-slate-800 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-slate-300">
              No Access
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              No management permissions
              have been assigned to
              this account.
            </p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-5">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="font-semibold text-white">
            GS Art & Management System
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Version 1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}






