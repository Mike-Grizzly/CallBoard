"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProductionTabs({
  slug,
  tabs,
}: {
  slug: string;
  tabs: { label: string; href: string; count?: number }[];
}) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-[color:var(--border)] overflow-x-auto">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== `/productions/${slug}` &&
            pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-[color:var(--primary)] text-[color:var(--foreground)]"
                : "border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                  isActive
                    ? "bg-[color:var(--muted)] text-[color:var(--foreground)]"
                    : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]",
                )}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
