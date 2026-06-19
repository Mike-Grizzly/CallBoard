# Builder.io — visual-editing proof of concept

**Status:** POC / not production. Branch `claude/builderio-poc`. Lives entirely
under the `/builder-poc` route and a Builder Space you control. No production
marketing page or header is changed.

## What this proves

That Builder.io can sit **on top of the existing Next.js codebase** and let a
non-developer drag-and-drop and edit the **real components you already built** —
not a rebuild, not a template. The hero and pricing-tier blocks registered here
render through `app/(marketing)/sanity-hero.tsx` and
`app/(marketing)/pricing/sanity-tiers.tsx`, so what you edit in Builder is
pixel-identical to the hand-built site.

## How it's wired

| Piece | File |
| --- | --- |
| Public API key + model name | `lib/builder/config.ts` |
| Hero adapter (wraps `SanityHero`) | `lib/builder/blocks/hero-block.tsx` |
| Pricing adapter (wraps `SanityTiers`) | `lib/builder/blocks/pricing-tiers-block.tsx` |
| Allow-list of insertable components | `lib/builder/registry.tsx` |
| Render route (catch-all) | `app/(marketing)/builder-poc/[[...page]]/page.tsx` |
| Scoped framing headers | `next.config.ts` |

## Setup (~5 minutes)

1. Create a free account at [builder.io](https://www.builder.io) and a Space.
2. Copy the Space's **public API key**: Account Settings → Space → "Public API Key".
3. Add it to `.env.local` (and to the Vercel **Preview** environment for a
   preview deploy — do **not** add it to Production for the POC):
   ```
   NEXT_PUBLIC_BUILDER_API_KEY=your-public-key
   ```
4. Run `npm run dev`. Visit `/builder-poc` — until a page entry exists in Builder
   you'll get a 404 (expected); with the key unset you'll see a setup message.
5. In Builder, create a **Page** model entry with URL `/builder-poc` (or any path
   under it). In the editor's preview/URL setting, point it at
   `http://localhost:3000/builder-poc` (or your Vercel **preview** URL).
6. In the editor's "Insert" menu you'll find **Marketing Hero** and
   **Pricing Tiers**. Drag them in, edit the fields, publish, and reload
   `/builder-poc`.

## Security posture (why this is safe to trial during the pentest)

- **Isolated route.** Everything is under `/builder-poc`. Production marketing
  pages and their content are untouched.
- **Framing scoped, not loosened globally.** `next.config.ts` keeps
  `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` on every route
  **except** `/builder-poc`, which alone allows `https://*.builder.io` as a frame
  ancestor (so the visual editor can frame it). `object-src 'none'` and
  `base-uri 'self'` remain everywhere.
- **Public key only.** No write/admin Builder credential is in the codebase or
  any `NEXT_PUBLIC_*` var.
- **Components-only allow-list.** Only the two vetted React components above are
  registered.

## Go-live hardening checklist (do ALL before any production domain serves Builder content)

- [ ] **Disable Builder's "Custom Code" / raw HTML block** in the Builder Space
      settings. This is the main stored-XSS vector — editors must be limited to
      registered components. (Code registration alone does **not** remove it.)
- [ ] **Lock down the Builder account:** enforce 2FA/SSO, least-privilege roles,
      and review who can publish.
- [ ] **Add Builder to the vendor/SBOM inventory** and the pentest scope, and
      re-test the framing headers on the production path that will serve Builder.
- [ ] **Decide the publish governance** — Builder publishing bypasses the git PR
      review gate by design; confirm that's acceptable or gate it.
- [ ] **Keep Builder on marketing pages only** — never inside authenticated app
      areas, and never pass it app data/PII.
- [ ] **Wire the pricing billing toggle** (`pricing-interactions.tsx`) into any
      Builder page that uses the Pricing Tiers block (inert in the POC).
- [ ] Re-run the pentest / a security review against the production framing
      config before launch.

## Not in scope for this POC

- The blog stays on Sanity. Builder *can* host a blog (structured Data Models),
  but that's a separate decision — see the chat discussion. Nothing here forecloses it.
- The monthly/annual pricing toggle is inert on the POC page (the client
  enhancer isn't mounted there).
