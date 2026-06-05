"use client";

import { useEffect } from "react";

/** Billing-period toggle, ported from the original pricing.html inline script. */
export function PricingInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-page="pricing"]');
    if (!root) return;
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>(".billing button"));
    if (!btns.length) return;

    const apply = (period: string) => {
      btns.forEach((b) => b.toggleAttribute("data-on", b.dataset.period === period));
      root.querySelectorAll<HTMLElement>("[data-price]").forEach((el) => {
        el.textContent = el.dataset[period] ?? el.textContent;
      });
      root.querySelectorAll<HTMLElement>("[data-note]").forEach((el) => {
        el.textContent = el.dataset[period] ?? el.textContent;
      });
      root.querySelectorAll<HTMLElement>("[data-per]").forEach((el) => {
        el.textContent = period === "annual" ? "/ production / yr" : "/ production";
      });
    };

    const handlers = btns.map((b) => {
      const fn = () => apply(b.dataset.period ?? "production");
      b.addEventListener("click", fn);
      return [b, fn] as const;
    });

    return () => handlers.forEach(([b, fn]) => b.removeEventListener("click", fn));
  }, []);

  return null;
}
