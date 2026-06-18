"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Features-page interactions, ported from feature-demos.js + the inline
 * <script> in features.html. Re-initializes whenever the route changes.
 *
 *  (a) scroll-driven multi-phase demo engine: maps each [data-demo]'s
 *      viewport position to a [data-phase]; reduced-motion parks on data-rest.
 *  (b) audience segment switcher: a proper tablist (roving tabindex, arrow/
 *      Home/End keys, aria-selected, animated thumb) that toggles
 *      [data-segment] on the [data-page="features"] container and persists
 *      to localStorage. All copy show/hide is CSS-driven.
 *  (c) contextual jump-nav scrollspy that skips links/sections hidden by the
 *      active segment.
 */
export function FeaturesInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    const root =
      document.querySelector<HTMLElement>('[data-page="features"]') ?? undefined;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // ── (a) scroll-driven phase engine ──────────────────────────────
    const demos = Array.from(
      root.querySelectorAll<HTMLElement>("[data-demo]")
    ).map((el) => ({
      el,
      phases: parseInt(el.dataset.phases || "4", 10),
      last: -1,
    }));

    if (demos.length) {
      if (reduce) {
        demos.forEach(({ el, phases }) => {
          const rest =
            el.dataset.rest != null ? parseInt(el.dataset.rest, 10) : phases - 1;
          el.dataset.phase = String(rest);
        });
      } else {
        const clamp = (v: number, a: number, b: number) =>
          Math.max(a, Math.min(b, v));
        let ticking = false;

        const update = () => {
          ticking = false;
          const vh = window.innerHeight || document.documentElement.clientHeight;
          const startY = vh * 0.82;
          const endY = vh * 0.22;
          for (const d of demos) {
            const rect = d.el.getBoundingClientRect();
            if (rect.bottom < -vh || rect.top > vh * 1.5) continue;
            const p = clamp((startY - rect.top) / (startY - endY), 0, 1);
            const phase = clamp(Math.floor(p * d.phases), 0, d.phases - 1);
            if (phase !== d.last) {
              d.last = phase;
              d.el.dataset.phase = String(phase);
            }
          }
        };

        const onScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(update);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        update();
        cleanups.push(() => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        });
      }
    }

    // ── (b) audience segment switcher (tablist) ─────────────────────
    const segs = Array.from(
      root.querySelectorAll<HTMLButtonElement>(".aud-seg")
    );
    const thumb = root.querySelector<HTMLElement>(".aud-thumb");
    const jumpLinks = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(".feature-jump a")
    );
    const KEY = "proscene:features:segment";

    if (segs.length) {
      const placeThumb = () => {
        const active =
          segs.find((s) => s.getAttribute("aria-selected") === "true") ||
          segs[0];
        if (!thumb || !active) return;
        thumb.style.left = active.offsetLeft + "px";
        thumb.style.width = active.offsetWidth + "px";
      };

      const apply = (seg: string, moveFocus: boolean) => {
        root.setAttribute("data-segment", seg);
        segs.forEach((s) => {
          const on = s.dataset.seg === seg;
          s.setAttribute("aria-selected", on ? "true" : "false");
          s.tabIndex = on ? 0 : -1;
          if (on && moveFocus) s.focus();
        });
        jumpLinks.forEach((a) => {
          const aud = a.dataset.aud || "both";
          a.hidden = aud !== "both" && aud !== seg;
        });
        placeThumb();
        try {
          localStorage.setItem(KEY, seg);
        } catch {
          /* ignore */
        }
      };

      segs.forEach((s, i) => {
        const onClick = () => apply(s.dataset.seg || "cast", false);
        const onKey = (e: KeyboardEvent) => {
          let ni: number | null = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown")
            ni = (i + 1) % segs.length;
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
            ni = (i - 1 + segs.length) % segs.length;
          else if (e.key === "Home") ni = 0;
          else if (e.key === "End") ni = segs.length - 1;
          if (ni != null) {
            e.preventDefault();
            apply(segs[ni].dataset.seg || "cast", true);
          }
        };
        s.addEventListener("click", onClick);
        s.addEventListener("keydown", onKey);
        cleanups.push(() => {
          s.removeEventListener("click", onClick);
          s.removeEventListener("keydown", onKey);
        });
      });

      let saved = "cast";
      try {
        const v = localStorage.getItem(KEY);
        if (v === "cast" || v === "creative") saved = v;
      } catch {
        /* ignore */
      }
      apply(saved, false);

      window.addEventListener("resize", placeThumb, { passive: true });
      cleanups.push(() => window.removeEventListener("resize", placeThumb));
      if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(placeThumb).catch(() => {});
      // re-measure after layout settles
      const raf = requestAnimationFrame(placeThumb);
      cleanups.push(() => cancelAnimationFrame(raf));
    }

    // ── (c) contextual jump-nav scrollspy ───────────────────────────
    const spyMap = new Map(
      jumpLinks.map((a) => [a.getAttribute("href")!.slice(1), a])
    );
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            const link = spyMap.get((e.target as HTMLElement).id);
            if (!link || link.hidden) return;
            jumpLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    root.querySelectorAll(".feat-block").forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
