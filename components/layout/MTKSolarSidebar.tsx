"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  BarChart3,
  Boxes,
  ClipboardList,
  FileText,
  Menu,
  Package,
  PackagePlus,
  RotateCcw,
  ScanBarcode,
  ShoppingCart,
  Wrench,
} from "lucide-react";

type MenuItem = {
  title: string;
  href: string;
  icon: typeof Package;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const QUICK_ACTION = {
  title: "New Sale",
  href: "/warehouse/sales",
  icon: ShoppingCart,
};

const MENU_SECTIONS: MenuSection[] = [
  {
    title: "PRODUCTS",
    items: [
      {
        title: "Product List",
        href: "/warehouse/products",
        icon: Package,
      },
      {
        title: "Register Product",
        href: "/warehouse/products/register",
        icon: PackagePlus,
      },
      {
        title: "Barcode Printing",
        href: "/warehouse/barcode-print",
        icon: ScanBarcode,
      },
    ],
  },
  {
    title: "WAREHOUSE",
    items: [
      {
        title: "Stock IN",
        href: "/warehouse/stock-in",
        icon: ArrowDownToLine,
      },
      {
        title: "Sales OUT",
        href: "/warehouse/sales-out",
        icon: ShoppingCart,
      },
      {
        title: "Service Issue",
        href: "/warehouse/service-issue",
        icon: Wrench,
      },
      {
        title: "Service Return",
        href: "/warehouse/service-return",
        icon: RotateCcw,
      },
      {
        title: "Stock Count",
        href: "/warehouse/stock-count",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "VOUCHERS",
    items: [
      {
        title: "Voucher History",
        href: "/warehouse/vouchers",
        icon: FileText,
      },
    ],
  },
  {
    title: "REPORTS",
    items: [
      {
        title: "Reports",
        href: "/warehouse/reports",
        icon: BarChart3,
      },
    ],
  },
];

export default function MTKSolarSidebar() {
  const pathname = usePathname();

  const [language, setLanguage] =
    useState<"en" | "my">("en");

  useEffect(() => {
    const storedLanguage =
      localStorage.getItem("dashboardLanguage");

    if (
      storedLanguage === "en" ||
      storedLanguage === "my"
    ) {
      setLanguage(storedLanguage);
    }

    const handleLanguageChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<"en" | "my">;

      setLanguage(customEvent.detail);
    };

    window.addEventListener(
      "dashboard-language-change",
      handleLanguageChange,
    );

    return () => {
      window.removeEventListener(
        "dashboard-language-change",
        handleLanguageChange,
      );
    };
  }, []);

  const t = {
    warehouse:
      language === "my"
        ? "ဂိုဒေါင်"
        : "Warehouse",

    warehouseStaff:
      language === "my"
        ? "ဂိုဒေါင်ဝန်ထမ်း"
        : "Warehouse Staff",

    newSale:
      language === "my"
        ? "အရောင်းအသစ်"
        : "New Sale",

    products:
      language === "my"
        ? "ကုန်ပစ္စည်းများ"
        : "PRODUCTS",

    productList:
      language === "my"
        ? "ကုန်ပစ္စည်းစာရင်း"
        : "Product List",

    registerProduct:
      language === "my"
        ? "ကုန်ပစ္စည်းစာရင်းသွင်းရန်"
        : "Register Product",

    barcodePrinting:
      language === "my"
        ? "ဘားကုတ်ထုတ်ခြင်း"
        : "Barcode Printing",

    warehouseSection:
      language === "my"
        ? "ဂိုဒေါင်"
        : "WAREHOUSE",

    stockIn:
      language === "my"
        ? "ကုန်ပစ္စည်းဝင်"
        : "Stock IN",

    salesOut:
      language === "my"
        ? "ကုန်ပစ္စည်းထွက်"
        : "Sales OUT",

    serviceIssue:
      language === "my"
        ? "ဝန်ဆောင်မှုအတွက် ထုတ်ပေးခြင်း"
        : "Service Issue",

    serviceReturn:
      language === "my"
        ? "ဝန်ဆောင်မှုမှ ပြန်လည်လက်ခံခြင်း"
        : "Service Return",

    stockCount:
      language === "my"
        ? "လက်ကျန်စာရင်းစစ်ခြင်း"
        : "Stock Count",

    vouchers:
      language === "my"
        ? "ဘောက်ချာ"
        : "VOUCHERS",

    voucherHistory:
      language === "my"
        ? "ဘောက်ချာမှတ်တမ်း"
        : "Voucher History",

    reports:
      language === "my"
        ? "အစီရင်ခံစာ"
        : "REPORTS",

    report:
      language === "my"
        ? "အစီရင်ခံစာများ"
        : "Reports",

    solarWarehouse:
      language === "my"
        ? "Solar ဂိုဒေါင်စနစ်"
        : "Solar Warehouse System",

    warrantySystem:
      language === "my"
        ? "အာမခံစနစ်"
        : "Warranty System",

    warehouseManagement:
      language === "my"
        ? "ဂိုဒေါင်စီမံခန့်ခွဲမှုစနစ်"
        : "Warehouse Management System",

    warehouseMenu:
      language === "my"
        ? "ဂိုဒေါင်မီနူး"
        : "Warehouse Menu",
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const isQuickActionActive =
    pathname === QUICK_ACTION.href;

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col bg-slate-900 text-white">

      {/* SYSTEM SWITCHER */}
      <div className="border-b border-slate-800 p-4">

        {/* MTK SOLAR */}
        <a
          href="/warehouse"
          className="block rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 transition-all hover:border-blue-400 hover:bg-blue-500/20"
        >
          <p className="text-lg font-bold text-blue-400">
            MTK Solar
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {t.solarWarehouse}
          </p>
        </a>

        {/* SUNTREEMYANMAR */}
        <a
          href="/dashboard"
          className="mt-2 block rounded-xl bg-slate-800 px-4 py-3 transition-all hover:bg-slate-700"
        >
          <p className="text-lg font-bold text-emerald-400">
            SuntreeMyanmar
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {t.warrantySystem}
          </p>
        </a>

      </div>

      {/* USER AREA */}
      <div className="border-b border-slate-800 px-5 py-4">

        <p className="text-xs uppercase tracking-wider text-slate-500">
          {t.warehouse}
        </p>

        <p className="mt-1 font-semibold text-white">
          {t.warehouseStaff}
        </p>

      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">

        {/* NEW SALE + MENU */}
        <div className="mb-6 flex items-center gap-2">

          {/* NEW SALE */}
          <a
            href={QUICK_ACTION.href}
            className={
              "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 " +
              "font-semibold transition-all " +
              (isQuickActionActive
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white")
            }
          >
            <div
              className={
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                (isQuickActionActive
                  ? "bg-white/15"
                  : "bg-emerald-600/10")
              }
            >
              <ShoppingCart size={18} />
            </div>

            <span className="truncate">
              {t.newSale}
            </span>
          </a>

          {/* MENU */}
          <a
            href="/warehouse"
            title={t.warehouseMenu}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition-all hover:border-emerald-500 hover:bg-emerald-600 hover:text-white"
          >
            <Menu size={20} />
          </a>

        </div>

        {/* MENU SECTIONS */}
        <div className="space-y-7">

          {MENU_SECTIONS.map((section) => (
            <div key={section.title}>

              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {section.title === "PRODUCTS"
                  ? t.products
                  : section.title === "WAREHOUSE"
                    ? t.warehouseSection
                    : section.title === "VOUCHERS"
                      ? t.vouchers
                      : section.title === "REPORTS"
                        ? t.reports
                        : section.title}
              </p>

              <div className="space-y-1">

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  const itemTitle =
                    item.title === "Product List"
                      ? t.productList
                      : item.title ===
                          "Register Product"
                        ? t.registerProduct
                        : item.title ===
                            "Barcode Printing"
                          ? t.barcodePrinting
                        : item.title ===
                            "Stock IN"
                          ? t.stockIn
                          : item.title ===
                              "Sales OUT"
                            ? t.salesOut
                            : item.title ===
                                "Service Issue"
                              ? t.serviceIssue
                              : item.title ===
                                  "Service Return"
                                ? t.serviceReturn
                                : item.title ===
                                    "Stock Count"
                                  ? t.stockCount
                                  : item.title ===
                                      "Voucher History"
                                    ? t.voucherHistory
                                    : item.title ===
                                        "Reports"
                                      ? t.report
                                      : item.title;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={
                        "flex items-center gap-3 rounded-xl px-4 py-3 " +
                        "transition-all " +
                        (active
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white")
                      }
                    >
                      <Icon size={18} />

                      <span className="font-medium">
                        {itemTitle}
                      </span>
                    </a>
                  );
                })}

              </div>
            </div>
          ))}

        </div>

      </nav>

      {/* FOOTER */}
      <div className="border-t border-slate-800 p-5">

        <div className="rounded-xl bg-slate-800 p-4">

          <div className="flex items-center gap-2">

            <Boxes
              size={16}
              className="text-emerald-400"
            />

            <p className="font-semibold text-white">
              GS Art & Management</p></div><p className="mt-1 font-semibold text-white">
  System
</p>

          <p className="mt-2 text-[11px] text-slate-500">
            Version 1.0.0
          </p>

        </div>

      </div>

    </aside>
  );
}
