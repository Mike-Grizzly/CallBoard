# Feature Spec: Rehearsal Templates + Schedule Generation (Step 12)

**Status:** IMPLEMENTED (2026-06-11) — branch `claude/relaxed-davinci-rwk788`. Live `call_templates` table created; `tsc`/`eslint` clean. Not yet browser-verified.

## Purpose

Address the calls-calendar known limitation "No recurring call support". Two
linked capabilities:

1. **Saved templates** — a named, reusable set of call defaults (time, location,
   focus, scenes, cast, schedule breakdown, notes) scoped to a production.
2. **Schedule generation** — project a template (or ad-hoc defaults) across a
   date range + selected weekdays to bulk-create calls in one action.

Each generated call is an ordinary `calls` row — individually editable,
deletable, and confirmable exactly as before. Templates are a convenience/seed,
not a live link: editing a template never changes already-generated calls.

## Roles

Same as the calls calendar — `reports:create` (admin, producer, director,
choreographer, stage_manager) may manage templates and generate; cast/crew
cannot. No new capability was added.

## Routes

| Route | Description |
|-------|-------------|
| `/productions/[slug]/calls/templates` | List + manage templates |
| `/productions/[slug]/calls/templates/new` | Create template |
| `/productions/[slug]/calls/templates/[templateId]/edit` | Edit / delete template |
| `/productions/[slug]/calls/generate` | Generate a schedule (optionally seeded by a template) |
| `/productions/[slug]/calls/generate?template=ID` | Generate, prefilled from a template |

Entry point: the **Schedule a call** slide-in tray (opened from the calendar's
"Schedule call" button / FAB) has an animated `One call` / `Repeating` segmented
toggle (`.seg`) at the top. "One call" is the existing single-call form;
"Repeating" swaps in the generator in place — same tray, no navigation. The
standalone `/calls/generate` page is kept for the templates list's per-template
**Generate** deep-link (`?template=ID`) and links back to template management;
the repeat-mode tray also links to template management.

## Schema

New table `call_templates` (production-scoped, mirrors `calls` fields):

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `production_id` | uuid FK → productions | `on delete cascade` |
| `created_by` | uuid FK → profiles | `on delete cascade` |
| `name` | text NOT NULL | template label |
| `call_time`, `end_time` | text nullable | `"HH:MM"` |
| `location`, `focus`, `scenes`, `cast_called`, `schedule`, `notes` | text nullable | call defaults |
| `created_at`, `updated_at` | timestamptz NOT NULL | |

RLS **enabled, no policies** (server-only, accessed via the Drizzle/`DATABASE_URL`
service connection) — matches `call_confirmations` / `script_ocr`. Index on
`production_id`.

> `cast_called` on a template is a free-text field (e.g. "Full Cast",
> "Principals"), not the rich cast-picker used on the single-call form — a
> template has no production cast list bound to it.

## Generation logic (`generateCalls` server action)

- Inputs: `production_id`, `start_date`, `end_date` (`YYYY-MM-DD`), one or more
  `weekdays` (0=Sun … 6=Sat), `skip_existing` (checkbox), and the call default
  fields.
- The submitted form fields are the source of truth; the chosen template only
  seeds the form **client-side**. So the action mirrors `createCall` per date.
- Dates are iterated inclusively in **UTC** (`datesInRange` / `weekdayOf`) so the
  server timezone can't shift which calendar day a date lands on.
- `skip_existing` (default on): dates that already have any call for the
  production in `[start,end]` are skipped.
- Guards: end ≥ start; ≥1 weekday; valid date format; access + billing
  (`assertCanOperate`); **max 200 calls** per generation (runaway guard).
- Inserts all matching dates in a single `db.insert(calls).values([...])`,
  revalidates `/productions/[slug]`, `/productions/[slug]/calls`, `/calendar`,
  and returns `{ success, count }`. The form shows an inline success banner and
  stays mounted so the SM can generate another batch.

## Key files

| File | Role |
|------|------|
| `db/schema/call-templates.ts` | `call_templates` table + types |
| `features/call-templates/queries.ts` | `getTemplatesForProduction`, `getTemplateById` |
| `features/call-templates/actions.ts` | `createTemplate`, `updateTemplate`, `deleteTemplate`, `generateCalls` |
| `app/(app)/productions/[slug]/calls/templates/page.tsx` | Templates list |
| `app/(app)/productions/[slug]/calls/templates/new/{page,template-form}.tsx` | Create (form shared w/ edit) |
| `app/(app)/productions/[slug]/calls/templates/[templateId]/edit/{page,delete-template-button}.tsx` | Edit / delete |
| `app/(app)/productions/[slug]/calls/generate/{page,generate-form}.tsx` | Generate flow (`GenerateForm` has `mode="page"\|"tray"`) |
| `app/(app)/calendar/call-tray.tsx` | One call / Repeating toggle; hosts both forms |
| `features/calls/actions.ts` | `getCallTrayData` also returns the production's templates |

## Manual test steps

1. As an SM, open a production calendar → **Generate** in the toolbar.
2. Templates → **New template**: "Standard weeknight", 19:00–22:00, Studio A,
   focus "Music review", cast "Principals". Save → appears in the list.
3. From the list, click **Generate** on that template → the generate form opens
   prefilled. Pick Tue + Thu, a 6-week range, leave "skip clashes" on →
   **Generate calls** → success banner shows the count; the calls appear on the
   calendar on each Tue/Thu.
4. Re-run the same generation → all days skipped ("Every matching day already
   has a call").
5. Generate with no weekday selected / end before start → validation errors.
6. Edit a generated call (change time) → unaffected by the template. Edit the
   template → existing calls unchanged.
7. Delete a template → calendar calls untouched.
8. As cast/crew → no Generate button; `/calls/generate` and `/calls/templates`
   redirect away.

## Known limitations / follow-ups

- Generation is one weekly pattern per run (pick the weekdays). Bi-weekly /
  "every other week" or per-day time variation needs multiple runs or a follow-up.
- Templates are production-scoped; no cross-production / org-level template library.
- The repeat-mode generator uses plain-text call-default fields (incl. a free-text
  "cast called"), not the single-call form's rich cast picker — generated calls
  are skeletons you flesh out per day. Unifying the field set across both tray
  modes is a possible follow-up.
- Not browser-verified yet.

## Revisions

- **2026-06-11 (same session, follow-up):** moved generation into the
  **Schedule a call** tray behind a `One call` / `Repeating` toggle (removed the
  separate toolbar button); `getCallTrayData` now also returns templates so the
  repeat mode can offer the template picker. Fixed the weekday-chip selected
  state — was `--primary` (a near-black box in light mode, unclear invert in
  dark); now uses the theme-aware accent tint (`--accent-soft` bg /
  `--accent-ink` text / `--accent` border).
