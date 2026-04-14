import type { LucideIcon } from "lucide-react";
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
  adminOnly?: boolean;
}

/**
 * Canonical navigation for the app shell.
 * Keep the order stable — users will learn it.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Productions", href: "/productions", icon: Theater },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Documents", href: "/documents", icon: FolderOpen },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];
