# Open Questions

Unresolved questions, risks, and concerns. Organized by area. Do not decide answers here unless the answer is clearly visible in the repo.

---

## Script editor questions

- **Page number overrides UI:** The `pageOverrides` JSONB column is stored and loaded but there is no UI to set overrides. Intended use: let users remap PDF page numbers to match the printed page numbers in the script (e.g. PDF page 1 = script page 5). Should this be added as an inline editable label per page?
- **Signed URL expiry during long sessions:** Script PDFs load via 1-hour Supabase signed URLs. The pdfjs document reference stays valid for the session, but the bitmap cache is keyed by URL — a new URL after expiry means re-rendering all visited pages. Should the page auto-refresh the signed URL before expiry (e.g. server action ping on focus regain)?
- **Multi-device annotation sync:** Annotations auto-save to the DB but a second device or tab won't see changes without a reload. Should Supabase Realtime subscriptions sync annotations live across devices?
- **Downloaded PDF is raster-only:** The "Download PDF" output is JPEG pages assembled by jsPDF — text is not selectable in the result. A pdf-lib approach (draw annotation primitives on top of the original PDF vectors) would preserve text selectability. Worth revisiting if print fidelity becomes a requirement.
- **Thumbnail panel performance on long scripts:** All pages render progressively at 0.25× when the panel opens. For 100+ page scripts this could take 30+ seconds. Should IntersectionObserver lazy-load only visible thumbnails?
- **Annotation color editing:** There is no way to change the color of an existing highlight or note — the user must delete and redraw. Should a color picker appear in the panel item edit mode?

## Blocking tool questions (future candidates)

- **Full beat breakdown export:** Directors want to print the entire blocking script — all scenes, all beats, each with a canvas snapshot. Approach: loop through every beat, render positions onto an offscreen canvas, assemble into a multi-page PDF (e.g. via `jspdf`) or a print-friendly HTML page. Should include scene/beat label and actor legend per page.
- The number line ruler uses `preserveAspectRatio="none"` on the SVG, which distorts tick mark heights on non-square viewports — is this acceptable or should it be addressed?
- **Custom set piece signed URLs:** URLs expire after 1 hour. Long blocking sessions will see broken images for custom pieces after expiry. Should the canvas auto-refresh URLs (e.g. on focus regain)?
- **Custom set piece deletion UX:** Deleting a custom set piece from the library removes it from future beats, but existing `blocking_positions` rows still reference its ID. Tokens for deleted pieces will appear as missing images on canvas. Should deletion be blocked if the piece is in use, or should positions be cleaned up on delete?

## Mentions questions

- **Mention notifications:** Currently mentions appear only on the dashboard. Should users receive email or push notifications when @mentioned?
- **Mention in deleted context:** If a report or announcement is deleted, mention rows for it remain in the DB. Should deletions cascade-delete mention rows?
- **Cross-production mention visibility:** The dashboard shows all mentions across all productions. Should users be able to filter by production?
- **`production_logs` table orphan:** The DB table was not dropped when the daily log feature was removed. It can be dropped in a future cleanup migration when convenient.

## Product questions

- Steps 1–13 are complete. What is the next feature step?
- Should rehearsal report departments be configurable per production, or remain fixed?
- Should attendance tracking be added to rehearsal reports?
- Should productions have additional statuses beyond draft/active/archived?
- Should there be a notification system when reports are filed or documents uploaded?
- Should the "requested role" from signup trigger any workflow (e.g., admin approval queue)?

## Architecture questions

- Should `drizzle-kit push` be fixed or should the project fully adopt SQL Editor for schema changes?
- When should the project move from `push` workflow to proper migrations?
- Is the single-org design sufficient for launch, or will multi-org be needed before v1?
- Should an API layer be introduced between the UI and database, or is the current direct-query pattern acceptable long-term?

## Permissions questions

- Should production-level roles override org-level roles, or should they be additive?
- Currently a user's org role is used for capability checks everywhere. Should production membership roles affect what a user can do within a specific production?
- Are the current capability assignments correct? (e.g., should `stage_manager` have `announcements:create`?)
- Should `cast` and `crew` have different permissions, or are they intentionally identical?

## File upload / storage questions

- **Access control gap:** `getDocumentUrl()` and `getAttachmentUrl()` generate signed URLs without verifying the user has access to the parent production or report. Should these actions check production membership before returning a URL?
- **Storage RLS is permissive:** Current policies allow any authenticated user to insert/select/delete any file in the `attachments` bucket. Should policies be scoped to production membership?
- **No file type validation:** Any file type is accepted for upload. Should there be an allowlist of accepted file types?
- **No duplicate detection:** Users can upload the same file multiple times. Is this acceptable or should duplicates be detected?
- **No virus/malware scanning:** Uploaded files are served back to users via signed URLs. Should files be scanned before serving?
- **File naming:** Storage paths use `{timestamp}-{filename}`. Should filenames be sanitized to remove special characters?
- **Orphaned files:** If a database insert fails after a successful storage upload, the file remains in storage with no DB record. Should there be cleanup logic?

## UX questions

- TipTap bullet points do not render due to Tailwind prose CSS reset. When should this be fixed?
- Mobile navigation: sidebar is hidden on mobile with no alternative. When should a mobile drawer be added?
- Should the document viewer support page-by-page navigation for multi-page PDFs?
- Should there be a search/filter capability on the documents list?
- Should the production overview cards show more metadata (dates, member count)?

## UI port questions

- **Workspace Home vs. current `/dashboard`:** `design-reference/jsx/tab-home.jsx` is a richer workspace landing (greeting hero, "Right now" strip, announcement broadcast cards, productions browser, @mentions, pinned items). The current `/dashboard` was ported against an earlier design and does not match it. Should `/dashboard` be re-ported to the Workspace Home design? The new shell mockup (`design-reference/jsx/shell.jsx`) also adds a workspace/production/people view switcher in the rail — adopting it is a connected decision.

## Notes questions

- **Visibility enforcement:** Private notes are visible to all team members in the current implementation. Should the `getNotesByProduction` query filter by `visibility = 'shared' OR created_by = currentUserId`?
- **Cross-production notes view:** User wants a dashboard glimpse of notes from all productions. When should this be built?
- **Real-time updates:** Notes from other team members only appear on reload. Should Supabase Realtime subscriptions be used here?
- **Note editing rights:** Currently only the author or a manage_tags user can edit a note. Should this be loosened for "shared" notes?
- **Tag deletion cascade:** Deleting a tag sets `tag_id = null` on all notes (ON DELETE SET NULL). Should users be warned how many notes will lose their tag?
- **Bullet points in TipTap:** Same issue as reports — Tailwind prose resets list styles. Should a fix be applied globally?

## Testing / hardening questions

- There are zero test files in the repo. When should testing be introduced?
- What level of testing is appropriate for MVP? (Unit tests, integration tests, E2E?)
- Password reset flow was never fully tested due to Supabase email rate limits. Needs verification.
- Should server actions validate that referenced IDs (productionId, reportId, documentId) actually exist and belong to the correct org before proceeding?
- `dangerouslySetInnerHTML` in `RichTextDisplay` renders unsanitized HTML. Should a sanitization library (e.g., DOMPurify) be added?

## Scope control questions

- The MVP is being built in vertical slices. What is the definition of "MVP complete"?
- Is there a target launch date or user count?
- Should any of the scaffolded features (announcements, activity) be cut from MVP scope?
- When should UX polish become a priority vs. feature completion?

## Call schedule questions

- **Real-time live status:** The dashboard header badge reflects state at page load, not in real time. Should the header auto-update (e.g. via Supabase Realtime or a client-side interval revalidation) so it flips to "Live" or advances to the next call without a manual refresh?
- **Recurring calls:** There is no support for repeating calls (e.g. "Tuesday/Thursday 7–10pm for 8 weeks"). Should a recurrence system be built, or is bulk-creation sufficient?
- **Cancel vs. delete:** Currently calls can only be deleted. Should there be a "cancel" status that keeps the call visible on the calendar (greyed out) to preserve the history for the production record?

## People directory questions (Step 16)

- **Service-role key in environment:** `inviteMembers` / `resendInvite` need `SUPABASE_SERVICE_ROLE_KEY`. It is in `.env.example` and must be set in every environment (local, deploy) before invites work. The page, parsing, and UI work without it.
- **Invite email template:** Supabase's "Invite user" auth email template must be enabled in the project dashboard for invite emails to actually send.
- **`/settings/members` overlap:** the older Step 3 org-member page still exists alongside the new `/people` page. Should `/settings/members` redirect to `/people`, or stay as a lighter settings-scoped view?
- **`last_active_at` precision:** only set when an invited user is promoted to active on first sign-in — it is not a true per-request "last seen" (per-request DB writes were deliberately avoided). Is a more accurate last-seen worth a throttled write later?
- **Invite acceptance landing:** invite links route through `/auth/callback` to `/reset-password` so the user sets a password. This reuses the existing reset-password page and should be verified end-to-end against a live project.
