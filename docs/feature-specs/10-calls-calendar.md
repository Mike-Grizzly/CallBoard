# Feature Spec: Call Schedule Calendar (Step 12)

**Status:** IMPLEMENTED (2026-05-08)

## Purpose

Give stage managers and directors a single place to plan the full rehearsal schedule weeks out, and keep the production dashboard header always pointing at the next call — transitioning to "live" during the call window and advancing to the next scheduled call after it ends.

## Roles

| Role | Can view calendar | Can create/edit/delete calls |
|------|------------------|------------------------------|
| admin, producer, director, choreographer, stage_manager | ✓ | ✓ (`reports:create`) |
| cast, crew | ✓ | ✗ |

## Routes

| Route | Description |
|-------|-------------|
| `/productions/[slug]/calls` | Month calendar + upcoming list |
| `/productions/[slug]/calls?month=YYYY-MM` | Navigate to a specific month |
| `/productions/[slug]/calls/new` | Create call form |
| `/productions/[slug]/calls/new?date=YYYY-MM-DD` | Create call with date pre-filled |
| `/productions/[slug]/calls/[callId]/edit` | Edit or delete a call |

## Schema

`calls` table (additions in this step):

| Column | Type | Notes |
|--------|------|-------|
| `end_time` | `text` (nullable) | `"HH:MM"` 24-hour string, same format as `call_time` |

## Status computation (server-side, at render time)

| Condition | Status |
|-----------|--------|
| `callDate > today` | `upcoming` |
| `callDate == today`, no times set | `upcoming` (shows as Today's Call on header) |
| `callDate == today`, `callTime <= now`, `endTime > now` (or null) | `live` |
| `callDate == today`, `endTime <= now` | `past` (skipped by `getNextCall`) |
| `callDate < today` | `past` |

Status is not stored — it is derived from `call_time`, `end_time`, and the current server time on every render. No cron job required.

## Calendar UI

- 7-column CSS grid (Sun–Sat)
- Each cell: day number, call chips, hover `+` to schedule (SM only)
- Call chip colours: blue-tinted = upcoming, orange = live, muted = past
- Month navigation links (`?month=` param) — no client-side state required
- Legend row below grid

## Dashboard header states

| State | Badge | Colour |
|-------|-------|--------|
| Live (in window) | "Live · In Rehearsal" + pulse dot | Orange (`#c4572a`) |
| Today, not started | "Today's Call" | Amber |
| Future date | "Upcoming Call" | Muted white |
| No call scheduled | Empty-state CTA | — |

End time shown as "until HH:MM AM/PM" under the start time when set.

## Key files

| File | Role |
|------|------|
| `db/schema/calls.ts` | Schema with `endTime` |
| `features/calls/queries.ts` | `getNextCall` (time-aware), `getAllCallsForProduction`, `getUpcomingCalls` |
| `features/calls/actions.ts` | `createCall`, `updateCall`, `deleteCall` — all redirect to `/calls` |
| `app/(app)/productions/[slug]/calls/page.tsx` | Calendar page (server component) |
| `app/(app)/productions/[slug]/calls/new/page.tsx` | Accepts `?date=` search param |
| `app/(app)/productions/[slug]/calls/new/call-form.tsx` | Form with `end_time` field + `prefillDate` prop |
| `app/(app)/productions/[slug]/calls/[callId]/edit/page.tsx` | Edit page |
| `app/(app)/productions/[slug]/calls/[callId]/edit/delete-call-button.tsx` | Client component for delete (confirm dialog) |
| `app/(app)/productions/[slug]/page.tsx` | Dashboard header updated for live status |

## Known limitations

- Status is computed at page render time — the header won't flip from "upcoming" to "live" without a page reload. Real-time would require Supabase Realtime or polling.
- Calendar shows all calls for a production across all time; there is no archive/hide-past toggle.
- No recurring call support (e.g. "every Tuesday 7–10pm for 8 weeks").
