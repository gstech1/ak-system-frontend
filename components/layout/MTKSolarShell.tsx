"use client";

import type { ReactNode } from "react";
import MTKSolarSidebar from "./MTKSolarSidebar";
import Header from "./Header";

type MTKSolarShellProps = {
  children: ReactNode;
  showSidebar?: boolean;
};

export default function MTKSolarShell({
  children,
  showSidebar = true,
}: MTKSolarShellProps) {
  return (
    <div className="flex h-screen bg-slate-100">
      {showSidebar && <MTKSolarSidebar />}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}