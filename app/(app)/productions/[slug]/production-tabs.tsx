"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProductionTabs({
  slug,
  tabs,
}: {
  slug: string;
  tabs: { label: string; href: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-[color:var(--border)]">
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
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-[color:var(--primary)] text-[color:var(--foreground)]"
                : "border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
