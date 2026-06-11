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

Entry point: a **Generate** button in the calendar toolbar, shown only on the
production-scoped calendar (`scopedSlug` set) for users with `canEdit`. The
generate page links to template management; the templates list links back to
generate (per template).

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
| `app/(app)/productions/[slug]/calls/generate/{page,generate-form}.tsx` | Generate flow |
| `app/(app)/calendar/calendar-client.tsx` | "Generate" toolbar entry (scoped calendar only) |

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
- Single-call creation (the slide-in tray) does **not** yet offer a template
  picker — template application currently flows through the Generate page (a
  one-day range = one call). Adding a picker to the shared `CallForm` is a
  fast-follow.
- Not browser-verified yet.
