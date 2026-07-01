"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * "Focus view" launch button for the production toolbar. Self-hides unless the
 * user is on the Script or Blocking tab, and links into the full-screen Focus
 * route for that surface. Additive only — it never alters the tools.
 */
export function FocusEntryButton() {
  const pathname = usePathname();
  const m = pathname.match(/^\/productions\/([^/]+)\/(script|blocking)(?:\/|$)/);
  if (!m) return null;

  const [, slug, mode] = m;

  return (
    <Link
      href={`/focus/${slug}?mode=${mode}`}
      className="btn fx-entry"
      title="Focus mode — the full screen, just this tool and nothing else"
    >
      <svg
        className="ico"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
      <span>Focus mode</span>
    </Link>
  );
}
