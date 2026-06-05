import type { Metadata } from "next";
import "./pricing.css";
import { PRICING_HTML } from "./content";
import { PricingInteractions } from "./pricing-interactions";

export const metadata: Metadata = {
  title: "Pricing — ProScene",
  description:
    "Pay for the shows you run. No per-seat fees — invite the whole company at no extra cost. Start free, upgrade when you load in.",
};

export default function PricingPage() {
  return (
    <>
      <div data-page="pricing" dangerouslySetInnerHTML={{ __html: PRICING_HTML }} />
      <PricingInteractions />
    </>
  );
}
