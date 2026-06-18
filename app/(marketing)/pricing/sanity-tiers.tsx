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

/**
 * Sanity-driven COMPANIES tier cards. Markup matches the static company tiers in
 * content.ts so the billing toggle in pricing-interactions.tsx works the same:
 * priceProduction maps to the monthly amount and priceAnnual to the annual one,
 * with noteProduction / noteAnnual as the monthly / annual sub-labels.
 */
export function SanityTiers({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="tiers">
      {tiers.map((t) => {
        // Billing-toggle data attributes (read by pricing-interactions.tsx),
        // only emitted when an annual price exists.
        const priceProps: Record<string, string> = t.priceAnnual
          ? {
              "data-amt-monthly": t.priceProduction ?? "",
              "data-amt-annual": t.priceAnnual,
            }
          : {};
        const perProps: Record<string, string> = t.priceAnnual ? { "data-per": "" } : {};
        const subProps: Record<string, string> = t.noteAnnual
          ? {
              "data-sub-monthly": t.noteProduction ?? "",
              "data-sub-annual": t.noteAnnual,
            }
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
            <div className="tier-sub" {...subProps}>
              {t.noteProduction ?? ""}
            </div>
            <Link className={t.featured ? "btn primary" : "btn"} href={t.ctaHref || "/signup"}>
              {t.ctaLabel || "Start 60-day trial"}
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
  );
}
