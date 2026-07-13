import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../help.css";
import { DOC_SECTIONS, getSection } from "../content";
import { JsonLd } from "../../_components/json-ld";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const s = getSection(section);
  if (!s) return {};
  return {
    title: `${s.title} · Proscene Help`,
    description: s.description,
    alternates: { canonical: `/help/${s.slug}` },
  };
}

export default async function DocsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const s = getSection(section);
  if (!s) notFound();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Help", item: `${SITE_URL}/help` },
      { "@type": "ListItem", position: 2, name: s.title, item: `${SITE_URL}/help/${s.slug}` },
    ],
  };

  return (
    <div data-page="docs">
      <JsonLd data={breadcrumb} />
      <div className="wrap docs-article-wrap">
        <nav className="docs-breadcrumb" aria-label="Breadcrumb">
          <Link href="/help">Help</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{s.title}</span>
        </nav>

        <h1 className="docs-h1">{s.title}</h1>
        <p className="docs-lede">{s.blurb}</p>

        {s.overview.map((b) => (
          <section className="docs-block" key={b.heading}>
            <h2>{b.heading}</h2>
            <div className="docs-prose" dangerouslySetInnerHTML={{ __html: b.body }} />
          </section>
        ))}

        <section className="docs-block">
          <h2>Guides in this section</h2>
          <div className="docs-toc">
            {s.pages.map((p) => (
              <Link className="docs-toc-item" key={p.slug} href={`/help/${s.slug}/${p.slug}`}>
                <strong>{p.title}</strong>
                <span>{p.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="docs-cta-strip">
          <p>
            New here? Your first production is free — a 60-day full-access trial, no card required.
          </p>
          <div className="docs-cta-row">
            <Link className="btn primary sm" href="/signup">
              Start free
            </Link>
            <Link className="btn-link" href={s.featureHref}>
              {s.featureLinkLabel ?? "See the feature"}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
