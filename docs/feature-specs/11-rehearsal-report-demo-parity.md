# Feature Spec: Rehearsal Report — Demo Parity

## Status

**IMPLEMENTED — 2026-05-11.** Sequel to `09-rehearsal-report-overhaul.md`.

Landed across 9 commits on branch `claude/merge-reports-tab-gp3r0`:
1. Migration `rehearsal_report_demo_parity` + Drizzle schema + TS types
   (`49e96e9`)
2. `updateReport` action + `/edit` route shell + restored Edit button
   (`882c172`)
3. Save draft / Distribute status flow with server-side no-revert
   enforcement (`715a46a`)
4. Department notes become rich text via a per-card TipTap modal
   (`a4dd160`)
5. Top summary editors: Call times + breaks, Attendance, Scenes
   worked (`aca0ee5`)
6. Bottom subtab editors: Schedule changes, Line notes, Injuries
   (`b07982e`)
7. Detail view renders every new section behind a client tab
   switcher (`9cc283b`)
8. List view: status pill column + URL-driven filter chips
   (`579ae17`)
9. Email Report dialog → demo modal chrome (`9b20951`)

Original draft 2026-05-11 below.
Brings the rehearsal report data model and UX to full parity with the
HTML demo (`design-reference/jsx/tab-reports.jsx`) so the Reports tab
visual port can land on real data instead of restyling around missing
fields.

## Purpose

The current rehearsal report supports header times, 12 plain-text
department notes, general notes (rich), schedule notes (rich),
next-rehearsal fields, and attachments. The demo additionally tracks:

- Breaks (start / end / kind)
- Attendance counts (present / absent / late) + per-person attendance notes
- Scenes worked (label / pages / time)
- Schedule changes (department / what changed)
- Line notes (character / line / issue)
- Injuries & incidents (who / time / description)
- A `draft → distributed` status with two save buttons
- Rich-text department notes (TipTap modal per department)
- A read-only "view" mode separate from the editor
- Edit-after-distribute for SM + director

We're committing to all of the above before the rest of the UI port
moves on. Cast view redactions and "Rehearsal X of Y" are explicitly
out of scope (see decisions below).

## User story

- As a stage manager, I can fill out a complete rehearsal report —
  times, attendance, scenes worked, dept notes (rich), schedule
  changes, line notes, incidents — and save it as a draft.
- As a director or SM, I can re-open a distributed report and edit
  it later; the changes overwrite in place.
- As anyone with `reports:view`, I can see the full report (no
  redaction). Edit/distribute is gated by `reports:create`.

## Decisions (locked 2026-05-11)

1. **Edit after distribute:** Always allowed for `reports:create` roles.
   No locking, no "revert to draft" step. The timestamp of the last
   edit lives in a new `updated_at` column.
2. **Cast view:** No redaction. Everyone with `reports:view` sees the
   whole report including line notes. Simpler model; matches our
   existing permissions.
3. **Rehearsal X of Y:** Dropped. We render the report number only
   (`R-11`), no "of 36".
4. **Department notes:** Rich text. Dept columns stay `text` but now
   hold sanitized HTML. Reuses the TipTap chrome from general notes,
   wrapped in a per-dept modal that matches the demo.
5. **Edit conflicts:** Last-write-wins. No optimistic locking. If two
   SMs edit simultaneously, the later save overwrites — acceptable
   for a small theatre tool.
6. **Drafts:** Persisted, not session-local. A draft is just a report
   row with `status='draft'`. Visible on the list with a status pill.
7. **Email Report:** Stays. The demo has no equivalent, but it's
   already shipped and useful. Will be restyled separately to use the
   demo modal chrome.
8. **Export PDF:** Demo has it as a button, we do not. Punted to a
   future spec — not blocking demo parity for Reports.

## Data model

### New columns on `rehearsal_reports`

| Column | Type | Notes |
|---|---|---|
| `status` | `text` not null default `'draft'` | Enum-via-check: `'draft'` \| `'distributed'`. |
| `attendance_present` | `integer` not null default `0` | |
| `attendance_absent` | `integer` not null default `0` | |
| `attendance_late` | `integer` not null default `0` | |
| `breaks` | `jsonb` not null default `'[]'` | `Array<{ start: string; end: string; kind: '5-min' \| '10-min' \| 'Meal' }>` |
| `scenes_worked` | `jsonb` not null default `'[]'` | `Array<{ label: string; pages: string; time: string }>` |
| `schedule_changes` | `jsonb` not null default `'[]'` | `Array<{ who: string; what: string; c?: string }>` |
| `attendance_notes` | `jsonb` not null default `'[]'` | `Array<{ who: string; note: string }>` |
| `line_notes` | `jsonb` not null default `'[]'` | `Array<{ who: string; line: string; issue: string }>` |
| `injuries` | `jsonb` not null default `'[]'` | `Array<{ who: string; time: string; text: string }>` |
| `distributed_at` | `timestamptz` nullable | Set when status flips to `distributed`. |
| `updated_at` | `timestamptz` not null default `now()` | Bumped on every update. |

Dept columns (`dept_scenery`, `dept_props`, …, `dept_other`) keep
their `text` type. New writes hold sanitized HTML; existing plain
text continues to render correctly through the same `RichRender`.

### Migration

Single migration `rehearsal_report_demo_parity`, applied via
Supabase MCP `apply_migration`. All new columns are nullable or
have defaults, so existing rows backfill cleanly. No data
transformation required for the dept columns — old plain text
remains valid HTML-when-rendered.

## Server actions

Module: `features/reports/actions.ts`.

- `createReport(_prev, formData)` — extended to accept all new fields
  and `status` (`draft` | `distributed`). Auto-increments
  `reportNumber` only when status is `distributed` for the first time
  (drafts get a number too, but the increment rule is unchanged
  since drafts also live on the same table).
- `updateReport(_prev, formData)` — new. Loads the report, checks
  `reports:create` + production membership (same as create), upserts
  all fields. Bumps `updated_at`. If `status` flips from `draft` to
  `distributed`, sets `distributed_at`.
- `revalidatePath` calls cover `/productions/[slug]/reports` and
  `/productions/[slug]/reports/[reportId]` after both actions.

### Validation (`features/reports/validation.ts`)

Extended `validateReportForm` to:
- Parse the new integers (default 0, must be ≥ 0)
- Parse JSONB arrays from form fields (one hidden input per array,
  serialized JSON). Form components build the JSON client-side.
- Validate `status` is one of the two allowed values.
- General notes is no longer strictly required for drafts; it is
  required to **distribute**.

## Routes / pages

- `/productions/[slug]/reports` — list view, restyled in commit
  `313043f`. Will gain a status pill column (`Draft` / `Distributed`)
  and a filter chip row (All / Drafts / Distributed) once the data
  exists.
- `/productions/[slug]/reports/new` — create. Renders the full demo
  editor (header card, 3-col summary, bottom subtabs).
- `/productions/[slug]/reports/[reportId]` — read-only detail view,
  ported in commit `e52abdd`. Will gain the demo's bottom-tabbed
  sections (department notes / schedule changes / line notes /
  injuries) and the full summary cards (call times, attendance,
  scenes worked).
- `/productions/[slug]/reports/[reportId]/edit` — **new route.**
  Wraps the same `<ReportEditor>` component used by `/new`, prefilled
  with existing data. Gated by `reports:create` + production
  membership. Available regardless of status.

The editor and viewer are separate components, both server-rendered
shells that hand off to client components for interactive sections
(attendance editor, dept-note modals, subtab switcher).

## Components

New / changed:
- `features/reports/types.ts` — TypeScript types for the JSON
  arrays (`Break`, `SceneWorked`, `ScheduleChange`, `LineNote`,
  `Injury`, `AttendanceNote`, `ReportStatus`).
- `app/(app)/productions/[slug]/reports/_components/report-editor.tsx`
  — shared client component used by both `/new` and `/edit`. Takes a
  `mode: 'create' | 'edit'` prop plus initial data.
- `app/(app)/productions/[slug]/reports/_components/dept-note-modal.tsx`
  — TipTap-in-a-modal, matches the demo's `RichEditorModal`.
- `app/(app)/productions/[slug]/reports/_components/attendance-editor.tsx`
  — counts + per-person notes editor.
- `app/(app)/productions/[slug]/reports/_components/repeatable-list.tsx`
  — small generic for the scenes/breaks/schedule/lines/injuries
  arrays. Each list has its own row UI; this just handles add/remove.
- `app/(app)/productions/[slug]/reports/[reportId]/edit/page.tsx` —
  the new edit route. Loads the report, checks permission, renders
  `<ReportEditor mode="edit" initial={…} />`.
- Detail page extended with the demo's bottom subtabs and the new
  summary cards.
- List page extended with status pill + filter chips.

## Permissions

Unchanged:
- `reports:view` — admin, producer, director, choreographer, SM,
  cast, crew.
- `reports:create` — admin, producer, director, choreographer, SM.
  Used for create **and** edit.

No new capabilities introduced (no cast-view restriction).

## UX flow

1. SM clicks "New report" → `/reports/new`. Editor opens with today's
   date, status pill `New draft`, all summary cards empty, bottom
   subtabs empty.
2. SM fills the form. The dept notes section shows the demo's
   bordered cards; clicking one opens a TipTap modal.
3. SM has two buttons:
   - **Save draft** — `createReport` with `status='draft'`. Redirects
     to detail view; status pill reads `Draft`.
   - **Distribute** — `createReport` with `status='distributed'`.
     Same redirect; pill reads `Distributed`; `distributed_at` is
     set. Email-on-distribute is **not** automatic — the existing
     Email Report button stays the trigger for emails.
4. From the detail view, SM/director clicks **Edit** → `/edit`
   route, which renders the same editor prefilled. Save updates in
   place via `updateReport`.

## Edge cases & risks

- **Sanitization of dept HTML.** Same `dangerouslySetInnerHTML` risk
  already documented in `CLAUDE.md`. Mitigation deferred along with
  the existing general-notes risk.
- **JSONB shape drift.** Validation is duck-typed in `validation.ts`;
  bad shapes are coerced to `[]` rather than rejecting the form.
  Acceptable for a small tool.
- **Concurrent edits.** Last write wins. If this becomes a real
  problem we add a `version` integer and 409 on mismatch.
- **Backfill.** Existing reports get `status='draft'` by default.
  We'll need a one-line UPDATE in the migration to set
  `status='distributed'` for all pre-existing rows so they don't all
  suddenly show as drafts. Decision: mark all existing reports as
  `distributed` with `distributed_at = created_at`.
- **`reportNumber` for drafts.** A draft consumes the next number,
  same as a distributed report. If a draft is deleted later, the
  number is not reclaimed (gaps are acceptable — matches normal
  numbering).
- **Delete:** Currently we don't expose delete. Out of scope here;
  drafts that need to disappear can be filtered out by the user
  manually or addressed in a follow-up.

## Manual test checklist

- [ ] Migration applies cleanly; existing reports show as
      `Distributed` with `distributed_at = created_at`.
- [ ] New report → Save draft creates row with `status='draft'`,
      visible in list with Draft pill.
- [ ] New report → Distribute creates row with `status='distributed'`
      and a populated `distributed_at`.
- [ ] Each demo section is editable: breaks add/remove, attendance
      counts + notes add/remove, scenes worked add/remove, schedule
      changes add/remove, line notes add/remove, injuries add/remove.
- [ ] Dept notes open a TipTap modal; saving populates the card with
      rendered HTML.
- [ ] Editing an existing report from `/edit` round-trips all fields
      correctly.
- [ ] Permissions: cast/crew see Edit hidden; SM/director see Edit.
- [ ] Filter chips on the list view (All / Drafts / Distributed)
      filter correctly.
- [ ] Email Report button still works on distributed reports (smoke
      test only).
- [ ] No type errors on `npx tsc --noEmit`.

## Sequencing

Suggested commit order on `claude/merge-reports-tab-gp3r0`:

1. **Migration + schema + types.** Add the columns, regenerate
   Drizzle schema, add the TS types. No UI changes; existing tests
   still pass. Backfill existing rows to `distributed`.
2. **`updateReport` action + `/edit` route shell.** Wire the action
   and a stub edit page that renders today's form prefilled. Add the
   Edit button back to the detail page.
3. **Form extension: status + Save/Distribute buttons + draft pill.**
   No new sections yet — just the status flow.
4. **Form extension: dept-note rich-text modal.** Migrates dept
   textareas to clickable cards opening a TipTap modal.
5. **Form extension: summary cards (breaks, attendance, scenes).**
   Adds the 3 top cards as fully interactive editors.
6. **Form extension: bottom subtabs (schedule, lines, injuries).**
   Adds the tabbed bottom section.
7. **Detail view extension.** Renders all new sections in read-only
   form, including the bottom subtabs.
8. **List view extension.** Adds Draft/Distributed pill and the
   filter chips.
9. **Email Report dialog → demo modal chrome.** Last item from the
   original todo list; folds in naturally now that the rest of the
   tab matches the demo.

Each step is independently shippable: it leaves the app in a working
state where SM can still file and view reports.

## Open questions

- Should we expose a "Revert to draft" affordance later? Currently
  not in scope; reopen if SMs hit a wall.
- Do we eventually want a `signed_by` / countersigned-by field for
  legal/contract reasons? Out of scope for this spec.
- Demo's attendance notes are very free-form; do we eventually want
  to link `who` to a real `production_membership` row? Likely yes,
  but JSON-of-strings is the right starting point.

## Architecture notes to preserve

- All new fields ride on the existing `rehearsal_reports` table.
  No child tables yet — JSONB is fine for arrays this small.
- Editor is a single client component reused by `/new` and `/edit`,
  with `mode` and `initial` props. Server actions stay separate
  (`createReport`, `updateReport`).
- Validation continues to live in `features/reports/validation.ts`
  with a single entry point.
- Dept-note rich text reuses the existing `RichTextEditor` (TipTap)
  rather than a second editor implementation.
