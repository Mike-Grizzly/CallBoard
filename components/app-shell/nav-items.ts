import type { LucideIcon } from "lucide-react";
import type { Capability } from "@/lib/permissions";
import {
  Activity,
  LayoutDashboard,
  Megaphone,
  FileText,
  FolderOpen,
  Settings,
  Theater,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  capability?: Capability;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Productions", href: "/productions", icon: Theater, capability: "productions:view" },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: FileText, capability: "reports:view" },
  { label: "Documents", href: "/documents", icon: FolderOpen, capability: "documents:view" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, capability: "announcements:view" },
  { label: "Activity", href: "/activity", icon: Activity, capability: "activity:view" },
  { label: "Settings", href: "/settings", icon: Settings, capability: "settings:manage" },
];
