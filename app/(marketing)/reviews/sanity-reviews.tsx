import Link from "next/link";
import type { Testimonial, CompanyLogo } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
const AV_COLORS = ["#c0563f", "#4f7fb8", "#6bbf7a", "#7d6fb0", "#caa24a"];
function avColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

export function SanityReviews({
  testimonials,
  logos,
}: {
  testimonials: Testimonial[];
  logos: CompanyLogo[];
}) {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow no-rule" style={{ justifyContent: "center" }}>
            Loved by stage managers
          </span>
          <h1 className="display" style={{ marginTop: 16, fontSize: "clamp(36px,5.4vw,62px)" }}>
            From the people
            <br />
            holding the <em>book.</em>
          </h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="masonry reveal">
            {testimonials.map((t) => {
              const av = urlForImage(t.avatar)?.width(96).height(96).url() ?? null;
              return (
                <div key={t._id} className={t.featured ? "rev feat" : "rev"}>
                  <p>{t.quote}</p>
                  <div className="who">
                    {av ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="av" src={av} alt={t.author} style={{ objectFit: "cover" }} />
                    ) : (
                      <span className="av" style={{ background: avColor(t.author) }}>
                        {initials(t.author)}
                      </span>
                    )}
                    <div>
                      <b>{t.author}</b>
                      {t.role && <span>{t.role}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {logos.length > 0 && (
        <section
          className="section-tight"
          style={{
            background: "var(--bg-muted)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="wrap center">
            <p className="trust-label" style={{ marginBottom: 24 }}>
              Productions run on Proscene at
            </p>
            <div className="logos-strip reveal">
              {logos.map((l) => (
                <span className="trust-logo" key={l._id}>
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="cta-band center reveal">
            <div className="cta-curtain" />
            <div style={{ position: "relative" }}>
              <h2 className="title" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
                Join the companies who <em>stopped chasing replies.</em>
              </h2>
              <p className="lede" style={{ margin: "18px auto 30px", maxWidth: "48ch" }}>
                Start free on your next show and see why stage managers don&apos;t go back.
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
    </>
  );
}
