"use client";

import { useEffect } from "react";

/** Blog category tabs (visual toggle) + newsletter form no-op, from blog.html. */
export function BlogInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-page="blog"]');
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".blog-tab"));
    const onTab = (b: HTMLButtonElement) => () => {
      tabs.forEach((x) => x.removeAttribute("data-on"));
      b.setAttribute("data-on", "");
    };
    const tabHandlers = tabs.map((b) => {
      const fn = onTab(b);
      b.addEventListener("click", fn);
      return [b, fn] as const;
    });

    const form = root.querySelector<HTMLFormElement>("[data-noop-form]");
    const onSubmit = (e: Event) => e.preventDefault();
    form?.addEventListener("submit", onSubmit);

    return () => {
      tabHandlers.forEach(([b, fn]) => b.removeEventListener("click", fn));
      form?.removeEventListener("submit", onSubmit);
    };
  }, []);

  return null;
}
