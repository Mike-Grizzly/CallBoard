import type { RegisteredComponent } from "@builder.io/sdk-react";
import { HeroBlock } from "./blocks/hero-block";
import { PricingTiersBlock } from "./blocks/pricing-tiers-block";

/**
 * The ONLY custom components an editor can place on a Builder page in this POC.
 *
 * Security note: registering an explicit allow-list keeps editors to vetted,
 * pre-built React components. It does NOT by itself remove Builder's built-in
 * blocks (including the raw "Custom Code" / HTML block, which is a stored-XSS
 * vector). Disabling those is a Builder *dashboard* setting and is part of the
 * go-live hardening checklist in docs/builder-poc.md — do that before any
 * Builder content is served from a production domain.
 */
export const BUILDER_COMPONENTS: RegisteredComponent[] = [
  {
    component: HeroBlock,
    name: "Hero",
    friendlyName: "Marketing Hero",
    inputs: [
      { name: "eyebrow", type: "string", defaultValue: "Production management" },
      {
        name: "headline",
        type: "string",
        helperText: "Wrap a phrase in *asterisks* for the amber accent.",
        defaultValue: "Run your whole season from *one* calm place",
      },
      { name: "subhead", type: "longText" },
      { name: "primaryCtaLabel", type: "string", defaultValue: "Start free" },
      { name: "primaryCtaHref", type: "string", defaultValue: "/signup" },
      { name: "secondaryCtaLabel", type: "string", defaultValue: "Book a demo" },
      {
        name: "secondaryCtaHref",
        type: "string",
        defaultValue: "/contact?reason=demo",
      },
      { name: "note", type: "string" },
    ],
  },
  {
    component: PricingTiersBlock,
    name: "PricingTiers",
    friendlyName: "Pricing Tiers",
    inputs: [
      {
        name: "tiers",
        type: "list",
        subFields: [
          { name: "name", type: "string", defaultValue: "Company" },
          { name: "description", type: "string" },
          { name: "priceProduction", type: "string", defaultValue: "$49" },
          { name: "priceAnnual", type: "string" },
          { name: "period", type: "string", defaultValue: "/mo" },
          { name: "noteProduction", type: "string" },
          { name: "noteAnnual", type: "string" },
          { name: "flag", type: "string", helperText: "e.g. \"Most popular\"" },
          { name: "featured", type: "boolean", defaultValue: false },
          { name: "ctaLabel", type: "string", defaultValue: "Start 60-day trial" },
          { name: "ctaHref", type: "string", defaultValue: "/signup" },
          {
            name: "features",
            type: "list",
            subFields: [
              { name: "text", type: "string" },
              { name: "included", type: "boolean", defaultValue: true },
            ],
          },
        ],
      },
    ],
  },
];
