import type { Metadata } from "next";
import { stegaClean } from "@sanity/client/stega";
import "./blogpost.css";
import { getBlogPost, renderArticleHtml, BLOG_POSTS } from "../posts";
import { getPostBySlug } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import { SanityBlogPost } from "./sanity-blog-post";
import { JsonLd } from "../../_components/json-ld";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Prerender the static fallback posts. Sanity slugs not listed here still
// render on demand (dynamicParams defaults to true).
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (post) {
    const title = stegaClean(post.seoTitle) || stegaClean(post.title);
    const description =
      stegaClean(post.metaDescription) || stegaClean(post.excerpt);
    const cover = urlForImage(post.coverImage);
    return {
      title: `${title} · Proscene`,
      description,
      alternates: { canonical: `/blog/${stegaClean(post.slug)}` },
      keywords: post.tags?.map((t) => stegaClean(t)),
      openGraph: {
        type: "article",
        title,
        description,
        url: `/blog/${stegaClean(post.slug)}`,
        publishedTime: stegaClean(post.publishedAt),
        images: cover
          ? [{ url: cover.width(1200).height(630).fit("crop").url() }]
          : undefined,
      },
    };
  }
  // Static fallback posts.
  const staticPost = getBlogPost(slug) ?? BLOG_POSTS[0];
  return {
    title: `${staticPost.title} · Proscene`,
    description: staticPost.metaDescription,
    alternates: { canonical: `/blog/${staticPost.slug}` },
    keywords: staticPost.tags,
    openGraph: {
      type: "article",
      title: staticPost.title,
      description: staticPost.metaDescription,
      url: `/blog/${staticPost.slug}`,
      publishedTime: staticPost.dateISO,
    },
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
    const cover = urlForImage(post.coverImage);
    const authorName = stegaClean(post.author) || "The Proscene team";
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: stegaClean(post.title),
      description:
        stegaClean(post.metaDescription) || stegaClean(post.excerpt),
      datePublished: stegaClean(post.publishedAt),
      keywords: post.tags?.map((t) => stegaClean(t)).join(", "),
      image: cover ? [cover.width(1200).url()] : undefined,
      author:
        authorName === "The Proscene team"
          ? { "@type": "Organization", name: authorName, url: SITE_URL }
          : { "@type": "Person", name: authorName },
      publisher: {
        "@type": "Organization",
        name: "Proscene",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
      },
      mainEntityOfPage: `${SITE_URL}/blog/${stegaClean(post.slug)}`,
    };
    return (
      <div data-page="blogpost">
        <JsonLd data={articleSchema} />
        <SanityBlogPost post={post} />
      </div>
    );
  }

  // Static fallback posts (used until the same slug is published in Sanity).
  const staticPost = getBlogPost(slug) ?? BLOG_POSTS[0];
  const staticSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: staticPost.title,
    description: staticPost.metaDescription,
    datePublished: staticPost.dateISO,
    keywords: staticPost.tags.join(", "),
    author: { "@type": "Organization", name: "The Proscene team", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Proscene",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${staticPost.slug}`,
  };
  return (
    <div data-page="blogpost">
      <JsonLd data={staticSchema} />
      <div dangerouslySetInnerHTML={{ __html: renderArticleHtml(staticPost) }} />
    </div>
  );
}
