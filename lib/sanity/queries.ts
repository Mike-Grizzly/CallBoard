import { cookies, draftMode } from "next/headers";
import { resolvePerspectiveFromCookies } from "next-sanity/live";
import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient, getSanityPreviewClient } from "./client";

// Single read path for every marketing query. Normal visitors hit the published
// content with ISR (revalidate 60). When Draft Mode is on — i.e. the editor
// opened the page from the Studio's Presentation tool — we switch to the
// preview client (drafts + overlays) and:
//   - take the perspective from the Studio's Published/Drafts switcher (stored
//     in a cookie by the enable route), defaulting to "drafts", so that switcher
//     is the real control;
//   - force a fresh read (no-store) so each keystroke-saved draft shows.
// draftMode() is read inside a try/catch because it throws outside a request
// scope (e.g. during static generation), where preview is never wanted anyway.
async function loadQuery<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  let preview = false;
  try {
    preview = (await draftMode()).isEnabled;
  } catch {
    preview = false;
  }
  if (preview) {
    const perspective =
      (await resolvePerspectiveFromCookies({ cookies: await cookies() })) ??
      "drafts";
    return getSanityPreviewClient().fetch<T>(query, params, {
      perspective,
      stega: true,
      cache: "no-store",
    });
  }
  return sanityClient.fetch<T>(query, params, { next: { revalidate: 60 } });
}

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
  seoTitle?: string;
  metaDescription?: string;
  tags?: string[];
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
    const posts = await loadQuery<PostCard[]>(
      `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {${CARD_FIELDS}}`,
    );
    return posts ?? [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const post = await loadQuery<Post | null>(
      `*[_type == "post" && slug.current == $slug][0] {${CARD_FIELDS}, body, seoTitle, metaDescription, tags}`,
      { slug },
    );
    return post ?? null;
  } catch {
    return null;
  }
}

export type Testimonial = {
  _id: string;
  quote: string;
  author: string;
  role?: string;
  avatar?: SanityImageSource;
  featured?: boolean;
};

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await loadQuery<Testimonial[]>(
      `*[_type == "testimonial"] | order(featured desc, order asc, _createdAt asc) {
        _id, quote, author, role, avatar, featured
      }`,
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

export type CompanyLogo = {
  _id: string;
  name: string;
  logo?: SanityImageSource;
};

export async function getLogos(): Promise<CompanyLogo[]> {
  try {
    const rows = await loadQuery<CompanyLogo[]>(
      `*[_type == "companyLogo"] | order(order asc, name asc) { _id, name, logo }`,
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

export type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  category?: string;
};

export async function getFaqItems(): Promise<FaqItem[]> {
  try {
    const rows = await loadQuery<FaqItem[]>(
      `*[_type == "faqItem"] | order(order asc, _createdAt asc) {
        _id, question, answer, category
      }`,
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

export type PricingFeature = { text?: string; included?: boolean };
export type PricingTier = {
  _id: string;
  name: string;
  description?: string;
  priceProduction?: string;
  priceAnnual?: string;
  period?: string;
  noteProduction?: string;
  noteAnnual?: string;
  flag?: string;
  featured?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  features?: PricingFeature[];
};

export async function getPricingTiers(): Promise<PricingTier[]> {
  try {
    const rows = await loadQuery<PricingTier[]>(
      `*[_type == "pricingTier"] | order(order asc, _createdAt asc) {
        _id, name, description, priceProduction, priceAnnual, period,
        noteProduction, noteAnnual, flag, featured, ctaLabel, ctaHref,
        features[]{ text, included }
      }`,
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

export type HomePage = {
  heroEyebrow?: string;
  heroHeadline?: string;
  heroSubhead?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  heroNote?: string;
};

export async function getHomePage(): Promise<HomePage | null> {
  try {
    const row = await sanityClient.fetch<HomePage | null>(
      `*[_type == "homePage"][0] {
        heroEyebrow, heroHeadline, heroSubhead,
        primaryCtaLabel, primaryCtaHref, secondaryCtaLabel, secondaryCtaHref,
        heroNote
      }`,
      {},
      { next: { revalidate: 60 } },
    );
    return row ?? null;
  } catch {
    return null;
  }
}
