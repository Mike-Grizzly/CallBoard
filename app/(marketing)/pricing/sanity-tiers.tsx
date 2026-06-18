import Link from "next/link";
import { stegaClean } from "@sanity/client/stega";
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
        // The price/note strings double as data-attribute values that
        // pricing-interactions.tsx parses for the monthly/annual toggle, so they
        // must be stripped of stega markers (which would otherwise corrupt the
        // toggle in preview). Cleaning them also drops their on-page overlay —
        // an acceptable trade for a working toggle; name/description/features
        // keep theirs. ctaHref is cleaned for the same reason links need it.
        const priceProduction = stegaClean(t.priceProduction);
        const priceAnnual = stegaClean(t.priceAnnual);
        const noteProduction = stegaClean(t.noteProduction);
        const noteAnnual = stegaClean(t.noteAnnual);
        const ctaHref = stegaClean(t.ctaHref) || "/signup";

        // Billing-toggle data attributes (read by pricing-interactions.tsx),
        // only emitted when an annual price exists.
        const priceProps: Record<string, string> = priceAnnual
          ? {
              "data-amt-monthly": priceProduction ?? "",
              "data-amt-annual": priceAnnual,
            }
          : {};
        const perProps: Record<string, string> = priceAnnual ? { "data-per": "" } : {};
        const subProps: Record<string, string> = noteAnnual
          ? {
              "data-sub-monthly": noteProduction ?? "",
              "data-sub-annual": noteAnnual,
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
                {priceProduction}
              </span>
              {t.period && (
                <span className="per" {...perProps}>
                  {t.period}
                </span>
              )}
            </div>
            <div className="tier-sub" {...subProps}>
              {noteProduction ?? ""}
            </div>
            <Link className={t.featured ? "btn primary" : "btn"} href={ctaHref}>
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
