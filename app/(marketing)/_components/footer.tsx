import Link from "next/link";

const COLS = [
  {
    h: "Product",
    links: [
      ["Features", "/features"],
      ["Pricing", "/pricing"],
      ["What's new", "/blog"],
      ["Mobile app", "/features#mobile"],
    ],
  },
  {
    h: "Resources",
    links: [
      ["Walkthroughs", "/blog"],
      ["FAQ", "/faq"],
      ["Help center", "/faq"],
    ],
  },
  {
    h: "Company",
    links: [
      ["Contact", "/contact"],
      ["Book a demo", "/contact?reason=demo"],
    ],
  },
] as const;

function Social({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <a href="#" data-noop aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" aria-label="Proscene home">
              <span className="brand-mark">
                <img src="/brand-ink.svg" alt="" width={30} height={30} />
              </span>
              <span className="brand-name">
                Pro<em>scene</em>
              </span>
            </Link>
            <p className="footer-blurb">
              The production hub for stage managers. Calls, calendars, scripts, and
              reports — everything your company needs, in one place.
            </p>
          </div>
          {COLS.map((c) => (
            <div className="footer-col" key={c.h}>
              <h4>{c.h}</h4>
              <ul>
                {c.links.map(([t, h]) => (
                  <li key={t}>
                    {h.startsWith("/") ? (
                      <Link href={h}>{t}</Link>
                    ) : (
                      <a href={h} data-noop>
                        {t}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Proscene. Made for the theatre.</span>
          <div className="footer-social">
            <Social label="Instagram">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" />
            </Social>
            <Social label="X">
              <path d="M4 4l16 16M20 4L4 20" />
            </Social>
            <Social label="YouTube">
              <rect x="3" y="6" width="18" height="12" rx="3" />
              <path d="M11 9l4 3-4 3z" fill="currentColor" />
            </Social>
          </div>
        </div>
      </div>
    </footer>
  );
}
