import type { Metadata } from "next";
import "./pricing.css";
import {
  PRICING_HTML,
  PRICING_HERO_HTML,
  PRICING_COMPANIES_OPEN_HTML,
  PRICING_COMPANIES_CLOSE_HTML,
  PRICING_INDIVIDUALS_HTML,
  PRICING_REST_HTML,
} from "./content";
import { PricingInteractions } from "./pricing-interactions";
import { getPricingTiers } from "@/lib/sanity/queries";
import { SanityTiers } from "./sanity-tiers";

export const metadata: Metadata = {
  title: "Pricing — Proscene",
  description:
    "Pay for the shows you run, never for the people in them. Unlimited cast and crew on every plan. Season, Repertory, and Company tiers for organizations, plus Proscene Studio for freelance designers and discounted school pricing.",
};

export const revalidate = 60;

export default async function PricingPage() {
  const tiers = await getPricingTiers();

  return (
    <>
      <div data-page="pricing" data-aud="designers">
        {tiers.length > 0 ? (
          <>
            <div dangerouslySetInnerHTML={{ __html: PRICING_HERO_HTML }} />
            <div id="pricing-panels">
              <section
                className="section aud-panel"
                data-aud-panel="companies"
                style={{ paddingTop: "clamp(20px,3vw,30px)" }}
              >
                <div className="wrap">
                  {/* COMPANIES panel: Sanity-driven tiers slot between the
                      lead-in and the shared "rest" (banner, includes, table). */}
                  <div dangerouslySetInnerHTML={{ __html: PRICING_COMPANIES_OPEN_HTML }} />
                  <SanityTiers tiers={tiers} />
                  <div dangerouslySetInnerHTML={{ __html: PRICING_COMPANIES_CLOSE_HTML }} />
                </div>
              </section>
              <div dangerouslySetInnerHTML={{ __html: PRICING_INDIVIDUALS_HTML }} />
            </div>
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
