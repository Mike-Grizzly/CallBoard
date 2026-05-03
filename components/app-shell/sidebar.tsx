"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import type { Role } from "@/types/roles";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.capability || can(role, item.capability),
  );

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-[color:var(--border)] md:bg-[color:var(--muted)]">
      <nav className="flex flex-col gap-1 p-4">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Navigate
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                  : "text-[color:var(--foreground)] hover:bg-[color:var(--accent)]",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
