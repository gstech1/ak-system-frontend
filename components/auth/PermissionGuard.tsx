"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthUser = {
  id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
};

type PermissionGuardProps = {
  permission: string;
  children: ReactNode;
};

export default function PermissionGuard({
  permission,
  children,
}: PermissionGuardProps) {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      const authUser: AuthUser = JSON.parse(storedUser);

      /*
       * Dealer users must never access
       * the main Staff / Management Dashboard.
       */
      if (authUser.role === "DEALER") {
        router.replace("/warranty/dealer-login");
        return;
      }

      const permissions = authUser.permissions ?? [];

      /*
       * Super Admin only:
       *
       * ADMIN is treated as full system access.
       *
       * Other roles must have the exact
       * permission assigned to them.
       */
      const isSuperAdmin = authUser.role === "ADMIN";

      const hasPermission =
        isSuperAdmin || permissions.includes(permission);

      if (!hasPermission) {
        router.replace("/dashboard");
        return;
      }

      // Authentication is synchronized from localStorage.
      // This state update is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthorized(true);
    } catch (error) {
      console.error("Permission Guard Error:", error);

      localStorage.removeItem("authUser");
      router.replace("/login");
    } finally {
      // Authentication check is complete.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
    }
  }, [permission, router]);

  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-lg">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}