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
    const rows = await sanityClient.fetch<Testimonial[]>(
      `*[_type == "testimonial"] | order(featured desc, order asc, _createdAt asc) {
        _id, quote, author, role, avatar, featured
      }`,
      {},
      { next: { revalidate: 60 } },
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
    const rows = await sanityClient.fetch<CompanyLogo[]>(
      `*[_type == "companyLogo"] | order(order asc, name asc) { _id, name, logo }`,
      {},
      { next: { revalidate: 60 } },
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
    const rows = await sanityClient.fetch<FaqItem[]>(
      `*[_type == "faqItem"] | order(order asc, _createdAt asc) {
        _id, question, answer, category
      }`,
      {},
      { next: { revalidate: 60 } },
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
    const rows = await sanityClient.fetch<PricingTier[]>(
      `*[_type == "pricingTier"] | order(order asc, _createdAt asc) {
        _id, name, description, priceProduction, priceAnnual, period,
        noteProduction, noteAnnual, flag, featured, ctaLabel, ctaHref,
        features[]{ text, included }
      }`,
      {},
      { next: { revalidate: 60 } },
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
