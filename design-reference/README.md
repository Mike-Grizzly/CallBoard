# Design Reference — CallBoard standalone HTML mockup

Source of truth for the UI port. Extracted from the standalone HTML demo
(`dea72e3c-CallBoardstandalone.html`) the user supplied.

The demo was a Babel-standalone single-file React app rendering a
"Stage Manager perspective on Pirates of Penzance" mockup with all data
hardcoded in `window.DATA`. We are **not** wiring up the demo as-is — we
re-implement it as Next.js Server Components bound to the real Drizzle/Supabase
data layer, while matching the demo's visuals closely.

## Layout

- `styles/demo-styles.css` — full CSS from the demo's `<style>` block.
  Tokens, reset, app shell (rail + topbar + tabs), buttons, pills, fields,
  cards, notifications popover. Copy fragments from here into
  `app/globals.css` as we port each tab.
- `jsx/` — the demo's React components, transpiled by Babel-standalone at
  load time. They use globals (`window.I`, `window.DATA`, `window.Shell`)
  which we replace with real imports during port.
  - `shell.jsx` — Rail (left nav — now with workspace/production/people
    view switching + a new-production trigger), ProductionHeader
    (topbar + tabs), NotificationsPopover.
  - `app-entry.jsx` — top-level App that wires shell + tabs + tweaks.
    Now also carries a workspace/production/people view switcher and the
    new-production menu/quick-add/overlay state.
  - `new-production.jsx` — 6-step New Production setup wizard (basics,
    calendar, departments, roles, team, review). Runs standalone or as an
    in-app overlay. NOT yet ported — see note below.
  - `quick-add.jsx` — Quick Add modal (title + opening date), the
    new-production menu popover, and the full-screen overlay wrapper for
    the wizard.
  - `people.jsx` — workspace-level People directory: table/grid views,
    filters, person drawer, and the 3-path Add People modal (manual, CSV
    upload, bulk paste wizard). Backed by `data-people.jsx`.
  - `tab-overview.jsx` — Production dashboard ("Today's call" hero).
  - `tab-reports.jsx` — Rehearsal Reports list/view/edit.
  - `tab-notes.jsx` — Notes / To-dos workspace.
  - `tab-documents.jsx` — Shared files.
  - `tab-blocking.jsx` — Stage blocking drag-and-drop.
  - `tab-video.jsx` — Rehearsal video player with timestamped notes.
  - `rich-text-editor.jsx` — Lightweight RTE used by notes and reports.
  - `icons.jsx` — Lucide-style outline icon set used by the demo.
  - `mock-data.jsx` — Hardcoded productions, ME, notifications, etc.
  - `data-people.jsx` — Org-level people directory mock data (ORG_ROLES,
    PERMISSIONS, PRONOUNS, PEOPLE, ALL_PRODUCTIONS). Backs the demo's
    PeoplePage, which lands in a later batch.
  - `tweaks-panel.jsx` — Dev-only theme/density tweaker (NOT being ported).

## Port status

Detailed roadmap and per-tab checklist live in `docs/ui-port-roadmap.md`.
Short version:

- [x] Step 1: tokens, fonts, reset, shell layout primitives ported into
  `app/globals.css`. Geist + Newsreader added via `next/font/google`.
- [x] Step 2: rail shell (`components/app-shell/rail.tsx`) and persistent
  production header + tabs (`app/(app)/productions/[slug]/layout.tsx` +
  `production-tabs.tsx`) replace the old topbar/sidebar.
- [ ] Step 3: per-tab content port, wired to real `queries.ts`/`actions.ts`.
  - [ ] Overview (call card already matches; surrounding sections pending)
  - [ ] Calls
  - [ ] Reports
  - [ ] Notes
  - [ ] Documents
  - [ ] Blocking
  - [ ] Daily Log
  - [ ] Announcements
  - [ ] Top-level dashboard, productions list, settings, auth screens
  - (no Video tab — we don't have that feature yet)

## Notes / non-goals

- Do NOT port the Tweaks panel — it's a dev-time theme switcher we don't need.
- The "Video" tab maps to no current backend; skip until a feature exists.
- The New Production wizard (`new-production.jsx`) collects far more than
  the current backend supports (departments, roles, team invites, rehearsal
  pattern). It is a *feature*, not a pure reskin — port it under its own
  feature spec, separate from the visual overhaul.
- Geist + Newsreader come from Google Fonts via `next/font`, not from the
  demo's bundled woff2 blobs.
- `--accent` in this codebase now means **curtain crimson** (the demo's
  brand color), not "soft hover surface". Components that want a soft hover
  surface should use `--muted` (a.k.a. `--bg-muted`).
