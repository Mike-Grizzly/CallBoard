"use client";

import { useEffect } from "react";

/** FAQ search filter + sidebar scrollspy, ported from faq.html inline scripts. */
export function FaqInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-page="faq"]');
    if (!root) return;

    // ── search filter ──
    const q = root.querySelector<HTMLInputElement>("#faqq");
    const qas = Array.from(root.querySelectorAll<HTMLDetailsElement>(".qa"));
    const groups = Array.from(root.querySelectorAll<HTMLElement>(".faq-group"));
    const none = root.querySelector<HTMLElement>("#noresults");

    const onInput = () => {
      const t = (q?.value ?? "").trim().toLowerCase();
      let any = false;
      qas.forEach((d) => {
        const hit = !t || d.textContent!.toLowerCase().includes(t);
        d.hidden = !hit;
        if (hit) any = true;
        if (t && hit) d.open = true;
        if (!t) d.open = false;
      });
      groups.forEach((g) => {
        g.style.display = Array.from(g.querySelectorAll<HTMLElement>(".qa")).some(
          (d) => !d.hidden
        )
          ? ""
          : "none";
      });
      if (none) none.style.display = any ? "none" : "block";
    };
    q?.addEventListener("input", onInput);

    // ── sidebar scrollspy ──
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".faq-side a"));
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
      { rootMargin: "-30% 0px -60% 0px" }
    );
    groups.forEach((g) => io.observe(g));

    return () => {
      q?.removeEventListener("input", onInput);
      io.disconnect();
    };
  }, []);

  return null;
}
