import { Theater } from "lucide-react";
import Link from "next/link";

/**
 * Top bar. Shows the product name and a placeholder show context.
 * When auth and production-switching land, the right side will host
 * the current show selector and the user menu.
 */
export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--background)] px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Theater className="h-5 w-5" aria-hidden />
        <span className="text-base font-semibold tracking-tight">
          Show Portal
        </span>
      </Link>

      <div className="flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
        <span className="hidden sm:inline">No production selected</span>
      </div>
    </header>
  );
}
