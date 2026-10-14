import {
  LayoutDashboard,
  Package,
  BriefcaseBusiness,
  Megaphone,
  Users,
  ScanBarcode,
  ClipboardCheck,
  Truck,
  Store,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

export const SIDEBAR_MENU = [
  {
    section: "MAIN",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: "DASHBOARD_VIEW",
      },
    ],
  },

  {
    section: "WEBSITE",
    items: [
      {
        title: "Website Products",
        href: "/dashboard/website/products",
        icon: Package,
        permission: "WEBSITE_MANAGEMENT",
      },

      {
        title: "Projects",
        href: "/dashboard/website/projects",
        icon: BriefcaseBusiness,
        permission: "WEBSITE_MANAGEMENT",
      },

      {
        title: "Ads & Promotions",
        href: "/dashboard/website/ads",
        icon: Megaphone,
        permission: "WEBSITE_MANAGEMENT",
      },
    ],
  },

  {
    section: "SWMS",
    items: [
      {
        title: "Product Catalog",
        href: "/products",
        icon: Package,
        permission: "PRODUCTS_VIEW",
      },

      {
        title: "Serial Management",
        href: "/serials",
        icon: ScanBarcode,
        permission: "SERIALS_VIEW",
      },

      {
        title: "Reject Approvals",
        href: "/serials/reject-approvals",
        icon: ClipboardCheck,
        permission: "SERIALS_MANAGE",
      },

      {
        title: "Stock Out",
        href: "/shipments",
        icon: Truck,
        permission: "SHIPMENTS_VIEW",
      },

      {
        title: "Dealers",
        href: "/dealers",
        icon: Store,
        permission: "DEALERS_VIEW",
      },

      {
        title: "Warranty",
        href: "/management/warranty",
        icon: ShieldCheck,
        permission: "WARRANTY_VIEW",
      },

      {
        title: "Warranty Replacement History",
        href: "/warranty-replacements",
        icon: ClipboardCheck,
        permission: "WARRANTY_VIEW",
      },

      {
        title: "Warranty Policies",
        href: "/warranty-policies",
        icon: ClipboardCheck,
        permission: "WARRANTY_POLICY_VIEW",
      },

      {
        title: "Stock Count",
        href: "/suntree-warehouse/stock-count",
        icon: ClipboardList,
        permission: "STOCK_COUNT_VIEW",
      },
    ],
  },

  {
    section: "SYSTEM",
    items: [
      {
        title: "User Management",
        href: "/users",
        icon: Users,
        permission: "USERS_VIEW",
      },
    ],
  },
] as const;
