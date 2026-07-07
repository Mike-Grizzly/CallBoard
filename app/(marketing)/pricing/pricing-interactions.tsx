"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pricing page client behavior, ported from the original pricing.html inline
 * script. Two independent controls:
 *
 *   1) Billing toggle (monthly / annual) rewrites prices, period, and sub-labels
 *      from data-amt-monthly / data-amt-annual / data-per / data-sub-* attrs.
 *   2) Audience tablist (individuals / companies) sets data-aud on the
 *      [data-page="pricing"] container, which CSS uses to swap [data-aud-panel]
 *      sections. Roving tabindex with arrow / Home / End keys, an animated thumb,
 *      localStorage persistence, and #individuals / #companies deep links.
 *
 * Keyed on usePathname so it re-binds after client navigation into the page,
 * mirroring the established marketing-interactions pattern.
 */
export function PricingInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-page="pricing"]');
    if (!root) return;

    const cleanups: Array<() => void> = [];

    // ── Billing period (monthly / annual) ──
    const billBtns = Array.from(
      root.querySelectorAll<HTMLButtonElement>(".billing button"),
    );
    const applyBilling = (period: string) => {
      const annual = period === "annual";
      billBtns.forEach((b) =>
        b.toggleAttribute("data-on", b.dataset.period === period),
      );
      root.querySelectorAll<HTMLElement>("[data-amt-monthly]").forEach((el) => {
        el.textContent = annual ? (el.dataset.amtAnnual ?? "") : (el.dataset.amtMonthly ?? "");
      });
      root.querySelectorAll<HTMLElement>("[data-per]").forEach((el) => {
        el.textContent = annual ? "/ year" : "/ month";
      });
      root.querySelectorAll<HTMLElement>("[data-sub-monthly]").forEach((el) => {
        el.textContent = annual ? (el.dataset.subAnnual ?? "") : (el.dataset.subMonthly ?? "");
      });
    };
    billBtns.forEach((b) => {
      const fn = () => applyBilling(b.dataset.period ?? "monthly");
      b.addEventListener("click", fn);
      cleanups.push(() => b.removeEventListener("click", fn));
    });
    applyBilling("monthly");

    // ── Audience switcher (individuals / companies) ──
    const segs = Array.from(root.querySelectorAll<HTMLButtonElement>(".aud-seg"));
    const thumb = root.querySelector<HTMLElement>(".aud-thumb");
    const KEY = "proscene:pricing:aud";

    if (segs.length) {
      const placeThumb = () => {
        const active =
          segs.find((s) => s.getAttribute("aria-selected") === "true") ?? segs[0];
        if (!thumb || !active) return;
        thumb.style.left = active.offsetLeft + "px";
        thumb.style.width = active.offsetWidth + "px";
      };
      const applyAud = (aud: string, moveFocus: boolean) => {
        root.setAttribute("data-aud", aud);
        segs.forEach((s) => {
          const on = s.dataset.aud === aud;
          s.setAttribute("aria-selected", on ? "true" : "false");
          s.tabIndex = on ? 0 : -1;
          if (on && moveFocus) s.focus();
        });
        placeThumb();
        try {
          localStorage.setItem(KEY, aud);
        } catch {
          /* ignore */
        }
      };

      segs.forEach((s, i) => {
        const click = () => applyAud(s.dataset.aud ?? "designers", false);
        const keydown = (e: KeyboardEvent) => {
          let ni: number | null = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % segs.length;
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
            ni = (i - 1 + segs.length) % segs.length;
          else if (e.key === "Home") ni = 0;
          else if (e.key === "End") ni = segs.length - 1;
          if (ni != null) {
            e.preventDefault();
            applyAud(segs[ni].dataset.aud ?? "designers", true);
          }
        };
        s.addEventListener("click", click);
        s.addEventListener("keydown", keydown);
        cleanups.push(() => {
          s.removeEventListener("click", click);
          s.removeEventListener("keydown", keydown);
        });
      });

      let start = "companies";
      const hash = (location.hash || "").toLowerCase();
      if (hash === "#companies" || hash === "#company" || hash === "#teams") start = "companies";
      else if (
        hash === "#individuals" ||
        hash === "#designers" ||
        hash === "#studio" ||
        hash === "#choreographers"
      )
        start = "designers";
      else {
        try {
          const v = localStorage.getItem(KEY);
          if (v === "companies" || v === "designers") start = v;
        } catch {
          /* ignore */
        }
      }
      applyAud(start, false);

      window.addEventListener("resize", placeThumb, { passive: true });
      cleanups.push(() => window.removeEventListener("resize", placeThumb));
      if (document.fonts?.ready) document.fonts.ready.then(placeThumb).catch(() => {});
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
