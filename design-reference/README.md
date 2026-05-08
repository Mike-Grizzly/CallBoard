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
  - `shell.jsx` — Rail (left nav), ProductionHeader (topbar + tabs),
    NotificationsPopover.
  - `app-entry.jsx` — top-level App that wires shell + tabs + tweaks.
  - `tab-overview.jsx` — Production dashboard ("Today's call" hero).
  - `tab-reports.jsx` — Rehearsal Reports list/view/edit.
  - `tab-notes.jsx` — Notes / To-dos workspace.
  - `tab-documents.jsx` — Shared files.
  - `tab-blocking.jsx` — Stage blocking drag-and-drop.
  - `tab-video.jsx` — Rehearsal video player with timestamped notes.
  - `rich-text-editor.jsx` — Lightweight RTE used by notes and reports.
  - `icons.jsx` — Lucide-style outline icon set used by the demo.
  - `mock-data.jsx` — Hardcoded productions, ME, notifications, etc.
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
- Geist + Newsreader come from Google Fonts via `next/font`, not from the
  demo's bundled woff2 blobs.
- `--accent` in this codebase now means **curtain crimson** (the demo's
  brand color), not "soft hover surface". Components that want a soft hover
  surface should use `--muted` (a.k.a. `--bg-muted`).
