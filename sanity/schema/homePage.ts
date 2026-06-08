import { defineType, defineField } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  description: "Create only ONE of these — it controls the home page hero.",
  fields: [
    defineField({ name: "heroEyebrow", title: "Hero eyebrow", type: "string" }),
    defineField({
      name: "heroHeadline",
      title: "Hero headline",
      type: "string",
      description: "Wrap emphasized words in *asterisks* for the crimson accent style.",
    }),
    defineField({ name: "heroSubhead", title: "Hero sub-headline", type: "text", rows: 3 }),
    defineField({ name: "primaryCtaLabel", title: "Primary button label", type: "string", initialValue: "Start free" }),
    defineField({ name: "primaryCtaHref", title: "Primary button link", type: "string", initialValue: "/signup" }),
    defineField({ name: "secondaryCtaLabel", title: "Secondary button label", type: "string" }),
    defineField({ name: "secondaryCtaHref", title: "Secondary button link", type: "string", initialValue: "/contact?reason=demo" }),
    defineField({ name: "heroNote", title: "Reassurance note", type: "string", description: 'e.g. "Free for your first production · No card required"' }),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
