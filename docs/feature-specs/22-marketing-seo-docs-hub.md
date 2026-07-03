# 22 — Marketing SEO: /help manual + technical SEO foundations

## Purpose

Implements the SEO strategy (`docs/seo/seo-strategy.md`): a public, crawlable
product manual at `/help` that captures high-intent "how do I" searches (shipped at `/docs`, renamed to `/help` same-day for the non-technical audience; permanent redirects in `next.config.ts`), plus
the site-wide technical SEO the strategy calls table stakes (robots, sitemap,
canonical URLs, structured data), and the blog's SEO plumbing in Sanity.

## User story

- A stage manager Googles "how to create a rehearsal report in Proscene" (or a
  generic "rehearsal report software how to") and lands on a docs page that
  answers it, with next steps and a signup CTA.
- An existing user hits an expired invite link, searches the symptom, and finds
  the troubleshooting page with the fix.
- The marketing team publishes blog posts in Sanity with per-post SEO fields;
  posts emit `Article` structured data and appear in the sitemap automatically.

## Status

Implemented (2026-07-02) — build-verified and browser-verified locally
(headless Chromium screenshots of hub, article, and troubleshooting pages;
robots/sitemap/JSON-LD checked via curl on a production build). Not yet
verified on a live deploy. Search Console/Bing setup and sitemap submission
are owner tasks.

## Content model (no database)

Manual content is static, typed TS in the repo — not Sanity, not user input —
so it ships with the code, is reviewed like code, and needs no sanitize path.

- `app/(marketing)/help/content/types.ts` — `DocSection` / `DocPage` types.
  Page kinds: `how-to` (numbered `steps`, emits `HowTo` schema), `concept`
  (`blocks`), `troubleshooting` (`faqs`, emits `FAQPage` schema). All pages
  carry `intro`, `description` (meta), optional `tip`, `nextSteps`, `related`.
- `app/(marketing)/help/content/index.ts` — `DOC_SECTIONS` registry,
  `getSection`/`getPage` helpers, `POPULAR_PAGES` for the hub.
- One content file per section: `get-started`, `productions`, `people`,
  `scheduling`, `reports`, `script`, `blocking`, `troubleshooting`
  (27 pages total). Every product claim in them was verified against the
  feature specs and the actual UI code at authoring time.

## Routes/pages

- `/help` — hub: section cards, most-read articles, support CTA
  (`app/(marketing)/help/page.tsx`).
- `/help/[section]` — section overview: prose blocks + guide list. The
  overview lives at the section index (deliberate deviation from the
  strategy's `/docs/<section>/overview/` sketch — avoids a thin duplicate URL).
- `/help/[section]/[page]` — article: breadcrumb, steps/blocks/faqs, tip
  callout, next steps, related articles, CTA strip. `generateStaticParams` +
  `dynamicParams = false` on both dynamic routes (unknown slugs 404).
- Styling: `app/(marketing)/help/docs.css`, marketing tokens under `.ps-site`.
- Titles follow the site convention: `<Page title> · Proscene Help`.

## Technical SEO (site-wide)

- `app/robots.ts` — allows marketing/blog/docs, disallows app + auth routes;
  points at the sitemap.
- `app/sitemap.ts` — marketing routes + every docs section/page + Sanity blog
  posts (CMS failure degrades to no blog entries, never a build error).
- `lib/site.ts` — `SITE_URL` (`NEXT_PUBLIC_SITE_URL`, falls back to
  `https://www.proscene.app`); `metadataBase` set in the root layout.
- Canonicals on all marketing pages; `openGraph` (type article + cover image)
  on blog posts.
- Structured data via `app/(marketing)/_components/json-ld.tsx`:
  - Home: `Organization` + `SoftwareApplication`
  - Pricing: `SoftwareApplication`
  - FAQ: `FAQPage` (Sanity-backed render path only)
  - Blog posts: `Article` (author = Person unless "The Proscene team")
  - Docs: `BreadcrumbList` everywhere; `HowTo` on how-tos; `FAQPage` on
    troubleshooting pages
- `proxy.ts`: `/help`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`
  added to `PUBLIC_ROUTES` (the last three are Next routes and were being
  redirected to /login for logged-out crawlers).

## Blog SEO plumbing

- `sanity/schema/post.ts` gains `seoTitle`, `metaDescription`, `tags`
  (all optional, with length warnings in the Studio).
- `getPostBySlug` returns them; blog post `generateMetadata` prefers them and
  falls back to title/excerpt. Values are `stegaClean`ed before use in
  metadata/JSON-LD.

## Editorial assets (not shipped to the site)

- `docs/seo/seo-strategy.md` — the strategy document (committed copy).
- `docs/seo/blog-editorial-calendar.md` — 13-post roadmap with keywords,
  meta descriptions, outlines, and required internal links.
- `docs/seo/blog-drafts/01–04-*.md` — publish-ready Phase 1 drafts (rehearsal
  report guide + template, blocking notation guide, tech week checklist,
  rehearsal schedule guide), formatted for pasting into Sanity Studio.

## Permissions

None — everything here is public marketing surface. No new capabilities, no
schema/DB changes (the Sanity schema is CMS config, not the app database).

## Manual test steps

1. Logged out, open `/help` — hub renders with 8 section cards; nav shows
   Help; no login redirect.
2. Open `/help/get-started` → guide list; click through to an article; check
   breadcrumb, numbered steps, tip callout, next steps, related, CTA strip.
3. View source on a how-to article — one `BreadcrumbList` and one `HowTo`
   JSON-LD block; on a troubleshooting page — `FAQPage`.
4. `/robots.txt` and `/sitemap.xml` return 200 logged-out; sitemap lists all
   docs URLs (and blog posts once Sanity is reachable).
5. `/help/bogus` and `/help/get-started/bogus` return 404; `/docs` and `/docs/...` 308-redirect to `/help/...`.
6. In Sanity Studio, a post shows SEO title / Meta description / Tags fields;
   a published post's page source contains `Article` JSON-LD.
7. Mobile (≤640px): article step numbers collapse above the step text; hub
   cards stack.

## Follow-ups / watch out for

- Docs pages have no screenshots yet (strategy wants one per step) — add real
  product screenshots once a stable demo production exists.
- The manual describes the product as of 2026-07-02; feature changes must
  update the matching docs content file (added to session-closeout habits).
- `Organization.sameAs` is empty until social profiles exist; no default OG
  image asset yet (blog posts use their cover image when set).
- Owner tasks: Google Search Console + Bing Webmaster verification, submit
  the sitemap, Google Business Profile, paste Phase 1 drafts into Sanity.
