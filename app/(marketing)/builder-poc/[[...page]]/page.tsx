import { Content, fetchOneEntry, getBuilderSearchParams, isPreviewing } from "@builder.io/sdk-react";
import { notFound } from "next/navigation";
import { BUILDER_PUBLIC_API_KEY, BUILDER_PAGE_MODEL } from "@/lib/builder/config";
import { BUILDER_COMPONENTS } from "@/lib/builder/registry";

/**
 * Builder.io proof-of-concept render route.
 *
 * This single catch-all renders Builder "page" content under /builder-poc/* and
 * is the ONLY surface that touches Builder. It is deliberately isolated from the
 * production marketing pages: the in-context visual editor needs to frame this
 * route from builder.io, and next.config.ts scopes that framing exemption to
 * /builder-poc only — every other route keeps the app's strict frame-ancestors
 * 'self' / X-Frame-Options: SAMEORIGIN headers unchanged.
 */

// Preview/editing needs fresh, uncached reads; the POC isn't worth caching.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ page?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuilderPocPage({ params, searchParams }: PageProps) {
  const { page } = await params;
  const sp = await searchParams;
  const urlPath = "/builder-poc" + (page?.length ? `/${page.join("/")}` : "");

  // Builder's helpers want a query object without `undefined` values.
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (value !== undefined) query[key] = value;
  }

  if (!BUILDER_PUBLIC_API_KEY) {
    return (
      <section className="wrap" style={{ padding: "4rem 0", maxWidth: 640 }}>
        <h1 className="display">Builder.io POC</h1>
        <p className="lede">
          Set <code>NEXT_PUBLIC_BUILDER_API_KEY</code> to your Builder Space&apos;s
          public API key (Account Settings → Space) and restart the dev server.
          See <code>docs/builder-poc.md</code> for setup and the go-live hardening
          checklist.
        </p>
      </section>
    );
  }

  const content = await fetchOneEntry({
    apiKey: BUILDER_PUBLIC_API_KEY,
    model: BUILDER_PAGE_MODEL,
    userAttributes: { urlPath },
    options: getBuilderSearchParams(query),
  });

  // When not actively previewing in the editor, a missing entry is a 404.
  if (!content && !isPreviewing(query)) {
    notFound();
  }

  return (
    <Content
      content={content}
      apiKey={BUILDER_PUBLIC_API_KEY}
      model={BUILDER_PAGE_MODEL}
      customComponents={BUILDER_COMPONENTS}
    />
  );
}
