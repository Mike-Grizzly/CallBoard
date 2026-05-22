"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Client shell around the app layout. On desktop it is a passive wrapper —
 * the rail and main content sit in the CSS grid unchanged. On phone widths
 * (<=720px) it adds a top bar with a hamburger button and turns the rail
 * into an off-canvas slide-in drawer.
 */
export function AppFrame({
  rail,
  children,
}: {
  rail: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The drawer counts as open only while still on the route it was opened
  // from; navigating anywhere else closes it with no state-syncing effect.
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const drawerOpen = openedOnPath === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = () => {
    setOpenedOnPath(null);
    menuButtonRef.current?.focus();
  };

  // While the drawer is open: lock background scroll, close on Escape, and
  // move focus into the drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOnPath(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <div className="app" data-drawer={drawerOpen ? "open" : "closed"}>
      <header className="mobile-topbar">
        <button
          ref={menuButtonRef}
          type="button"
          className="mobile-menu-btn"
          aria-label="Open navigation menu"
          aria-controls="app-rail"
          aria-expanded={drawerOpen}
          onClick={() => setOpenedOnPath(pathname)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
        <Link
          href="/dashboard"
          className="mobile-brand"
          aria-label="CallBoard home"
        >
          <span className="rail-mark">C</span>
          <span className="rail-name">
            Call<em>Board</em>
          </span>
        </Link>
      </header>

      <div
        className="rail-backdrop"
        aria-hidden="true"
        onClick={() => setOpenedOnPath(null)}
      />

      {rail}

      <button
        ref={closeButtonRef}
        type="button"
        className="rail-close"
        aria-label="Close navigation menu"
        onClick={closeDrawer}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <main className="main">{children}</main>
    </div>
  );
}
