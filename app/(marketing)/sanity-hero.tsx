import Link from "next/link";
import type { HomePage } from "@/lib/sanity/queries";
import { HOME_HERO_MOCK_HTML } from "./home-content";

// Trusted owner-authored copy. Escape HTML, then turn *asterisks* into the
// crimson accent <em> used across the marketing headlines.
function emphasize(s: string): string {
  const esc = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function SanityHero({ home }: { home: HomePage }) {
  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero-glow" />
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            {home.heroEyebrow && <span className="eyebrow">{home.heroEyebrow}</span>}
            {home.heroHeadline && (
              <h1
                className="display"
                dangerouslySetInnerHTML={{ __html: emphasize(home.heroHeadline) }}
              />
            )}
            {home.heroSubhead && <p className="lede">{home.heroSubhead}</p>}
            <div className="hero-actions">
              <Link className="btn primary lg" href={home.primaryCtaHref || "/signup"}>
                {home.primaryCtaLabel || "Start free"}{" "}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
              {home.secondaryCtaLabel && (
                <Link className="btn lg" href={home.secondaryCtaHref || "/contact?reason=demo"}>
                  {home.secondaryCtaLabel}
                </Link>
              )}
            </div>
            {home.heroNote && (
              <div className="hero-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {home.heroNote}
              </div>
            )}
          </div>

          <div className="hero-media" dangerouslySetInnerHTML={{ __html: HOME_HERO_MOCK_HTML }} />
        </div>
      </div>
    </section>
  );
}
