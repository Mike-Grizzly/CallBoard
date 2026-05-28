# Open Questions

Unresolved questions, risks, and concerns. Organized by area. Do not decide answers here unless the answer is clearly visible in the repo.

---

## Mobile / iOS questions

- **iOS auto-zoom persists into the app after sign-in (PARKED 2026-05-27).**
  On iOS WebKit (Safari and Chrome — both use WebKit), typing into the
  sign-in inputs auto-zooms the page (font-size below 16px triggers it)
  and the zoom level carries over into the authenticated app, so the
  whole UI feels stuck zoomed-in until the user manually pinches back
  out. Two attempts at a fix were made in `components/app-shell/zoom-reset.tsx`:
  (1) detect via `visualViewport.scale` then clamp via `maximum-scale=1`
  — failed because the auto-zoom is a *layout* zoom, not a pinch zoom,
  so `visualViewport.scale` reads 1; (2) always run on mount + double-rAF
  + `maximum-scale=1, user-scalable=no` — reported as still not
  resetting. The component is kept in tree for now since it's harmless.
  Next ideas to try when revisiting: hard-reload navigation after the
  auth server action instead of the Next.js client redirect; force a
  layout via `document.body.style.zoom = 1`; remove + re-insert the
  viewport meta tag entirely; or accept the trade-off and floor the
  login form's `.field` to 16px so auto-zoom never triggers in the
  first place.

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
- ~~Is the single-org design sufficient for launch, or will multi-org be needed before v1?~~ **Resolved 2026-05-28** — multi-org refactor shipped; see `decision-log.md` 2026-05-28 entry.
- Should an API layer be introduced between the UI and database, or is the current direct-query pattern acceptable long-term?

## Permissions questions

- Should production-level roles override org-level roles, or should they be additive?
- Currently a user's org role is used for capability checks everywhere. Should production membership roles affect what a user can do within a specific production?
- Are the current capability assignments correct? (e.g., should `stage_manager` have `announcements:create`?)
- Should `cast` and `crew` have different permissions, or are they intentionally identical?

## File upload / storage questions

- **Storage RLS is permissive:** Current policies allow any authenticated user to insert/select/delete any file in the `attachments` bucket. Signed-URL generation is now access-checked in app code (P0, 2026-05-21), so this is defense-in-depth — but should policies still be scoped to production membership?
- **No duplicate detection:** Users can upload the same file multiple times. Is this acceptable or should duplicates be detected?
- **No virus/malware scanning:** Uploaded files are served back to users via signed URLs. Should files be scanned before serving?
- **Orphaned files:** If a database insert fails after a successful storage upload, the file remains in storage with no DB record. Should there be cleanup logic?
- **Bidirectional link between report attachments and the Documents
  directory (post-beta).** Two paired behaviors that promote keeping
  every production's files in one place:
  1. *Picking from Documents:* in the rehearsal report attachment UI,
     let the user pick a file that already lives in the production's
     Documents directory instead of (or in addition to) uploading a
     new one. Avoids re-uploading the same script revision / floor
     plan / costume sheet for every report.
  2. *Auto-promoting report attachments into Documents:* when a user
     uploads a file directly inside the rehearsal report, also add
     it to the Documents directory by default — with an opt-out
     checkbox ("don't add to Documents") for one-off files where
     storage savings matter. Files that *do* get added need a target
     folder (Documents has 6 categories), so the upload flow needs
     a folder picker at attach time. Decision needed on whether the
     report-attachment row should reference the Documents row by FK
     (shared underlying storage object) or stay a separate row that
     just *also* writes a Documents entry (two refs to the same
     file). The FK approach is more efficient but harder to reason
     about for deletion semantics.

  Queued for post-beta because both flows touch the report-builder,
  Documents picker, and Storage layout — bigger than a beta fix.

_Resolved in P0 (2026-05-21): signed-URL actions now verify production access; uploads enforce a MIME allowlist; storage-path filenames are sanitized. See `decision-log.md`._

## UX questions

- TipTap bullet points do not render due to Tailwind prose CSS reset. When should this be fixed?
- Mobile navigation: sidebar is hidden on mobile with no alternative. When should a mobile drawer be added?
- Should the document viewer support page-by-page navigation for multi-page PDFs?
- Should there be a search/filter capability on the documents list?
- Should the production overview cards show more metadata (dates, member count)?

## UI port questions

- **Workspace Home vs. current `/dashboard`:** `design-reference/jsx/tab-home.jsx` is a richer workspace landing (greeting hero, "Right now" strip, announcement broadcast cards, productions browser, @mentions, pinned items). The current `/dashboard` was ported against an earlier design and does not match it. Should `/dashboard` be re-ported to the Workspace Home design? The new shell mockup (`design-reference/jsx/shell.jsx`) also adds a workspace/production/people view switcher in the rail — adopting it is a connected decision.

## Notes questions

- **Cross-production notes view:** User wants a dashboard glimpse of notes from all productions. When should this be built?
- **Real-time updates:** Notes from other team members only appear on reload. Should Supabase Realtime subscriptions be used here?
- **Note editing rights:** Currently only the author or a manage_tags user can edit a note. Should this be loosened for "shared" notes?
- **Tag deletion cascade:** Deleting a tag sets `tag_id = null` on all notes (ON DELETE SET NULL). Should users be warned how many notes will lose their tag?
- **Bullet points in TipTap:** Same issue as reports — Tailwind prose resets list styles. Should a fix be applied globally?

## Testing / hardening questions

- There are zero test files in the repo. When should testing be introduced?
- What level of testing is appropriate for MVP? (Unit tests, integration tests, E2E?)
- Password reset flow was never fully tested due to Supabase email rate limits. Needs verification.
- **Server-action ID ownership sweep:** the signed-URL read actions now verify production access (P0, 2026-05-21), but mutating actions (e.g. `uploadDocument`, `uploadCustomSetPiece`) still trust a client-supplied `productionId` without confirming the caller belongs to it. A broad ownership-check pass across mutating server actions is still outstanding.
- Leaked-password protection (HaveIBeenPwned check) must be enabled in the Supabase Auth dashboard — a project-owner action, not a code change.

## Scope control questions

- The MVP is being built in vertical slices. What is the definition of "MVP complete"?
- Is there a target launch date or user count?
- Should any of the scaffolded features (announcements, activity) be cut from MVP scope?
- When should UX polish become a priority vs. feature completion?

## Call schedule questions

- **Real-time live status:** The dashboard header badge reflects state at page load, not in real time. Should the header auto-update (e.g. via Supabase Realtime or a client-side interval revalidation) so it flips to "Live" or advances to the next call without a manual refresh?
- **Recurring calls:** There is no support for repeating calls (e.g. "Tuesday/Thursday 7–10pm for 8 weeks"). Should a recurrence system be built, or is bulk-creation sufficient?
- **Cancel vs. delete:** Currently calls can only be deleted. Should there be a "cancel" status that keeps the call visible on the calendar (greyed out) to preserve the history for the production record?
- **Rehearsal report "Next Rehearsal" ↔ calendar bidirectional link
  (post-beta).** Right now the Next Rehearsal block on a rehearsal
  report (date / time / location / notes) is plain text fields and
  doesn't talk to the production calendar at all — SMs end up
  double-entering the same information. Two paired behaviors:
  1. *Pull from calendar:* button in the Next Rehearsal block that
     looks up the next scheduled call on this production's calendar
     after `report.reportDate` and pre-fills date / time / location.
     Edit-friendly afterward in case the SM wants to override.
  2. *Push to calendar:* if the SM types Next Rehearsal info directly
     into the report and there is no existing calendar entry for
     that date/time, create one automatically on save so the calendar
     stays the source of truth. If a call already exists at that
     date+time, don't duplicate — link instead.

  Edge cases to think through: what counts as a "match" when pushing
  (same date + start time, or any call on that date?); whether
  cast/crew should be able to push-create calendar entries from a
  report or only `reports:create` holders; and whether editing the
  Next Rehearsal fields on an already-distributed report should
  edit the linked calendar entry. Queued for post-beta.

## People directory questions (Step 16)

- **Service-role key in environment:** `inviteMembers` / `resendInvite` need `SUPABASE_SERVICE_ROLE_KEY`. It is in `.env.example` and must be set in every environment (local, deploy) before invites work. The page, parsing, and UI work without it.
- **Invite email template:** Supabase's "Invite user" auth email template must be enabled in the project dashboard for invite emails to actually send.
- **`/settings/members` overlap:** the older Step 3 org-member page still exists alongside the new `/people` page. Should `/settings/members` redirect to `/people`, or stay as a lighter settings-scoped view?
- **`last_active_at` precision:** only set when an invited user is promoted to active on first sign-in — it is not a true per-request "last seen" (per-request DB writes were deliberately avoided). Is a more accurate last-seen worth a throttled write later?
- **Invite acceptance landing:** invite links route through `/auth/callback` to `/reset-password` so the user sets a password. This reuses the existing reset-password page and should be verified end-to-end against a live project.
