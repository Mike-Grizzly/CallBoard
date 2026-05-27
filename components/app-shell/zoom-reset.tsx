"use client";

import { useEffect } from "react";

/**
 * On iOS WebKit (Safari and Chrome both — Chrome iOS uses the same
 * engine), focusing an `<input>` whose font-size is under 16px
 * auto-zooms the page, and the zoom level persists across the
 * subsequent navigation. So after typing into the sign-in form (where
 * smaller fonts are intentional — they're easier to read when zoomed)
 * the user lands inside the app still zoomed at ~1.4×, which makes the
 * whole UI feel "stuck in."
 *
 * This component runs once when the authenticated app layout mounts.
 * If `visualViewport.scale` is meaningfully above 1, we briefly set
 * `maximum-scale=1` on the viewport meta to force the browser to
 * clamp back to 1×, then revert so manual pinch-zoom still works.
 * The check is gated on > 1.05 so an intentional user pinch isn't
 * fought.
 */
export function ZoomReset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || vv.scale <= 1.05) return;

    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]',
    );
    if (!meta) return;

    const original =
      meta.getAttribute("content") ?? "width=device-width, initial-scale=1";
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1",
    );

    const timer = window.setTimeout(() => {
      meta.setAttribute("content", original);
    }, 200);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
