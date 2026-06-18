import Link from "next/link";
import { stegaClean } from "@sanity/client/stega";
import type { PostCard } from "@/lib/sanity/queries";
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
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

function Cover({ url, label, accent }: { url: string | null; label: string; accent?: boolean }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="ph" src={url} alt="" style={{ objectFit: "cover" }} />;
  }
  return <div className="ph" {...(accent ? { "data-accent": "" } : {})} data-label={label} />;
}

export function SanityBlogIndex({ posts }: { posts: PostCard[] }) {
  const [featured, ...rest] = posts;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">The Proscene blog</span>
          <h1 className="display" style={{ marginTop: 18, fontSize: "clamp(34px,5vw,58px)" }}>
            Notes from the <em>prompt desk.</em>
          </h1>
          <p className="lede lede-narrow" style={{ marginTop: 18 }}>
            Walkthroughs, stage-management craft, and the occasional opinion about call
            times, written by people who&apos;ve held the book.
          </p>
        </div>
      </section>

      {featured && (
        <section className="section-tight">
          <div className="wrap">
            <Link className="feat-post reveal" href={`/blog/${stegaClean(featured.slug)}`}>
              <Cover
                url={urlForImage(stegaClean(featured.coverImage))?.width(900).height(675).url() ?? null}
                label="cover"
                accent
              />
              <div className="body">
                <div className="meta">
                  {featured.category && (
                    <span className="pill" data-c={catColor(featured.category)}>
                      {featured.category}
                    </span>
                  )}
                  {featured.readTime && <span className="read">{featured.readTime}</span>}
                </div>
                <h2>{featured.title}</h2>
                {featured.excerpt && <p>{featured.excerpt}</p>}
                <span className="btn-link" style={{ display: "inline-flex" }}>
                  Read the walkthrough <Arrow />
                </span>
                <div className="by" style={{ marginTop: 14 }}>
                  {[featured.author, fmtDate(featured.publishedAt)].filter(Boolean).join(" · ")}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="section" style={{ paddingTop: 8 }}>
          <div className="wrap">
            <div className="posts reveal">
              {rest.map((p) => (
                <Link key={p._id} className="post" href={`/blog/${stegaClean(p.slug)}`}>
                  <Cover
                    url={urlForImage(stegaClean(p.coverImage))?.width(640).height(400).url() ?? null}
                    label={p.title}
                  />
                  <div className="body">
                    <div className="meta">
                      {p.category && (
                        <span className="pill" data-c={catColor(p.category)}>
                          {p.category}
                        </span>
                      )}
                      {p.readTime && <span className="read">{p.readTime}</span>}
                    </div>
                    <h3>{p.title}</h3>
                    {p.excerpt && <p>{p.excerpt}</p>}
                    <div className="by">
                      {[p.author, fmtDate(p.publishedAt)].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
