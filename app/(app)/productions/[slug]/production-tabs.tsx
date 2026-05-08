"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type ProductionTab = {
  label: string;
  href: string;
  icon: LucideIcon;
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

  return (
    <nav className="tabs" aria-label="Production sections">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isOverview = tab.href === overviewHref;
        const active = isOverview
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
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
