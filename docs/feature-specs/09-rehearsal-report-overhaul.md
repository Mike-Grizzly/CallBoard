# Feature Spec: Rehearsal Report Overhaul

## Status

**Planned — not started.**

## Background

The current rehearsal report (Step 5) stores only two free-form TipTap fields: `generalNotes` and `scheduleNotes`. This does not match how professional stage managers actually produce and distribute reports.

The user's current workflow: during rehearsal, the SM fills out a structured department-by-department report, then emails it to the full company after rehearsal.

This overhaul replaces the free-form format with a structured, professional format and adds an email export capability.

## What already exists (do not rebuild)

- **Daily Log** (`production_logs` table, `/productions/[slug]/log`) — personal per-user rich text notes for a production. This already satisfies the "I want a place to keep my own notes" use case. Do not rebuild it.
- **Report attachments** — file attachments on reports already work. Preserve this.
- **Report list and detail pages** — update in place, do not delete.

## User stories

- As a stage manager, I want to fill out a structured report with department-by-department notes during rehearsal, so I can quickly capture who needs what.
- As a stage manager, I want to post that report so the whole team can see it on the production dashboard.
- As a stage manager, I want to copy the report as a formatted email template so I can paste it into Gmail and send it to the company.
- As a cast member, I want to see the latest rehearsal report on my dashboard so I know what was discussed.
- As a director, I want my personal daily log for running notes, separate from the official report that goes to everyone.

## Planned format

Based on professional stage management standards (USITT, Yale SM paperwork, The Complete Stage Manager).

### Header block (structured fields)
- Production name (from production record — auto-populated)
- Report number (auto-incremented per production)
- Report date
- Stage manager name (from current user — auto-populated)
- Scheduled call time
- Actual start time
- End time
- Next rehearsal: date, time, location, what will be covered

### General notes (TipTap rich text)
Free-form summary of the day — what was accomplished, overall tone, anything that doesn't fit a department.

### Department notes (structured rows)
Each department has a single text field. Default display value is "None" when empty.

Standard department list:
- Scenery / Set
- Props
- Costumes
- Hair & Makeup
- Lighting
- Sound
- Sound Effects
- Music
- Choreography
- Video / Projection
- Crew
- Other

**Open question:** Should departments be configurable per production, or fixed for all shows? Fixed is simpler for MVP; configurable is more useful for varied show types. Recommend fixed for MVP, revisit later.

### Attendance (optional for MVP)
Present, absent, excused late. Low priority — can be added in a later pass.

## Email export

A "Copy as Email" button on the report detail page that:
1. Formats the report into a clean plain-text or HTML block
2. Copies it to the clipboard
3. The user pastes it into Gmail/Outlook

**Why not actual sending?** No email service is integrated. A mailto: link won't work for long report bodies. Clipboard copy is the right MVP approach.

Format should resemble the user's existing email format:
- Header with production name, report type, date
- General notes section
- Department rows (skip or show "None" for empty ones)
- Next rehearsal info at the bottom

## Schema changes required

Add columns to `rehearsal_reports`:

| New column | Type | Notes |
|------------|------|-------|
| `report_number` | integer | Auto-incremented per production (not global) |
| `scheduled_call` | text (nullable) | e.g. "7:00 PM" |
| `actual_start` | text (nullable) | e.g. "7:10 PM" |
| `end_time` | text (nullable) | e.g. "10:30 PM" |
| `next_rehearsal_date` | date (nullable) | — |
| `next_rehearsal_time` | text (nullable) | e.g. "7:00 PM" |
| `next_rehearsal_location` | text (nullable) | e.g. "Studio A" |
| `next_rehearsal_notes` | text (nullable) | What will be covered |
| `dept_scenery` | text (nullable) | Department notes |
| `dept_props` | text (nullable) | — |
| `dept_costumes` | text (nullable) | — |
| `dept_hair_makeup` | text (nullable) | — |
| `dept_lighting` | text (nullable) | — |
| `dept_sound` | text (nullable) | — |
| `dept_sound_effects` | text (nullable) | — |
| `dept_music` | text (nullable) | — |
| `dept_choreography` | text (nullable) | — |
| `dept_video` | text (nullable) | — |
| `dept_crew` | text (nullable) | — |
| `dept_other` | text (nullable) | — |

Keep existing `generalNotes` and `scheduleNotes` columns — `scheduleNotes` can be repurposed as the "next rehearsal notes" free text or deprecated.

**Note:** Apply via Supabase SQL Editor (not drizzle-kit push — known hanging issue).

## Report number logic

`report_number` should be set on insert as:
```sql
SELECT COALESCE(MAX(report_number), 0) + 1
FROM rehearsal_reports
WHERE production_id = :productionId
```
Handle this in the server action, not a DB trigger, to keep it simple.

## Routes / pages affected

| Route | Change |
|-------|--------|
| `/productions/[slug]/reports/new` | Replace free-form TipTap with structured form |
| `/productions/[slug]/reports/[reportId]` | Replace rendered HTML with structured layout + "Copy as Email" button |
| `/productions/[slug]/reports` | Add report number to list items |

## Files to create / modify

- `db/schema/rehearsal-reports.ts` — add new columns
- `features/reports/actions.ts` — update createReport to handle new fields + report number logic
- `features/reports/validation.ts` — update validation
- `features/reports/queries.ts` — update to select new columns
- `app/(app)/productions/[slug]/reports/new/page.tsx` — new structured form
- `app/(app)/productions/[slug]/reports/[reportId]/page.tsx` — structured display + copy button
- `app/(app)/productions/[slug]/reports/[reportId]/copy-email-button.tsx` — client component for clipboard copy

## Permissions

No changes to permissions. `reports:create` users (admin, producer, director, stage_manager) can create reports. All members can view.

## Manual test checklist (to be completed after implementation)

- [ ] Create a report — all department fields save correctly
- [ ] Empty department fields display as "None" in the detail view
- [ ] Report number increments correctly within a production (not globally)
- [ ] Report number resets correctly for a new production
- [ ] "Copy as Email" copies a formatted block to clipboard
- [ ] Pasted email template is readable in Gmail
- [ ] Existing report attachments still work
- [ ] Old reports (before overhaul) still display without errors
- [ ] "Import from daily log" button still works on report creation

## Open questions

- Should departments be configurable per production? Fixed for MVP.
- Should `scheduleNotes` be removed or repurposed? Recommend repurposing as `nextRehearsalNotes` or just leaving it alongside the new fields.
- Should attendance tracking be included in this pass? Recommend deferring.
- What should the email template look like exactly? User to review and approve before implementation.
- Should the copy-as-email format be plain text or HTML? Plain text is safer for cross-client compatibility.
