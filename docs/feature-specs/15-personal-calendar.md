# Feature Spec: Personal Calendar (Step 15)

**Status:** IMPLEMENTED (2026-05-19) · Restyled to match the design-reference `tab-calendar.jsx` (2026-05-19)

## Purpose

Give every user a single cross-production calendar so they can see every
call they're expected at — across all productions they belong to — without
having to drill into each production individually. Stage managers and
admins/producers also get a wider org-level view.

## Roles

| Role | Sees |
|------|------|
| admin, producer | All calls for every production in the org |
| director, choreographer, stage_manager, cast, crew | Calls for productions where they hold a `production_memberships` row |

No new capability — visibility is gated by the membership join. The route
itself requires `requireCurrentUser()`.

## Routes

| Route | Description |
|-------|-------------|
| `/calendar` | Personal calendar (defaults to month view, today) |
| `/calendar?view=month\|week\|day\|agenda` | Switch view |
| `/calendar?date=YYYY-MM-DD` | Anchor the visible window on a date |
| `/calendar?productions=id1,id2` | Filter to a subset of productions |

## Schema

`productions` table — new column:

| Column | Type | Notes |
|--------|------|-------|
| `color` | `text` (nullable) | One of the palette tokens defined in `features/productions/constants.ts` (`"clay"`, `"sage"`, `"dusk"`, `"amber"`, `"plum"`, `"sand"`) |

Migration: applied directly via Supabase MCP (`add_production_color`). The
column is nullable, so existing rows fall back to a deterministic hash-based
token via `fallbackColorTokenForId`. Legacy `"var(--c-...)"` values written
by early builds are normalized at read time.

## Palette

Defined in `features/productions/constants.ts`:

| Token | CSS var |
|-------|---------|
| Clay | `var(--c-clay)` |
| Sage | `var(--c-sage)` |
| Dusk | `var(--c-dusk)` |
| Amber | `var(--c-amber)` |
| Plum | `var(--c-plum)` |
| Sand | `var(--c-sand)` |

`resolveProductionColor({ id, color })` returns the chosen color if set
and valid, otherwise the deterministic fallback.

## Layout

Two-column grid (`.cal`): 248px sidebar + flexible main area. Below 980px
the sidebar hides and the day view collapses to single column.

**Sidebar** (`.cal-side`)
- Mini-month picker (`.mini-month`) — clickable day cells, prev/next month
  buttons that move the cursor; pip dot on dates with events
- Productions filter — checkbox-style swatches; off = transparent fill with
  colored outline, on = fully filled
- Upcoming — 5 next events with spine in production color, weekday/time/title

**Main** (`.cal-main`)
- Toolbar: prev/next/today + display-font period label on the left,
  segmented view switcher (`.seg`) on the right
- Canvas (`.cal-canvas`) — rounded `--radius-l` card with `--shadow-1`,
  hosts the active view, full-height with internal scrolling

## Views

All views render inside `.cal-canvas`. Live "now" indicator computes from
the actual current time at render — no client polling required.

### Month (`.month`)

6×7 grid, full weeks. Today gets an `--accent` filled circle on the day
number. Cells outside the current month muted via `[data-mute="1"]`.
Up to 4 `.month-chip` entries per cell; overflow becomes "+N more" that
jumps to day view. Each chip = colored dot + tabular-numeric time + title.

### Week (`.week`)

60px hour gutter + 7 columns; hour rows at `--hour-px` (44px). Events
positioned absolutely by `(callTime, durMin)`. Today column tinted with
30% of `--accent-soft`. Live "now" line in `--accent` with dot + pill.
Each event uses `--evt-color` (production color) mixed into background
via `color-mix(... 14%, --bg-elev)` and into border at 35%. Short events
(≤45 min) collapse padding.

### Day (`.day`)

Two-column: timeline track on the left (same hour grid as week), 280px
sidebar on the right. Sidebar shows huge display-font date (weekday
eyebrow, big day number, italic month), all-day events, then a list of
that day's calls with spine, time, title, location.

### Agenda (`.agenda`)

3-week window starting at the cursor's week. Each day with events gets a
header row (display-font day number, weekday eyebrow, italic month, "Today"
accent pill) and a list of rows. Each row: 4px spine + monospace time +
title + right-aligned location.

## Production filter

Client component (`production-filter.tsx`). Toggles drive a URL search
param so navigation/back/forward all work. "All" button resets the
selection. Hidden if the user only has one production.

## Status computation

Same time-aware logic as the per-production calendar:

| Condition | Status |
|-----------|--------|
| `callDate > today` | upcoming |
| `callDate < today` | past |
| same day, `endTime <= now` | past |
| same day, `callTime > now` | upcoming |
| otherwise | live |

Live calls show a pulse dot + `ring-[#c4572a]`. No real-time updates —
status is computed at render time.

## Key files

| File | Role |
|------|------|
| `db/schema/productions.ts` | Adds `color` column |
| `features/productions/constants.ts` | Palette + `resolveProductionColor` |
| `features/productions/validation.ts` | Accepts/validates `color` form field |
| `features/productions/actions.ts` | Writes color on create |
| `features/productions/queries.ts` | `getUserProductions` returns color |
| `features/calls/queries.ts` | `getCallsForUserInRange` + `UserCalendarCall` type |
| `app/(app)/calendar/page.tsx` | Server: fetches user, productions, calls window (-45d / +120d) |
| `app/(app)/calendar/calendar-client.tsx` | Client wrapper, toolbar + 4-view switcher + drawer state |
| `app/(app)/calendar/calendar-sidebar.tsx` | Mini-month + production filter + upcoming list |
| `app/(app)/calendar/mini-month.tsx` | Compact month picker with event pips |
| `app/(app)/calendar/week-view.tsx` | Hourly grid with absolutely-positioned events + now-line |
| `app/(app)/calendar/month-view.tsx` | 6×7 grid with chips |
| `app/(app)/calendar/day-view.tsx` | Hour timeline + side list |
| `app/(app)/calendar/agenda-view.tsx` | 3-week grouped list |
| `app/(app)/calendar/event-drawer.tsx` | Right-side details drawer |
| `app/(app)/calendar/utils.ts` | Date helpers + `callToEvent` adapter |
| `app/globals.css` | `.cal-*`, `.week-*`, `.month-*`, `.day-*`, `.agenda-*`, `.mini-*`, `.seg`, `.row`, `.mono` |
| `app/(app)/productions/new/create-production-form.tsx` | Swatch picker on create |
| `app/(app)/productions/production-list.tsx` | Color dot before title |
| `components/app-shell/rail.tsx` | Sidebar dot now reads `production.color` |
| `components/app-shell/nav-items.ts` | "Calendar" entry between Dashboard and Reports |
| `components/ui/icon.tsx` | `CalendarDays` icon added |

## Known limitations / out of scope

- **No edit UI for production color.** Color is set at creation time only.
  Existing productions get the deterministic-hash fallback until someone
  adds an "Edit production" page (none exists in the codebase yet).
- **Data window is fixed at -45 / +120 days from page load.** Far-future
  navigation will show empty results until the page is refreshed.
- **No event types yet.** Demo distinguishes rehearsal/tech/fitting/etc;
  our schema only has calls. Drawer always shows "Rehearsal" as the type
  chip. To enable: add a `kind` column to `calls` + filter in the sidebar.
- **No "New event" CTA from the calendar.** Demo has it; we deferred
  because the picker needs production-of-context. Stage managers can add
  calls from each production's call schedule page.
- **No conflict detection** (e.g., actor double-booked across productions).
- **No real-time refresh** — same caveat as the per-production calendar.
- **No iCal export / external feed.**
