import type { Metadata } from "next";
import "./pricing.css";
import {
  PRICING_HTML,
  PRICING_HERO_HTML,
  PRICING_REST_HTML,
} from "./content";
import { PricingInteractions } from "./pricing-interactions";
import { getPricingTiers } from "@/lib/sanity/queries";
import { SanityTiers } from "./sanity-tiers";

export const metadata: Metadata = {
  title: "Pricing — Proscene",
  description:
    "Pay for the shows you run. No per-seat fees — invite the whole company at no extra cost. Start free, upgrade when you load in.",
};

export const revalidate = 60;

export default async function PricingPage() {
  const tiers = await getPricingTiers();

  return (
    <>
      <div data-page="pricing">
        {tiers.length > 0 ? (
          <>
            <div dangerouslySetInnerHTML={{ __html: PRICING_HERO_HTML }} />
            <SanityTiers tiers={tiers} />
            <div dangerouslySetInnerHTML={{ __html: PRICING_REST_HTML }} />
          </>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: PRICING_HTML }} />
        )}
      </div>
      <PricingInteractions />
    </>
  );
}
