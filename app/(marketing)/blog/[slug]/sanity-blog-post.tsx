import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { Post } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";

const COLORS = ["accent", "amber", "clay", "dusk", "sage", "plum"];
function catColor(cat?: string) {
  if (!cat) return "accent";
  let h = 0;
  for (const c of cat) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
function fmtDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
function initials(name?: string) {
  if (!name) return "PS";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    blockquote: ({ children }) => <div className="pull">{children}</div>,
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-ink)" }}>
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      const url = urlForImage(value)?.width(1200).url();
      if (!url) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img className="ph" src={url} alt={value?.alt || ""} style={{ objectFit: "cover" }} />;
    },
  },
};

export function SanityBlogPost({ post }: { post: Post }) {
  const cover = urlForImage(post.coverImage)?.width(1400).height(600).url() ?? null;

  return (
    <article>
      <header className="art-hero">
        <div className="wrap-narrow">
          <Link className="art-back" href="/blog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M11 18l-6-6 6-6" />
            </svg>{" "}
            Back to the blog
          </Link>
          <div className="art-meta">
            {post.category && (
              <span className="pill" data-c={catColor(post.category)}>
                {post.category}
              </span>
            )}
            {post.readTime && (
              <span className="read mono" style={{ color: "var(--ink-4)" }}>
                {post.readTime}
              </span>
            )}
          </div>
          <h1 className="art-title">{post.title}</h1>
          {post.excerpt && <p className="art-lede">{post.excerpt}</p>}
          <div className="art-byline">
            <span className="av">{initials(post.author)}</span>
            <div>
              <b>{post.author || "The Proscene team"}</b>
              <span>{fmtDate(post.publishedAt)}</span>
            </div>
          </div>
        </div>
        {cover && (
          <div className="wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph art-cover" src={cover} alt="" style={{ objectFit: "cover" }} />
          </div>
        )}
      </header>

      <div className="section">
        <div className="art-body">
          {post.body && <PortableText value={post.body} components={components} />}
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band center reveal">
            <div className="cta-curtain" />
            <div style={{ position: "relative" }}>
              <h2 className="title" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
                Ready to set up <em>your show?</em>
              </h2>
              <p className="lede" style={{ margin: "18px auto 30px", maxWidth: "46ch" }}>
                Ten minutes from now, your company could be confirming their first call.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link className="btn primary lg" href="/signup">
                  Start free
                </Link>
                <Link className="btn ghost lg" href="/features">
                  Tour the features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
