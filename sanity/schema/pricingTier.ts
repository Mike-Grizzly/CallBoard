import { defineType, defineField } from "sanity";

export const pricingTier = defineType({
  name: "pricingTier",
  title: "Pricing tier",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "priceProduction",
      title: "Price (per production)",
      type: "string",
      description: 'e.g. "Free", "$29", or "Custom"',
    }),
    defineField({
      name: "priceAnnual",
      title: "Price (annual, optional)",
      type: "string",
      description: 'e.g. "$23" — shown when the "Annual" toggle is on',
    }),
    defineField({
      name: "period",
      title: "Period",
      type: "string",
      description: 'e.g. "/ production" (leave empty for Free / Custom)',
    }),
    defineField({
      name: "noteProduction",
      title: "Sub-note (per production)",
      type: "string",
      description: 'e.g. "One-time, per show"',
    }),
    defineField({
      name: "noteAnnual",
      title: "Sub-note (annual, optional)",
      type: "string",
    }),
    defineField({
      name: "flag",
      title: "Badge (optional)",
      type: "string",
      description: 'e.g. "Most popular"',
    }),
    defineField({
      name: "featured",
      title: "Highlight this tier",
      type: "boolean",
      initialValue: false,
    }),
    defineField({ name: "ctaLabel", title: "Button label", type: "string", initialValue: "Start free" }),
    defineField({ name: "ctaHref", title: "Button link", type: "string", initialValue: "/signup" }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "text", type: "string", title: "Feature" },
            { name: "included", type: "boolean", title: "Included?", initialValue: true },
          ],
          preview: {
            select: { title: "text", included: "included" },
            prepare({ title, included }) {
              return { title, subtitle: included === false ? "— not included" : "✓ included" };
            },
          },
        },
      ],
    }),
    defineField({ name: "order", title: "Sort order", type: "number" }),
  ],
  preview: { select: { title: "name", subtitle: "priceProduction" } },
});
