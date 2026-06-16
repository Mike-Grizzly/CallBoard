# 21 — Onboarding Walkthroughs (Coachmark Tours)

**Status:** Built 2026-06-16 (branch `claude/tender-carson-u08lyc`). Not browser-verified.

## Goal

Help new users get oriented without reading docs or guessing. The first time a
user lands on a key screen, a "tour guide" series of spotlight pop-ups walks
them through what's there. Tours are replayable from Settings for refreshers or
new teammates.

## Behaviour

- **Spotlight coachmarks** — the screen dims, one real UI element is highlighted
  with a ring, and a tooltip card explains it (Back / Next / Skip + step count).
- **Auto-start once per screen.** A tour runs the first time its screen is
  reached and never again, unless replayed.
- **Replay from Settings → Walkthroughs.** "Replay all walkthroughs" clears the
  seen state and reopens the dashboard tour; per-screen links force a single
  tour via `?tour=1`.
- **Role-aware for free.** Steps point at `data-tour` anchors; capability-gated
  UI simply isn't in the DOM for roles that lack it, so those steps are skipped
  with no role logic in the tour.
- **Keyboard:** Esc skips, →/Enter advances, ← goes back. Clicking the dimmed
  area advances.

## Screens covered (first pass)

| Tour key | Screen | Anchors |
|---|---|---|
| `dashboard` | `/dashboard` | greeting, status chips, today/focal hero, sidebar productions, settings link |
| `productions` | `/productions` | heading, "new production", production cards |
| `production-hub` | `/productions/[slug]` | show title/status, section tabs, quick actions |

(`/productions/new` — the wizard — intentionally has no tour.)

## Implementation

- **Schema:** `profiles.tours_seen text[] not null default '{}'` (migration
  `add_tours_seen_to_profiles`, applied via Supabase MCP — not `db:push`).
  Surfaced on `CurrentUser.toursSeen` in `lib/auth.ts`.
- **`features/tours/steps.ts`** — pure constants: `TourStep`/`TourDefinition`,
  the three tour definitions, `REPLAYABLE_TOURS`, and `resolveTour(pathname)`.
  NOT a `"use server"` file (constants there cause hydration errors).
- **`features/tours/actions.ts`** — `markTourSeen(key)` (idempotent array
  append) and `resetAllTours()`.
- **`components/tour/coach-tour.tsx`** — the spotlight engine (portal to body;
  box-shadow dim + ring; tooltip placement with viewport clamping; tracks the
  anchor on scroll/resize; drops steps whose anchor is absent).
- **`components/tour/tour-controller.tsx`** — pathname-aware orchestration:
  auto-start when unseen, force-replay on `?tour=1` (param stripped after),
  persist on close. Mounted once in `app/(app)/layout.tsx`.
- **`app/(app)/(default)/settings/tour-replay.tsx`** — the Settings card.
- **CSS:** `.tour-*` block in `app/globals.css` (z-index 1400–1402, above the
  confirm dialog).

## Manual test steps

1. As a fresh user, open `/dashboard` → the dashboard tour auto-starts. Step
   through it; it shouldn't reappear on reload.
2. Visit `/productions` and a production hub → each tours once.
3. Settings → Walkthroughs → "Replay all walkthroughs" → dashboard tour replays;
   revisiting productions/hub re-tours them.
4. Sign in as a `cast` user on a hub: leadership-only quick-action steps (e.g.
   "New report") are skipped rather than highlighting nothing.
5. Resize / scroll during a step — the spotlight should track its element.

## Known gaps / follow-ups

- Desktop-first: the dashboard anchors live in the desktop command center, so
  the dashboard tour is a no-op at phone widths (steps with no anchor are
  skipped). A mobile-specific tour isn't built.
- No per-tour replay for the hub from Settings (no slug there) — covered by
  "Replay all" re-showing it on next hub visit.
- Anchors are coarse (sections, not individual buttons); can be refined later.
