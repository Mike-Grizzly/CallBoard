"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell,
  Clapperboard,
  FileText,
  FolderOpen,
  Layout as LayoutIcon,
  Megaphone,
  PenLine,
  Phone,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Layout: LayoutIcon,
  Phone,
  FileText,
  Megaphone,
  FolderOpen,
  PenLine,
  Users,
  Bell,
  Clapperboard,
  Settings,
};

export type ProductionTab = {
  label: string;
  href: string;
  icon: string;
  count?: number;
};

/**
 * Persistent tab strip for the production header. Matches the demo's
 * `.tabs` style (underline + accent active state). Active when the
 * current URL equals the tab href, or — for non-overview tabs — starts
 * with it. Overview only matches exactly so it isn't always active.
 */
export function ProductionTabsNav({ tabs }: { tabs: ProductionTab[] }) {
  const pathname = usePathname();
  const overviewHref = tabs[0]?.href;
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  // On phones the tab strip is a horizontal scroller — keep the active
  // tab in view when the route changes so it isn't stranded off-screen.
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [pathname]);

  return (
    <nav className="tabs" aria-label="Production sections">
      {tabs.map((tab) => {
        const Icon = ICONS[tab.icon] ?? FileText;
        const isOverview = tab.href === overviewHref;
        const active = isOverview
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            ref={active ? activeTabRef : undefined}
            href={tab.href}
            className="tab"
            data-active={active ? "1" : "0"}
          >
            <Icon className="ico" aria-hidden />
            <span>{tab.label}</span>
            {tab.count != null && tab.count > 0 && (
              <span className="count">{tab.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
