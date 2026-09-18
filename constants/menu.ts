import {
  LayoutDashboard,
  Newspaper,
  BriefcaseBusiness,
  Building2,
  MapPinned,
  Image,
  Users,
  ScanBarcode,
} from "lucide-react";

export const SIDEBAR_MENU = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "DASHBOARD_VIEW",
  },

  {
    title: "News",
    href: "/news",
    icon: Newspaper,
    permission: "WEBSITE_MANAGEMENT",
  },

  {
    title: "Projects",
    href: "/projects",
    icon: BriefcaseBusiness,
    permission: "WEBSITE_MANAGEMENT",
  },

  {
    title: "Company",
    href: "/company",
    icon: Building2,
    permission: "WEBSITE_MANAGEMENT",
  },

  {
    title: "Dealer Locator",
    href: "/dealers",
    icon: MapPinned,
    permission: "DEALERS_VIEW",
  },

  {
    title: "Media Library",
    href: "/media",
    icon: Image,
    permission: "WEBSITE_MANAGEMENT",
  },

  {
    title: "User Management",
    href: "/users",
    icon: Users,
    permission: "USERS_VIEW",
  },

  {
    title: "Serial Management",
    href: "/serials",
    icon: ScanBarcode,
    permission: "SERIALS_VIEW",
  },
] as const;