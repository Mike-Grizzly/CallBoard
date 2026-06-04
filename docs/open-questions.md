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

## 2026-05-29 session — deferred / optional follow-ups

These are nice-to-haves intentionally left for a later day; each has a working
default in place today.

- **Scheduler — workspace `/calendar` "+" production picker.** When the
  workspace calendar has multiple productions, the new-call "+" asks which
  production each time. Optionally remember the last-used production and skip
  the picker (with a way to change it). Today: always asks.
- **Scheduler — edit-call as a tray.** Creating a call now opens the slide-in
  tray over the calendar, but editing an existing call (from the event drawer's
  "Edit") still navigates to the full-page form. Optionally make edit use the
  same slide-in tray for consistency. Today: edit is a full page.
- **Script reader — two-finger scroll while drawing.** With a freehand tool
  active, the page scroll is locked so one finger draws cleanly; navigation is
  via the scrubber. Optionally add two-finger pan/scroll so the user can scroll
  without deselecting the tool (GoodNotes-style). Today: scrubber-only while a
  tool is active.
- **Script reader — ink on desktop.** Freehand ink is drawn only on mobile (and
  the desktop Read-mode overlay is reading-only). Desktop renders ink read-only
  and exports it in the annotated PDF, but there's no freehand drawing on the
  desktop annotation viewer (it keeps its rectangle highlight/note/cue tools).
  Optional if desktop freehand is ever wanted.
- **New Production wizard — inviting brand-new people.** The wizard's Team step
  can assign existing org members for any `productions:manage` user, but
  inviting brand-new email addresses requires `settings:manage`; rows that
  can't be actioned are reported as skipped on the launch screen. Optionally
  let producers invite new people, or guide them to ask an admin.

## Settings — deferred from PR #20 (2026-05-29)

- **Email change (a.k.a. "email linking" / rebinding).** Deferred on
  purpose. The `/settings/account` email field renders disabled with
  a hint. Building it correctly needs Supabase's
  `updateUser({ email })` + the magic-link confirmation on the new
  address. If a fresh session reads the codebase and asks "is email
  change implemented?" the answer is **no, and that's intentional** —
  don't treat it as missing work and rebuild it. We'll revisit if
  beta testers actually ask for it.
- **Delete workspace / delete account.** Out of scope; needs cascade
  semantics + confirmation UX we don't want to get wrong.
- **Transfer ownership to a non-member.** Current flow requires the
  target be an existing workspace member. Invite-then-transfer is
  the supported path. Decide later whether a one-step
  "invite + make them admin and step down" is worth shipping.
- **Account-level avatar upload.** Workspace logo shipped; personal
  avatars deferred.

## Dashboard command center / RSVP / acks (2026-05-29)

- **RSVP confirm only on the dashboard focal call.** `confirmCall` works for
  any member of any call's production, but the only UI to call it is the
  dashboard focal-call panel (the single next call). Members can't yet RSVP to
  a *specific* non-focal call. Natural home: the calendar `EventDrawer`
  (`app/(app)/calendar/event-drawer.tsx`) — would need confirm data threaded
  through `CalEvent`/`callToEvent`. Deferred to keep the calendar pipeline
  untouched this pass.
- **Desktop bento pinned has no unpin.** The desktop bento "Pinned" card
  renders plain links; unpin is only on the phone `PinnedSection`. Add an
  unpin affordance to the bento if desktop users want it.
- **Phone dashboard not redesigned.** The command-center look is desktop-only;
  phones still get MobileTodayHero + the legacy stacked feeds. The uploaded
  Mobile_Dashboard.html referenced `mobile-dashboard.jsx`/`mobile-shell.jsx`
  which were not included, so the phone re-skin is deferred until that source
  is available. The Acknowledge button *is* reachable on phone via
  `/announcements`.
- **Countdown time format assumption.** `FocalCall`'s countdown builds the
  target as `${callDate}T${callTime}:00` (local), assuming `calls.callTime` is
  24h `HH:MM`. Verify against real call data; non-24h or null times fall back
  to "—".
- **Not verified live.** `tsc` + `eslint` pass, but there's no `DATABASE_URL`
  here so `next build` page-data collection and real-data rendering weren't
  exercised.

## Mobile dashboard (2026-05-29)

- **`mobile-today-hero.tsx` removed (RESOLVED 2026-05-29).** The phone
  dashboard was replaced by `mobile-dashboard.tsx`, orphaning
  `MobileTodayHero`. The file was deleted after confirming nothing else
  imported it (`tsc` + `eslint` clean).
- **Mobile dashboard appbar omitted.** The draft had a top app bar with
  Search + Notifications buttons; both were demo-only toasts with no real
  destinations in the app (no global search; the notifications inbox is
  deferred), so the appbar was dropped and the screen starts at the greeting.
  Revisit if/when those destinations exist.
## Notes Notion-style editor (2026-05-29)

- **Mobile keyboard accessory bar needs device verification.** The bar is kept
  above the keyboard by syncing the editor height to
  `window.visualViewport.height` (handles the common "keyboard at bottom"
  case). iOS edge cases (viewport offset when scrolled, split keyboard,
  floating iPad keyboard) are unverified — check on a real iPhone.
- **Mobile metadata uses the in-document properties row.** Tag/due/pin/to-do
  now live in a quiet row under the title (desktop + mobile) rather than a
  top bar. A future polish could tuck them behind a "⋯" sheet next to the
  Private pill for an even cleaner immersive top.
- **Inline link uses `window.prompt`.** The bubble-menu Link button prompts
  for a URL. An inline link popover (edit/remove/open) would be nicer — quick
  follow-up.

---

## Notifications questions (2026-06-03)

- **Announcement notifications are implemented but not browser-verified.**
  Scope-based fan-out (in-app + email) + a `/settings/notifications` preference
  page + a global rail bell were added this session. Not yet tested end-to-end:
  (a) that a recipient actually sees the in-app bell count update and the email
  arrives, (b) the rail bell dropdown renders correctly opening *upward* from
  the rail foot (it was originally built for a topbar; `placement="up"` flips
  it), (c) large-org fan-out performance (one `notifications` insert batch +
  Resend batch per ≤100 recipients).
- **Push is modeled but inert.** The `notification_preferences.push` column and
  the disabled settings toggle exist, but there is no delivery transport. Phase 2
  = Web Push (PWA: manifest + service worker + VAPID + `push_subscriptions`).
  Open: iOS requires "Add to Home Screen" before Web Push works at all — is that
  acceptable, or is a native wrapper (Expo/Capacitor + APNs/FCM) eventually
  needed for reliable phone alerts?
- **Email volume / opt-out.** Every announcement currently emails every audience
  member who hasn't turned email off. For a busy show this could feel spammy —
  consider per-production muting or digest batching before wide rollout.
- **No real-time refresh.** The rail bell count updates on next navigation, not
  live (consistent with the documented "no real-time updates" stance). Revisit
  if instant delivery is expected.

---

## Orphaned profiles / invites (2026-06-03)

- **Legacy orphan profiles** (a `profiles` row with no `auth.users` account) existed
  from an older invite/seed path. Three were deleted (director + 2 katie dupes);
  **10 `@wellmantheatre.org` demo rows remain** by choice. If more real orphans
  exist in other orgs, they'll show as members but can't log in or reset a
  password until re-invited. `inviteMembers` now self-heals these on re-invite.
- **Misleading password reset.** Supabase returns 200 for reset requests on
  unknown/login-less emails (anti-enumeration) and sends nothing. The member
  list now flags `invited` status, but the public reset screen still can't tell
  a user "you were invited, accept the invite instead" without leaking account
  existence. Acceptable for now; revisit if it confuses testers.
- **Latent risk:** do NOT add profile↔login reconciliation by email outside the
  admin invite flow without requiring verified email ownership — that would turn
  pre-seeded roles into an account-takeover vector. Current linking is by auth
  UID, which is safe.
- **Duplicate profiles per email** were possible historically (katie had 3). The
  invite path dedupes by email now, but there's no DB-level uniqueness on
  `profiles.email`; self-signup with an email that already has a login-less
  profile still creates a separate profile + org. Consider a reconciliation step
  or a guard if this recurs.

---

## Notification surface after the banner pivot (2026-06-03)

- **Dead bell code.** `components/app-shell/notification-bell.tsx` and the
  notifications actions (`getNotifications`, `getUnreadNotificationCount`,
  `markNotificationsRead`) are no longer referenced by any UI after the rail
  bell was removed in favour of the acknowledge banner. Left in place for a
  possible future "notification center" header. Decide: build that center, or
  delete the dead chain.
- **Orphaned notification rows.** `fanoutAnnouncement` still inserts `notifications`
  rows and document comments still do too, but nothing displays them. Either wire
  a viewer or stop writing announcement rows (the banner reads acks directly, so
  in-app announcements don't need the table).
- **`notification_preferences.in_app` is currently a no-op** — the banner always
  shows for unacknowledged announcements regardless of the toggle. Only `email`
  is meaningful right now; `push` remains inert. Revisit the settings copy if the
  bell/center doesn't come back.
- **Banner scope choices to confirm with use:** 30-day window and audience-only
  (a manager isn't nagged to ack announcements for productions they're not in).

## Mentions questions (2026-06-04, PR #28)

- **`mention-input.tsx` contenteditable not device-verified.** The inline chip
  editor is hand-rolled (Selection/Range, caret placement, paste, serialize).
  Verified in desktop preview; unverified on iOS/Android soft keyboards (IME
  composition, autocorrect, caret-after-chip on touch). Test on real devices.
- **Plain-text mention resolution is name/email-based.** `@{Full Name}` tokens
  resolve to a user id by matching org members' full name or email at save time.
  A member renamed between typing the mention and saving, or two members sharing
  a full name, can mis-resolve or fail to notify (the chip still displays). The
  rich-text (`data-id`) path is unaffected.
- **Pre-existing report mentions weren't re-split.** Reports saved before the
  per-section change keep their old single merged `report` row; only a re-save
  rewrites them into per-section rows. No backfill was run.
