# Step 5: Reports & Daily Log

## Purpose
Rehearsal report creation, daily personal log per production, "import from log" into reports, and file attachments on reports.

## User story
As a stage manager or director, I can keep a daily log of running notes, then create a rehearsal report (optionally importing from my log). I can attach files to reports. All team members can view reports.

## Status: IMPLEMENTED
- **Known issue:** TipTap bullet points do not render correctly due to Tailwind prose CSS reset. Deferred to UX polish.

## Data model
- `rehearsal_reports` — productionId, createdBy, reportDate (date), generalNotes (rich text HTML), scheduleNotes (rich text HTML)
- `production_logs` — productionId, userId, content (rich text HTML); one log per user per production (upsert pattern)
- `report_attachments` — reportId, uploadedBy, fileName, fileSize, contentType, storagePath

## Routes/pages
- `/productions/[slug]/reports` — report list, ordered by date descending
- `/productions/[slug]/reports/new` — create report form with "Import from daily log" option
- `/productions/[slug]/reports/[reportId]` — report detail with general notes, schedule notes, and attachments
- `/productions/[slug]/log` — daily log editor (only shown in tabs if user has `reports:create`)

## Components
- `app/(app)/productions/[slug]/reports/new/create-report-form.tsx` — date picker, rich text for general/schedule notes, import button
- `app/(app)/productions/[slug]/reports/[reportId]/attachment-upload.tsx` — file input with upload handling
- `app/(app)/productions/[slug]/log/log-editor.tsx` — rich text editor with save button
- `components/ui/rich-text-editor.tsx` — TipTap editor (shared) and `RichTextDisplay`

## Server actions
- `createReport(formData)` in `features/reports/actions.ts` — validates date + notes, inserts report, redirects to reports list; requires `reports:create`
- `saveProductionLog(formData)` in `features/logs/actions.ts` — upsert: creates or updates the user's log for this production; requires `reports:create`
- `uploadReportAttachment(formData)` in `features/reports/attachments.ts` — uploads to Supabase Storage (`reports/{reportId}/{timestamp}-{filename}`), max 10MB, records in DB; requires `reports:create`
- `getAttachmentUrl(storagePath)` in `features/reports/attachments.ts` — returns signed URL (1-hour expiry); **no permission check**

## Queries
- `getReportsByProduction(productionId)` — reports with author info, ordered by date desc
- `getReportById(reportId)` — single report with author info
- `getProductionLog(productionId, userId)` — user's log for this production
- `getReportAttachments(reportId)` — all attachments for a report

## Validation (`features/reports/validation.ts`)
- `validateReportForm(formData)` — validates reportDate and generalNotes are present

## Rich text editor
- TipTap with StarterKit, Underline, TextStyle, Color, Highlight, TextAlign extensions
- `immediatelyRender: false` for SSR compatibility
- Toolbar: bold, italic, underline, strikethrough, h1/h2, bullet list, ordered list, alignment, highlight, text color, undo/redo
- `RichTextDisplay` renders HTML via `dangerouslySetInnerHTML` (no sanitization — see open questions)

## Import from daily log
- The new report page fetches the user's daily log content
- Passed to `CreateReportForm` as `logContent` prop
- "Import from daily log" button fills the general notes field with the log HTML

## Permissions
- `reports:view` — required to see reports (all roles have this)
- `reports:create` — required to create reports, save logs, upload attachments (admin, producer, director, stage_manager)
- Daily Log tab only shown in production tabs if user has `reports:create`

## Edge cases
- TipTap bullet points don't render (Tailwind prose CSS reset)
- `RichTextDisplay` uses `dangerouslySetInnerHTML` — content is from authenticated users via TipTap but not sanitized
- `getAttachmentUrl()` has no auth check — any authenticated user who knows the storage path could generate a URL
- Report attachments max 10MB; document uploads max 25MB (different limits)
- Daily log is per-user per-production — only the author can see/edit their own log

## Manual test checklist
- [ ] Can create a report with date, general notes, schedule notes
- [ ] Rich text formatting (bold, italic, headings) renders in report detail
- [ ] Can view report list, ordered by most recent
- [ ] Can click into report detail and see formatted content
- [ ] Can upload a file attachment to a report (under 10MB)
- [ ] Attachment appears in report detail with download link
- [ ] Daily log: can write and save personal notes
- [ ] Daily log: content persists between visits
- [ ] "Import from daily log" fills general notes in new report form
- [ ] Users without `reports:create` cannot see the Daily Log tab or create reports
- [ ] Users with `reports:view` can see report list and detail

## Architecture notes to preserve
- Rich text editor is a shared component in `components/ui/rich-text-editor.tsx` — used by both daily log and report forms
- Daily log uses upsert pattern (check for existing, update or insert)
- Report creation uses `redirect()` after success — not a return value
- Attachments are in the same `attachments` Supabase Storage bucket as documents
- Storage path pattern for attachments: `reports/{reportId}/{timestamp}-{filename}`
