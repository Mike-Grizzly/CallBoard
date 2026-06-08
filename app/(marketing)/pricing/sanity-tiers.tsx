import Link from "next/link";
import type { PricingTier } from "@/lib/sanity/queries";

const Tick = () => (
  <span className="tick">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  </span>
);
const Cross = () => (
  <span className="tick">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  </span>
);

export function SanityTiers({ tiers }: { tiers: PricingTier[] }) {
  return (
    <section className="section" style={{ paddingTop: 36 }}>
      <div className="wrap">
        <div className="tiers reveal">
          {tiers.map((t) => {
            // Data attributes drive the per-production ↔ annual billing toggle
            // (pricing-interactions.tsx) — only emitted when an annual value exists.
            const priceProps: Record<string, string> = t.priceAnnual
              ? { "data-price": "", "data-production": t.priceProduction ?? "", "data-annual": t.priceAnnual }
              : {};
            const perProps: Record<string, string> = t.priceAnnual ? { "data-per": "" } : {};
            const noteProps: Record<string, string> = t.noteAnnual
              ? { "data-note": "", "data-production": t.noteProduction ?? "", "data-annual": t.noteAnnual }
              : {};
            const featProps: Record<string, string> = t.featured ? { "data-feat": "" } : {};

            return (
              <div className="tier" key={t._id} {...featProps}>
                {t.flag && <span className="tier-flag">{t.flag}</span>}
                <div className="tier-name">{t.name}</div>
                {t.description && <div className="tier-desc">{t.description}</div>}
                <div className="tier-price">
                  <span className="amt" {...priceProps}>
                    {t.priceProduction}
                  </span>
                  {t.period && (
                    <span className="per" {...perProps}>
                      {t.period}
                    </span>
                  )}
                </div>
                <div className="tier-sub" {...noteProps}>
                  {t.noteProduction ?? ""}
                </div>
                <Link className={t.featured ? "btn primary" : "btn"} href={t.ctaHref || "/signup"}>
                  {t.ctaLabel || "Start free"}
                </Link>
                <ul className="tier-list">
                  {(t.features ?? []).map((f, i) => (
                    <li key={i} className={f.included === false ? "off" : undefined}>
                      {f.included === false ? <Cross /> : <Tick />} {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="center kicker" style={{ marginTop: 26 }}>
          Students &amp; educators get Company free.{" "}
          <Link
            className="btn-link"
            href="/contact?reason=school"
            style={{ display: "inline-flex", verticalAlign: "middle" }}
          >
            Verify your school{" "}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </p>
      </div>
    </section>
  );
}
