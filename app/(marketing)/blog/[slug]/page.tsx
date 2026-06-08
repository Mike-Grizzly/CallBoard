import type { Metadata } from "next";
import "./blogpost.css";
import { BLOGPOST_HTML } from "./content";
import { getPostBySlug } from "@/lib/sanity/queries";
import { SanityBlogPost } from "./sanity-blog-post";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (post) {
    return { title: `${post.title} — Proscene`, description: post.excerpt };
  }
  return {
    title: "Set up your first production — Proscene",
    description:
      "A blank screen to your first call going out, step by step. We build a real show and have the whole company confirmed by the end.",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (post) {
    return (
      <div data-page="blogpost">
        <SanityBlogPost post={post} />
      </div>
    );
  }

  // Falls back to the static demo post until Sanity has content.
  return (
    <div data-page="blogpost" dangerouslySetInnerHTML={{ __html: BLOGPOST_HTML }} />
  );
}
