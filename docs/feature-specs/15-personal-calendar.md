# Feature Spec: Personal Calendar (Step 15)

**Status:** IMPLEMENTED (2026-05-19)

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
| `/calendar?view=month\|week` | Switch view |
| `/calendar?date=YYYY-MM-DD` | Anchor the visible window on a date |
| `/calendar?productions=id1,id2` | Filter to a subset of productions |

## Schema

`productions` table — new column:

| Column | Type | Notes |
|--------|------|-------|
| `color` | `text` (nullable) | One of the palette values defined in `features/productions/constants.ts` |

Migration: `pnpm db:push` after pulling. The column is nullable, so existing
rows fall back to a deterministic hash-based color (`fallbackColorForId`).

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

## Views

### Month grid

- 7-column grid covering full weeks from the first-of-month back to Sunday
  and the last-of-month forward to Saturday
- Cells outside the current month are dimmed (`bg-[color:var(--muted)]/30`)
- Past dates: `opacity-60`
- Today: clay-filled circle around day number
- Call chips: left border-stripe in production color, time line, production
  title (small caps), focus line; live calls get a pulse dot + ring

### Week view

- 7-column day grid (current week, Sun–Sat)
- Each day is a vertical stack of call cards
- Each card shows production color dot, time range, focus/location
- Empty days show "No calls" italic placeholder

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
| `app/(app)/(default)/calendar/page.tsx` | Server component, view + filter + nav |
| `app/(app)/(default)/calendar/month-grid.tsx` | Month grid + chip |
| `app/(app)/(default)/calendar/week-view.tsx` | Week grid + card |
| `app/(app)/(default)/calendar/production-filter.tsx` | URL-driven filter chips |
| `app/(app)/(default)/calendar/utils.ts` | Date helpers + status |
| `app/(app)/productions/new/create-production-form.tsx` | Swatch picker on create |
| `app/(app)/productions/production-list.tsx` | Color dot before title |
| `components/app-shell/rail.tsx` | Sidebar dot now reads `production.color` |
| `components/app-shell/nav-items.ts` | "Calendar" entry between Dashboard and Reports |
| `components/ui/icon.tsx` | `CalendarDays` icon added |

## Known limitations / out of scope

- **No edit UI for production color.** Color is set at creation time only.
  Existing productions get the deterministic-hash fallback until someone
  adds an "Edit production" page (none exists in the codebase yet).
- **No hour grid in week view.** Calls only store `HH:MM` strings, not full
  timestamps, so the week view shows time-ordered cards per day rather
  than positioning by hour.
- **No real-time refresh** — same caveat as the per-production calendar.
- **Live status indicator is render-time only.** A live call won't flip
  to "past" on screen without a reload.
- **No iCal export / external feed.**
