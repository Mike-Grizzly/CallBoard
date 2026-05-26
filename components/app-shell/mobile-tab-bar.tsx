"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

// Inside `/productions/[slug]/...`, the bottom tabs scope themselves to
// that production (the demo's mental model). Outside, they fall back to
// workspace-level routes. Notes only exists per-production, so off-show
// it falls back to the dashboard.
const PRODUCTION_PATH = /^\/productions\/([^/]+)/;

interface TabConfig {
  id: string;
  label: string;
  icon: IconName;
  href: (slug: string | null) => string;
  isActive: (pathname: string, slug: string | null) => boolean;
}

const TABS: TabConfig[] = [
  {
    id: "today",
    label: "Today",
    icon: "Sun" as IconName,
    href: (slug) => (slug ? `/productions/${slug}` : "/dashboard"),
    isActive: (pathname, slug) =>
      slug ? pathname === `/productions/${slug}` : pathname.startsWith("/dashboard"),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "CalendarDays",
    href: (slug) => (slug ? `/productions/${slug}/calls` : "/calendar"),
    isActive: (pathname, slug) =>
      slug
        ? pathname.startsWith(`/productions/${slug}/calls`)
        : pathname.startsWith("/calendar"),
  },
  {
    id: "reports",
    label: "Reports",
    icon: "FileText",
    href: (slug) => (slug ? `/productions/${slug}/reports` : "/reports"),
    isActive: (pathname, slug) =>
      slug
        ? pathname.startsWith(`/productions/${slug}/reports`)
        : pathname.startsWith("/reports"),
  },
  {
    id: "notes",
    label: "Notes",
    icon: "PenLine",
    // Workspace-level notes feed — aggregates the caller's notes across
    // every production. Production-scoped notes are reached via the
    // production tab strip, not this bottom tab.
    href: () => "/notes",
    isActive: (pathname) => pathname === "/notes" || pathname.startsWith("/notes/"),
  },
  {
    id: "more",
    label: "More",
    icon: "Layers",
    href: () => "/more",
    isActive: (pathname) =>
      pathname.startsWith("/more") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/people") ||
      pathname.startsWith("/documents") ||
      pathname.startsWith("/announcements") ||
      pathname.startsWith("/activity") ||
      pathname === "/productions" ||
      pathname.startsWith("/productions/new"),
  },
];

/**
 * Bottom tab bar shown at phone widths (<=720px). Replaces the desktop
 * rail. Routes are context-aware: inside a production the tabs point at
 * that production's sub-routes; outside they point at the workspace
 * equivalents.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const slugMatch = pathname.match(PRODUCTION_PATH);
  const slug = slugMatch ? slugMatch[1] : null;

  return (
    <nav className="mob-tabbar" aria-label="Primary navigation">
      {TABS.map((tab) => {
        const active = tab.isActive(pathname, slug);
        return (
          <Link
            key={tab.id}
            href={tab.href(slug)}
            className="mob-tab"
            data-active={active ? "1" : "0"}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={tab.icon} className="ico" aria-hidden />
            <span className="lbl">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
