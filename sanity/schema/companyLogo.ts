import { defineType, defineField } from "sanity";

export const companyLogo = defineType({
  name: "companyLogo",
  title: "Customer logo",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Company name",
      type: "string",
      validation: (rule) => rule.required(),
      description: "Shown as text (and used as alt text if you add a logo image).",
    }),
    defineField({
      name: "logo",
      title: "Logo image (optional)",
      type: "image",
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first.",
    }),
  ],
  preview: { select: { title: "name", media: "logo" } },
});
