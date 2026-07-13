import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../help.css";
import { DOC_SECTIONS, getPage } from "../../content";
import { JsonLd } from "../../../_components/json-ld";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_SECTIONS.flatMap((s) =>
    s.pages.map((p) => ({ section: s.slug, page: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; page: string }>;
}): Promise<Metadata> {
  const { section, page } = await params;
  const found = getPage(section, page);
  if (!found) return {};
  return {
    title: `${found.page.title} · Proscene Help`,
    description: found.page.description,
    alternates: { canonical: `/help/${section}/${page}` },
  };
}

// Strip tags for schema text fields (content is our own static HTML).
function plain(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<{ section: string; page: string }>;
}) {
  const { section: sectionSlug, page: pageSlug } = await params;
  const found = getPage(sectionSlug, pageSlug);
  if (!found) notFound();
  const { section, page } = found;

  const url = `${SITE_URL}/help/${section.slug}/${page.slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Help", item: `${SITE_URL}/help` },
      { "@type": "ListItem", position: 2, name: section.title, item: `${SITE_URL}/help/${section.slug}` },
      { "@type": "ListItem", position: 3, name: page.title, item: url },
    ],
  };

  const howTo =
    page.kind === "how-to" && page.steps?.length
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: page.title,
          description: page.description,
          step: page.steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: plain(s.body),
            url: `${url}#step-${i + 1}`,
          })),
        }
      : null;

  const faqSchema =
    page.faqs?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: plain(f.answer) },
          })),
        }
      : null;

  return (
    <div data-page="docs">
      <JsonLd data={breadcrumb} />
      {howTo && <JsonLd data={howTo} />}
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="wrap docs-article-wrap">
        <nav className="docs-breadcrumb" aria-label="Breadcrumb">
          <Link href="/help">Help</Link>
          <span aria-hidden>/</span>
          <Link href={`/help/${section.slug}`}>{section.title}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{page.title}</span>
        </nav>

        <h1 className="docs-h1">{page.title}</h1>
        <div className="docs-lede docs-prose" dangerouslySetInnerHTML={{ __html: page.intro }} />

        {page.steps && page.steps.length > 0 && (
          <ol className="docs-steps">
            {page.steps.map((s, i) => (
              <li key={s.title} id={`step-${i + 1}`}>
                <h2>{s.title}</h2>
                <div className="docs-prose" dangerouslySetInnerHTML={{ __html: s.body }} />
              </li>
            ))}
          </ol>
        )}

        {page.blocks?.map((b) => (
          <section className="docs-block" key={b.heading}>
            <h2>{b.heading}</h2>
            <div className="docs-prose" dangerouslySetInnerHTML={{ __html: b.body }} />
          </section>
        ))}

        {page.tip && (
          <aside className="docs-tip">
            <strong>Hit a snag?</strong>
            <div className="docs-prose" dangerouslySetInnerHTML={{ __html: page.tip }} />
          </aside>
        )}

        {page.faqs && page.faqs.length > 0 && (
          <section className="docs-block">
            {page.faqs.map((f) => (
              <details className="docs-faq" key={f.question}>
                <summary>
                  <h2>{f.question}</h2>
                </summary>
                <div className="docs-prose" dangerouslySetInnerHTML={{ __html: f.answer }} />
              </details>
            ))}
          </section>
        )}

        {page.nextSteps && page.nextSteps.length > 0 && (
          <section className="docs-block">
            <h2>Next steps</h2>
            <div className="docs-next">
              {page.nextSteps.map((l) => (
                <Link className="docs-next-item" key={l.href} href={l.href}>
                  {l.label}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {page.related && page.related.length > 0 && (
          <section className="docs-block docs-related">
            <h2>Related articles</h2>
            <ul>
              {page.related.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <aside className="docs-cta-strip">
          <p>Your first production is free — a 60-day full-access trial, no card required.</p>
          <div className="docs-cta-row">
            <Link className="btn primary sm" href="/signup">
              Start free
            </Link>
            <Link className="btn-link" href={section.featureHref}>
              {section.featureLinkLabel ?? "See the feature"}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
