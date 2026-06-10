"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the top-of-content banner stack (trial + announcement banners) and
 * publishes its rendered height as the `--app-banner-h` CSS variable on
 * <body>. The fixed trial-countdown pill reads that variable to shift itself
 * below whatever banners are showing, so it never covers their buttons — and
 * slides back up as banners are dismissed or acknowledged (tracked live via a
 * ResizeObserver). Collapses to 0 when no banner is present.
 */
export function BannerSlot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () => {
      document.body.style.setProperty("--app-banner-h", `${el.offsetHeight}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.body.style.removeProperty("--app-banner-h");
    };
  }, []);

  return (
    <div ref={ref} className="app-banner-slot">
      {children}
    </div>
  );
}
