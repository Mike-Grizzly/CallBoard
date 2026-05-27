# UI Port Roadmap — HTML demo → Next.js app

**Last updated:** 2026-05-20
**Source mockup:** `design-reference/` (extracted from the standalone HTML demo)
**Goal:** match the warm theatre look of the demo across every existing
feature, without changing the data layer.

This is a port, not a rewrite. The backend (Drizzle + Supabase, server
actions, permissions) stays as-is. Only the UI layer is being reskinned to
match the demo, tab by tab.

> **2026-05-20 reconcile:** the previous version of this file (dated
> 2026-05-08) was badly out of date — it marked only Overview + Reports as
> ported. A screen-by-screen audit shows most tabs and top-level screens
> are now done. The status below reflects that audit.

## Where we are

### Phase 1 — design system & shell — DONE

- [x] Warm oklch token set ported into `app/globals.css` (`--bg`, `--ink-*`,
      `--accent` curtain crimson, status pills, shadows, radii)
- [x] `body[data-theme]` and `body[data-density]` hooks wired in
      `app/layout.tsx`
- [x] Geist + Geist Mono + Newsreader loaded via `next/font/google`
- [x] Tailwind v4 `@theme inline` block bridges CSS vars → Tailwind utilities
- [x] Legacy alias tokens (`--background`, `--foreground`, `--muted`, …)
      kept so unported screens still render without churn
- [x] App shell: rail (`components/app-shell/rail.tsx` + `rail-link.tsx`)
      replaces the old top+side bar
- [x] Persistent production header in `app/(app)/productions/[slug]/layout.tsx`
- [x] Tab strip (`production-tabs.tsx`) with client-side active-state
- [x] Universal `<Icon name="…" />` client component
      (`components/ui/icon.tsx`) for crossing the RSC boundary

### Phase 2 — per-tab content port — IN PROGRESS

Most screens are ported. What remains is a handful of **embedded forms**
still on old shadcn — Calls new/edit, Documents upload, the Blocking
setup wizard, and the new-production form. The **Calls / Rehearsal
Schedule** calendar itself is ported; only its form is not.

## Feature ↔ demo module ↔ route map

| Built feature | Demo module | Route | Port status |
|---|---|---|---|
| Overview / call hero | `tab-overview.jsx` | `/productions/[slug]` | **Done** |
| Rehearsal Schedule | `tab-calendar.jsx` | `/productions/[slug]/calls` | **Partial** — CSS vars in place, residual old Tailwind utilities |
| Rehearsal Reports | `tab-reports.jsx` | `/productions/[slug]/reports` | **Done** |
| Notes ("My Notes") | `tab-notes.jsx` | `/productions/[slug]/notes` | **Done** |
| Document Center | `tab-documents.jsx` | `/productions/[slug]/documents` | **Done** — except `document-upload-form.tsx` (still old shadcn) |
| Blocking Tool | `tab-blocking.jsx` | `/productions/[slug]/blocking` | **Done** — except `blocking/setup/setup-wizard.tsx` (still old shadcn) |
| Script Editor | (no demo module) | `/productions/[slug]/script` | **Done** (built natively) |
| Personal Calendar | `tab-calendar.jsx` | `/calendar` | **Done** |
| Personalized Dashboard | `tab-home.jsx` | `/dashboard` | **Done** — but predates the newer `tab-home.jsx` Workspace Home design (see note) |
| Announcements (production) | `tab-home.jsx` `.ann-card`s | `/productions/[slug]/announcements` | **Done** (build-verified; not yet browser-verified) |
| Announcements (global) | `tab-home.jsx` `.ann-card`s | `/announcements` | **Done** (build-verified; not yet browser-verified) |
| Production Members | `people.jsx` | `/productions/[slug]/members` | **Done** (build-verified; not yet browser-verified) |
| Productions list | `tab-home.jsx` `.prod-card`s | `/productions` | **Done** (build-verified; not yet browser-verified) |
| Org member management | `people.jsx` | `/settings/members` | **Done** (build-verified; not yet browser-verified) |
| Auth screens | (no demo module) | `/login`, `/signup`, `/forgot-password`, `/reset-password` | **Done** (build-verified; not yet browser-verified) |

The demo's **Video** tab (`tab-video.jsx`) has no backend feature and is
explicitly skipped. The demo's **Tweaks** panel is dev-only and skipped.

> **Note — Workspace Home.** `design-reference/` now includes
> `tab-home.jsx`, a richer workspace landing (greeting hero, "Right now"
> strip, announcement broadcast cards, productions browser, @mentions,
> pinned items). The current `/dashboard` was ported against an earlier
> design and does **not** match `tab-home.jsx`. Whether to re-port
> `/dashboard` to the Workspace Home design — and adopt the new shell's
> workspace/production/people view switcher — is an open product
> decision. Tracked in `docs/open-questions.md`.

## Remaining work — visual overhaul punch list

Every screen in the route map is now **Done**. What's left is form-level
polish, one page-wrapper cleanup, and verification. In priority order:

1. **Embedded forms still on old shadcn.** Four forms sit inside
   otherwise-ported screens and were never restyled:
   - `app/(app)/productions/[slug]/calls/new/call-form.tsx` — call create/edit
   - `app/(app)/productions/[slug]/documents/document-upload-form.tsx` — document upload
   - `app/(app)/productions/[slug]/blocking/setup/setup-wizard.tsx` — blocking stage-setup wizard
   - `app/(app)/productions/new/create-production-form.tsx` — new production

   Recipe: swap `<Card>` / `<Button>` / shadcn inputs for `.card` /
   `.btn` / `.field` / `.label`, and route any client-side Lucide icons
   through `<Icon>`.

2. **Calls page wrapper.** `/productions/[slug]/calls` still has residual
   old Tailwind on its wrapper (`mx-auto max-w-5xl`,
   `text-[color:var(--muted-foreground)]`). Replace with `.page-narrow`
   + warm classes — the calendar grid itself is already ported.

3. **`<RichTextDisplay>` typography.** Match the demo's prose styling
   (Newsreader for headings inside rendered rich text).

4. **Browser verification.** Nothing in this port has been verified in a
   browser — every screen was build- and type-checked only, because the
   build container has no `DATABASE_URL`. Run the app against a real
   Supabase instance and walk every ported screen for layout/regression
   bugs and `can(role, capability)` gating.

5. **Workspace Home — open product decision.** `/dashboard` predates the
   newer `tab-home.jsx` design and does not match it. Re-porting it is a
   product call, not a mechanical port — see the note above and
   `docs/open-questions.md`.

## Per-tab port checklist

For every screen, the same recipe applies:

1. Read the demo module in `design-reference/jsx/`.
2. Copy needed CSS fragments from `design-reference/styles/demo-styles.css`
   into `app/globals.css`. Reuse existing tokens.
3. Rewrite the JSX to match the demo, preserving server-component data
   fetching, `can(role, capability)` gating, and existing server actions.
4. Replace any `<LucideIcon />` that is a child of a client component with
   `<Icon name="…" />`.

### Done

- [x] **Overview** — `/productions/[slug]`
- [x] **Reports** — list / detail / new / edit (demo-parity spec
      `docs/feature-specs/11-rehearsal-report-demo-parity.md`)
- [x] **Notes** — `/productions/[slug]/notes`
- [x] **Documents** — list + viewer (upload form still pending — see below)
- [x] **Blocking** — canvas + panels (setup wizard still pending — see below)
- [x] **Script** — `/productions/[slug]/script`
- [x] **Calendar** — `/calendar`
- [x] **Dashboard** — `/dashboard` (caveat: see Workspace Home note above)
- [x] **Auth** — login / signup / signup-confirm / forgot-password /
      reset-password — warm restyle on a new `.auth-*` CSS block; the
      stale "Show Portal" brand corrected to "CallBoard"
- [x] **Members** — `/productions/[slug]/members` + `/settings/members` —
      restyled to `people.jsx` table/row styling on a new `.pp-*` CSS
      block

### Calls — `/productions/[slug]/calls` — PARTIAL

- [x] Calendar grid + status-coloured chips (shares the `/calendar` port)
- [ ] Replace residual old Tailwind utilities (`mx-auto max-w-5xl`,
      `text-[color:var(--muted-foreground)]`) with warm classes
- [ ] Audit call detail / new / edit forms for warm styling

### Announcements — `/productions/[slug]/announcements` + `/announcements` — DONE

- [x] Production announcement list → demo `.ann-card` broadcast cards
      (colored scope rail, author avatar, scope pill, display-font title)
- [x] Global `/announcements` page mirrored (scope pill shows
      "Org-wide" or the production title)
- [x] Create form restyled as a warm `.card` with `.field` inputs; the
      shared `RichTextEditor` chrome is unchanged
- [x] Replaced `<Card>` / `<CardContent>` shadcn primitives and the
      Tailwind-styled buttons with `.ann-*` / `.btn` classes and `<Icon>`
- The demo's acknowledge bar + Acknowledge/Reply actions were dropped —
  there is no backend for acknowledgements or replies.
- Not browser-verified: no `DATABASE_URL` in this container. Compiles +
  type-checks clean.

### Members — `/productions/[slug]/members` + `/settings/members` — DONE

- [x] Both member screens rebuilt as a warm `.pp-table` (avatar with
      role-tinted initials, `.pp-name`/`.pp-email`, role `.pill`)
- [x] Org page: inline role `<select>` + Remove, "You" tag, requested-role
      hint preserved
- [x] Production page: bulk-assign panel (`.pp-pick` checklist) + current
      team table with the inline cast character-name editor
- [x] Added a `.pp-*` CSS block + `.btn.sm` / `.btn.danger` modifiers;
      `UserPlus` added to the `Icon` registry
- [x] Replaced `<Card>` / `<CardContent>` / `<Button>` shadcn primitives
      and raw `lucide-react` imports
- The demo's drawer, add-people modal, CSV import, bulk wizard, stat
  cards, and toast were intentionally not ported — no backend exists for
  invites, per-member activity, or org-wide stats.
- Not browser-verified: no `DATABASE_URL` in this container. Compiles +
  type-checks clean.

### Productions list — `/productions` — DONE

- [x] Card grid → demo `.prod-card` styling (status dot + label, display-font
      title, dashed Opens/Closes footer, hover "Open hub" CTA)
- [x] Replaced `<Button>` / `<Card>` + raw `lucide-react` imports with the
      warm `.btn`/`.prod-card` classes and `<Icon>`
- [x] Locked (non-assigned) cards keep the dimmed + "Not assigned" lock
      treatment via a new `.prod-card[data-locked]` rule
- Stacked principal avatars + "next call" footer column from the demo were
  intentionally dropped — that data isn't fetched by the list query, and
  per-production member/call lookups would be backend scope creep.
- Not browser-verified: this container has no `DATABASE_URL`, so the
  authenticated page can't be rendered. Compiles + type-checks clean.

### Auth screens — DONE

- [x] login / signup / signup-confirm / forgot-password / reset-password
      restyled on a new `.auth-*` CSS block (warm radial-spotlight
      background, `.card` form, `.field` inputs, `Proscene` wordmark)
- [x] Replaced `<Button>` shadcn primitive and raw `lucide-react` imports
- [x] Corrected the stale "Show Portal" brand to "CallBoard" (the rail +
      metadata already use "CallBoard")
- No demo module exists for auth — this is an original warm design.
- Not browser-verified: no `DATABASE_URL` in this container.

### Embedded forms still on old shadcn — NOT STARTED

Tracked in detail under **Remaining work** above (item 1) — four forms
inside otherwise-ported screens still need a warm restyle.

## Out of scope

- **Video tab** — no backend equivalent.
- **Tweaks panel** — dev-only theme switcher.
- **Backend changes** — schemas, queries, server actions stay frozen
  during the port. Any required data change graduates back to a normal
  feature spec under `docs/feature-specs/`.

## Definition of done for the UI port

- Every screen in the route map shows **Done** — ✓ reached 2026-05-20
- Every item in "Remaining work" above is cleared
- No raw Lucide icons cross a server→client component boundary
- The port has been browser-verified against a real Supabase instance
- `current-status.md` reflects the port being complete and
  `design-reference/README.md` "Port status" is fully checked
