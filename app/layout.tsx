import type { Metadata } from "next";
import "./globals.css";
import DashboardLanguageProvider from "@/components/layout/DashboardLanguageProvider";
import SuntreeFavicon from "@/components/layout/SuntreeFavicon";

export const metadata: Metadata = {
  title: "SuntreeMyanmar Dashboard",
  description: "SuntreeMyanmar Warranty Management Dashboard",
  icons: {
    icon: "/images/logo/suntree-favicon.png",
    shortcut: "/images/logo/suntree-favicon.png",
    apple: "/images/logo/suntree-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SuntreeFavicon />
        <DashboardLanguageProvider>{children}</DashboardLanguageProvider>
      </body>
    </html>
  );
}
