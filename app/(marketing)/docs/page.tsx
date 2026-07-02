import type { Metadata } from "next";
import Link from "next/link";
import "./docs.css";
import { DOC_SECTIONS, POPULAR_PAGES } from "./content";

export const metadata: Metadata = {
  title: "Proscene Help & Manual · Setup guides, how-tos, and troubleshooting",
  description:
    "The Proscene manual: setup guides, feature how-tos, and troubleshooting for stage managers, directors, and theatre companies.",
  alternates: { canonical: "/docs" },
};

export default function DocsHubPage() {
  return (
    <div data-page="docs">
      <section className="page-hero docs-hero">
        <div className="wrap">
          <span className="eyebrow">Proscene Help</span>
          <h1 className="display docs-hero-title">
            The <em>manual.</em>
          </h1>
          <p className="lede lede-narrow">
            Setup guides, feature how-tos, and fixes for the moments something
            doesn&apos;t behave. Written for the person holding the book, and
            for everyone they invited.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="docs-grid">
            {DOC_SECTIONS.map((s) => (
              <Link className="docs-card" key={s.slug} href={`/docs/${s.slug}`}>
                <h2>{s.title}</h2>
                <p>{s.blurb}</p>
                <ul>
                  {s.pages.slice(0, 4).map((p) => (
                    <li key={p.slug}>{p.title}</li>
                  ))}
                </ul>
                <span className="docs-card-more">
                  {s.pages.length} article{s.pages.length === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <h2 className="docs-popular-h">Most-read articles</h2>
          <div className="docs-popular">
            {POPULAR_PAGES.map((p) => (
              <Link className="docs-popular-item" key={p.href} href={p.href}>
                {p.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap-narrow">
          <div className="card card-pad center docs-cta">
            <h2 className="subtitle">Can&apos;t find what you need?</h2>
            <p className="lede">
              Write to us and a human who has held the book will answer.
            </p>
            <div className="docs-cta-row">
              <Link className="btn primary" href="/contact">
                Contact support
              </Link>
              <Link className="btn-link" href="/faq">
                Read the FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
