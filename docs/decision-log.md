# Decision Log

Record of durable project decisions. Add new entries at the bottom with date and context.

---

## 2026-05-05 — Repo docs become persistent AI development memory

**Decision:** The `/docs` folder and `CLAUDE.md` are the source of truth for architecture, development rules, feature specs, current status, decisions, and open questions.

**Reason:** Claude Code sessions do not persist memory across sessions. Future AI-assisted development should rehydrate context from the repository.

**Impact:** Every future Claude Code session reads `CLAUDE.md` (automatic) which directs to `/docs/` for detailed context. Docs should be updated whenever architecture, schema, permissions, or feature status changes.

---

## 2026-05-05 — Renamed `users` table to `profiles`

**Decision:** The Drizzle schema table was renamed from `users` to `profiles` (file remains `db/schema/users.ts`).

**Reason:** Supabase reserves the `users` table name in the public schema. `drizzle-kit push` hung when the table was named `users`.

**Impact:** All code references use `profiles` as the table name. The file name `users.ts` is kept for clarity but exports `profiles`.

---

## 2026-05-05 — Removed composite unique constraints from membership tables

**Decision:** Composite unique constraints `(userId, organizationId)` and `(userId, productionId)` were removed from membership tables.

**Reason:** `drizzle-kit push` (v0.30.x) hangs when composite unique constraints are defined using the Drizzle syntax.

**Impact:** Duplicate memberships are prevented in application code (upsert pattern in `assignProductionMember`) but NOT enforced at the database level. This should be revisited if `drizzle-kit` fixes the issue or if migrations are adopted.

---

## 2026-05-05 — SQL applied directly via Supabase SQL Editor

**Decision:** For tables added after the initial `drizzle-kit push`, SQL was run directly in the Supabase SQL Editor instead of using `npm run db:push`.

**Reason:** `drizzle-kit push` experienced hanging issues with the Supabase connection pooler. Direct SQL was faster and more reliable.

**Impact:** The Drizzle schema files are the source of truth for table structure, but the actual database was created via SQL Editor. If the database needs to be recreated, SQL must be run manually or `drizzle-kit push` issues must be resolved.

**Tables created via SQL Editor:** `rehearsal_reports`, `production_logs`, `report_attachments`, `documents` (needs confirmation — earlier tables may have been created via push).

---

## 2026-05-05 — Single organization MVP design

**Decision:** The MVP supports only a single organization with slug "default", lazy-created on first user access.

**Reason:** Multi-org adds significant complexity. Small theatre companies typically need one workspace.

**Impact:** All code assumes a single org. `getOrCreateDefaultOrganization()` returns the singleton. Multi-org support would require refactoring auth, queries, and navigation.

---

## 2026-05-05 — First user becomes admin automatically

**Decision:** The first user to access the app in an organization automatically gets the `admin` role. All subsequent users get `cast`.

**Reason:** Removes the need for a seeding step or manual database edits to bootstrap the first admin.

**Impact:** The first signup in a fresh deployment becomes the org admin. This logic is in `lib/auth.ts` `getCurrentUser()`.

---

## 2026-05-05 — Supabase Storage with anon key and RLS policies

**Decision:** File uploads use the Supabase anon key (via `createSupabaseServerClient`) rather than the service role key, with RLS policies on `storage.objects`.

**Reason:** The server-side Supabase client uses the anon key with cookie-based auth. Storage operations go through this client.

**Impact:** RLS policies must be configured on the `attachments` bucket. Current policies allow any authenticated user to insert/select/delete — this is permissive and should be tightened before production.

---

## 2026-05-05 — TipTap for rich text editing

**Decision:** TipTap (`@tiptap/react` with StarterKit + extensions) was chosen for rich text editing in daily logs and report notes.

**Reason:** Headless editor that works well with React 19 and supports the formatting features needed (bold, italic, lists, headings, color, highlight, alignment).

**Impact:** 5 TipTap packages installed. `immediatelyRender: false` required for SSR compatibility. `RichTextDisplay` renders HTML via `dangerouslySetInnerHTML`.

---

## 2026-05-05 — Document schema prepared for future AI processing

**Decision:** The `documents` table includes `documentType` (script, schedule, design, music, reference, general) and `processingStatus` (default "none") fields.

**Reason:** User wants future AI script analysis (scene breakdowns, actor part highlighting). Schema was prepared during Step 7 to avoid migration later.

**Impact:** No processing logic exists yet. These fields are display-only for now. Future work should use `processingStatus` to track AI analysis state.

---

## 2026-05-06 — Email sending via Resend (rehearsal reports)

**Decision:** Use Resend (`resend` npm package) for transactional email. Initial sender is `onboarding@resend.dev` (Resend sandbox) until the product has a verified domain. Switching to a custom domain requires only updating `RESEND_FROM_EMAIL` in env — no code changes.

**Reason:** User does not yet own a domain for the product. Resend's sandbox lets us build and test the full email flow now and upgrade the sender address later without refactoring.

**Impact:** `RESEND_API_KEY` and `RESEND_FROM_EMAIL` required in `.env.local`. Both vars documented in `.env.example`. Email is sent as HTML (with plain-text fallback) from `features/reports/send-report.ts`.

---

## 2026-05-06 — Rehearsal report overhaul: structured format

**Decision:** Replaced free-form `generalNotes`/`scheduleNotes` reports with a structured format: header time fields, TipTap general notes, 12 fixed department text fields, next-rehearsal block, per-production `report_number`, and Email Report button via Resend.

**Reason:** Matches professional SM workflow per spec `09-rehearsal-report-overhaul.md`. Departments fixed for MVP; attendance deferred.

**Impact:** New nullable columns added to `rehearsal_reports` via Supabase MCP `apply_migration` (name `rehearsal_report_overhaul`). Legacy `scheduleNotes` retained for old reports. `resend` package added.

---

## 2026-05-07 — Blocking tool positions stored as canvas percentages

**Decision:** `blocking_positions` stores `x_percent` and `y_percent` (0–100) relative to the canvas container, not absolute pixels or real-world coordinates.

**Reason:** Canvas size varies by screen and window. Percentage-based positions are resolution-independent and survive viewport changes without remapping.

**Impact:** Grid overlay and token rendering must always work in the same percentage coordinate space. Real-world coordinates (feet from center) are derived at render time from calibration data + canvas dimensions.

---

## 2026-05-07 — Choreographer added as 7th role

**Decision:** `choreographer` was added as a distinct role alongside the original six.

**Reason:** Choreographers need `blocking:edit` access (same as directors and stage managers) but are a distinct credit and authority in the production hierarchy. Mapping them to `director` would have been inaccurate.

**Impact:** `types/roles.ts`, `lib/permissions.ts`, and all role-display labels updated. Existing users unaffected — new role only appears when assigned.

---

## 2026-05-07 — PDF rendered to canvas via pdfjs-dist; original file untouched

**Decision:** The blocking tool renders the ground plan PDF to an HTML `<canvas>` element client-side using pdfjs-dist v5. The original document in the Document Center is never modified.

**Reason:** Drag-and-drop tokens require a stable pixel surface. A PDF embed (`<iframe>`) would create z-index and event conflicts. Rendering to canvas gives full control of layering.

**Impact:** pdfjs-dist v5 uses `{ canvas, viewport }` render API (not the older `canvasContext` form). Multi-page support added in Phase 2.

---

## 2026-05-07 — Capture Beat copies positions forward automatically

**Decision:** The "Capture Beat" button creates the next beat and copies all blocking positions from the current beat into it, so each beat starts where the last left off.

**Reason:** In practice, actors don't teleport between beats — they move incrementally. Pre-populating the next beat eliminates repetitive re-placement and matches how directors actually work.

**Impact:** `captureNextBeat` server action inserts a new `scene_beats` row and bulk-copies `blocking_positions`. The client skips the normal DB re-fetch after capture (positions are already in local state).

---

## 2026-05-07 — Notes are per-production and org-level tags

**Decision:** Notes are scoped to a production and shared with all production members. Tags are org-level (shared across all productions) and seeded lazily from a fixed preset list on first access.

**Reason:** Tags like "Calls", "Props", "Music" are generic theatre categories that make sense across any production. Per-production tags would create redundant setup for each show.

**Impact:** `note_tags` table uses `organization_id` FK. Tags seeded in `getNoteTagsByOrg()` on first call if empty. Higher-permission users can add/remove tags which affects all productions.

---

## 2026-05-07 — Note visibility is informational in Phase 1

**Decision:** The "private" vs "shared" visibility field on notes is stored but not query-level enforced — all team members can see all notes in the list.

**Reason:** Implementing row-level visibility filtering requires passing the current user's ID into the query and filtering at the DB layer. This adds complexity; the UI affordance (EyeOff icon + footer label) is sufficient for Phase 1 trust-based use.

**Impact:** Visibility should be enforced at the query layer before this feature is used in a high-trust environment. See open questions.

---

## 2026-05-05 — Next.js 16 serverActions config under experimental

**Decision:** The `serverActions.bodySizeLimit` config must be placed under `experimental` in `next.config.ts`.

**Reason:** Next.js 16 moved this config key. Placing it at the top level produces an "Unrecognized key" warning and does not take effect.

**Impact:** `next.config.ts` uses `experimental.serverActions.bodySizeLimit: "25mb"`.

---

## 2026-05-08 — Call live-status computed at render time, not stored

**Decision:** The "live" / "upcoming" / "past" status of a call is derived server-side on every page render from `call_time`, `end_time`, and the current time. No `status` column is flipped by a cron job or background worker.

**Reason:** Storing computed state requires a reliable scheduled job and creates sync risks. The derived approach is simpler, always correct at render time, and requires no infrastructure beyond what already exists.

**Impact:** The dashboard header badge and calendar chip colours reflect state as of page load. A rehearsal that goes live at 7pm will show "Live" on the next page load after 7pm, not in real time. This is acceptable for MVP use.

---

## 2026-05-08 — Calls calendar navigates via URL search params, not client state

**Decision:** The month calendar uses `?month=YYYY-MM` URL search params for navigation rather than React state. The page is a server component.

**Reason:** Keeps the calendar a server component (no client bundle cost, no hydration). Month state is bookmarkable and shareable. No interactivity is needed beyond link clicks.

**Impact:** Each month navigation is a full page navigation. The `searchParams` prop is awaited as a Promise per Next.js 16 convention.


---

## 2026-05-08 — UI port: design system first, tabs second; lucide icons routed through a client `<Icon>` wrapper

**Decision:** Port the standalone HTML demo onto the existing app in two phases. Phase 1: warm theatre tokens, Geist+Newsreader fonts, rail shell, persistent production header + tabs. Phase 2: visual port of every tab content, tracked in `docs/ui-port-roadmap.md`. The data layer (Drizzle, Supabase, server actions, permissions) stays frozen during the port.

**Reason:** Doing the design system + shell first means every later tab port lands inside a coherent container, and every tab can be ported independently against existing `queries.ts`/`actions.ts` without rewriting the backend.

**Impact:**
- New token set in `app/globals.css` with legacy aliases so unported pages still render.
- `--accent` now means curtain crimson; soft-hover surfaces use `--muted`.
- `app/(app)/productions/[slug]/layout.tsx` owns the production header and tabs so sub-routes navigate without reload.
- New `components/ui/icon.tsx` ("use client") with a name→LucideIcon lookup. lucide-react 0.468 ships forwardRef components without `"use client"`, so passing them as children of any client component (Next.js `Link`, `RailLink`, etc.) from a server component breaks RSC serialization. Server components must use `<Icon name="..." />` for any icon that crosses a client boundary; raw Lucide imports are still fine inside DOM elements (`div`, `span`, `button`).
- Every future tab port must do the same icon swap before shipping.

---

## 2026-05-14 — Beat arrows exclude timestamp columns from server action serialization

**Decision:** `fetchBeatArrows`, `createBeatArrow`, and `getArrowsForBeat` explicitly select only the five scalar fields needed by the UI (`id`, `fromX`, `fromY`, `toX`, `toY`, `color`), omitting `createdAt` and `beatId`.

**Reason:** Next.js 16 server actions serialize return values through the React server action boundary. Drizzle `Date` objects (from `timestamp` columns) fail this serialization, producing a `TypeError: Failed to fetch` unhandled rejection in the browser. Selecting only plain-number/string fields avoids the issue entirely.

**Impact:** Any future query/action that returns rows from `beat_arrows` (or any table with a `timestamp` column) must do the same — select fields explicitly and exclude timestamp columns, or convert them to ISO strings before returning.

---

## 2026-05-14 — Blocking canvas layer toggle and draw mode disable dragging

**Decision:** The canvas has two exclusive "layers" (Actors / Set Pieces) controlled by a segmented button. Only the active layer's tokens are pointer-interactive; the other layer gets `pointerEvents: none`. Draw mode additionally disables all tokens so canvas pointer events are unambiguous.

**Reason:** With 20+ actors and set pieces on a dense stage, accidental selection of the wrong token type is a significant usability problem. Isolating draggable elements by layer matches the mental model of theatre designers who think in discrete staging layers.

**Impact:** `isInteractive` prop threaded through both `ActorToken` and `SetPieceToken`. Off-stage tile drags also respect `activeLayer`. When draw mode is active, all token dragging is suspended.

---

## 2026-05-13 — PDF ground plan rendered via offscreen canvas + module-level ImageBitmap cache

**Decision:** The blocking canvas renders the ground plan PDF to an offscreen `<canvas>`, converts it to an `ImageBitmap`, and stores it in a module-level `Map` keyed by the stable file path (not the signed URL token). Subsequent renders draw from the cached bitmap.

**Reason:** `router.refresh()` (called after beat creation and other mutations) causes Next.js to regenerate the Supabase signed URL, producing a new URL string. The PDF `useEffect` was keyed to `pdfUrl`, so every refresh triggered a re-render: `canvas.width = ...` cleared the canvas, causing a visible flash. Keying the cache by the URL's pathname (stable) rather than the full token (volatile) prevents unnecessary re-renders.

**Impact:** PDF renders once per page+session and is reused on subsequent beats. Cache lives for the lifetime of the module (page session). No flash between beats or after refresh calls.

---

## 2026-05-13 — Custom set pieces stored in Supabase Storage under `set-pieces/` prefix

**Decision:** User-uploaded custom set piece images (SVG/PNG/JPG) are stored in the existing `attachments` bucket under the path `set-pieces/{productionId}/{timestamp}-{safeName}`. A new `custom_set_pieces` table tracks metadata (name, storagePath, fileType, uploadedBy). Signed URLs are generated server-side at page load (1-hour expiry).

**Reason:** Reuses the existing storage bucket and RLS policies without requiring a new bucket. The `set-pieces/` prefix namespace is distinct from `reports/` and `documents/` prefixes already in use.

**Impact:** `custom_set_pieces` table added to Drizzle schema. New server actions: `uploadCustomSetPiece`, `deleteCustomSetPiece`, `getCustomSetPieceUrls`. File size limit 5 MB. Signed URLs expire after 1 hour — long blocking sessions may see broken images for custom pieces (see open questions).

---

## 2026-05-13 — Free-angle set piece rotation via corner drag handle

**Decision:** Set piece rotation is implemented as a corner drag handle using `pointer capture` on a `<div>`, tracking angle delta relative to the token center on `pointermove`. The starting angle is captured on `pointerdown` and the rotation delta is applied on each move event, so clicking the handle without moving does not snap the piece.

**Reason:** The prior ±15° button approach required repeated clicks for large rotations and was unintuitive. A drag handle is the standard pattern for rotation in design tools. Delta-based tracking (vs. absolute angle) ensures no snap-on-click.

**Impact:** Rotation handle appears on set piece hover. Built-in SVG pieces and custom uploaded pieces both support free-angle rotation. Rotation stored as degrees in `blocking_positions.rotation`.

---

## 2026-05-15 — Daily log feature removed

**Decision:** The daily log (personal per-user rich-text notes per production, with "Import from daily log" on the new report form) was removed entirely.

**Reason:** The daily log was redundant with the report's general notes field. Users would draft content twice; the import button was a workaround for a UX problem rather than a real feature.

**Impact:** `db/schema/production-logs.ts`, `features/logs/queries.ts`, `features/logs/actions.ts`, the log page, and the log editor were deleted. `db/schema/index.ts` no longer exports production-logs. The `ReportForm` no longer has a `logContent` prop or "Import" button. Existing `production_logs` rows in the database are orphaned (the table still exists in Supabase); it can be dropped in a future cleanup migration.

---

## 2026-05-15 — @Mentions: TipTap extension pinned to exact version 3.22.5

**Decision:** `@tiptap/extension-mention` and `@tiptap/suggestion` are pinned to exact version `3.22.5` (no caret) in `package.json`.

**Reason:** All existing TipTap packages in the project are at `3.22.5`. The npm registry had `3.23.4` as the latest `@tiptap/extension-mention`, which requires `@tiptap/core@3.23.4` as a peer. Using `^3.22.5` still resolved to `3.23.4` (the latest matching semver range). Only an exact pin prevents the mismatch.

**Impact:** When upgrading TipTap, all packages must be bumped together. Do not use a caret for `@tiptap/extension-mention` or `@tiptap/suggestion`.

---

## 2026-05-15 — @Mentions write path: idempotent delete-then-insert

**Decision:** `writeMentions(html, ctx)` always deletes all existing mention rows for `(contextType, contextId)` before inserting new ones, rather than diffing.

**Reason:** Notes autosave every 600ms on content change. A diff-based approach would require comparing old vs. new mention sets on every save and handling edge cases (deleted mentions, re-added mentions). Delete-then-insert is simpler, always correct, and mention rows are lightweight (no FK cascade consequences).

**Impact:** Every report save, note autosave, or announcement create re-writes all mention rows for that context. The `mentions` table does not accrue stale rows. Any downstream feature reading mentions (e.g., notification history) will always see the current state of the document.

---

## 2026-05-15 — Mention card UX: fade highlight, keep card visible (fadedIds pattern)

**Decision:** Clicking a mention card fades the blue unread background immediately (optimistic) but keeps the card present in the Unread tab until the user navigates away. A separate `unfadedIds` set allows individual cards to be restored to unread state.

**Reason:** Earlier iteration used a `readIds` set that both removed the highlight AND filtered the card out of the unread list on click, causing the card to disappear before the user had navigated to the mentioned context. User feedback: "it just deletes itself from the unread view before you go to see the @mention itself."

**Impact:** Two independent state sets: `fadedIds` (blue highlight removed) and `unfadedIds` (card force-shown as unread). `effectiveUnread(m)` = `(m.isUnread || unfadedIds.has(m.id)) && !fadedIds.has(m.id)`. Cards disappear from the Unread tab only on the next server-side data refresh (page navigation or revalidation).

---

## 2026-05-19 — Script editor uses pdfjs-dist canvas rendering + SVG annotation overlay

**Decision:** The "Your Script" PDF annotation editor renders pages via `pdfjs-dist` to an HTML `<canvas>` element, with a sized SVG overlay for annotations. Annotations are stored as normalized 0–1 coordinates relative to the canvas dimensions.

**Reason:** `pdfjs-dist` was already installed (blocking tool). A canvas-based render gives full pixel control for the overlay. Normalized coordinates are resolution-independent — they survive zoom level changes and canvas rescales without remapping.

**Impact:** Rendering is done client-side via dynamic import. The module-level `pdfBitmapCache` (keyed by `url::page::scale`) prevents re-renders when the signed URL regenerates between sessions or after revalidation. The SVG `viewBox` is set to `0 0 canvasW canvasH`, so annotations scale correctly at any zoom level.

---

## 2026-05-19 — Annotation auto-save reads from refs, not state

**Decision:** `latestAnnotationsRef` and `latestBookmarksRef` mirror the annotations/bookmarks state. The debounced `triggerSave` function reads from these refs rather than from the state values at call time.

**Reason:** React closures capture state values at render time. If `triggerSave` captured `annotations` directly and the user made rapid changes (adding a bookmark immediately after drawing a highlight), the 1.5s-debounced save would fire with a stale `annotations` value, dropping the highlight. Refs always hold the current value regardless of when the closure was created.

**Impact:** Any future save-triggering operation must update both the state (for rendering) and the ref (for saving) together, using the same `next` array.

---

## 2026-05-19 — Annotated PDF download composites canvas + Canvas 2D drawing client-side

**Decision:** The "Download PDF" feature renders every page at 2× scale, draws annotation shapes on top using the Canvas 2D API (fillRect, strokeRect, arc, fillText), then assembles pages into a PDF using `jsPDF`. All processing happens in the browser; no server action is involved.

**Reason:** The original PDF is a Supabase signed URL accessible from the browser. All annotation data is already in client state. Server-side PDF generation would require re-fetching both the PDF and the user's annotations and adds latency. Client-side compositing reuses the same `pdfjs-dist` pipeline already used for display.

**Impact:** `jspdf` added as a dependency. Download time scales linearly with page count (~1–2s per page on a modern device). The output PDF is a raster image (JPEG pages), not a vector PDF — text is not selectable in the downloaded file, but the result prints cleanly. Print quality uses a fixed 2× scale regardless of the user's current zoom setting.

---

## 2026-05-11 — RLS enabled on all public tables; policies intentionally omitted

**Decision:** Turn on Row Level Security for the 9 remaining unsecured tables (`organizations`, `productions`, `announcements`, `production_scenes`, `scene_beats`, `stage_configurations`, `blocking_positions`, `note_tags`, `production_notes`) without writing any policies. Migration `enable_rls_on_public_tables` applied via Supabase MCP.

**Reason:** The app's data layer (Drizzle via `DATABASE_URL`) connects through the Supabase Postgres pooler with a role that bypasses RLS, so RLS-enabled-no-policies leaves the app working while closing the anon-key REST access path. Seven other tables (`profiles`, `rehearsal_reports`, `documents`, etc.) were already configured this way and continue to work; this brings the remaining tables in line with that convention. Defense-in-depth policies were considered but deferred — adding them would require auditing every read/write path and risks breaking access if the connection role ever changes; out of scope for the current Reports demo-parity work.

**Impact:**
- The Supabase advisory `rls_disabled` clears.
- Anon-key REST clients can no longer read or write any public table directly. All access goes through the Next.js server.
- If a future change moves data access from Drizzle to the Supabase JS client (anon key), policies will need to be written before that change ships.
- `calls` is the only table with actual policies; that remains a one-off until we revisit defense-in-depth.

---

## 2026-05-19 — RLS enabled on 8 tables added since the 2026-05-11 pass

**Decision:** Turn on Row Level Security for the 8 tables that were created (via `drizzle-kit push`) after the 2026-05-11 RLS pass and never had it enabled: `document_folders`, `document_comments`, `notifications`, `custom_set_pieces`, `beat_arrows`, `mentions`, `user_pins`, `script_annotations`. No policies written. Migration `enable_rls_on_unprotected_tables` applied via Supabase MCP.

**Reason:** Same rationale as the 2026-05-11 entry — `drizzle-kit push` does not manage RLS, so any table added after that pass shipped with RLS off and was fully exposed to the anon/authenticated PostgREST roles. The Supabase advisory flagged this as `rls_disabled` (critical). The app's Drizzle layer connects through the Postgres pooler role that bypasses RLS, and a grep confirmed no `supabase.from("<table>")` client access exists (only `supabase.storage`), so RLS-on-no-policies closes the anon REST path without affecting the app. This brings all 25 public tables in line with the convention.

**Impact:**
- The `rls_disabled` critical advisory clears; the 8 tables now show only the benign INFO-level `rls_enabled_no_policy`, identical to the other 23.
- Same future caveat: if data access ever moves to the Supabase JS client (anon key), policies must be written first.
- Unrelated: the security advisor still reports a WARN for `auth_leaked_password_protection` (HaveIBeenPwned check disabled in Auth settings) — not addressed here.

---

## 2026-05-20 — People directory uses Supabase Admin invites, not a separate invitation table

**Decision:** For the People directory mass-upload feature (Step 16), people
added before they sign up are created as real Supabase auth users in an
unconfirmed state via the Admin API (`auth.admin.inviteUserByEmail` /
`createUser`), rather than introducing a standalone `invitations` table or
decoupling `profiles` from auth users.

**Reason:** Supabase ships the standard SaaS invite flow as a built-in
primitive — `inviteUserByEmail` creates the user, generates the token, and
sends the email. Using it keeps `profiles` 1:1 with auth users, so
`organization_memberships` and `production_memberships` keep their existing
foreign keys and invited people can be assigned to productions immediately
(which the demo requires). The alternative — standalone profile records — would
have forced a migration rewriting `lib/auth.ts`'s identity model for no real
gain. The cost is one new server-only env var, `SUPABASE_SERVICE_ROLE_KEY`
(the Admin API cannot run on the anon key).

**Impact:**
- New `lib/supabase/admin.ts` service-role client; used only in server actions.
- `profiles.status` (`active | invited | inactive`) tracks invite state;
  `lib/auth.ts` promotes `invited` → `active` on first sign-in.
- The Supabase project must have the "Invite user" email template enabled.
- The demo's separate "permission level" concept was collapsed into Proscene's
  single role model — permissions remain role-derived; the People table's
  Permission column is a read-only role-derived tier.

---

## 2026-05-20 — People directory `profiles` columns applied via Supabase MCP

**Decision:** The four new `profiles` columns (`phone`, `pronouns`, `status`,
`last_active_at`) were applied to the `CallBoard` project with a direct
`apply_migration` call (`add_people_directory_profile_columns`) via the Supabase
MCP, not `drizzle-kit push`.

**Reason:** `npm run db:push` was run but the columns did not land on the
database (a query against `information_schema` afterward still showed the
original 7 columns). `drizzle-kit push` is interactive under `strict: true` and
is already documented in this repo as prone to hanging. Rather than chase the
push, the columns were applied directly — they are additive and either nullable
or defaulted (`status` defaults to `'active'`, so existing signed-up rows stay
correct), so direct DDL carries no risk. This matches the established fallback
("`drizzle-kit push` may hang — SQL was applied directly" in current-status).

**Impact:**
- The Drizzle schema in `db/schema/users.ts` and the live `profiles` table now
  match; a future `db:push` will be a no-op for these columns.
- If `db:push` is consistently failing locally, check the interactive prompt and
  confirm `.env.local`'s `DATABASE_URL` points at the `CallBoard` project.

---

## 2026-05-20 — Dropped two CHECK constraints to unblock `drizzle-kit push`

**Decision:** Dropped `beat_comments_body_check` and
`rehearsal_reports_status_check` from the `CallBoard` database (migration
`drop_check_constraints_for_drizzle_kit_push`).

**Reason:** `drizzle-kit push` (0.30.6) crashes during schema introspection
with `TypeError: Cannot read properties of undefined (reading 'replace')` while
parsing CHECK constraints — it never reaches the apply step, so nothing lands
(this is why an earlier `db:push` silently did nothing). The identical
unguarded line is present in the latest drizzle-kit (0.31.10), so upgrading
does not fix it; with this tooling the database can have CHECK constraints or a
working `push`, not both. The two constraints were added by ad-hoc SQL, were
never represented in the Drizzle schema (so a working push would have dropped
them as drift anyway), and both duplicate validation already enforced in server
actions — `features/blocking/actions.ts:232-234` trims and caps comment body at
2000 chars; report `status` is Zod-validated to `draft`/`distributed`.

**Impact:**
- `public` now has zero CHECK constraints; `drizzle-kit push` introspection no
  longer crashes.
- No data or table-structure change — beat comments and rehearsal reports
  behave identically. The only loss is a redundant DB-level backstop for two
  rules the app already enforces.
- If DB-level CHECK constraints are wanted again, schema changes must go through
  `apply_migration` (Supabase MCP) rather than `db:push`.

---

## 2026-05-20 — `schemaFilter: ["public"]` added to `drizzle.config.ts` (real `db:push` fix)

**Decision:** Added `schemaFilter: ["public"]` to `drizzle.config.ts`.

**Reason:** This is the actual root cause of the `drizzle-kit push` crash. With
`schemaFilter` omitted, drizzle-kit's config-prep treats it as "no filter" and
its introspection lists tables from **every** schema — including Supabase's
managed `auth` (43 CHECK constraints) and `realtime` (1) — then crashes parsing
those constraints (`TypeError: ... reading 'replace'`). The earlier removal of
the two `public` CHECK constraints did not help because the crash was on the
`auth`/`realtime` constraints, which must not be touched. Pinning
`schemaFilter` to `["public"]` scopes introspection to the app's own schema, so
`auth`/`realtime` are never read.

**Impact:**
- `db:push` introspects only `public` and no longer crashes.
- The earlier CHECK-constraint drop (previous entry) was not strictly necessary
  given this fix, but is harmless and left as-is — those constraints duplicated
  app-layer validation and were never in the Drizzle schema.

---

## 2026-05-21 — P0 security hardening for soft launch

**Decision:** Completed Phase 0 of `docs/launch-roadmap.md` — the security
fixes that gate inviting external testers.

**Changes:**
- **Signed-URL access control.** `getDocumentUrl`, `getDocumentDownloadUrl`
  (`features/documents/actions.ts`), `getAttachmentUrl`
  (`features/reports/attachments.ts`), and `getCustomSetPieceUrls`
  (`features/blocking/actions.ts`) previously accepted a client-supplied
  storage path and signed it with no checks. They now accept a record **id**,
  load the authoritative row from the DB, and verify access via the new
  `userCanAccessProduction()` guard before signing. A client can no longer pass
  an arbitrary path, and cannot get URLs for a production it is not part of.
- **`userCanAccessProduction()`** added to `lib/auth.ts` — mirrors the
  page-level gate (`productions:manage` reaches any production; everyone else
  needs a production membership).
- **HTML sanitization.** Added `isomorphic-dompurify` (new dependency, approved
  as decision D1) and `lib/sanitize.ts`. All `dangerouslySetInnerHTML` render
  paths — `RichTextDisplay` and the notes panel — now sanitize first, closing
  the stored-XSS vector in reports, announcements, and notes.
- **File-type validation.** `uploadDocument` and `uploadReportAttachment` now
  enforce a MIME allowlist (PDF, common images, Office documents), matching the
  pattern already in `uploadCustomSetPiece`.
- **Filename sanitization.** Document and report-attachment uploads now
  sanitize the filename used in the storage path (special chars → `_`),
  matching `uploadCustomSetPiece`. Original filenames are still stored for
  display.
- **Notes privacy.** Notes are private to their author (Step 11 removed shared
  visibility), but `getNotesByProduction` returned every member's notes. It now
  filters to the caller's own notes.

**Reason:** These were confirmed vulnerabilities, not theoretical risks. The
app has never been used by anyone outside development; external testers will
handle each other's data, so these fixes precede any P3 invite.

**Deferred (not P0 blockers):**
- Storage-bucket RLS is still permissive (any authenticated user can
  read/write/delete any object). The signed-URL access check above is the real
  gate; tightening `storage.objects` RLS by path is defense-in-depth, tracked
  for later.
- A broad sweep adding org/ownership checks to every mutating server action
  (e.g. `uploadDocument` trusts the passed `productionId`) is deferred to a
  later hardening pass — the signed-URL read leaks were the high-value fix.
- Leaked-password protection is a Supabase dashboard toggle, to be enabled by
  the project owner.

---

## 2026-05-21 — Uploads go client-direct to Supabase Storage (D4)

**Decision:** All file uploads (documents, report attachments, blocking set
pieces) now upload directly from the browser to Supabase Storage instead of
POSTing the file through a Next.js server action.

**Reason:** Vercel's serverless functions reject request bodies over ~4.5 MB on
every plan — an infrastructure limit, not a billing tier. The previous pattern
(`uploadDocument`, `uploadReportAttachment`, `uploadCustomSetPiece` each
received the `File` in `FormData`) would have failed in production for any
file larger than that, including typical script PDFs. Routing the file
straight to Supabase removes Vercel from the upload path; it is also faster,
cheaper, and the standard production pattern.

**New shape — each flow is now two server actions plus a direct upload:**
1. `request*Upload(... fileName, contentType, fileSize)` — checks permission,
   validates type/size, generates the storage path under the production's
   prefix, and returns a Supabase **signed upload URL** (`path` + `token`) via
   `createSignedUploadUrl`.
2. The browser uploads the file to that URL with `uploadToSignedUrl`
   (`lib/storage-upload.ts` → `uploadFileToSignedUrl`).
3. `finalize*Upload({ storagePath, ...metadata })` — inserts the DB row. It
   rejects any `storagePath` not under `{kind}/{productionId}/` so a caller
   cannot attach an arbitrary stored object to a production.

**Impact:**
- Upload size cap is now the Supabase bucket's file-size setting (50 MB on the
  free plan; higher requires Pro), not Vercel's body limit.
- `next.config.ts` still carries `bodySizeLimit: "25mb"` — now only relevant to
  the small metadata payloads; left as-is, harmless.
- Old single-action `upload*` functions were removed (no compatibility shim).

---

## 2026-05-22 — Sanitizer swapped: isomorphic-dompurify → sanitize-html

**Decision:** Replaced `isomorphic-dompurify` (added for the P0 XSS fix) with
`sanitize-html` as the rich-text sanitizer in `lib/sanitize.ts`.

**Reason:** `isomorphic-dompurify` depends on `jsdom` for server-side use.
On the deployed Vercel build it crashed at runtime whenever `sanitizeHtml`
ran inside a server component — every rehearsal-report detail page (which
renders TipTap HTML via `RichTextDisplay`) returned a 500. The build
compiled fine; the failure only surfaced in the serverless runtime. This is
a documented incompatibility between jsdom and the Next.js server bundler.

`sanitize-html` is a pure string parser with no `jsdom`/DOM dependency, so
it runs identically on the server and the client. Its allowlist in
`lib/sanitize.ts` is configured to match TipTap's output (StarterKit,
Underline, TextAlign, TextStyle/Color, Highlight, Mention), and preserves
`data-id` on mention spans so mention parsing still works.

**Impact:**
- `sanitizeHtml(html)` keeps the same signature — `RichTextDisplay` and the
  notes panel are unchanged.
- Supersedes the D1 decision (which chose `isomorphic-dompurify`).

---

## 2026-05-22 — P2 mobile navigation: slide-in drawer (not a bottom tab bar)

**Decision:** At phone widths (≤720px) the rail becomes a left slide-in
drawer opened from a hamburger button in a sticky top bar, rather than a
bottom tab bar. Tablet widths (721–1100px) keep the existing 64px icon
rail; the icon-collapse media query was rescoped from `max-width: 1100px`
to `min-width: 721px and max-width: 1100px`.

**Reason:** Proscene's navigation has two variable-length sections —
Workspace links (capability-gated) and the user's full Productions list.
A bottom tab bar fits only 4–5 fixed destinations and would have needed a
separate "More" sheet for everything else, splitting navigation across two
patterns. A drawer presents the entire existing rail unchanged, so there is
one nav surface and no per-item triage. It is also the smaller change: the
rail markup and capability filtering are reused as-is.

**Impact:**
- New client component `components/app-shell/app-frame.tsx` wraps the
  `(app)` layout and owns the drawer open/close state. The `Rail` server
  component is passed to it as a prop, so data fetching stays on the server.
- Drawer "open" is derived state (`openedOnPath === pathname`) — navigating
  closes it without a state-syncing effect, which also satisfies the
  `react-hooks/set-state-in-effect` lint rule.
- The closed drawer uses `visibility: hidden` (not only a transform) so it
  leaves the tab order and accessibility tree on mobile.
- If a bottom bar is wanted later it can be added alongside the drawer
  (roadmap P2 listed "drawer + bottom bar" as an option) without rework.

---

## 2026-05-22 — PWA icons: SVG manifest icons + generated PNG apple-touch-icon

**Decision:** The installable-PWA icons are SVG (`public/icon.svg` and a
maskable variant) referenced by `app/manifest.ts` with `sizes: "any"`. The
iOS `apple-touch-icon` is generated as a PNG at build time by
`app/apple-icon.tsx` using `next/og`'s `ImageResponse`. No raster icon
files are committed and no image-processing dependency was added.

**Reason:** This environment has no image tooling (`sharp`, ImageMagick,
`rsvg-convert` all absent), so hand-authored PNG icon sets were not an
option. Modern Android Chrome accepts SVG manifest icons, so a single
scalable SVG covers Android install and the favicon. iOS does **not**
support SVG touch icons, so that one icon must be a PNG —
`ImageResponse` renders the same "C" mark to a 180×180 PNG during the
build, which is the documented Next.js way to produce a generated icon
without a binary asset.

**Impact:**
- If pixel-tuned PNG icon sets are wanted later (e.g. for older Android or
  app-store assets in P5), they can be added to the manifest's `icons`
  array; the SVGs do not need to be removed.
- `next/og` is built into Next 16 — no dependency change.

---

## 2026-05-22 — Blocking + script tools are view-only on phones (interim)

**Decision:** On phone widths (≤720px) the blocking canvas and the script
editor are presented **view-only** — all editing is disabled, not just
left broken. Tablet and desktop keep full editing. This is an interim
state: the eventual goal is real touch editing, at least tablet parity for
the blocking tool (tracked under P2 "Touch interactions").

**Reason:** Both tools are mouse-built — the blocking canvas is @dnd-kit
drag-and-drop with a pointer-capture rotation handle; the script editor
creates annotations by click-drag drawing. On a touchscreen these
interactions are unusable, so a phone user who could "edit" would only
produce a frustrating, broken experience. Disabling editing lets them
still *view* blocking and scripts (the common phone use case — checking
staging or reading the script) cleanly.

**Implementation:**
- New `lib/use-is-phone.ts` — `useIsPhone()` via `useSyncExternalStore`
  over a `matchMedia("(max-width: 720px)")` query (SSR-safe, no
  setState-in-effect, matches the CSS mobile breakpoint).
- Blocking: `BlockingCanvas` already threaded a single `canEdit` prop
  through every edit affordance. The component now derives
  `canEdit = canEditProp && !isPhone`, so phone view-only needed no
  per-control changes.
- Script: `activeTool` is derived as `isPhone ? "pointer" : activeToolState`
  (locks the canvas to panning, no drawing); the drawing tool buttons and
  colour/cue options are hidden; `PanelAnnotationItem` gained a `readOnly`
  prop that hides its edit/delete controls.
- Script **bookmarks** were deliberately left usable on phones — they are a
  navigation aid (jump to a page), not annotation editing, and work fine by
  tap.

**Impact:**
- An editor-role user on a phone sees the same view-only experience that
  Cast/Crew already get for blocking — a tested code path.
- When touch editing is built, the `!isPhone` guards are the single place
  to relax (e.g. allow editing on tablet-sized touch devices).

---

## 2026-05-22 — Mobile primary nav: 5-tab bottom bar (supersedes the drawer)

**Decision:** At phone widths (≤720px) primary navigation is a 5-tab
**bottom bar** — Today / Calendar / Reports / Notes / More — rendered by
`components/app-shell/mobile-tab-bar.tsx`. The desktop rail is hidden at
this width. Tabs are **context-aware**: inside `/productions/[slug]/...`
they route to that production's sub-pages (overview / calls / reports /
notes); outside they route to the workspace equivalents (`/dashboard`,
`/calendar`, `/reports`). This supersedes the same-day slide-in drawer
decision earlier in the session.

**Reason:** After porting a Claude-design mobile demo (`design-reference/`
incoming files), bottom tabs were clearly the modern mobile pattern and
unlocked all the other mobile screen designs (Today, Reports list, Notes,
etc.), which the demo built around them. A drawer would have required
duplicating that screen work for a less familiar pattern. Context-aware
routing matches how the demo is laid out (production-scoped) without
forcing a global "current production" concept into our data layer.

**Impact:**
- New `app/(app)/(default)/more/page.tsx` hosts the destinations that fall
  off the tab bar: Productions, Documents, Announcements, Activity,
  People, Settings, Sign out (capability-gated like the desktop rail).
- The previous drawer code path is removed (`mobile-topbar`,
  `rail-backdrop`, `rail-close`, the off-canvas `.rail` rules); `AppFrame`
  is now a server component again — no client state needed for nav.
- `.main` gets bottom padding (tab-bar height + iOS safe area) so fixed
  content isn't covered.
- `Icon` gained `Sun` (used for the Today tab).
- The tab-strip-contained-scroller fix from earlier still applies.

---

## 2026-05-22 — Production tab strip is a contained scroller on phones

**Decision:** On phones the production header's tab strip (`.tabs`, up to 8
tabs) becomes a contained horizontal scroller rather than a dropdown or a
wrapped multi-row layout. `production-tabs.tsx` scrolls the active tab into
view on route change.

**Reason:** The flex row had no overflow handling, so a long tab list
widened the page and forced a sideways scroll of the whole screen. A
contained scroller (`overflow-x: auto` on `.tabs`, `flex-shrink: 0` tabs)
keeps every section reachable with one familiar pattern and is the
smallest, lowest-risk change — the existing tab markup and active-state
logic are untouched. A dropdown would hide the at-a-glance row; wrapping to
multiple rows is visually noisier and eats vertical space.

**Impact:**
- Scoped to ≤720px so desktop/tablet are unchanged.
- If the strip ever overflows at narrow tablet widths too, the same rules
  can be widened to that range.

---

## 2026-05-27 — App rename: "CallBoard" → "Proscene"

**Decision:** The product is renamed from **CallBoard** to **Proscene**.
The `callboard` domain could not be secured, so a different name was
chosen. The product URL will be **`proscene.app`** (the `.app` TLD).
DNS / Vercel domain wiring happens in P4–P6.

**Scope of the rename (this change):**
- Rail wordmark `Call<em>Board</em>` → `Pro<em>scene</em>` and the rail
  mark glyph `C` → `P`.
- Auth screens (login, signup, forgot-password, reset-password): the
  `.auth-mark` glyph `C` → `P` and the `.auth-wordmark`
  `Call<em>Board</em>` → `Pro<em>scene</em>`.
- PWA manifest (`name`, `short_name`) and root metadata (`title`,
  `applicationName`, `appleWebApp.title`).
- Apple touch icon (`app/apple-icon.tsx` glyph) and the SVG icons
  (`public/icon.svg`, `public/icon-maskable.svg`) — the `C` mark is now a
  `P`. The dark-brown `#28231f` square and italic Georgia type are
  unchanged.
- Rehearsal-report email footer: "Sent via CallBoard" → "Sent via Proscene".
- `package.json` / `package-lock.json` `name` field: `callboard` → `proscene`.
- Inline brand references in `docs/` updated to "Proscene" where they
  refer to the app brand.

**Intentionally NOT changed:**
- The Supabase project is still literally named `CallBoard` in the
  Supabase dashboard. Backticked `` `CallBoard` `` references in the
  docs (e.g. "applied to the `CallBoard` project via Supabase MCP")
  point to that project identifier and remain accurate. Renaming the
  Supabase project is a separate operation on the Supabase side.
- Historical changelog entries that read "the stale 'Show Portal' brand
  corrected to 'CallBoard'" are left as-is — they describe an earlier
  fix at the time it happened.
- Domain references in `launch-roadmap.md` (`callboard.com`,
  `app.callboard.com`) are stale and will be updated once the new
  domain is confirmed.
- All design tokens / colors / typography are unchanged.

**Reason:** Naming follows the domain. We could not get the `callboard`
domain; "Proscene" was the chosen alternative. The wordmark split
`Pro<em>scene</em>` mirrors the original `Call<em>Board</em>` italic
treatment, so the rail keeps the same visual weight without any CSS
changes.

---

## 2026-05-27 — Email pipeline + custom domain wired end-to-end

**Decision:** `proscene.app` (registered at Namecheap, same day as the
rename) is wired to both Vercel (as the app's custom domain) and Resend
(as a verified sending domain), and Supabase Auth uses Resend as its
custom SMTP provider. This resolves **D2** (email deliverability) fully —
the P3 application-flow checks were previously blocked on real email
delivery.

**The wiring, end to end:**

- **Namecheap DNS (Advanced DNS tab):**
  - For Resend (sending): Mail Settings switched to **Custom MX** so the
    MX type becomes available; MX on `send` →
    `feedback-smtp.us-east-1.amazonses.com` priority 10; TXT (SPF) on
    `send` → `v=spf1 include:amazonses.com ~all`; TXT (DKIM) on
    `resend._domainkey` → Resend's `p=...` value; TXT (DMARC) on `_dmarc`
    → `v=DMARC1; p=none;`.
  - For Vercel (app traffic): A record on `@` → `76.76.21.21`; CNAME on
    `www` → `cname.vercel-dns.com`. The default Namecheap parking
    CNAME/URL Redirect on `@` was deleted first to avoid the conflict.
  - The Resend `send.` MX and Vercel apex A coexist because they're on
    different hosts.
- **Resend:** domain `proscene.app` verified; API key created with
  *Sending access* (least privilege) scoped to `proscene.app` and used as
  the SMTP password (Resend's SMTP gateway accepts any API key as the
  password — no separate SMTP credential).
- **Supabase → Project Settings → Authentication → SMTP Settings:**
  Custom SMTP enabled, host `smtp.resend.com`, port `465` (implicit
  TLS), user `resend`, password is the Resend API key, sender
  `noreply@proscene.app`, sender name `Proscene`.
- **Supabase → Authentication → URL Configuration:** Site URL set to
  `https://proscene.app`; redirect-URL allowlist covers
  `http://localhost:3000/**`, `https://call-board.vercel.app/**`,
  `https://proscene.app/**` (the `/**` glob keeps future routes
  reachable without re-allowlisting).
- **Vercel → Settings → Domains:** `proscene.app` added as a domain
  alongside the auto-assigned `call-board.vercel.app`, then promoted to
  Primary; `www.proscene.app` added with redirect to apex. Let's Encrypt
  certs auto-provisioned within ~1 min of DNS verification.
- **Vercel → Settings → Environment Variables (Production / Preview /
  Development):** `NEXT_PUBLIC_SITE_URL=https://proscene.app`,
  `RESEND_FROM_EMAIL=noreply@proscene.app`.
- **`.env.example`** updated to default `RESEND_FROM_EMAIL` to
  `noreply@proscene.app` so a fresh clone matches production. Local
  developers using a different sender for testing should override in
  `.env.local`.

**What's verified:** Supabase Dashboard → Authentication → Users → Send
Magic Link delivered an email from `noreply@proscene.app`; the link in
the email points to `https://proscene.app/...` (proves both SMTP and
Supabase Site URL config are correct); after the Vercel DNS hookup the
link resolves to the live app.

**Not yet verified — these belong to P3:** the app's `/forgot-password`
flow (different code path — uses `NEXT_PUBLIC_SITE_URL` for `redirectTo`
rather than Supabase's Site URL); the member-invite flow end-to-end
(needs a non-self test email); a rehearsal-report email from
`features/reports/send-report.ts`.

**Intentionally NOT done in this pass:**

- **Inbox at `proscene.app`** (e.g. `feedback@proscene.app` →
  personal Gmail). Recommended path is ImprovMX (free) when wanted —
  separate MX records on the apex coexist fine with the Resend `send.`
  MX. Skipped for now because nothing on the app side needs a
  receiving inbox; sender addresses don't require a mailbox to exist.
- **Rename the Supabase project from `CallBoard` to `Proscene` in the
  Supabase dashboard.** Cosmetic only — connection strings and keys
  are tied to the project ref, not the display name. Deferred so
  backticked `` `CallBoard` `` references in the docs stay accurate
  until renamed.
- **Rename the Vercel project from `call-board` to `proscene`.** Would
  change the auto-assigned `*.vercel.app` URL and break bookmarks for
  the old one; deferred until after beta.

**Reason:** The whole P3 beta plan depends on reaching external testers
by email — Supabase's built-in SMTP is rate-limited to 2/hr in sandbox
mode, which silently breaks signup confirmation and password reset for
real recruits. Wiring a verified sending domain end-to-end was the
single biggest unlock left for the soft launch.

**Impact:**
- Email deliverability is no longer a blocker for any P3 work.
- `proscene.app` is the canonical public URL; auth emails, password
  resets, member invites, and rehearsal-report emails all originate
  from `noreply@proscene.app` and link back to `proscene.app`.
- HSTS preload for the `.app` TLD means there's no HTTP fallback;
  Vercel cert provisioning is now part of the critical path for any
  future domain change.

---

## 2026-05-27 — Two-step OTP confirm page (`/auth/confirm`)

**Decision:** All Supabase email-link OTP flows (invite, password
reset, signup confirmation, email change) route through a custom
`/auth/confirm` page rather than the default `{{ .ConfirmationURL }}`
magic-link path. The page renders a Proscene-branded "Continue"
button on GET (safe for link scanners to pre-fetch) and only
consumes the OTP when the form POSTs.

**Why:**
First real invite to a Gmail address landed on
`/login?error=auth_callback` with `otp_expired` in the hash.
Supabase auth logs showed two GET `/verify` hits on the same OTP
8 seconds apart — first succeeded (`user_signedup` event), second
failed (`One-time token not found`). A link scanner / pre-fetcher
(Gmail safe-browsing, antivirus, link unfurler — common with
Gmail addresses) consumed the OTP before the human clicked.
Standard Supabase recommendation for this is a two-step page where
GET doesn't touch the token; only the user's POST does. PR #14.

**Implementation:**
- New `app/auth/confirm/page.tsx` server component with an inline
  server action.
- Email templates use a custom `href` of
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...&next=...`
  instead of `{{ .ConfirmationURL }}`. The "Invite user" template
  already uses this; the "Reset Password" template was updated the
  same day.
- Different `type` values get different button copy and title (e.g.
  "Accept invitation" for invite, "Reset password" for recovery)
  but share one page implementation.

**Impact:**
- Invite + password-reset flows are reliable on Gmail (and any
  inbox with malware scanning / link previewers).
- Any future OTP-based flow inherits the fix automatically.

---

## 2026-05-27 — D5 locked: single-org launch, multi-org in beta week 1

**Decision:** Beta launches with a single shared organization (one
non-profit theatre company), and the multi-organization refactor
ships within the first week so additional companies can be invited
into walled-off workspaces. This locks **D5** in the launch
roadmap.

**Background:**
The schema has supported multi-org from day one
(`organizations`, `organization_memberships`, `organizationId`
filters in every query). The runtime is what pins everyone to a
single org: `getCurrentUser()` in `lib/auth.ts` calls
`getOrCreateDefaultOrganization()` and always returns that default,
so every signup lands in the same workspace and every user sees
every other user's productions / people / announcements. Fine for
one tester company; a privacy bug for two.

Options weighed:
- **A — Stay single-org for beta.** Zero engineering work; only one
  theatre company can be invited. Rejected — user plans to bring on
  additional companies in week 1.
- **B — Add real multi-org now.** ~half a day of careful refactor;
  unblocks the actual beta plan. **Selected.**
- **C — Separate Supabase + Vercel deploy per org.** Pure ops cost,
  N copies of the app to keep in sync. Rejected.

**Scope for week-1 multi-org work (Option B):**
1. `getCurrentUser` looks up the user's actual org membership
   rather than always returning the default.
2. Self-signup creates a fresh org with the new user as admin
   (instead of joining them to the default org as cast).
3. Invited users still join the inviter's org — `inviteMembers`
   already does this correctly via `currentUser.organizationId`.
4. Org name display wired through wherever "Default Organization"
   is rendered (announcements scope badge, invite email metadata,
   Settings header, etc.).
5. An org-switcher in the rail/Settings if a user ever ends up in
   multiple orgs — likely deferred from week 1, can ship later.

**Impact:**
- Multi-org moves from long-term roadmap to during-beta Tier 1.
- Reflected in `current-status.md` ("Not implemented" section
  flags it as "queued for beta week 1") and `docs/tester-guide.md`
  (under the "During beta — week 1" tier).
