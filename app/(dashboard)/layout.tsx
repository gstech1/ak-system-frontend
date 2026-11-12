import IdleLogoutMonitor from "@/components/layout/IdleLogoutMonitor";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <IdleLogoutMonitor />
      {children}
    </>
  );
}
