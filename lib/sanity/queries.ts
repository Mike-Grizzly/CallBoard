import { draftMode } from "next/headers";
import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient, getSanityPreviewClient } from "./client";

// Hard ceiling on any single Sanity fetch. Without it, an unreachable CMS makes
// the request blackhole and server rendering of a Sanity-backed marketing page
// hangs for minutes (M10) — ISR only masks this until a revalidate misses. On a
// healthy CDN a query returns in well under this, so the signal never fires;
// when Sanity is down the fetch aborts fast and each caller's try/catch falls
// back to the static content that already exists for every page.
const SANITY_TIMEOUT_MS = 3000;

// Single read path for every marketing query. Normal visitors hit the published
// CDN with ISR (revalidate 60). When Draft Mode is on — i.e. the editor opened
// the page from the Studio's Presentation tool — we switch to the preview
// client so drafts + Visual Editing overlays show, and skip the cache so each
// keystroke-saved draft is fresh. draftMode() is read inside a try/catch
// because it throws outside a request scope (e.g. during static generation),
// where preview is never wanted anyway.
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
  const signal = AbortSignal.timeout(SANITY_TIMEOUT_MS);
  if (preview) {
    return getSanityPreviewClient().fetch<T>(query, params, { signal });
  }
  return sanityClient.fetch<T>(query, params, {
    next: { revalidate: 60 },
    signal,
  });
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
