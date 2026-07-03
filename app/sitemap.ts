import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllPosts } from "@/lib/sanity/queries";
import { DOC_SECTIONS } from "./(marketing)/help/content";

const MARKETING_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/features", priority: 0.9 },
  { path: "/pricing", priority: 0.9 },
  { path: "/blog", priority: 0.8 },
  { path: "/help", priority: 0.8 },
  { path: "/faq", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
  { path: "/signup", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = MARKETING_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    priority: r.priority,
    changeFrequency: "weekly",
  }));

  for (const section of DOC_SECTIONS) {
    pages.push({
      url: `${SITE_URL}/help/${section.slug}`,
      priority: 0.7,
      changeFrequency: "monthly",
    });
    for (const page of section.pages) {
      pages.push({
        url: `${SITE_URL}/help/${section.slug}/${page.slug}`,
        priority: 0.6,
        changeFrequency: "monthly",
      });
    }
  }

  // getAllPosts already swallows Sanity failures and returns [] — an
  // unreachable CMS never breaks sitemap generation.
  const posts = await getAllPosts();
  for (const post of posts) {
    pages.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : undefined,
      priority: 0.7,
      changeFrequency: "monthly",
    });
  }

  return pages;
}
