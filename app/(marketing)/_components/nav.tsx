"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Reviews", href: "/reviews" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Proscene home">
      <span className="brand-mark">
        <img src="/brand-mark.svg" alt="" width={19} height={19} />
      </span>
      <span className="brand-name">
        Pro<em>scene</em>
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="nav"
      data-open={open ? "1" : "0"}
      data-scrolled={scrolled ? "1" : "0"}
    >
      <div className="nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              className="nav-link"
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-cta">
          <Link className="nav-link sign-in" href="/login">
            Sign in
          </Link>
          <Link className="btn primary sm" href="/signup">
            Start free
          </Link>
          <button
            className="nav-toggle"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
