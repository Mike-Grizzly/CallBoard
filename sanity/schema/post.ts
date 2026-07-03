import { defineType, defineField } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The URL path, e.g. /blog/your-slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "Short summary shown on cards and as the page description.",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Walkthrough", value: "Walkthrough" },
          { title: "SM craft", value: "SM craft" },
          { title: "Product", value: "Product" },
          { title: "Company story", value: "Company story" },
        ],
      },
    }),
    defineField({ name: "author", title: "Author", type: "string" }),
    defineField({
      name: "readTime",
      title: "Read time",
      type: "string",
      description: 'e.g. "8 min read"',
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
      description:
        "Overrides the title tag in search results. Include the primary keyword; keep under 60 characters. Falls back to the post title.",
      validation: (rule) => rule.max(70).warning("Keep under 60 characters"),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 2,
      description:
        "Search-result snippet, 120–155 characters, primary keyword + value statement. Falls back to the excerpt.",
      validation: (rule) => rule.max(160).warning("Keep under 155 characters"),
    }),
    defineField({
      name: "tags",
      title: "Tags / target keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Target keywords for this post (used as article keywords).",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "category", media: "coverImage" },
  },
});
