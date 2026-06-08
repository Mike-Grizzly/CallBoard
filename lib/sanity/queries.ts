import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./client";

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  readTime?: string;
  coverImage?: SanityImageSource;
};

export type Post = PostCard & {
  body?: PortableTextBlock[];
};

const CARD_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  author,
  publishedAt,
  readTime,
  coverImage
`;

// All fetches are wrapped so a missing/empty/unreachable Sanity project never
// breaks the page — the blog falls back to its static content instead.
export async function getAllPosts(): Promise<PostCard[]> {
  try {
    const posts = await sanityClient.fetch<PostCard[]>(
      `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {${CARD_FIELDS}}`,
      {},
      { next: { revalidate: 60 } },
    );
    return posts ?? [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const post = await sanityClient.fetch<Post | null>(
      `*[_type == "post" && slug.current == $slug][0] {${CARD_FIELDS}, body}`,
      { slug },
      { next: { revalidate: 60 } },
    );
    return post ?? null;
  } catch {
    return null;
  }
}
