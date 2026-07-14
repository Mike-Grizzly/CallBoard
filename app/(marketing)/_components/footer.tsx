import Link from "next/link";
import { BrandMark } from "./brand-mark";

const COLS = [
  {
    h: "Product",
    links: [
      ["Features", "/features"],
      ["Pricing", "/pricing"],
      ["Blog", "/blog"],
      ["FAQ", "/faq"],
    ],
  },
  {
    h: "Resources",
    links: [
      ["Help center", "/help"],
      ["Getting started", "/help/get-started"],
      ["Walkthroughs", "/blog"],
      ["FAQ", "/faq"],
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

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" aria-label="Proscene home">
              <span className="brand-mark">
                <BrandMark id="pslogo-foot" />
              </span>
              <span className="brand-name">
                Pro<em>scene</em>
              </span>
            </Link>
            <p className="footer-blurb">
              The one place your show lives. Calls, calendar, script, blocking, and
              reports, shared by the cast, the crew, and the creative team.
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
        </div>
      </div>
    </footer>
  );
}
