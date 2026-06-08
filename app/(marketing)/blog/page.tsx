import type { Metadata } from "next";
import "./blog.css";
import { BLOG_HTML } from "./content";
import { BlogInteractions } from "./blog-interactions";

export const metadata: Metadata = {
  title: "Blog & Walkthroughs — Proscene",
  description:
    "Notes from the prompt desk — walkthroughs, stage-management craft, and product updates, written by people who've held the book.",
};

export default function BlogPage() {
  return (
    <>
      <div data-page="blog" dangerouslySetInnerHTML={{ __html: BLOG_HTML }} />
      <BlogInteractions />
    </>
  );
}
