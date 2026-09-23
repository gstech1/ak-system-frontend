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
        title: "Products",
        href: "/website-management/products",
        icon: Package,
        permission: "WEBSITE_MANAGEMENT",
      },

      {
        title: "Projects",
        href: "/projects",
        icon: BriefcaseBusiness,
        permission: "WEBSITE_MANAGEMENT",
      },

      {
        title: "Ads & Promotions",
        href: "/website-management/ads",
        icon: Megaphone,
        permission: "WEBSITE_MANAGEMENT",
      },
    ],
  },

  {
    section: "SWMS",
    items: [
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
        title: "Shipments",
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