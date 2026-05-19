import type { IconName } from "@/components/ui/icon";
import type { Capability } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  capability?: Capability;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Productions", href: "/productions", icon: "Theater", capability: "productions:view" },
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Calendar", href: "/calendar", icon: "CalendarDays" },
  { label: "Reports", href: "/reports", icon: "FileText", capability: "reports:view" },
  { label: "Documents", href: "/documents", icon: "FolderOpen", capability: "documents:view" },
  { label: "Announcements", href: "/announcements", icon: "Megaphone", capability: "announcements:view" },
  { label: "Activity", href: "/activity", icon: "Activity", capability: "activity:view" },
  { label: "Settings", href: "/settings", icon: "Settings", capability: "settings:manage" },
];
