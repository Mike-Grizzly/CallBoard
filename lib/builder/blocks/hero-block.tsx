import type { HomePage } from "@/lib/sanity/queries";
import { SanityHero } from "@/app/(marketing)/sanity-hero";

/**
 * Builder adapter for the marketing hero.
 *
 * It exposes flat, editor-friendly fields to Builder and assembles them into the
 * `HomePage` shape the *real* `SanityHero` component already renders — so what an
 * editor drags onto a Builder page is pixel-identical to the hand-built hero,
 * with no duplicated markup. (`SanityHero` is the single source of truth for the
 * hero UI; this is purely a prop adapter.)
 */
export type HeroBlockProps = {
  eyebrow?: string;
  /** Wrap a phrase in *asterisks* to render it in the amber accent. */
  headline?: string;
  subhead?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  note?: string;
};

export function HeroBlock(props: HeroBlockProps) {
  const home: HomePage = {
    heroEyebrow: props.eyebrow,
    heroHeadline: props.headline,
    heroSubhead: props.subhead,
    primaryCtaLabel: props.primaryCtaLabel,
    primaryCtaHref: props.primaryCtaHref,
    secondaryCtaLabel: props.secondaryCtaLabel,
    secondaryCtaHref: props.secondaryCtaHref,
    heroNote: props.note,
  };
  return <SanityHero home={home} />;
}
