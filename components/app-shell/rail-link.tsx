"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export function RailLink({
  href,
  className = "rail-item",
  matchPrefix = true,
  icon,
  children,
}: {
  href: string;
  className?: string;
  matchPrefix?: boolean;
  icon?: IconName;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const active = matchPrefix
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
  return (
    <Link href={href} className={className} data-active={active ? "1" : "0"}>
      {icon && <Icon name={icon} className="ico" aria-hidden />}
      {children}
    </Link>
  );
}
