import type { PricingTier, PricingFeature } from "@/lib/sanity/queries";
import { SanityTiers } from "@/app/(marketing)/pricing/sanity-tiers";

/**
 * Builder adapter for the pricing tier grid.
 *
 * Builder edits a repeatable list of tiers (a `list` input); this maps each one
 * into the `PricingTier` shape and renders the *real* `SanityTiers` grid. A
 * stable `_id` is synthesized per row since Builder list items have no id.
 *
 * Note: the monthly/annual billing toggle is driven by the separate client
 * `PricingInteractions` component on the real /pricing page. It isn't wired into
 * this POC page, so the toggle is inert here — the cards still render exactly as
 * built. Wiring the toggle in is a follow-up if the POC moves forward.
 */
type TierInput = {
  name?: string;
  description?: string;
  priceProduction?: string;
  priceAnnual?: string;
  period?: string;
  noteProduction?: string;
  noteAnnual?: string;
  flag?: string;
  featured?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  features?: PricingFeature[];
};

export type PricingTiersBlockProps = {
  tiers?: TierInput[];
};

export function PricingTiersBlock({ tiers = [] }: PricingTiersBlockProps) {
  const mapped: PricingTier[] = tiers.map((t, i) => ({
    _id: `builder-tier-${i}`,
    name: t.name ?? "",
    description: t.description,
    priceProduction: t.priceProduction,
    priceAnnual: t.priceAnnual,
    period: t.period,
    noteProduction: t.noteProduction,
    noteAnnual: t.noteAnnual,
    flag: t.flag,
    featured: t.featured,
    ctaLabel: t.ctaLabel,
    ctaHref: t.ctaHref,
    features: t.features,
  }));
  return <SanityTiers tiers={mapped} />;
}
