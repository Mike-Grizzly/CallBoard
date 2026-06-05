"use client";

import { useEffect } from "react";

/**
 * Features-page interactions, ported from feature-demos.js + the inline
 * scrollspy in features.html:
 *  - scroll-driven phase engine: maps each [data-demo]'s viewport position to
 *    a [data-phase]; reduced-motion parks on data-rest
 *  - feature sub-nav scrollspy
 */
export function FeaturesInteractions() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const demos = Array.from(
      document.querySelectorAll<HTMLElement>("[data-demo]")
    ).map((el) => ({
      el,
      phases: parseInt(el.dataset.phases || "4", 10),
      last: -1,
    }));

    let cleanupDemos = () => {};

    if (demos.length) {
      if (reduce) {
        demos.forEach(({ el, phases }) => {
          const rest = el.dataset.rest != null ? parseInt(el.dataset.rest, 10) : phases - 1;
          el.dataset.phase = String(rest);
        });
      } else {
        const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
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
        cleanupDemos = () => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        };
      }
    }

    // ── feature sub-nav scrollspy ──
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".feature-nav a")
    );
    const map = new Map(links.map((a) => [a.getAttribute("href")!.slice(1), a]));
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            map.get(e.target.id)?.classList.add("active");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    document.querySelectorAll(".feat-block").forEach((s) => io.observe(s));

    return () => {
      cleanupDemos();
      io.disconnect();
    };
  }, []);

  return null;
}
