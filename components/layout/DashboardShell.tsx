"use client";

import { usePathname } from "next/navigation";

import Header from "./Header";
import Sidebar from "./Sidebar";
import MTKSolarSidebar from "./MTKSolarSidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  // MTK Solar Warehouse
  const isMTKSolarWarehouse =
    pathname === "/warehouse" ||
    pathname.startsWith("/warehouse/");

  // Suntree Breaker Warehouse
  const isSuntreeWarehouse =
    pathname === "/suntree-warehouse" ||
    pathname.startsWith("/suntree-warehouse/");

  return (
    <div className="flex h-screen bg-slate-100">
      {isMTKSolarWarehouse ? (
        <MTKSolarSidebar />
      ) : (
        <Sidebar />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}