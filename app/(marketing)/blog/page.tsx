import type { Metadata } from "next";
import { stegaClean } from "@sanity/client/stega";
import "./blog.css";
import { BlogInteractions } from "./blog-interactions";
import { getAllPosts, type PostCard } from "@/lib/sanity/queries";
import { SanityBlogIndex } from "./sanity-blog-index";
import { BLOG_POSTS } from "./posts";

export const metadata: Metadata = {
  title: "Blog & Walkthroughs · Proscene",
  description:
    "Notes from the prompt desk: walkthroughs, stage-management craft, and product updates, written by people who've held the book.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

// The ported static posts, mapped to the Sanity card shape (no cover image, so
// they render the placeholder ghost). Merged with Sanity below.
const STATIC_CARDS: PostCard[] = BLOG_POSTS.map((p) => ({
  _id: `static-${p.slug}`,
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt,
  category: p.category,
  author: "The Proscene team",
  publishedAt: p.dateISO,
  readTime: p.readTime,
}));

export default async function BlogPage() {
  // Show Sanity posts AND the ported static posts together. Sanity wins per
  // slug: if a post with the same slug is published in Studio, its version is
  // used and the static copy drops out — so recreating these in Sanity later
  // supersedes them with no duplicates. Sanity's newest post stays featured.
  const sanityPosts = await getAllPosts();
  const sanitySlugs = new Set(sanityPosts.map((p) => stegaClean(p.slug)));
  const posts = [
    ...sanityPosts,
    ...STATIC_CARDS.filter((p) => !sanitySlugs.has(p.slug)),
  ];

  return (
    <>
      <div data-page="blog">
        <SanityBlogIndex posts={posts} />
      </div>
      <BlogInteractions />
    </>
  );
}
