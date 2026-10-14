"use client";

import type { ReactNode } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import PermissionGuard from "@/components/auth/PermissionGuard";

export default function WebsiteManagementLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PermissionGuard permission="WEBSITE_MANAGEMENT">
      <DashboardShell>{children}</DashboardShell>
    </PermissionGuard>
  );
}
