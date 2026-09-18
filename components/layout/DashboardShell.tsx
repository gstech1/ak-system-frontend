import Header from "./Header";
import Sidebar from "./Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
