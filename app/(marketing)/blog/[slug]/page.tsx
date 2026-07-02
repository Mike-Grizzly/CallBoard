import type { Metadata } from "next";
import { stegaClean } from "@sanity/client/stega";
import "./blogpost.css";
import { BLOGPOST_HTML } from "./content";
import { getPostBySlug } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import { SanityBlogPost } from "./sanity-blog-post";
import { JsonLd } from "../../_components/json-ld";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

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
  return {
    title: "Set up your first production · Proscene",
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

  // Falls back to the static demo post until Sanity has content.
  return (
    <div data-page="blogpost" dangerouslySetInnerHTML={{ __html: BLOGPOST_HTML }} />
  );
}
