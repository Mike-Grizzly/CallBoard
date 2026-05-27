"use client";

import { useEffect } from "react";

/**
 * On iOS WebKit (Safari and Chrome both — Chrome iOS uses the same
 * engine), focusing an `<input>` whose font-size is under 16px
 * auto-zooms the page, and that zoom level persists across the
 * subsequent navigation. So after typing into the sign-in form (where
 * smaller fonts are intentional — they're easier to read when zoomed)
 * the user lands inside the app still zoomed in, with no way to get
 * back to 1× short of pinching out manually.
 *
 * Important: iOS's input auto-zoom is a *layout* zoom, not a pinch
 * zoom. `visualViewport.scale` only reflects pinch zoom, so it reports
 * 1 even while the page is clearly layout-zoomed — checking it to
 * decide whether to reset is a dead end. We just always run the
 * reset on first mount of the authenticated layout (which doesn't
 * remount between in-app navigations, so a deliberate pinch the user
 * applies once inside the app is preserved).
 *
 * Technique: clamp the viewport with `maximum-scale=1, user-scalable=no`
 * to force WebKit to re-layout at 1×, give it two animation frames to
 * actually apply, then revert so pinch-zoom still works after the
 * reset.
 */
export function ZoomReset() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]',
    );
    if (!meta) return;

    const original =
      meta.getAttribute("content") ?? "width=device-width, initial-scale=1";

    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    );

    // Two rAFs so WebKit actually applies the clamp before we lift it
    // — a single rAF can fire before the layout pass completes.
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        meta.setAttribute("content", original);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, []);

  return null;
}
