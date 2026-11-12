"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import MTKSolarSidebar from "./MTKSolarSidebar";
import IdleLogoutMonitor from "./IdleLogoutMonitor";
import { getCurrentAuthUser, type CurrentAuthUser } from "@/lib/current-user";

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState<CurrentAuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    setAuthUser(getCurrentAuthUser());
    setAuthLoaded(true);
  }, []);

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
      <IdleLogoutMonitor />
      {isMTKSolarWarehouse ? (
        <MTKSolarSidebar />
      ) : (
        <Sidebar authUser={authUser} authLoaded={authLoaded} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header authUser={authUser} authLoaded={authLoaded} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
