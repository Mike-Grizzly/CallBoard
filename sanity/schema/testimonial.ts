import { defineType, defineField } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role / company",
      type: "string",
      description: 'e.g. "PSM · Wellman Theatre"',
    }),
    defineField({
      name: "avatar",
      title: "Photo (optional)",
      type: "image",
      options: { hotspot: true },
      description: "If empty, the author's initials are shown instead.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
      description: "Featured testimonials get the larger dark card.",
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first.",
    }),
  ],
  preview: { select: { title: "author", subtitle: "role" } },
});
