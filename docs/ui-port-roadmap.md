# UI Port Roadmap — HTML demo → Next.js app

**Last updated:** 2026-05-08
**Source mockup:** `design-reference/` (extracted from the standalone HTML demo)
**Goal:** match the warm theatre look of the demo across every existing
feature, without changing the data layer.

This is a port, not a rewrite. The backend (Drizzle + Supabase, server
actions, permissions) stays as-is. Only the UI layer is being reskinned to
match the demo, tab by tab.

## Where we are

### Phase 1 — design system & shell — DONE

- [x] Warm oklch token set ported into `app/globals.css` (`--bg`, `--ink-*`,
      `--accent` curtain crimson, status pills, shadows, radii)
- [x] `body[data-theme]` and `body[data-density]` hooks wired in
      `app/layout.tsx`
- [x] Geist + Geist Mono + Newsreader loaded via `next/font/google`
- [x] Tailwind v4 `@theme inline` block bridges CSS vars → Tailwind utilities
- [x] Legacy alias tokens (`--background`, `--foreground`, `--muted`, …)
      kept so unported tab content still renders without churn
- [x] App shell: rail (`components/app-shell/rail.tsx` + `rail-link.tsx`)
      replaces the old top+side bar, matching the demo's `.rail` / `.rail-item`
      / `.prod-item` / `.rail-foot` markup
- [x] Persistent production header in `app/(app)/productions/[slug]/layout.tsx`
      — crumbs, italicized show title, status pill, opening/closing dates,
      director, Cast & Crew + New Report buttons
- [x] Tab strip (`production-tabs.tsx`) with client-side `usePathname`
      active-state highlighting; sub-routes (Reports, Notes, Blocking, …)
      now navigate without losing the header
- [x] Universal `<Icon name="…" />` client component
      (`components/ui/icon.tsx`) — required because lucide-react 0.468 uses
      `forwardRef` without `"use client"`, so raw Lucide components can't
      cross the RSC boundary inside `<Link>` children

### Phase 2 — per-tab content port — IN PROGRESS

Every tab page exists and is wired to real data. None of them have been
restyled yet — they still use the old shadcn-style classes inside the new
shell. Phase 2 is purely a visual port: keep queries/actions/permissions,
swap the JSX/CSS to match the demo modules in `design-reference/jsx/`.

## Feature ↔ demo module ↔ route map

| Built feature (current-status.md) | Demo module | Route | Tab port |
|---|---|---|---|
| Step 4: Productions / Dashboard hero | `tab-overview.jsx` | `/productions/[slug]` | Partial — call card lives, surrounding layout still old |
| Step 12: Call Schedule Calendar | (demo's "Today's Call" hero feeds it) | `/productions/[slug]/calls` | Not started |
| Step 5 / 9: Rehearsal Reports | `tab-reports.jsx` | `/productions/[slug]/reports` | Not started |
| Step 8: Announcements | (no dedicated demo tab — overview cards) | `/productions/[slug]/announcements` | Not started |
| Step 6: Document Center | `tab-documents.jsx` | `/productions/[slug]/documents` | Not started |
| Step 5: Daily Log | (folded into `tab-reports.jsx`) | `/productions/[slug]/log` | Not started |
| Step 10: Blocking Tool | `tab-blocking.jsx` | `/productions/[slug]/blocking` | Not started |
| Step 11: Notes | `tab-notes.jsx` | `/productions/[slug]/notes` | Not started |
| Step 4: Personalized Dashboard | (no dedicated demo screen) | `/dashboard` | Not started |
| Step 4: Productions list | (rail + overview entry points) | `/productions` | Not started |
| Step 3: Org member management | (no demo equivalent) | `/settings/members` | Out of scope for the port |

The demo's **Video** tab (`tab-video.jsx`) has no backend feature and is
explicitly skipped. The demo's **Tweaks** panel (`tweaks-panel.jsx`) is a
dev-only theme switcher and is also skipped.

## Per-tab port checklist

For every tab, the same four steps apply. Use them as a recipe.

1. Read the demo module in `design-reference/jsx/tab-*.jsx` — note the
   sections, classes, and visual hierarchy.
2. Copy the necessary CSS fragments out of `design-reference/styles/demo-styles.css`
   into `app/globals.css`. Reuse existing tokens; only add new ones if the
   demo introduces something we don't already have.
3. Rewrite the page's JSX to match the demo, preserving:
   - the existing server-component data fetching
   - the existing `can(role, capability)` gating
   - the existing forms and server actions (just restyle their containers)
4. Replace any `<LucideIcon />` that is a child of a client component
   (`Link`, `Button`, anything `"use client"`) with `<Icon name="…" />`.
   Lucide icons are OK as direct children of DOM elements (`div`, `span`,
   `button`).

### Overview — `/productions/[slug]`

- [x] Persistent production header (now in layout)
- [x] Today's call hero card (already matches demo styling)
- [x] Recent activity list — restyled as demo's grouped feed (notif-ico + title/muted body + relative timestamp)
- [x] Principals/Team section — restyled to match demo's compact list (avatar + name/actor + pill, gap 8)
- [x] Quick stats / counts row — N/A, demo does not include one outside the hero

### Calls — `/productions/[slug]/calls`

- [ ] Month grid restyled with `--c-*` chips and the demo's hover-to-add `+`
- [ ] Upcoming calls list below the calendar
- [ ] Call detail / new / edit forms restyled
- [ ] Replace Lucide icons inside `<Link>` with `<Icon>` (same RSC fix)

### Reports — `/productions/[slug]/reports`

- [ ] List view — adopt the demo's report row styling (number + date +
      author chip)
- [ ] Detail view — port the structured department layout to the demo's
      card/section style
- [ ] New/Edit form — restyle headers, fieldsets, attachment uploader
- [ ] Email Report dialog — restyle recipient picker
- [ ] Replace Lucide icons inside `<Link>` with `<Icon>`

### Notes — `/productions/[slug]/notes`

- [ ] Two-panel layout match (filter rail + editor)
- [ ] Note row styling, pin/visibility/due-date affordances
- [ ] Tag pills using `--c-*` colors + tag manager modal
- [ ] TipTap editor chrome restyled to match the demo's RTE
- [ ] Address pre-existing TS errors (`Editor | null`, color-literal
      narrowing) flagged in current-status.md before next prod build
- [ ] Replace Lucide icons inside `<Link>` with `<Icon>`

### Documents — `/productions/[slug]/documents`

- [ ] Document grid/list restyled with type badges, file size, uploader
- [ ] Upload form restyled
- [ ] Viewer (PDF iframe / image / text) restyled in the demo's frame
- [ ] Replace Lucide icons inside `<Link>` with `<Icon>`

### Blocking — `/productions/[slug]/blocking`

- [ ] Setup wizard (PDF + proscenium calibration) restyled
- [ ] Canvas chrome (toolbar, page controls, ruler toggles) restyled
- [ ] Scene/Beat manager left panel matched to demo styling
- [ ] Set piece library restyled
- [ ] Replace Lucide icons inside `<Link>` with `<Icon>`

### Daily Log — `/productions/[slug]/log`

- [ ] Personal note container restyled
- [ ] "Import from daily log" affordance from the new report form

### Announcements — `/productions/[slug]/announcements`

- [ ] Announcement card list restyled (org-wide badge, pin chip)
- [ ] New/Edit form restyled with TipTap chrome matching notes
- [ ] Global `/announcements` page mirrored

## Cross-cutting cleanups

- [ ] Top-level dashboard `/dashboard` and productions list `/productions`
      are still on the old design — port both to the warm look so the rail
      doesn't dump users into a clashing screen
- [ ] Auth screens (login, signup, reset, verify) — minimal restyle so the
      first impression is consistent
- [ ] Settings pages (`/settings/*`) — restyle in the same minimal pass
- [ ] `<RichTextDisplay>` — keep current rendering but match prose styling
      to the demo's typography (Newsreader for headings)
- [ ] Audit every server-component page for raw Lucide icons inside
      `<Link>` — they hit the same RSC serialization error we just fixed
      on the overview page (see decision-log entry "RSC icon serialization")
- [ ] After each tab port, regression-test tab navigation + permission
      gating to make sure the new shell didn't drop a capability check

## Out of scope

- **Video tab** — `design-reference/jsx/tab-video.jsx` has no backend
  equivalent and isn't on the roadmap.
- **Tweaks panel** — dev-only theme switcher, not being ported.
- **Backend changes** — schemas, queries, server actions stay frozen
  during the port. Any required data change graduates back to a normal
  feature spec under `docs/feature-specs/`.

## Definition of done for the UI port

- Every tab listed above has its checklist boxes ticked
- Top-level routes (dashboard, productions list, settings, auth) match
  the warm theatre look
- No raw Lucide icons cross a server→client component boundary anywhere
- `current-status.md` reflects the port being complete and
  `design-reference/README.md` "Port status" is fully checked
