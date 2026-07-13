import { can, type Capability } from "@/lib/permissions";
import type { IconName } from "@/components/ui/icon";
import type { Role } from "@/types/roles";

export type NavSurface = "rail" | "more";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  capability?: Capability;
  /** Which app-shell surfaces this destination appears on. */
  surfaces: NavSurface[];
}

// Single source of truth for the workspace navigation (N4). The desktop rail
// and the mobile "More" page both derive their capability-gated lists from this
// via navItemsFor(), so adding or gating a destination is a one-file change and
// the two surfaces can't drift apart.
//
// The mobile bottom tab bar (mobile-tab-bar.tsx) is intentionally NOT derived
// from this: it's a curated 5-item, context-aware set (its labels/icons differ
// on purpose — "Today"/Sun, not "Dashboard"; routes rewrite inside a
// production) and carries no capability gating, so there's no gating-drift risk
// to consolidate there.
export const NAV_ITEMS: NavItem[] = [
  // Productions has its own dedicated section in the rail (the production
  // cards), so in the flat gated list it only surfaces on mobile's More page.
  { label: "Productions", href: "/productions", icon: "Theater", capability: "productions:view", surfaces: ["more"] },
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", surfaces: ["rail"] },
  { label: "Calendar", href: "/calendar", icon: "CalendarDays", surfaces: ["rail"] },
  { label: "Reports", href: "/reports", icon: "FileText", capability: "reports:view", surfaces: ["rail"] },
  { label: "Documents", href: "/documents", icon: "FolderOpen", capability: "documents:view", surfaces: ["rail", "more"] },
  { label: "Announcements", href: "/announcements", icon: "Megaphone", capability: "announcements:view", surfaces: ["rail", "more"] },
  { label: "Activity", href: "/activity", icon: "Activity", capability: "activity:view", surfaces: ["rail", "more"] },
  { label: "People", href: "/people", icon: "Users", capability: "settings:manage", surfaces: ["rail", "more"] },
  { label: "Settings", href: "/settings", icon: "Settings", surfaces: ["rail", "more"] },
];

/** Workspace nav items for a surface, gated to the given role. */
export function navItemsFor(surface: NavSurface, role: Role): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      item.surfaces.includes(surface) &&
      (!item.capability || can(role, item.capability)),
  );
}
