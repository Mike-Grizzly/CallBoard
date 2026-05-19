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

## Views

All four views share the same design vocabulary: warm `--bg-elev` card
surfaces with `--shadow-1`, `--border` outlines, Newsreader display font
for headings, soft-color chips that pick up the production's palette
token via `data-c="clay|sage|dusk|amber|plum|sand"`.

### Month grid (`.cal-month`)

- 7-column grid covering full weeks from the first-of-month back to Sunday
  and the last-of-month forward to Saturday
- Cells outside the current month use `--bg-sunken`; past cells use a
  blend of elev/sunken (`.cal-day-cell--past`)
- Today: `--accent` filled circle around day number
- Call chips (`.cal-chip[data-c=...]`): soft palette background with a 3px
  left border in the production color, time + production title + focus;
  live calls get an `--accent` outline and pulse dot

### Week view (`.cal-week`)

- 7-column day grid (current week, Sun–Sat) with sunken header strip
- Each day is a vertical stack of `.cal-card` items (border-left in
  production color, hover lift)
- Empty days show "No calls" italic placeholder
- Past days dim via `.cal-week-col--past`

### Day view (`.cal-day`)

- Two-column layout (`280px` rail + flex body) above 900px; stacks below
- Left rail: Newsreader-styled date, weekday eyebrow, count summary
- Right body: rows of `96px` time gutter + call detail, divided by
  `--border`; live calls show an inline accent "Live now" line
- Empty state: "Nothing on the schedule for this day."

### Agenda view (`.cal-agenda`)

- Card surface with `120px` date column + rows
- Each date header shows day-of-month in Newsreader display font + short
  weekday eyebrow; today date in `--accent`
- Each row: time gutter + production dot/title + focus + optional Live
  pill on the right
- Default window: today + 30 days (configurable via `AGENDA_LOOKAHEAD_DAYS`)
- Empty state: "No calls in this window."

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
| `app/(app)/(default)/calendar/page.tsx` | Server component, toolbar + 4-view switcher |
| `app/(app)/(default)/calendar/month-grid.tsx` | Month grid + chip |
| `app/(app)/(default)/calendar/week-view.tsx` | Week grid + card |
| `app/(app)/(default)/calendar/day-view.tsx` | Day rail + timeline |
| `app/(app)/(default)/calendar/agenda-view.tsx` | Flat date-grouped list |
| `app/(app)/(default)/calendar/production-filter.tsx` | URL-driven filter chips |
| `app/(app)/(default)/calendar/utils.ts` | Date helpers + status |
| `app/globals.css` | `.cal-*` styles section (month, week, day, agenda, chip, card, filter, toolbar) |
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
