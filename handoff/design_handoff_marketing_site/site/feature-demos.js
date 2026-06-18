/* ProScene — feature demo engine (scroll-driven).
   Each [data-demo] container maps its position in the viewport to a
   phase 0..(phases-1). Scrolling down advances the beats; scrolling
   up reverses them. Reduced-motion parks on data-rest. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const demos = [...document.querySelectorAll("[data-demo]")].map((el) => ({
    el,
    phases: parseInt(el.dataset.phases || "4", 10),
    last: -1,
  }));
  if (!demos.length) return;

  if (reduce) {
    demos.forEach(({ el, phases }) => {
      const rest = el.dataset.rest != null ? parseInt(el.dataset.rest, 10) : phases - 1;
      el.dataset.phase = String(rest);
    });
    return;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Scrub band: a panel's top travelling from 82% down the viewport
    // (progress 0) up to 22% (progress 1) plays the full sequence.
    const startY = vh * 0.82;
    const endY = vh * 0.22;
    for (const d of demos) {
      const rect = d.el.getBoundingClientRect();
      // skip work when far off-screen
      if (rect.bottom < -vh || rect.top > vh * 1.5) continue;
      const p = clamp((startY - rect.top) / (startY - endY), 0, 1);
      const phase = clamp(Math.floor(p * d.phases), 0, d.phases - 1);
      if (phase !== d.last) {
        d.last = phase;
        d.el.dataset.phase = String(phase);
      }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", update);
  update();
})();
