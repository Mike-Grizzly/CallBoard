"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Replicates the shared behaviors from the original marketing `site.js`:
 *  - reveal-on-scroll: adds `.in` to `.reveal` elements as they enter view
 *  - noop links: prevents navigation for placeholder `[data-noop]` anchors
 *
 * Page bodies are rendered as static markup, so this runs against the DOM and
 * re-initializes whenever the route changes.
 */
export function MarketingInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const show = (el: HTMLElement) => el.classList.add("in");

    let io: IntersectionObserver | undefined;
    if (els.length && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              show(en.target as HTMLElement);
              io?.unobserve(en.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      els.forEach((e) => io!.observe(e));

      // Failsafe: reveal anything already in view, and never leave content hidden.
      const revealInView = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        els.forEach((e) => {
          if (e.classList.contains("in")) return;
          const r = e.getBoundingClientRect();
          if (r.top < vh * 0.95 && r.bottom > 0) show(e);
        });
      };
      revealInView();
      window.addEventListener("scroll", revealInView, { passive: true });
      const t = window.setTimeout(() => els.forEach(show), 1400);

      // noop placeholder links
      const onClick = (e: MouseEvent) => {
        const a = (e.target as HTMLElement)?.closest?.("[data-noop]");
        if (a) e.preventDefault();
      };
      document.addEventListener("click", onClick);

      return () => {
        io?.disconnect();
        window.removeEventListener("scroll", revealInView);
        window.clearTimeout(t);
        document.removeEventListener("click", onClick);
      };
    }

    els.forEach(show);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("[data-noop]");
      if (a) e.preventDefault();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}
