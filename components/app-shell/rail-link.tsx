"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Workspace nav link with active-state highlighting driven by usePathname.
 * Active when pathname === href or starts with `${href}/`.
 */
export function RailLink({
  href,
  className = "rail-item",
  matchPrefix = true,
  children,
}: {
  href: string;
  className?: string;
  matchPrefix?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = matchPrefix
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
  return (
    <Link href={href} className={className} data-active={active ? "1" : "0"}>
      {children}
    </Link>
  );
}
