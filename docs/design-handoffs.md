# Design handoffs — how design drop-offs work

This is the standard for getting a UI/feature design from the owner into the
codebase. Set 2026-06-16. It is durable: every session should follow it without
being re-told.

## The two design locations

| Location | What it is |
|---|---|
| `design-reference/` | The **global, whole-app UI mockup** — the standalone HTML/JSX demo + `demo-styles.css`. Source of truth for overall look & feel. Ported tab-by-tab (see `docs/ui-port-roadmap.md`). |
| `handoff/<feature-name>/` | A **per-feature design drop-off** — one self-contained folder per design (e.g. `handoff/cast-crew-drag-assign/`). This is where new designs land. |

## How the owner drops off a new design

- Create **one folder per design** at `handoff/<feature-name>/` (kebab-case
  name). Don't drop loose files at the repo root or mix designs together.
- **Commit it straight to `main`.** Design files are inert reference material —
  no branch needed for the drop itself.
- Typical contents (all optional except a short README is encouraged):
  - `README.md` — what it is, what it replaces, interaction model, data mapping,
    build notes. See `handoff/cast-crew-drag-assign/README.md` as the template.
  - `prototype/` — a standalone working `.html` to feel the interaction.
  - `jsx/` — demo React components (use `window.I` icons + shared classNames).
  - `styles/` — the CSS block(s) to merge into `app/globals.css`.
  - `images/` — static mockups/screenshots.
- **Status marker:** the first line under the README title should be
  `**Status:** Unprocessed`. As work proceeds a session updates it to
  `In progress — <branch>` then `Implemented — <date> (<PR/branch>)`. A folder
  with no README, or no status line, is treated as **Unprocessed**.

## What a session does with handoffs

1. **Notice, don't auto-build.** On startup (and whenever design work is
   requested), scan `handoff/*/` for folders whose status is not `Implemented`.
   Briefly summarize each unprocessed handoff to the owner. **Do not start
   implementing one unless the owner explicitly asks.**
2. **When asked to implement a handoff:**
   - Branch off `main` (e.g. `feature/<feature-name>` or the session's assigned
     branch).
   - **Recreate** the design using this codebase's existing components, design
     tokens, patterns, and data layer (Drizzle/Supabase server actions). Match
     the design's appearance and behavior closely.
   - Reuse existing primitives rather than forking new ones (e.g. the People
     `pp-drawer`, the app's overlay/sheet, `RichTextEditor`, `Icon`).
   - Test (`tsc`, `eslint`, build), then do the normal docs closeout
     (`docs/dev-rules.md`).
   - Update the handoff's `**Status:**` to `Implemented — <date> (<branch/PR>)`.

## Hard rules

- **Never edit the design files** in `handoff/` or `design-reference/` to match
  the code. They are read-only reference — recreate the design in real code.
- `--accent` is **spotlight amber** (`#E0A23A`) across all three themes — honor
  it in any `.drop`/active-state highlights. (It was curtain crimson in the
  original design-reference port; the brand moved to amber — see
  `docs/branding.md` + decision-log 2026-07-21.) Note: amber is a light colour,
  so text on a filled accent surface is the dark ink (`var(--on-accent)`), never
  white.
- Respect `prefers-reduced-motion`; keep motion to what the prototype shows.
- If a handoff is ambiguous or conflicts with documented architecture, flag it
  to the owner before building (per `session-start.md`).

## Index of handoffs

| Folder | Status |
|---|---|
| `handoff/cast-crew-drag-assign/` | Implemented — 2026-06 (Cast & Crew board) |
