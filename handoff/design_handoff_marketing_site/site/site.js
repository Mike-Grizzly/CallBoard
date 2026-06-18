/* ProScene marketing, shared nav, footer, and page interactions.
   Each page sets <body data-page="home|features|pricing|faq|reviews|blog">. */
(function () {
  const PAGE = document.body.dataset.page || "";
  const ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  const NAV_LINKS = [
    { id: "features", label: "Features", href: "features.html" },
    { id: "pricing", label: "Pricing", href: "pricing.html" },
    { id: "blog", label: "Blog", href: "blog.html" },
    { id: "faq", label: "FAQ", href: "faq.html" },
  ];

  /* ProScene mark, proscenium arch silhouette with three marquee slats cut
     out, drawn in the accent. Matches the app + brand board. Unique mask id
     per scope so nav and footer copies don't collide. */
  function logoMark(id) {
    return `<svg class="brand-logo" viewBox="0 0 240 200" overflow="visible" aria-hidden="true">
      <defs><mask id="${id}"><rect width="240" height="200" fill="white"/>
        <g fill="black" stroke="black" stroke-width="9" stroke-linejoin="round">
          <polygon points="68,77 172,77 176,87 64,87"/>
          <polygon points="56,116 184,116 190,130 50,130"/>
          <polygon points="44,155 196,155 204,173 36,173"/>
        </g></mask></defs>
      <path d="M 30 184 L 30 74 Q 30 24 84 24 L 156 24 Q 210 24 210 74 L 210 184 Z" fill="var(--accent)" stroke="var(--accent)" stroke-width="12" stroke-linejoin="round" mask="url(#${id})"/>
    </svg>`;
  }
  function brand(scope) {
    return `<a class="brand" href="index.html" aria-label="ProScene home">
      <span class="brand-mark">${logoMark("pslogo-" + (scope || "x"))}</span>
      <span class="brand-name">Pro<em>Scene</em></span>
    </a>`;
  }

  function mountNav() {
    const nav = document.createElement("header");
    nav.className = "nav";
    nav.innerHTML = `
      <div class="nav-inner">
        ${brand("nav")}
        <nav class="nav-links" aria-label="Primary">
          ${NAV_LINKS.map(
            (l) =>
              `<a class="nav-link" href="${l.href}"${PAGE === l.id ? ' aria-current="page"' : ""}>${l.label}</a>`
          ).join("")}
        </nav>
        <div class="nav-cta">
          <a class="nav-link sign-in" href="#" data-noop>Sign in</a>
          <a class="btn primary sm" href="#signup" data-noop>Start free</a>
          <button class="nav-toggle" aria-label="Menu" aria-expanded="false">${ICON.menu}</button>
        </div>
      </div>`;
    document.body.prepend(nav);

    const toggle = nav.querySelector(".nav-toggle");
    toggle.addEventListener("click", () => {
      const open = nav.dataset.open === "1";
      nav.dataset.open = open ? "0" : "1";
      toggle.innerHTML = open ? ICON.menu : ICON.x;
      toggle.setAttribute("aria-expanded", String(!open));
    });

    const onScroll = () => {
      nav.dataset.scrolled = window.scrollY > 8 ? "1" : "0";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function mountFooter() {
    const cols = [
      {
        h: "Product",
        links: [
          ["Features", "features.html"],
          ["Pricing", "pricing.html"],
          ["What's new", "blog.html"],
          ["Mobile app", "features.html#mobile"],
        ],
      },
      {
        h: "Resources",
        links: [
          ["Walkthroughs", "blog.html"],
          ["FAQ", "faq.html"],
          ["Help center", "#"],
        ],
      },
      {
        h: "Company",
        links: [
          ["About", "#"],
          ["Careers", "#"],
          ["Contact", "#"],
          ["Book a demo", "#demo"],
        ],
      },
    ];
    const dot = (p) =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const footer = document.createElement("footer");
    footer.className = "footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div>
            ${brand("foot")}
            <p class="footer-blurb">The production hub for stage managers. Calls, calendars, scripts, and reports, everything your company needs, in one place.</p>
          </div>
          ${cols
            .map(
              (c) => `<div class="footer-col">
            <h4>${c.h}</h4>
            <ul>${c.links.map(([t, h]) => `<li><a href="${h}"${h === "#" ? " data-noop" : ""}>${t}</a></li>`).join("")}</ul>
          </div>`
            )
            .join("")}
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ProScene. Made for the theatre.</span>
          <div class="footer-social">
            <a href="#" data-noop aria-label="Instagram">${dot('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>')}</a>
            <a href="#" data-noop aria-label="X">${dot('<path d="M4 4l16 16M20 4L4 20"/>')}</a>
            <a href="#" data-noop aria-label="YouTube">${dot('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9l4 3-4 3z" fill="currentColor"/>')}</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(footer);
  }

  function reveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const show = (e) => e.classList.add("in");

    // No IO at all → show everything immediately.
    if (!("IntersectionObserver" in window)) {
      els.forEach(show);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            show(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((e) => io.observe(e));

    // Failsafe 1: reveal anything already within the viewport on load
    // (covers contexts where the observer callback never fires).
    const revealInView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach((e) => {
        if (e.classList.contains("in")) return;
        const r = e.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > 0) show(e);
      });
    };
    revealInView();
    window.addEventListener("load", revealInView, { once: true });
    window.addEventListener("scroll", revealInView, { passive: true });

    // Failsafe 2: never leave content permanently hidden.
    setTimeout(() => els.forEach(show), 1400);
  }

  function noops() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-noop]");
      if (a) e.preventDefault();
    });
  }

  function init() {
    mountNav();
    mountFooter();
    reveals();
    noops();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
