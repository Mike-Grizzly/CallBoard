import Link from "next/link";
import type { FaqItem } from "@/lib/sanity/queries";

const CATEGORY_ORDER = [
  "Getting started",
  "The company",
  "Features",
  "Billing",
  "Data & privacy",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PL = (
  <svg className="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function SanityFaq({ items }: { items: FaqItem[] }) {
  const byCat = new Map<string, FaqItem[]>();
  for (const it of items) {
    const c = it.category || "Other";
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c)!.push(it);
  }
  const cats = [
    ...CATEGORY_ORDER.filter((c) => byCat.has(c)),
    ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow no-rule" style={{ justifyContent: "center" }}>
            Help
          </span>
          <h1 className="display" style={{ marginTop: 16, fontSize: "clamp(36px,5.4vw,62px)" }}>
            Questions, <em>answered.</em>
          </h1>
          <p className="lede" style={{ margin: "18px auto 0", maxWidth: "50ch" }}>
            Everything stage managers ask before their first show. Can&apos;t find it?{" "}
            <Link href="/contact" style={{ color: "var(--accent-ink)", fontWeight: 500 }}>
              Talk to a human →
            </Link>
          </p>
          <div className="faq-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" id="faqq" placeholder="Search questions…" aria-label="Search FAQ" />
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="faq-layout">
            <aside className="faq-side" aria-label="FAQ categories">
              {cats.map((c, i) => (
                <a key={c} href={`#${slugify(c)}`} className={i === 0 ? "active" : undefined}>
                  {c} <span className="n">{byCat.get(c)!.length}</span>
                </a>
              ))}
            </aside>

            <div className="faq-main">
              <p className="no-results" id="noresults">
                No questions match that search. Try a different word, or{" "}
                <Link href="/contact" style={{ color: "var(--accent-ink)" }}>
                  ask us directly
                </Link>
                .
              </p>

              {cats.map((c) => (
                <div className="faq-group" id={slugify(c)} key={c}>
                  <h2>{c}</h2>
                  {byCat.get(c)!.map((it) => (
                    <details className="qa" key={it._id}>
                      <summary>
                        {it.question}
                        {PL}
                      </summary>
                      <p>{it.answer}</p>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap-narrow">
          <div className="card card-pad center reveal" style={{ padding: "clamp(32px,4vw,48px)" }}>
            <h3 className="subtitle">Still have a question?</h3>
            <p className="lede" style={{ margin: "12px auto 24px", maxWidth: "46ch" }}>
              Our team are former stage managers. Ask us anything, we read every
              message and answer in hours, not days.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn primary" href="/contact">
                Message support
              </Link>
              <Link className="btn" href="/contact?reason=demo">
                Book a walkthrough
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
