import type { Metadata } from "next";
import "./blog.css";
import { BLOG_HTML } from "./content";
import { BlogInteractions } from "./blog-interactions";
import { getAllPosts } from "@/lib/sanity/queries";
import { SanityBlogIndex } from "./sanity-blog-index";

export const metadata: Metadata = {
  title: "Blog & Walkthroughs · Proscene",
  description:
    "Notes from the prompt desk: walkthroughs, stage-management craft, and product updates, written by people who've held the book.",
};

// Sanity-backed once posts exist; falls back to the static demo content until
// then, so the page never breaks before the CMS is populated.
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getAllPosts();
  return (
    <>
      <div data-page="blog">
        {posts.length > 0 ? (
          <SanityBlogIndex posts={posts} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: BLOG_HTML }} />
        )}
      </div>
      <BlogInteractions />
    </>
  );
}
