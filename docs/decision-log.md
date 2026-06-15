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

---

## 2026-05-28 — Multi-org refactor shipped (D5 week-1 work)

**Decision:** Implemented the multi-org refactor scoped in the
2026-05-27 D5 entry. New self-signups create a fresh organization
with the new user as admin; invited users continue to land in the
inviter's org; the global "Default Organization" singleton is
gone from runtime (the existing prod row is left in place, will
be renamed via Supabase or a future Settings UI).

**Implementation:**
1. `lib/organization.ts` — `getOrCreateDefaultOrganization()`
   deleted, replaced with `createOrganization(name)` that slugifies
   the name and retries with a short hex suffix on collision.
2. `lib/auth.ts` — `getCurrentUser` reads the user's actual
   `organization_memberships` row. Profile-missing path (self-signup)
   creates a new org from `auth.user_metadata.organization_name` and
   makes the user admin. Profile-present-but-no-membership path
   recovers by creating a fresh admin-of-one org so the user is
   never stuck.
3. `app/actions/auth.ts` — signup action requires
   `organization_name` (form field) and writes it to
   `auth.signUp().options.data` so the auth helper can read it back
   on first login.
4. `app/signup/signup-form.tsx` — added a required Organization name
   field with hint copy "You can rename this later."
5. Callsite sweep — all `const org = await
   getOrCreateDefaultOrganization()` calls (~25 pages and feature
   actions) now use `user.organizationId` directly. Verified
   callers were only reading `org.id`, never `org.name`/`org.slug`.

**Product calls made on the way:**
- Existing "Default Organization" row in production: **left as is,
  rename later** (via Supabase or future Settings UI). Existing
  testers keep all their data; new self-signups branch off.
- Org name source on signup: **required field on the signup form**,
  not auto-derived from the user's first name. Reasoning: the org
  is the workspace label other members will see — picking it
  consciously beats `Jane's organization` showing up to invitees.

**Explicitly NOT shipped in this round:**
- Settings UI to rename the current org (admin can rename via
  Supabase Studio for now; SQL one-liner).
- Org switcher in the rail / Settings. Deferred per the 2026-05-27
  entry — comes online when a user actually ends up in multiple
  orgs, which can't happen yet through the UI.
- Promote-to-org-creator flow for existing testers in the default
  org (they stay where they are).

**Impact:**
- Closes the D5 week-1 deliverable on the launch roadmap.
- Beta can now invite a second theatre company; they get a fully
  walled-off workspace.
- Multi-org marker removed from `current-status.md` "Not
  implemented"; new "Multi-org refactor (2026-05-28)" section added.

---

## 2026-05-29 — Settings overhaul: account, workspace, org switcher

**Decision:** Shipped the deferred items from the 2026-05-28 multi-org
entry (rename workspace, org switcher) plus a real account-settings
page and a last-admin safeguard on the members page.

**Implementation:**

1. **Schema:** added `profiles.selected_organization_id` (uuid,
   nullable, FK to `organizations.id` on delete set null).
   `getCurrentUser` now reads it to resolve which org the user is
   viewing, with self-healing fallback to the user's first membership
   when the selection is stale (org deleted, user removed from the
   selected org, never set). `CurrentUser` carries `organizationName`
   so the rail / settings header don't need an extra query.
2. **`/settings/account`:** every user can edit first/last name,
   phone, pronouns; change password (verify current via
   `signInWithPassword`, then `updateUser({ password })`). Email
   stays read-only — changing it requires a re-verification flow that
   we're deferring.
3. **`/settings/workspace` (admin only):** rename the current
   workspace (60-char cap; slug stays stable since slugs aren't
   user-facing). Shows member + admin counts. Links to members for
   role changes.
4. **Org switcher:** `WorkspaceRailBadge` always shows the current
   workspace name just below the rail brand. Click opens a menu with
   the user's other orgs, or "No other workspaces yet" when they only
   belong to one. Same switcher inline on the settings landing.
   `switchOrganization` server action verifies the caller is a member
   of the target org, writes `selected_organization_id`, and
   revalidates the layout; client side calls `router.refresh()`.
5. **Members — last-admin safeguard:** refuse to demote OR remove
   the only remaining admin. Defense in depth on top of the existing
   "can't change/remove yourself" rules. Surfaces a clear error
   ("Promote another admin first — this workspace needs at least
   one.") so the user knows what to do.
6. **Settings landing** reframed around the workspace: org name as
   the headline, signed-in user + role below, switcher inline, then
   destinations (Account, Workspace, Members, Send feedback).

**Product calls made on the way:**
- "Always show the current workspace label" wins over "hide the
  switcher until needed" — even when the user has one org, the badge
  shows the name and clicking it explains they can join more via
  invitation. Discoverability over chrome.
- "Last admin" safeguard ships in this round, not later — cheap to
  add now, prevents a workspace from getting into a zero-admin state
  that would lock everyone out of settings.
- Email change is **out of scope** this round (needs a re-verification
  flow). Profile form labels the field read-only with a hint.
- Delete workspace / delete account are **out of scope** — easy to
  do wrong; will revisit when actually requested.

**Explicitly NOT shipped:**
- Email change with re-verification.
- Delete workspace / delete account / transfer-workspace flows.
- Account-level avatar upload.
- Workspace logo / branding fields.

**Impact:**
- Multi-org is now fully usable end-to-end through the UI (no Supabase
  Studio required to rename, switch, or recover from stale selection).
- Users with multiple memberships get a real switcher.
- Workspaces are protected from accidental zero-admin states.

---

## 2026-05-29 — New-production builder (full-setup wizard + quick add)

**Decision:** Replace the single-form `/productions/new` with a two-path
creation flow surfaced from the "+" menu on `/productions`: a 6-step **Full
setup** wizard (ported from the design's `new-production.jsx`) and a small
**Quick add** modal. The wizard is one component used two ways — a full-screen
**overlay** in-app (lazy-loaded) and a linkable, refresh-safe **page** at
`/productions/new` — rather than Next.js intercepting/parallel routes.

**Reason:** The user supplied the wizard design and wanted both an in-app
overlay and a shareable link. Intercepting routes deliver "both" but are
fragile on this repo's pinned Next 16 (see `AGENTS.md`); a single component
rendered full-screen in either context is simpler and loses no progress on
refresh. Persisting everything (the user's explicit choice) required new
schema.

**Impact:**
- Schema (additive): `productions` gains `venue`, `season`,
  `first_rehearsal_date`, `tech_start_date`, `rehearsal_days` (jsonb),
  `rehearsal_start`, `rehearsal_end`; new tables `production_departments` and
  `production_roles`. Applied to the `CallBoard` Supabase project via MCP
  (matches `drizzle-kit push` output); RLS enabled to match every other table.
- Team invites reuse the existing Supabase Admin invite path. Inviting
  *new* people needs `settings:manage`, so producers (who have
  `productions:manage` but not `settings:manage`) can assign existing org
  members but cannot create brand-new accounts from the wizard — those rows
  are reported as skipped on the launch screen instead of failing the launch.
- Wizard tokens are inherited from `:root` (the duplicate token block from the
  source CSS was dropped) so the wizard follows the dark/cool theme switch.

---

## 2026-05-29 — Rehearsal scheduler UX overhaul

**Decision:** Restyle the call create/edit form into Outlook-style grouped
cards (`.cform-*`); make the week view a responsive swipeable strip (3 days on
phone / 5 on tablet / 7 on desktop) with a frozen time-gutter and frozen day
headers; add an in-calendar create affordance (toolbar button + mobile FAB)
that opens the call form as a **slide-in tray** (right drawer on desktop,
bottom sheet on phones) instead of navigating to a page; default a new call's
start to the next whole hour and its end to start + 2h.

**Reason:** The previous flow felt clunky on mobile (full-page form, crowded
7-day week, no obvious "create"). Reference was Outlook/Teams mobile.

**Impact / notes:**
- `createCall`/`updateCall` now return `{ success }` instead of redirecting, so
  the tray closes + `router.refresh()`es in place while the full-page routes
  (still used for deep links / edit) navigate themselves.
- Week columns are sized in JS to exact px (percentage grid tracks resolved
  unreliably inside a horizontally-overflowing scroller); the grid uses
  `width: max-content` so the sticky gutter stays pinned across the whole week.
  `.cal-main` needed `min-width: 0` so the strip overflows internally instead
  of blowing out the layout.
- Tray slide uses dedicated keyframes; the mobile sheet has a fixed height +
  grab bar (drag/tap to dismiss).

---

## 2026-05-29 — Script reader: immersive mobile reader + freehand ink

**Decision:** On phones, route the script tab to a dedicated immersive reader
(`MobileScriptReader`) instead of the view-only desktop viewer; `ScriptScreen`
switches by `useIsPhone`. The reader has continuous windowed scrolling, a
floating page scrubber, a page-grid navigator (search + bookmarks), brand
styling, and a slide-up entrance. Phase 2 adds **freehand ink** (highlighter /
pen / eraser + colors) as a new `InkAnnotation` type, **private per user**.
The desktop viewer also gained additive tweaks (keyboard nav, jump-to-page,
prefetch, fit-width, a Read-mode overlay that reuses the reader, bookmark
search) with **no change to its annotation model**.

**Reason:** The reader needed to feel native on mobile (reference: GoodNotes /
Noteful). Freehand ink is the natural touch annotation; private-per-user
matches the existing `script_annotations` model.

**Impact / notes:**
- `InkAnnotation` (normalized `points`, `tool`, `size` as a fraction of page
  width) added to the annotation union with `INK_SIZES`/`INK_OPACITY`/
  `inkPathD`. Desktop renders ink **read-only** (SVG + PDF-export compositor)
  and the annotations side panel ignores it; the desktop Read-mode overlay is
  `allowDrawing={false}`.
- Drawing: the active stroke is tracked in a ref and drawn imperatively into a
  single fixed overlay `<path>` (no per-move React renders), committed once on
  pointer-up. While a tool is active the page scroll is locked
  (`overflow:hidden` + `touch-action:none`) so a finger draws cleanly; navigate
  via the scrubber or close the palette. The eraser is a point/segment eraser
  (keeps surviving runs as separate strokes).
- We did NOT mutate the source PDF (it's licensed material) — annotations are
  an overlay only.

---

## 2026-05-29 — Archive productions, transfer ownership, workspace logo (PR #20 follow-up pass)

**Decision:** Same-day follow-ups that landed on top of the initial
settings overhaul before PR #20 merged.

**1. Productions are soft-archived, never hard-deleted.**

New column `productions.archived_at TIMESTAMPTZ` + composite index on
`(organization_id, archived_at)`. Null = active.
`archiveProduction` / `unarchiveProduction` server actions, gated by
`productions:manage`, org-scoped (stale ids from another workspace
are a no-op).

`getProductionsByOrganization` and `getUserProductions` now filter
archived by default; `getArchivedProductionsByOrganization` is the
explicit list for the disclosure section on `/productions`.
`getProductionBySlug` deliberately doesn't filter — admins can still
deep-link into an archived production's pages.

**Why archive instead of delete:** every production accumulates
substantial downstream history (rehearsal reports, calls, blocking,
documents, notes). Hard delete would either cascade-destroy that
history or fail on FK constraints. Archive preserves everything and
is reversible. Hard delete remains explicitly out of scope.

**2. Transfer workspace ownership.**

New `transferWorkspaceOwnership(targetUserId, newSelfRole)` server
action runs in one DB transaction:
1. If target isn't already admin, promote them.
2. Demote caller to chosen non-admin role.

Order matters: by promoting first, a mid-transaction failure still
leaves the workspace with at least one admin. Refuses
self-targeting, refuses `admin` as the new self-role (stepping down
"to admin" is meaningless), refuses transfer to a non-member
(promote-via-invite isn't supported — invite first, then transfer).

Form on `/settings/workspace`. Empty state when caller is the only
member.

**3. Workspace logo (SVG / PNG / JPG, square, ≤2MB).**

New column `organizations.logo_url TEXT` — stores a Supabase Storage
path inside the existing `attachments` bucket
(`org-logos/{orgId}/{ts}.{ext}`). Two-step upload mirrors the report
attachment pattern: `requestWorkspaceLogoUpload` returns a signed
upload URL, browser uploads directly to Storage, then
`finalizeWorkspaceLogoUpload` writes the column and best-effort
deletes the previous file. `removeWorkspaceLogo` clears + deletes.

Server-side validation: admin role, MIME allow-list (SVG/PNG/JPG),
2MB cap, storage path locked to the caller's workspace (defends
against a forged finalize call pointing at another org's prefix).

Client-side validation: same MIME allow-list, 2MB cap, square shape
check using a 5% tolerance (a 500×501 PNG passes). SVGs skip the
shape check — they can ship without intrinsic dimensions and we
trust the uploader.

`lib/workspace-logo.ts` exposes `getSignedLogoUrl(path)` wrapped in
`cache()` so the rail + page headers share a single signed URL per
request. `CurrentUser` gained `organizationLogoUrl` so consumers
don't run an extra org query.

**4. Inline UX polish that came with the round:**
- "Create new workspace" inline form inside the rail badge menu and
  the settings switcher (server action `createWorkspace`).
- Password-confirm-match check fires while typing on
  `/settings/account`, sets `aria-invalid` + `aria-describedby`,
  and disables submit until both fields match.

**Explicitly NOT shipped (per product decision this session):**
- **Email change with re-verification** (a.k.a. "email linking" /
  "rebind email"). The `/settings/account` email field stays
  disabled with a hint. A fresh session reading docs should treat
  this as deferred-on-purpose, not missing work. We'll revisit if
  beta testers actually ask for it.
- Delete workspace / delete account.
- Transfer to a non-member (invite + transfer is the supported path).
- Account-level avatar.

**Impact:**
- Workspaces can rebrand themselves end-to-end (name + logo).
- Admins can hand off a workspace without database edits.
- Productions can be tidied away without losing history.
- Multi-org is now genuinely usable from inside the app — no
  Supabase Studio required for anything in the workspace lifecycle.
- PR #20 merged to `main` 2026-05-29 (commit 2792a4b).

## 2026-05-29 — Dashboard redesign builds RSVP + announcement acks; desktop-only re-skin

**Decision:** Adopt the uploaded dashboard draft as the **desktop** dashboard
and build the two net-new features it implied — **call confirmations (member
self-confirm RSVP)** and **announcement acknowledgements (Acknowledge
button)** — as real vertical slices with their own tables
(`call_confirmations`, `announcement_acks`). The phone dashboard is left as-is
behind a CSS gate rather than re-skinned in this pass.

**Reason:** The draft looked "cosmetic" but several populated tiles (confirmed
roster, ack progress) had no backing data. The user chose to build the
features rather than degrade/stub them. Most other draft elements (countdown,
Today timeline, week-to-opening, principal avatars, per-show unread) were
derivable from existing schema, so only the two RSVP/ack tables were added.
Keeping the proven phone experience avoided a risky full mobile rewrite (no
mobile-dashboard source was provided in the upload).

**Impact:** Two additive tables (RLS-enabled, app-enforced uniqueness, per the
composite-unique-constraint known issue). RSVP/ack interactions are idempotent
toggles. The desktop dashboard diverges visually from phone; both read the
same data. Follow-ups (event-drawer RSVP, phone bento parity) tracked in
open-questions.

## 2026-05-29 — Theme preference: cookie-based, no-flash, light/dark/system

**Decision:** Dark mode is a **device preference stored in a cookie**
(`proscene-theme`), not a per-user DB column. The root layout reads it
server-side for a no-flash first paint; an inline script resolves "system"
before paint. Switch lives in Settings → Appearance + mobile More + a rail
quick toggle.

**Reason:** Theme is a per-device/browser concern, so a cookie (readable in the
server layout) gives correct SSR with no flash and no schema change. A DB
column would flash (client-only) and wrongly sync across a user's devices.
`useSyncExternalStore` (not setState-in-effect) keeps it lint-clean and
flicker-free.

**Impact:** No schema change. `body[data-theme]` is now dynamic (was hardcoded
`warm`). Future per-workspace branding or additional themes (the `cool` token
set already exists) can extend the same mechanism.

---

## 2026-06-03 — Announcement notifications: scope-based fan-out, channel preferences, push deferred

**Decision:** Announcements now actively notify their audience instead of being
pull-only. Targeting is **scope-based**, not a new mention syntax: on create,
`createAnnouncement` fans out to org members (org-wide announcements) or
production members (production-scoped), excluding the author. Delivery is
per-user across channels stored in a new `notification_preferences` table
(`in_app`, `email`, `push`). In-app reuses the existing `notifications` table
(surfaced by a now-**global** bell in the rail foot — previously the bell only
existed inside a production layout). Email reuses the existing Resend pipeline.

**Reason:** An announcement is already a broadcast object whose audience is
defined by its scope; requiring authors to also @mention a group would be
redundant and easy to forget. Reusing scope keeps authoring foolproof and
reuses the audience logic already in `getAckInfoForAnnouncements`.

**Push deferred (Phase 2):** there is no native app or PWA push transport yet.
The `push` channel is modeled in the schema/UI (disabled "coming soon" toggle)
but inert — nothing delivers it. The realistic future path is Web Push (PWA:
manifest + service worker + VAPID + a `push_subscriptions` table), with the
caveat that iOS only delivers Web Push after "Add to Home Screen". Chosen over a
third-party push service (e.g. OneSignal) to avoid an external dependency.

**Impact:** New table `notification_preferences` (uniqueness on `userId`
enforced in app code, per the drizzle-push constraint note — run
`npm run db:push` to apply). New `features/notifications/announce.ts`
(fan-out + email) and `preferences.ts`. The notification bell moved from
`app/(app)/productions/[slug]/notification-bell.tsx` to
`components/app-shell/notification-bell.tsx` and is rendered globally in the
rail (removed from the production topbar to avoid duplication). New settings
page `/settings/notifications`. Implemented but **not yet browser-verified**.

---

## 2026-06-03 — Orphaned (login-less) profiles: diagnosis, cleanup, invite hardening

**Context:** A password reset for a member shown in the org (`mgrigsby.beazleyrealtors@gmail.com`) never delivered. Investigation via the live Supabase project found the address had a `profiles` row but **no `auth.users` account** — so Supabase silently 200s the reset (anti-enumeration) and sends nothing. Several such orphan profiles existed (1 real director, 10 `@wellmantheatre.org` demo/seed rows from one 2026-05-14 batch, and 2 duplicate `katieandmikeyplaygames` rows alongside the real login).

**Root cause:** logins link to profiles by `profiles.id == auth.users.id` (`lib/auth.ts`). The current invite flow is correct (creates the auth user first, then `profile.id = auth.id`). The orphans are **legacy** rows with random ids and no auth account; on signup they can't link, so a fresh self-signup profile + new org is created instead (this is how the katie duplicates arose). Additionally, `inviteMembers` assumed "profile exists ⇒ login exists", so re-inviting an orphan just added a membership and reported success without provisioning an account.

**Security assessment:** NOT a vulnerability in the exploit sense. Orphans have no auth row (no password, no session). Because linking is by auth UID (not email), signing up with an orphan's email yields a new account + new org and does **not** inherit the orphan's role/memberships. Latent risk noted: any future "reconcile by email" logic must be gated on verified email ownership and limited to the admin invite flow.

**Decisions / actions:**
1. **Data cleanup (production):** deleted the orphan director profile + the 2 duplicate katie profiles (all login-less, no authored content; FKs to `profiles.id` are all CASCADE). Left the 10 `@wellmantheatre.org` demo rows in place for now.
2. **Invite hardening (code):** `inviteMembers` now calls `auth.admin.getUserById` on a matched profile; if there's no login it deletes the orphan and falls through to the normal create path (real auth account + invite email).
3. **UX:** member list shows a "Pending invite" badge for `profiles.status = 'invited'`.

**Impact:** Bundled into branch `claude/keen-bardeen-kSndq` / PR #25. No schema change. Remaining: demo rows still present; broader backfill of any other legacy orphans not done.

---

## 2026-06-03 — Announcement notifications surface as an acknowledge banner (not a bell)

**Context:** The rail-foot notification bell worked but crowded the footer (avatar, name, role, theme, settings, logout) and had no mobile surface (rail is hidden on phones). Announcements are infrequent but important (schedule/room/last-minute changes).

**Decision:** Replace the bell with a **top-of-content acknowledge banner**. It appears only when the user has unacknowledged announcements in their audience and clears as each is acknowledged. Acknowledging from the banner records the same `announcementAcks` row managers already see rolled up on the announcements page ("N/M acknowledged"). Because it lives in the content column, it also shows on phones — closing the earlier mobile gap.

**Implementation:**
- `getUnacknowledgedAnnouncements(userId, orgId, productionIds)` — audience-scoped (org-wide + user's productions), excludes the user's own posts, 30-day window so enabling acks doesn't resurface ancient notices.
- `AnnouncementBanner` (server) in the `(app)` layout via `AppFrame`'s new `banner` slot → `AnnouncementBannerClient` (optimistic dismiss, reuses `acknowledgeAnnouncement`).
- Removed `NotificationBell` from the rail foot (and its unread-count fetch).

**Consequences / open items:**
- Email fan-out unchanged (still gated by the user's email preference).
- `fanoutAnnouncement` still writes `notifications` rows and `notification-bell.tsx` still exists, but **nothing renders them now** — dead until a future header "notification center." Document-comment notifications (which also write to `notifications`) likewise have no surface currently. The `notification_preferences` "in-app" toggle is therefore a no-op for the moment (the banner always shows for unacked items). Tracked in open-questions; cleanup or a header center is a follow-up.

---

## 2026-06-05 — Marketing website ported into the app (interim same-repo)

**Decision:** The standalone ProScene marketing site (hand-built static
HTML/CSS/JS — home, features, pricing, reviews, blog, blog post, FAQ) is
ported into this repo under a new `app/(marketing)/` route group, to be
**split into its own repo before public launch**. Chosen approach and
constraints:

- **Same repo now, separate repo at launch.** Building in-repo during the
  pre-launch phase keeps the convenience of one stack/deploy while there is
  no real traffic or live payments to protect; the site is extracted to its
  own repo (its own minimal env, no product secrets) before going public so
  the public marketing surface and the product don't share a blast radius.
- **CMS = Payload (planned, not yet installed).** Self-hosted in the same
  stack, content stored in the existing Supabase Postgres. Requires bumping
  `next` 16.2.3 → ≥16.2.6 (`@payloadcms/next` peer floor) — deferred to its
  own slice and to be verified on a preview deploy before merging.
- **Faithful-HTML render, not full JSX componentization.** Page bodies are
  rendered via `dangerouslySetInnerHTML` from authored, static, no-user-input
  content (safe; flagged not hidden). Shared chrome (Nav/Footer) and all
  interactions (reveal-on-scroll, mobile menu, pricing toggle, FAQ
  search/scrollspy, feature demo engine, blog tabs) are real React/client
  components. Rationale: content migrates into Payload collections later, so
  hand-componentizing every section now is largely throwaway.
- **Style isolation via `.ps-site` scope.** The marketing `site.css` shares
  token names with the app's `globals.css` and the app has a `body[data-theme]`
  dark/dusk system. Marketing tokens + base styles are redeclared on a
  `.ps-site` wrapper so they cannot leak into the app and the app's theme
  switching cannot recolor marketing pages. Per-page `<style>` blocks are
  scoped under `[data-page="…"]`. `feature-demos.css` + `dash-hero.css` are
  imported only on `/features`.

**Reason:** Matches the user's priorities — full control over tracking/ads,
shared design + integrated signup, and editability via a CMS — while keeping
the live product untouched and the eventual repo split cheap.

**Impact:** Routes: `/` (home), `/features`, `/pricing`, `/reviews`, `/blog`,
`/blog/[slug]`, `/faq`. The root `/` serves the marketing homepage — the old
`app/page.tsx` `/` → `/dashboard` redirect was removed (2026-06-05) so the
domain root is the marketing front door; users sign in at `/login` and land in
the app at `/dashboard`. App behavior otherwise unchanged. Branch
`claude/magical-ride-usNEW`.

---

## 2026-06-05 — Multi-tenant authorization hardening pass

**Decision:** Closed a systemic class of cross-tenant authorization gaps. Many
client-invocable server actions checked only the caller's capability
(`can(role, …)`) — which reflects the caller's role in their OWN org — without
verifying the target row belonged to a production/organization the caller can
access. With UUID ids this was hard to exploit, but it was a real IDOR class.

**Fixes:**
- `userCanAccessProduction` (`lib/auth.ts`) is now the tenant boundary: it
  verifies `production.organizationId === user.organizationId` BEFORE the
  `productions:manage` shortcut, so a manager in one org can no longer reach
  another org's productions. This hardened every existing caller at once.
- Added access checks to mutating/sensitive actions across `features/`:
  documents, reports, calls, notes, announcements, scenes, blocking, scripts,
  notifications, and members. People-management actions (role change, remove,
  profile/status edits, delete, resend invite, production assignment) now
  verify the target user/production shares the caller's org. Two signed-URL
  helpers (`getScriptUrl`, `getGroundPlanImageUrl`) that had NO auth now
  require auth + org-scoped access.
- Defense-in-depth: the `/activity`, `/documents`, `/reports` placeholder pages
  call `requireCurrentUser()` instead of relying on the proxy alone.

**Process:** the `architecture.md` "Where permissions are NOT enforced" notes
were partly stale (the signed-URL guards had already been added). The audit +
fixes were verified against the current code; `tsc` + `next build` compile and
`eslint` pass. Work is on `claude/magical-ride-usNEW` (unmerged).

**DB posture (Supabase advisors, read-only):** all public tables have RLS
enabled with no policies = deny-by-default for direct PostgREST/anon access;
the app uses a server-side Postgres connection with the app-level checks above.
No table RLS changes were made (changing them blind risks breakage and isn't
needed). One WARN: leaked-password protection is disabled (enable in Supabase
Auth; may need Pro).
## 2026-06-04 — @Mentions extended to all report sections + blocking, with per-section notifications and inline chips (PR #27 + #28)

**Context:** @mentions originally fired only from rich-text fields scanned for `data-id` (report General Notes, department notes, announcements, notes). Department-note mentions and the report's structured note fields (schedule changes, attendance, line notes, injuries) didn't notify; blocking beat-comment mentions were also unreliable.

**Decisions:**
1. **Two mention encodings, unified at write time.** Rich-text fields keep `data-id`; plain-text fields (the structured report note groups, blocking comments) use `@{Full Name}` tokens. `writeContextMentions()` accepts a list of `sources` (each `html` or `text` + optional `label`) and resolves `@{Name}` tokens to user ids by matching org members' full name/email. Reports call it via `reportMentionSources()`; the old `writeMentions(html, ctx)` remains for announcements/notes.
2. **One notification per section, not per report.** A merged-per-report approach (first attempt) hid mentions: a person tagged in General Notes *and* a department note got a single row showing only the general-notes snippet. `writeContextMentions` now emits one row per (user, section), de-duped within a section, titled `Report <date> · <section>`. The author is excluded.
3. **Keep the `@{Name}` plain-text storage format; fix the *rendering* instead.** Rather than migrate the structured fields to stored HTML/`data-id` (which would ripple into display and extraction), the token format stays. `components/ui/mention-input.tsx` (contenteditable) renders tokens as chips while editing and serializes back to `@{Name}`; `components/ui/mention-text.tsx` renders them as chips in read-only views. This kept the data model and server extraction unchanged — only the editor/display components changed.
4. **Blocking mentions deep-link to the beat.** `contextId` stays the beat-comment id (precise delete cleanup); `getMentionsForUser` left-joins `beat_comments` to expose `beatId` for the dashboard href (`/blocking?beat=<id>`), and `blocking/page.tsx` validates `?beat=` against the production before opening it.
5. **Dashboard: unread-first + View all + dismiss.** The capped mention lists hid unread items beyond the cap; unread now sort first, a View all toggle expands, and `dismissMention()` deletes a recipient's row.

**Impact:** `writeContextMentions` is the report mention path; do not also call `writeMentions` for reports (it would delete-then-insert and wipe the per-section rows). Plain-text mention resolution is name/email-based, so renaming a member between mention and save could fail to resolve a token (acceptable; the chip still displays). `mention-input.tsx` is contenteditable — caret/serialization behavior is hand-rolled; test in a browser when changing it.

---

## 2026-06-04 — Web Push notifications via PWA (VAPID + service worker), not native wrapper for Phase 1

**Context:** The `notification_preferences.push` channel had been modeled but inert since 2026-06-03 — no transport. The app is already an installable PWA (manifest + icons), but had no service worker, so it could install but not receive push. Decision needed on how to deliver phone alerts.

**Decisions:**
1. **Web Push first, native (Capacitor) later.** Implemented standard Web Push (VAPID keypair + `public/sw.js` service worker + `push_subscriptions` table) rather than a native wrapper. It is fully additive, deploys through Vercel with no extra build pipeline, and needs no app stores or Apple Developer account. A future Capacitor wrapper reuses the same `push_subscriptions` table and `sendPushToUsers()` helper, swapping only the channel to APNs/FCM — so this is not throwaway work.
2. **Push is per-device, managed by the subscribe flow — not the channel-prefs form.** `savePushSubscription`/`deletePushSubscription` (`features/push/actions.ts`) own the `notification_preferences.push` flag (set true on first device, false when the last is removed). `updateNotificationPreferences` was changed to write only in-app/email — previously it would have silently flipped `push` off on every save once the disabled form toggle was removed.
3. **`push_subscriptions` follows the RLS-on/no-policies convention.** An endpoint is a capability, so the table is server-only via the Drizzle pooler role; RLS is enabled manually after `db:push` (drizzle-kit doesn't manage RLS). Endpoint uniqueness is enforced in app code (delete-then-insert), not a DB constraint, per the drizzle-kit hang note.
4. **Best-effort, self-healing delivery.** `sendPushToUsers` swallows its own errors (a dead device never fails announcement creation, mirroring email) and prunes subscriptions the push service reports as gone (404/410).
5. **Announcements only, for now.** Fan-out (`features/notifications/announce.ts`) sends push at the spot previously marked TODO. Mentions/report notifications use a separate path and can call `sendPushToUsers` later.

**Impact:** Requires three new env vars (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) in Vercel + local, and creating `push_subscriptions` via the Supabase SQL editor/MCP with RLS enabled (NOT `db:push`, which is retired here — see current-status "Known limitations"). New dependency: `web-push`. iOS only delivers Web Push to a Home-Screen-installed PWA (accepted for Phase 1). Full setup + test steps in `docs/feature-specs/17-push-notifications.md`.

---

## 2026-06-04 — Push for @mentions (batched) + signup notification onboarding + in-app always on

**Context:** Follow-up to the Web Push work. (1) @mentions were pull-only (dashboard bento) — no phone alert. (2) New users had no way to choose how they're notified. (3) Product decision: in-app should never be a toggle.

**Decisions:**
1. **@mentions now push, gated on `prefs.push`.** A shared best-effort helper `pushMentionNotifications()` (`features/mentions/notify.ts`) is called from all three mention-creation sites: `writeMentions` (announcements/notes), `writeContextMentions` (reports), and the direct insert in `features/blocking/actions.ts` (beat comments). It never throws, so a push failure can't fail the underlying save. Email is intentionally NOT added for mentions (push + the existing dashboard bento only).
2. **Batching is per-write, not time-windowed.** `countsByUser` counts how many times each user was tagged in THIS save; >1 → a single "N new mentions" push instead of one per mention. This covers the stated case (multiple tags across one rehearsal report's sections) without a debounce/queue. Cross-write time-window batching is deferred (see open-questions).
3. **Mention pushes link to `/dashboard`.** The write paths lack the slug/author context to build deep links cheaply; the dashboard Mentions list is always valid. Deep-linking is a future nicety (open-questions).
4. **In-app is always on (not user-configurable).** Removed the in-app toggle from Settings (now a static "Always on" row); `updateNotificationPreferences` forces `in_app = true` and only writes the email choice. Push stays device-managed.
5. **Signup onboarding via a first-dashboard dialog, no schema change.** `OnboardingDialog` shows when the user has no `notification_preferences` row (`hasNotificationPreferences`). It asks email (toggle) + push (per-device enable, reusing the new `usePushSubscription` hook); in-app shown as always-on. Finishing or skipping calls `completeOnboarding` which writes the row — which is also what stops it reappearing. Gating on row-absence avoids a `profiles` column / DDL.

**Impact:** No new env vars or DB changes. The push-subscribe browser flow was extracted to `features/push/use-push-subscription.ts` and is shared by the Settings card and the onboarding dialog. "Upcoming rehearsal reminders" (auto email/push the morning of a scheduled call, pulled from the calendar) is a separately-scoped FUTURE feature — see open-questions; not built here. Rehearsal reports were intentionally left untouched (they're sent manually to chosen recipients).

---

## 2026-06-04 — UI font → Inter; theatre-aware dashboard greeting

**Decisions:**
1. **UI font is now Inter** (`--font-ui`, was Geist), loaded via `next/font/google` in `app/layout.tsx`. **Update (same day):** the **display/heading font is now Inter too** — Newsreader was removed entirely; `--font-display` points at `var(--font-ui)` (in `:root` and in the `.np-root` wizard scope that re-pinned it). Inter is loaded with `style: ["normal","italic"]` so the greeting's `<em>` name keeps true italics. Only **mono (Geist Mono)** remains a separate face. So the whole app is Inter + Geist Mono.
2. **Contextual dashboard greeting.** `getContextualGreeting()` in the dashboard page replaces the time-of-day-only `getGreeting`. It returns `{ greeting, note? }`; `greeting` renders as `{greeting}, {firstName}.` and `note` is an optional follow-up line beneath. Priority (most specific first): opening night ("Break a leg") → last show ("Congratulations" + note "See you on the next one.") → first day of rehearsal ("First day of rehearsal") → tech week ("Welcome to tech week") → a call on today's calendar ("Ready for rehearsal") → returning after ≥1 day away ("Welcome back") → day off, i.e. inside an active production's window with nothing scheduled ("Enjoy your day off") → time-of-day default. "Welcome back" is driven by `profiles.last_active_at`: `markActiveAndGetPrevious()` (lib/auth.ts) reads the prior timestamp then stamps now on each dashboard visit, so `daysAway` reflects the gap since the previous visit (null on a first visit → no false welcome-back). Both desktop and mobile dashboards render the same computed `greeting`/`note`. Tech window = `[techStartDate, openingDate)` (capped at 14 days with no opening date); day-off window = `[firstRehearsalDate, closingDate ?? openingDate]`. `getUserProductions` now also selects `techStartDate` (it already returned `openingDate`/`closingDate`/`firstRehearsalDate`).

**Impact:** Inter is fetched at build by Vercel (no local action). Greeting phrases are deliberately stable per request (no randomization) for predictability; adding rotating variety per category is an easy follow-up. No DB or env changes.

---

## 2026-06-04 — New Production wizard: name autocomplete for cast & crew + end-of-launch invite for non-org people

**Context:** The wizard already autocompleted the cast step's *actor* field over org members (name only, never linked to a member/invite), while the crew/team step required manual email entry. Requested: type names with org typeahead on both spots; only ask for emails at the end, for people not already in the org.

**Decisions (client-only — no server change):**
1. **Shared `PersonAutocomplete`** (generalized from `ActorAutocomplete`). Its `onChange(name, email?)` passes `email` only when a row is *picked* from the dropdown, so callers can distinguish "chosen org member" from "free-typed name". Used by both the cast actor field and the crew name field.
2. **Crew step drops the inline Email column** — name typeahead only (`.team-row` is the 3-col grid). Email for non-org crew is collected at the end. Bulk CSV (`Name, Email, Role`) still works and pre-fills emails.
3. **Cast + crew both become members/invites.** At launch, `collectPeople()` flattens cast actors (mapped to `Cast — Principal/Ensemble` via `castTeamLabelForType`) and crew into a single people list. Each is resolved to an email by: captured autocomplete email → exact case-insensitive org-name match → else unresolved. Resolved org members are assigned to the production by the existing server path; the production's character roles still keep the actor *name* label too.
4. **Skippable end-of-launch `InvitePrompt`.** If anyone is unresolved, launching opens a modal listing them (name + context) with email inputs. "Invite N & launch" sends those through the existing email-invite path; "Skip & launch" creates the production without them (cast names remain role labels). "Back to edit" returns to the wizard.
5. **`RoleRow` gained `actorEmail?`**; `WizardPerson` is the launch-time flattened shape. The server contract (`createProductionFull` → `applyWizardTeam`, which assigns existing org members and invites new emails) was reused unchanged — the client just builds a richer `team` array and dedupes by email.

**Impact:** No DB/env/server changes. People without an email are simply not added (no failed invites). Review step wording updated ("Team — N members"; unresolved shows "invite at launch"). New CSS under `.np-root` for `.team-row` and the `.np-modal*` / `.np-invite*` prompt.

---

## 2026-06-05 — Marketing CMS = Sanity (hosted, decoupled), not Payload

**Decision:** Use **Sanity** for the marketing blog CMS instead of the
earlier Payload plan. Rationale: the marketing site currently lives inside the
live production app, and a self-hosted CMS (Payload) would add an admin panel,
its own tables in the production Supabase DB, a Next config/version bump, and
React-19 dependency risk to the live app — none of which can be verified in the
web container. Sanity is decoupled (content lives in Sanity's cloud, read via
an API), adds no DB tables, keeps the app build light, and travels cleanly when
the marketing site is split into its own repo.

**Shape:**
- App side: lightweight read only — `next-sanity` + `@sanity/image-url` +
  `@portabletext/react`. `lib/sanity/{client,queries,image}.ts`. The blog
  (`/blog`, `/blog/[slug]`) reads published posts and **falls back to the
  existing static content** when Sanity is empty/unreachable, so nothing breaks
  before content exists.
- Editor: the Sanity **Studio is embedded in the app at `/studio`**
  (`app/studio/[[...tool]]/page.tsx` + root `sanity.config.ts` + `sanity/schema/`).
  Chosen over a standalone CLI-deployed studio because the owner has no local
  dev environment — embedding means the editor deploys automatically with the
  site and is used entirely in the browser (`proscene.app/studio`, Sanity
  login) with zero terminal steps. Sanity v5 supports React 19, so there's no
  dependency conflict; `/studio` is allow-listed in `proxy.ts`.
- Config via env (`NEXT_PUBLIC_SANITY_PROJECT_ID`/`DATASET`, optional
  server-only `SANITY_API_READ_TOKEN`). Project `dsciikio`, dataset `production`.

**Owner action items:** add the env vars to Vercel; add CORS origins
(localhost:3000 + proscene.app) in sanity.io/manage; `cd studio && npm install
&& npx sanity login && npx sanity deploy`; create/publish posts; rotate the
read token that was shared in chat.

---

## 2026-06-05 — Billing model = org-level subscription (Stripe), v1

**Decision:** Monetize via an **organization-level subscription** (the org pays
monthly or annual and adds users under it), NOT the per-production model the
marketing page currently shows. Tiered (middle tier most popular); **v1 ships
one tier price** to validate the flow, then expands. **60-day free trial from
signup**, app-managed (no card up front; counted from org creation,
independent of Stripe). **All orgs existing at launch are grandfathered** into
full access forever (`organizations.grandfathered = true`).

**Schema (applied live 2026-06-05 via Supabase MCP `add_org_billing_columns`):**
`organizations` gained `stripe_customer_id`, `stripe_subscription_id`,
`subscription_status`, `plan`, `trial_ends_at`, `current_period_end`,
`grandfathered` (bool, default false). The migration set `grandfathered = true`
for every existing org. New orgs default to not-grandfathered + a 60-day trial.

**Entitlement logic:** `lib/billing.ts` `billingState()` — grandfathered →
access; else Stripe status (active/past_due/canceled-within-period) → access;
else app trial (`trial_ends_at` in the future) → access; else no access.

**Build approach:** entirely in Stripe TEST mode, verified on a Vercel preview
before live keys. Stripe's API is unreachable from the web container (network
policy), so all Stripe calls are verified on deploy, not here. Pending: Stripe
client lib, Checkout + Customer Portal, webhook, `/settings/billing` page, the
60-day trial stamp at org creation, a soft "trial ended" gate, and rewriting
the pricing PAGE to match this model.

---

## 2026-06-09 — Monetization model: org-billed, participant-free, first-production-anchored trial

**Decision:** The **organization** is the billable entity; **participants (cast/crew/designers) are always free**. Three paid tiers differ only by concurrent productions — **Season $249/yr ($25/mo, 1 prod), Repertory $499/yr ($49/mo, 3 prod, "most popular"), Company $799/yr ($79/mo, unlimited)** — every paid tier includes the full toolset (no per-feature gating in code; concurrency is the lever). A new org gets a **60-day free trial anchored to its first production's creation** (write-once `trial_started_at`), not signup.

**Reason:** Cast/crew are mostly volunteers — never price per seat. Anchoring the trial to the first production (vs signup) means the clock never expires before the company has really begun, and keying it to an immutable org timestamp closes the "wipe the show / push the closing date / delete-and-recreate" farming exploits. Matches the competitive landscape (`docs/pricing-strategy.md`) which is price-anchored low with concurrency the natural gate.

**Impact:** `features/billing/constants.ts` (plans, limits, day markers), `features/billing/guard.ts` (gates), `lib/billing.ts` (`billingState`/`trialPhase`/`mutationLevel`). All pre-existing orgs are `grandfathered = true` (full access forever).

---

## 2026-06-09 — Graduated "finish your run" lock instead of a hard day-60 cutoff

**Decision:** After the 60-day trial: **day 60–90 grace** keeps the operational loop editable (rehearsal reports, announcements, schedules, director's notes) so a company in tech week can finish; scripts/blocking/scenes/uploads/settings lock immediately. **Day 90 → full read-only.** Uploaded files retained until **day 180** (90 days of read-only download window), then purged. Admins emailed before the purge (day 120/150/173).

**Reason:** A hard paywall mid-tech is the worst moment to lose a near-converting customer. Time-boxing the grace (and keeping it keyed to the immutable trial anchor, not the closing date) keeps it generous but non-abusable. Day-180 purge frees storage cost without surprising anyone — the closing date is purely cosmetic and never affects billing.

**Impact:** `assertCanMutate` (full) vs `assertCanOperate` (operational) gates; daily `vercel.json` cron `/api/cron/billing-lifecycle` (CRON_SECRET) drives emails + the purge; purge removes storage objects only (never DB rows, other orgs, or `org-logos/`), scoped by the org's production ids.

---

## 2026-06-09 — Card-on-file during trial defers first charge to day 60

**Decision:** Subscribing **during** the free trial collects the card immediately but sets Stripe `subscription_data.trial_end` to the org's day-60, so the first charge fires automatically when the trial ends. Stripe `trialing` status is treated as fully subscribed in-app.

**Reason:** Lets a company commit early ("add a card now") without losing their remaining free days, and converts the trial into a paying sub with zero further action. Honors the promised 60 free days regardless of when they subscribe.

---

## 2026-06-09 — Education pricing via manual verification, not a self-serve tier

**Decision:** Education is **not** a self-serve Stripe product. The pricing page routes schools to the contact form ("Get education pricing"); the owner verifies by hand (department email / program site) and issues a Stripe **promotion code** (a `forever`-duration coupon for an ongoing rate). Lifetime deals = one-time payment + `grandfathered = true`.

**Reason:** Automated `.edu` checks wrongly reject international / community-ed / K-12 / homeschool programs — the exact customers to keep. Manual verification is reliable at this volume and costs nothing; SheerID-style automation can come later. (See `docs/admin-playbook.md`.)

---

## 2026-06-09 — Multi-workspace visibility = Canva/Monday model

**Decision:** All workspace-scoped views (rail, dashboard, calendar) show **only the active org's** productions, and within an org: **managers (`productions:manage`) see every show; participants see only the shows they're cast/crewed on**. Signup offers individual-vs-org; participants get a personal workspace and never trigger billing. Cross-org **alert bubbles** on the switcher count mentions + notifications since the user last switched into each workspace (clear on switch; items stay unread within the org).

**Reason:** `getUserProductions` had no org filter, leaking a user's productions across all their orgs into every view. The fix matches how Canva/Monday teams work — join anyone's paid team and get its benefits scoped to that team, while your own free workspace only shows your own work.

**Impact:** `getVisibleProductions(user)`; `notifications.organization_id` + `organization_memberships.last_viewed_at` (set on `switchOrganization`); bubbles in `WorkspaceRailBadge`.

---

## 2026-06-09 — AI Script Analysis: SDK, async model, and human-in-the-loop

**Decision:** First AI feature. Added `@anthropic-ai/sdk` (model `claude-opus-4-8`) to parse uploaded PDF scripts into a cast list, scene breakdown, and bookmarks. (User approved the new dependency and model.)

**Key choices:**
- **Staging, not direct writes.** Model output lands in a server-only `script_parses` table and is only written into `production_roles`/`production_scenes`/`script_annotations` after a human reviews and approves it (`applyScriptParse`). Trust + correctness; AI never silently mutates a production.
- **Async + notify, not synchronous.** A full parse can take 30s–minutes (model + PDF extraction), risking Vercel function timeouts. The slow work runs in `POST /api/scripts/[parseId]/run` (`runtime=nodejs`, `maxDuration=300`) via `after()`, so it survives the client navigating away; the requester gets a notification/push when ready, and the review page polls meanwhile.
- **JSON-prompt, not structured outputs.** `output_config.format` is beta-only in SDK 0.103.0; rather than depend on the beta surface we pin the JSON shape in the system prompt and parse the reply (`extractJson`). Adaptive thinking keeps reasoning out of the visible JSON.
- **Server-side per-page PDF text** via `pdfjs-dist/legacy/build/pdf.mjs` (Node-safe), page-tagged so bookmark page numbers are accurate.
- **Phase 1 only.** Per-role script highlighting (the 4th envisioned output) deferred — it needs per-line pixel coordinates and is highly script-format-dependent.

**Impact:** new `lib/anthropic.ts`, `db/schema/script-parses.ts` (RLS-on/no-policies, live via Supabase MCP), `features/scripts/parse.ts` + extended actions/queries/constants, the run route, the review page, a Documents row-menu affordance, `sendScriptParseReady`. New env var `ANTHROPIC_API_KEY` (optional — feature degrades gracefully when unset).

---

## 2026-06-09 — AI cast auto-fill in the new-production wizard + plan gating

**Decision:** Added a pre-production AI entry point on the wizard's Roles step (upload script → pre-fill characters), and settled how AI is plan-gated.

**Key choices:**
- **Plan gating = the existing `assertCanMutate` gate.** "Paid-tier perk, but trial users get it during their trial" is *exactly* what `assertCanMutate` already encodes (passes for subscribed/trialing/pre-trial, blocks post-trial grace/locked). So both AI entry points reuse it — no new plan primitive. (Cast/crew never parse anyway; that's role-gated.)
- **Generalized the parse pipeline for pre-production parses.** `script_parses.production_id`/`document_id` made nullable + a `storage_path` column; a "wizard parse" is owned by `requested_by`, uploads to a temp `wizard-scripts/{userId}/…` path, is capped per-user (5/30 days), and reuses the same async run route (auth falls back to ownership). New poll-by-id action `fetchScriptParseById`.
- **Carry the uploaded script over** (`attachWizardScript`): on launch, move the PDF into the production and create its **default script** document, so the user doesn't re-upload and the full Script-tab AI is ready later. Roles flow in through the wizard's normal role-creation; scenes/bookmarks are left for the later Script-tab run.
- **Optional + non-blocking** step copy: skip and add cast by hand, or upload later from the Script tab.

**Impact:** generalized `features/scripts/parse.ts` + the run route; new actions `requestWizardScriptUpload`/`startWizardScriptParse`/`fetchScriptParseById`/`attachWizardScript`; wizard-level AI state + `StepRoles` upload card in `new-production-wizard.tsx`; `Sparkles` added to the `Icon` registry. Known edge: orphan temp files if the wizard is abandoned (see open-questions).

---

## 2026-06-10 — Scanned/image-only scripts analysed via Claude's vision/PDF pipeline

**Decision:** When an uploaded script has no usable embedded text (`runScriptParse` extracts < 200 chars), instead of rejecting it, hand the PDF to Claude's native vision/PDF pipeline, which OCRs each page. The PDF is passed as a `{ type: "url" }` `document` content block using the Supabase signed URL we already mint — not base64 (which inflates ~33% and would risk the 32 MB request ceiling) and not a Files API upload (extra round-trip + cleanup).

**Reason:** Theatre scripts are frequently scans/photocopies with no text layer; previously these failed outright. The same blank-page class of file was also a pain point reported by a tester. Claude Opus 4.8 supports PDF input (600-page limit on a 1M-context model, 32 MB request limit) and OCRs image-only pages via vision, so no separate OCR engine (Tesseract etc.) is needed.

**Impact:**
- A separate `VISION_SYSTEM_PROMPT` + `OUTPUT_SHAPE_VISION` ask for the same cast/scenes, but bookmarks return a **`page` integer** (no extracted text to anchor against on a scan). `resolveVisionBookmarks` validates the page is within the document and de-dupes — bookmarks on scans are **best-effort**, cast/scenes unaffected.
- **Page cap** `MAX_SCANNED_PAGES = 250` (each scanned page costs image + text tokens; a longer scan would overflow the context window) — beyond it the parse fails with a "split into acts" message.
- **Cache fingerprint** for scans is the **raw file bytes** SHA-256, not the normalized text (empty text would collide across different scans and poison the cross-org `script_cache`). Text PDFs keep the text fingerprint; both are hex in the same column.
- Cost on scans is higher (~$1–2/script: image + text tokens per page), bounded by the existing per-production/per-user caps. The wizard auto-fill path inherits this for free (same `runScriptParse`).
- Files touched: `features/scripts/parse.ts` (vision branch, prompts, `resolveVisionBookmarks`, `textFromMessage`, `MAX_SCANNED_PAGES`); AI-setup caveat copy in `script/ai/ai-review-client.tsx`.

---

## 2026-06-10 — AI script-parse reliability: watchdog, idempotent apply, late-joiner seeding

**Decision:** Three self-contained reliability fixes to the AI script-analysis feature, all in `features/scripts/actions.ts`.

1. **Stalled-parse watchdog (lazy, no cron).** The async run worker can die (Vercel reclaims the function, or work exceeds `maxDuration=300s`) without ever flipping the row off `processing`, which previously (a) spun the review page forever and (b) blocked all future parses via the concurrency lock. A row still `processing` past `STALE_PARSE_MS` (8 min) is now treated as dead: the poll paths (`fetchLatestScriptParse`/`fetchScriptParseById`) flip it to `failed` (`failIfStale`) so the UI shows a timeout, and the three concurrency locks (`startScriptParse`/`reparseWithNotes`/`startWizardScriptParse`) ignore stale rows (`hasLiveProcessing`). Chose lazy detection over a cron sweep because the poll already happens every 3s — the user watching gets immediate feedback with zero new infra.

2. **Idempotent apply.** `applyScriptParse` blindly inserted roles + scenes, so a double-click or a re-parse re-apply piled up duplicates (only bookmarks were idempotent). Now: re-applying an already-`applied` parse is a no-op (status guard), and roles/scenes are inserted **additively but de-duplicated** against what the production already has (roles by name, scenes by act/scene number).

3. **Late-joiner bookmark seeding.** `seedSharedBookmarks` only seeds members present at apply time, so anyone who joins later (invite, bulk-assign, wizard) saw no AI bookmarks. They're now seeded **lazily on first Script-tab open** by `ensureMemberBookmarks` (reads the applied parse's bookmarks — the canonical set — and writes the user's `ai-*` set if missing). Chose the script-open chokepoint over hooking every member-add path, and gated it on `documents.processingStatus === "applied"` so productions without a breakdown pay no extra query. Fits the codebase's lazy-write convention (auto-profile creation).

**Reason:** The feature isn't live-verified yet; these are the difference between an impressive demo and something trustworthy in production. All three are small and contained to the scripts feature.

**Impact:** No schema change (added `processingStatus` to the `getDefaultScript` projection). Apply is **additive** by design — it never deletes, because `production_scenes` is shared with the blocking tool and roles can be hand-added/wizard-created, so there's no safe blanket "replace AI rows" without an AI-vs-manual marker column. A re-parse that drops/renames a role or scene leaves the old row for the director to remove in the review form. Late-joiner seeding is a write-on-render: two simultaneous first-opens by the same user could double-insert an annotation row (no unique constraint on `script_annotations`; `limit(1)` on read) — same class as the existing apply-time seeding.

---

## 2026-06-10 — Announcements: multi-audience via a join table (+ priority, require-ack)

**Decision:** Redesigned announcements into a broadcast tool. An announcement is now either **org-wide** (`announcements.org_wide = true`) or scoped to a **set** of productions via a new join table **`announcement_productions`** `(announcement_id, production_id)` (unique). Added `priority` (`normal|important|urgent`, CHECK) and an explicit `require_ack` flag. The legacy single `announcements.production_id` column was **kept but demoted** — still written for single-target posts (null for org-wide/multi), no longer read for audience resolution.

**Reason:** The prototype's headline feature is sending one notice to several productions at once, which the single nullable `production_id` couldn't represent. A join table gives a true combined audience (one ack rollup across the deduped union of members) matching the design, vs. fanning out to N duplicate rows. Keeping `production_id` made the migration additive/non-destructive on the production DB and preserves a safety net for any path not yet migrated.

**How applied:** hand-written SQL via Supabase MCP `apply_migration` (NOT `drizzle-kit push` — the new unique constraint would risk the known `db:push` hang; see the 2026-05-05 membership-constraint decision). Backfill: `org_wide = (production_id IS NULL)`; mirrored each existing scoped row into the join. Drizzle schema synced afterward so the ORM matches.

**Secondary decisions:**
- **Acknowledge is now opt-in per announcement.** The unacked banner only surfaces posts with `require_ack = true`, so informational notices no longer nag. Existing rows defaulted to `false`.
- **Company-wide requires `productions:manage`.** Org-wide reaches everyone, so it's limited to admins/producers; other creators (e.g. directors) may target only productions they can access. Enforced in `createAnnouncement` (matches the prototype's permission banner).
- **Reach/ack totals use the deduped union** of the targeted productions' members (`countDistinct`), since a person can be in several targeted shows.

**Impact:** `features/announcements/queries.ts` + `actions.ts` rewritten around `org_wide` + the join table; new shared client UI (`components/announcements/announcements-center.tsx`, `announcement-composer.tsx`) used by both the global and production-scoped pages; old inline forms removed; `ac-*` styles added to `app/globals.css`. Dashboard announcement cards updated to the scope/priority shape. `tsc`/`eslint`/`next build` clean. Not yet device-verified.

---

## 2026-06-10 — Soft-delete model for productions and organizations

**Decision:** Both productions and organizations get a nullable `deleted_at`
column (`timestamptz`, applied live via Supabase MCP `apply_migration`),
**separate from** productions' existing `archived_at`. Semantics:

- **Archive** (`archived_at`) = a legitimate "this season is over, keep it"
  state — restorable from the Archived view, kept forever.
- **Delete** (`deleted_at`) = "trash": hidden from every list and from
  production access checks (`userCanAccessProduction`, `getProductionBySlug`),
  recoverable for 30 days, then (eventually) purged.

**Permissioning:** delete/restore are **admin-only** (`settings:manage`),
deliberately stricter than archive (`productions:manage`, i.e. producers too),
because deletion is more destructive. Org deletion additionally requires a
**type-the-workspace-name** confirmation (re-checked server-side in
`deleteWorkspace`, not just the UI).

**Recovery split (per product owner):**
- **Productions** are **self-serve recoverable** — a "Recently deleted" section
  on `/productions` (admins) with a Restore button, surfacing the 30-day window.
- **Organizations** are **support-recoverable** — the delete confirmation tells
  the user it's recoverable via support for 30 days; an operator restores it by
  clearing `deleted_at` (see admin-playbook). No self-serve org-restore UI, to
  keep the auth-resolution surface small. Deleting your current workspace moves
  you to another membership (or auth spins up a fresh personal workspace).

**Deferred (delete):** the destructive **hard purge** after 30 days is NOT built yet —
soft-deleted rows simply stay hidden past the window. Nothing is irreversibly
lost until a careful, separately-tested purge step (likely an extension of the
billing-lifecycle cron) lands. Tracked in open-questions.

**Impact:** new `deleted_at` on `db/schema/{productions,organizations}.ts`;
`deleteProduction`/`restoreDeletedProduction` (`features/productions/actions.ts`)
+ `getDeletedProductionsByOrganization` and `deleted_at` filters across
`features/productions/queries.ts`; `deleteWorkspace` (`features/workspace/actions.ts`)
+ deleted-org filters in `lib/auth.ts` (`resolveActiveMembership`,
`userCanAccessProduction`) and `features/workspace/queries.ts`
(`getUserMemberships`); UI: `DeleteProductionButton`/`RestoreDeletedProductionButton`
(`archive-buttons.tsx`), `deleted-section.tsx`, `delete-workspace-form.tsx`.
`tsc`/`eslint` clean; columns verified live. Not yet device-verified.

---

## 2026-06-10 — Cast assignment bridges parsed roles to people

**Decision:** `production_roles` (the character list written by the AI parse and
the setup wizard) was previously write-only — never read or used. It now backs a
**cast-assignment** UI. Added `production_roles.assigned_user_id` (nullable FK →
`profiles`, `ON DELETE SET NULL`, applied live via MCP) as the bridge between a
character and a real org member.

**Semantics:**
- Casting a person in a character (`assignRoleToMember`) **also grants
  production access**: in theatre, casting someone means they get the show
  (script, calls, etc.). A new member is inserted as `cast` with that
  `characterName`; an **existing** member keeps their current production role
  (so a director who also acts isn't demoted) and just gains the character.
- **One actor ↔ one character per production**: re-assigning a person frees the
  character they previously held in that show.
- `unassignRole` clears the link + the matching `characterName` but **leaves the
  membership** — revoking access stays an explicit action on the team list.
- **Permissions:** casting existing members needs `productions:manage`; inviting
  a brand-new person inline (`inviteAndAssignRole`, which reuses the People
  invite flow) needs `settings:manage`, matching the existing invite gate.

**Placement:** a "Cast list" section above the team manager on the Cast & Crew
page (`/productions/[slug]/members`) — chosen over a separate Casting tab to
keep all per-show people management in one place.

**Impact:** `production_roles.assignedUserId` in the schema; `getProductionRoles`
(`features/productions/queries.ts`); `assignRoleToMember`/`unassignRole`/
`inviteAndAssignRole` (`features/members/actions.ts`); new `cast-list.tsx` wired
into the members page. `tsc`/`eslint` clean; column verified live. Not yet
device-verified.

---

## 2026-06-11 — Scanned-script OCR in the browser (tesseract.js) for text tools

**Context.** A scanned/image-only script has no text layer, so the Script tool's select / copy / find / line-highlighting are dead — and print-to-PDF doesn't help (it re-wraps images, adds no text). The AI parser already OCRs scans *for analysis* via Claude vision, but that returns structured cast/scenes with **no per-word coordinates**, so it can't drive an on-page selectable layer. We needed real OCR with word boxes.

**Decision.** Do OCR **in the browser with tesseract.js (WASM)**, not server-side.
- **Why client-side:** it gives per-word bounding boxes (the thing the text layer needs), costs **zero tokens / no server infra** (vs Claude vision ~$1–2/scan, or a server-side ocrmypdf/Ghostscript worker that isn't Vercel-friendly), and the "watch a per-page progress bar" UX is a natural fit. Accuracy is good-not-perfect on clean scans — acceptable for select/copy/find.
- **Shared, not per-user:** OCR is a property of the *file*, so the result is stored once keyed by `storage_path` + `script_version` and reused for the whole production (`script_ocr` table). Coordinates are **normalized 0..1** so they survive any zoom/scale.
- **Detection** reuses the AI parser's heuristic (extractable text `< ~100` chars over the first few pages = scan).
- **Opt-in + reversible:** managers get a banner (Run OCR / Not now); "Not now" is remembered per file and falls back to today's image-only viewing. Nothing about the existing viewer changes when OCR is absent.
- **Engine self-hosted:** worker + WASM core copied into `public/tesseract/` at build (`scripts/copy-tesseract-assets.mjs`, gitignored like `public/pdfjs/`). Language data (`eng.traineddata`, ~10MB) is **not vendored** — fetched from the tessdata CDN by default (`NEXT_PUBLIC_TESSERACT_LANG_PATH` to self-host later).
- **Gating:** running OCR is a write, gated by `assertCanMutate` (the existing billing guard) + production access; reading a ready result is open to all members.

**Scope.** v1 wires the **desktop `ScriptViewer`** (detect → banner → run with progress → paint OCR text layer). The mobile reader can consume the *stored* result for display; its own detect/run UI is a fast-follow.

**Setup the user owns — create the server-only table** (RLS on, no policies, like `script_parses`). Run in the Supabase SQL editor / via MCP against the `CallBoard` project:

```sql
create table if not exists public.script_ocr (
  id uuid primary key default gen_random_uuid(),
  production_id uuid references public.productions(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  storage_path text not null,
  script_version integer not null default 1,
  status text not null default 'processing',
  page_count integer,
  pages jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.script_ocr enable row level security;
create index if not exists script_ocr_lookup_idx
  on public.script_ocr (storage_path, script_version);
```

(No composite UNIQUE — those hang `drizzle-kit push`; app code enforces one row per `storage_path`+`script_version`.)

**Impact.** New: `db/schema/script-ocr.ts`, `lib/ocr.ts`, `scripts/copy-tesseract-assets.mjs`, `features/scripts/ocr-actions.ts`, `app/(app)/productions/[slug]/script/use-script-ocr.ts`. Extended: `features/scripts/constants.ts`, `script-viewer.tsx`, `app/globals.css`, `db/schema/index.ts`, `.gitignore`, `eslint.config.mjs`, `package.json` (dev/build copy step + `tesseract.js`). `tsc`/`eslint` clean; `next build` compiles + type-checks. Not yet verified against a real scan.

---

## 2026-06-11 — Searchable-PDF rebuild for pdfjs-unrenderable scans (PDFium-WASM)

**Context.** A tester's scanned script rendered blank in the Script tool even after in-browser OCR. Recovering the file from git history and dissecting it showed why: it's **MRC compression** — every page is a `DCTDecode` (JPEG) background plus **3,959 tiny `CCITTFax` 1-bit `/ImageMask` glyph stencils** (`/K -1`) that carry the actual text. **pdfjs renders the background but drops the ImageMask stencils**, so the text body is blank. pdfjs is both our viewer's renderer *and* the in-browser OCR's raster source, so display and tesseract OCR both came up empty. The browser's native engine (Documents `<iframe>`) and Adobe render it fine — hence those worked. (PR #32's non-embedded-font fix does nothing here: the file has no fonts.)

**Decision.** Stop forcing pdfjs for these. Two layers:
1. **Native-engine fallback (viewing).** The viewer probes a representative page's ink coverage (`isRenderBlank`, downsample + non-white ratio); a scanned page that comes back (near-)blank means pdfjs can't rasterize it, so we render the PDF in the browser's native viewer (an `<iframe>` of the signed URL, like the Documents tab). The in-browser tesseract OCR offer is suppressed for these (it would read a blank canvas).
2. **In-browser searchable-PDF rebuild (fixing).** `lib/pdf-ocr-rebuild.ts` renders each page with **PDFium-WASM** (`@hyzyla/pdfium`, the engine Chrome uses — **verified it renders this exact file**, 126 pages at 16–27% ink where pdfjs is blank), OCRs each page with `tesseract.js`, and assembles a new PDF with the page image + an **invisible jsPDF text layer**. The output uses standard codecs + a real text layer, so pdfjs renders and searches it natively — no `script_ocr` overlay needed for rebuilt files. It's the automatic equivalent of Adobe "Recognize Text".

**Why PDFium-WASM over a server pipeline:** keeps the app's zero-infrastructure, all-client model (pdfjs/tesseract/jsPDF already run in the browser), BSD/MIT licensed, and the base64-inlined WASM build needs no asset hosting or CDN. Trade-off: a long scan is a multi-minute client task (progress + cancel); if that ever becomes a problem, moving just the rebuild to a background job is a clean later upgrade.

**Product decisions (with user):** the rebuilt searchable file **replaces the default script** (version-bumped; the original upload stays in the document list as a backup). The rebuild is **offered at first view** of an unrenderable scan (where blank-render detection is reliable) via a *Make searchable* button; relocating the prompt into the upload flow itself is a follow-up. Decline keeps the original + native-engine viewing.

**Impact.** New dep `@hyzyla/pdfium`. New: `lib/pdf-ocr-rebuild.ts`, `app/(app)/productions/[slug]/script/use-script-rebuild.ts`, server actions `createRebuiltScriptUploadUrl` / `finalizeRebuiltScript` (`features/scripts/ocr-actions.ts`). Extended `script-viewer.tsx` (blank detection, native fallback, rebuild UI). `tsc`/`eslint` clean; `next build` compiles. Not yet live-verified end-to-end (needs a running browser + the real file).

---

## 2026-06-11 — Wider scan coverage + OCR quality model (image uploads, higher DPI)

**Context.** After shipping the searchable-scan rebuild (PR #32), two follow-ups to widen the umbrella for photocopied/scanned scripts, plus a clarification on what OCR does and doesn't change.

**Decisions.**
- **Image-file scripts.** A script uploaded as a bare JPEG/PNG/WebP (not only a PDF) is now scan-detected and rebuilt into a one-page searchable PDF (`rebuildImageAsSearchablePdf`: `createImageBitmap` with `imageOrientation:"from-image"` for EXIF rotation → OCR → jsPDF text layer). Per-page assembly shared with the PDF path via `appendOcrPage`; `installSearchableScript` takes a `File` and dispatches image-vs-PDF; `needsScriptOcr` = supported image type OR no-text-layer PDF. (Low real-world demand, but cheap once the engine existed.)
- **Higher OCR DPI.** PDFium render scale 2.0→3.0 (144→216 dpi). Measured on the real test file: +11% words recovered (314→349 over 3 pages) and higher mean confidence (78.0→78.7), at modest memory/output-size cost. Not pushed to 300 dpi to keep client-side memory/time bounded on long scripts.

**OCR quality model (important, recorded for future work).** The rebuilt PDF is two layers: (1) the **visible page is the original scan image, untouched** — no script/lyric content is ever lost, altered, or dropped from what users read/print/annotate; (2) an **invisible text layer** from OCR drives search/select/copy and AI parse. OCR imperfections live *only* in layer 2 (a search miss, a copy typo, an occasional AI mis-parse) — never in the visible script. "Words recovered" in the DPI benchmark refers to how completely OCR populates layer 2, not deletion from the script. This mirrors Adobe's model (image + text layer); the only gap is tesseract vs. Adobe's commercial OCR accuracy. **Upgrade path if exact search/AI fidelity is needed:** route pages through a stronger OCR (cloud OCR or Claude vision) — the visible script is safe regardless of engine.

**Impact.** Engine `lib/pdf-ocr-rebuild.ts` (image fn + `appendOcrPage` + scale), `lib/install-searchable-script.ts` (File dispatch), `lib/pdf-scan-detect.ts` (`needsScriptOcr`), `document-upload-form.tsx`, `use-script-rebuild.ts`. `tsc`/`eslint`/`next build` clean.

---

## 2026-06-11 — Rehearsal templates + schedule generation

**Context.** The calls calendar listed "No recurring call support" as a known limitation. Requested feature: "calendar rehearsal-template generation". Asked the user for scope; they chose **Both** — saved named templates *and* recurring generation.

**Decisions.**
- **New `call_templates` table, production-scoped** (not org-level). Mirrors the calendar's existing per-production `calls` model; an org-wide template library would add access-check surface for no proven need (dev-rules: don't add broad abstractions early). FK to `productions`/`profiles` with cascade; RLS enabled, **no policies** (accessed only through server actions via the Drizzle/`DATABASE_URL` service connection) — same posture as `call_confirmations`/`script_ocr`. Applied as a live additive migration (`create_call_templates`) per this branch's convention.
- **No new capability.** Reused `reports:create` (the calls-calendar gate) for template CRUD + generation. Cast/crew excluded.
- **Templates are a seed, not a live link.** Generation copies the submitted form values (the picked template only prefills the form client-side); editing/deleting a template never mutates already-created calls. This keeps generated rows ordinary, individually-editable `calls` and avoids a template→calls dependency graph.
- **Generation = one weekly pattern per run.** Date range × selected weekdays, iterated in UTC; `skip_existing` (default on) avoids duplicating days that already have a call; capped at **200 calls/run** as a runaway guard. Bi-weekly / per-day variation is a deliberate follow-up rather than a complex recurrence engine up front.
- **Scoped to the production calendar.** The "Generate" entry only appears when the unified `CalendarClient` has a `scopedSlug` (i.e. `/productions/[slug]/calls`), since templates are production-scoped — the workspace multi-production calendar is left untouched.
- **Deferred:** a template picker on the single-call slide-in tray (would require controlling every field on the shared `CallForm`); for now applying a template to one call = a one-day generation.

**Impact.** New: `db/schema/call-templates.ts`, `features/call-templates/{queries,actions}.ts`, `app/(app)/productions/[slug]/calls/templates/**`, `app/(app)/productions/[slug]/calls/generate/**`. Edited: `db/schema/index.ts`, `app/(app)/calendar/calendar-client.tsx`. `tsc`/`eslint` clean; not yet browser-verified. Spec: `feature-specs/12-rehearsal-templates.md`.

---

## 2026-06-11 — Google social sign-in (Apple deferred; origin-derived OAuth redirect)

**Decision.** Added "Sign in with Google" on `/login` and `/signup` via Supabase OAuth (PKCE), alongside the existing email/password flow. Apple Sign In is deliberately **not** shipped.

**Reasons / choices.**
- **Google only, for now.** Apple Sign In requires a paid Apple Developer Program membership ($99/yr), so it was held off. The implementation is provider-agnostic: re-enabling Apple is `"apple"` in `OAUTH_PROVIDERS` (`app/actions/auth.ts`) plus a second button in `components/auth/oauth-buttons.tsx`.
- **No new callback.** The pre-existing `/auth/callback` route already does the PKCE `exchangeCodeForSession`, so OAuth reused it unchanged.
- **`redirectTo` is derived from the request origin, not `NEXT_PUBLIC_SITE_URL`.** A fixed site URL sent users back to a different domain than the one that started the flow; since the PKCE code-verifier cookie is **domain-scoped**, the exchange then failed and Supabase fell back to the Site URL (homepage). `requestOrigin()` (Origin / x-forwarded-host headers) keeps the round-trip on one host.
- **Canonical domain = `www.proscene.app`.** Supabase Site URL, `NEXT_PUBLIC_SITE_URL`, and the tested host are all `www` to avoid apex↔www cookie/redirect mismatches.
- **OAuth name backfill.** OAuth users lack `first_name`/`last_name` metadata, so `lib/auth.ts → deriveName()` falls back to Google's `given_name`/`family_name` (or splits `full_name`/`name`). Profile + org auto-creation is otherwise identical to email/password signup — a new Google user gets their own admin workspace.

**Rollout lesson (why it took several passes).** The break was never the app code — it was deploy/config: production briefly ran a `main` build with no OAuth code (button "vanished", redirect had nowhere to land), and testing happened on Vercel previews where the domain-scoped cookie can't survive the hop to prod. Diagnosed from Supabase auth logs: a `login` event with **no following `POST /token`** = the code was never redeemed. Fix = merge to `main`, deploy prod, test on `www.proscene.app`. Full runbook in `feature-specs/02-auth.md` → "OAuth troubleshooting".

**Impact.** New: `components/auth/oauth-buttons.tsx`. Edited: `app/actions/auth.ts` (`signInWithOAuth`, `requestOrigin`), `lib/auth.ts` (`deriveName`), `app/login/page.tsx` (+ `?error=` surfacing), `app/signup/page.tsx`, `app/globals.css` (`.auth-divider`/`.auth-oauth*`). Merged via PR #41; verified working in production 2026-06-11. Requires the Google provider enabled in the Supabase dashboard (not in code).

---

## 2026-06-11 — Role-restricted (private) document folders

**Context.** Backlog item "per-role private folders" (flagged as needing design decisions). The Document Center had production-scoped folders, but every folder/document was visible to all members.

**Decisions.**
- **Restrict by role, stored on the folder.** Added `visibility` ('everyone'|'restricted') + `allowed_roles text[]` to `document_folders` rather than a join table — roles are a small fixed enum, so an array column is the lean choice. Live additive migration (`add_folder_visibility`); existing folders default to `everyone`, no behavior change.
- **Visibility keys off the viewer's _production_ role** (`production_memberships.role`), not the org role, since a person's role varies per show. Managers (`productions:manage` = admin/producer) always see every folder. One pure helper `canViewFolder` shared by server filtering and client UI.
- **Documents inherit folder visibility; unfiled docs stay public.** No per-document ACL — keeps the model simple and matches how teams think ("the SM folder").
- **Reused `documents:upload`** for creating/editing restricted folders — no new capability.
- **Enforced at the page + viewer**, not via RLS (the app reads through the Drizzle service connection, so filtering lives in app code). The documents list filters folders + docs; the viewer `notFound()`s on a hidden doc to block direct-URL access.
- **Deferred:** the Documents tab badge still counts hidden docs (a number, no titles — acceptable v1 leak); the Script tool's default-script path isn't folder-gated; restriction is role-based, not per-person or per-department.

**Impact.** New: `folder-editor.tsx`, `feature-specs/13-document-folder-privacy.md`. Edited: `db/schema/documents.ts`, `features/documents/{constants,actions,queries}.ts`, the documents page + `[documentId]` viewer + `documents-client.tsx`. `tsc`/`eslint` clean; not browser-verified. Shipped as its own PR off `main`.

---

## 2026-06-12 — Per-plan storage allowances (100 / 250 / 500 GB)

**Decision.** Paid plans get a storage ceiling, measured across the whole workspace: **Season 100 GB, Repertory 250 GB, Company 500 GB** (Free 5 GB). Defined as `STORAGE_LIMIT_GB` in `features/billing/constants.ts`. No price change.

**Reason.** Storage is the one variable cost that actually scales (Supabase Storage ≈ $0.252/GB/yr at rest, plus egress). Real usage is PDFs and images — a few GB at most — so even a *full* tier costs only a few dollars a year and stays a small fraction of revenue (and well within margin even with the planned ~30% lifetime founding discount). We start **conservative** to cap worst-case exposure while we learn real usage, then raise ceilings **"for free"** later as a goodwill/retention lever. Caps only ever go **up** (raising an allowance delights; cutting one burns trust), so starting low is the safe asymmetry.

**Impact.**
- `STORAGE_LIMIT_GB` is the single source of truth for marketing copy and any future quota enforcement. **Enforcement is NOT wired up yet** — these are advertised ceilings only for now.
- Pricing page updated: tier cards, the comparison table, and a new storage FAQ (with a fair-use note that large-scale video isn't included yet). Sanity-driven tier docs, if/when populated, should mirror these numbers.
- The lifetime founding discount applies to the **subscription only**, never to storage overages/add-ons.

**Deferred / future.**
- **Large-scale video hosting is explicitly out of scope** of current plans, so today's plans don't implicitly promise it. When we add video and/or meaningfully bigger ceilings, migrate file blobs to a **zero-egress object store (Cloudflare R2)** — that's what makes TB-scale and streaming financially safe. Not worth the migration cost today (PDF/image usage, low egress).
- Treat video / bigger caps as **additive** (a paid add-on SKU or new tiers), never a retroactive base-price hike on existing or lifetime users.

---

## 2026-06-12 — Rehearsal Video: link-only embeds before native hosting

**Context.** Product wants to offer rehearsal video sharing (pro companies film
every rehearsal and distribute to cast/crew). Native hosting raises the cost
question. Analysis: storage at rest is cheap; **egress/bandwidth is the real
cost driver** and scales with viewing, plus native hosting needs transcoding,
adaptive-bitrate delivery and a resumable-upload pipeline (the 64MB server-action
path can't carry multi-GB films).

**Decisions.**
- **Ship a link-only interim first.** A "Rehearsal Video" production tab where
  leadership/SMs paste YouTube/Vimeo links that embed on the page. The platform
  hosts/transcodes/streams, so it adds **zero storage or egress cost** and no
  upload pipeline. Native hosting (Mux/Cloudflare Stream) is a deliberate later
  phase, gated as a paid feature so heavy-watching orgs fund their own bandwidth.
- **Build the embed via the platforms' player SDKs**, not a bare iframe, so the
  concept's timestamped-notes panel works: the YouTube IFrame API / Vimeo Player
  SDK (loaded via injected `<script>`, no npm dep) give `seekTo`/`getCurrentTime`/
  `setPlaybackRate`. Notes seek the player on click.
- **Embed URLs are constructed from a validated provider+id**, never from
  user-supplied HTML — deliberately avoiding the documented `dangerouslySetInnerHTML`
  sanitization risk. `parseVideoUrl` rejects any non-YouTube/Vimeo input.
- **New capabilities `videos:view` (all) + `videos:create` (leadership + SMs).**
  A dedicated pair (not reusing `documents:upload`) so video access can be
  granted/revoked independently later. Timestamp notes are open to any member.
- **Omitted what hosted links can't honestly do:** no Download (impossible for
  hosted video), no true clip trim ("Share clip" copies a timestamped deep
  link), no custom scrubber-with-markers (deferred — uses native player chrome).
- **Two new tables, pushed via `drizzle-kit push`** (`rehearsal_videos`,
  `video_timestamp_notes`); no composite unique constraints (avoids the known
  push hang). `durationSeconds` is backfilled idempotently from the player.

**Impact.** New: `db/schema/rehearsal-videos.ts`, `features/videos/*`,
`app/(app)/productions/[slug]/videos/*`, `feature-specs/20-rehearsal-video.md`.
Edited: `lib/permissions.ts`, `db/schema/index.ts`, the production `layout.tsx`
+ `production-tabs.tsx`. `tsc`/`eslint` clean; not browser-verified. **Requires
`npm run db:push` before use.**

---

## 2026-06-12 — Enabled RLS on `announcement_productions`

**Context.** The Supabase security advisor flagged `public.announcement_productions`
as the only table with **RLS disabled** — meaning the anon key could read/write
every row. It pre-dated this work (the `08-announcements` join table).

**Decision.** Enabled RLS with **no policies** (migration
`enable_rls_announcement_productions`), matching every other table. Verified
first that the table is accessed exclusively through the Drizzle pooler
connection (`features/announcements/{queries,actions}.ts` → `db` from `@/db`,
postgres role, bypasses RLS) and that **no Supabase anon/SSR client performs
table reads anywhere in the repo** (the Supabase JS client is used only for
Storage `attachments` + Auth). So enabling RLS closes the anon exposure with no
behavior change.

**Impact.** Critical `rls_disabled` advisory cleared. The app's standing
convention is now uniform: RLS on, no policies, DB access via the pooler. New
tables (incl. `rehearsal_videos`/`video_timestamp_notes`) follow the same.
Left open: Supabase Auth "leaked password protection" is disabled (advisor
WARN) — a dashboard toggle, deferred to the user.

---

## 2026-06-12 — Typography + brand identity refresh (marketing/app cosmetics)

**Decision.** A cosmetic pass across the marketing site and app chrome (no app logic):
- **Geist** is the main UI font (`next/font/google`), replacing Inter, in both the root and marketing layouts. Geist Mono unchanged.
- **No italics in chrome.** Every `font-style: italic` in our own CSS/inline styles is now `normal`; the crimson accent colour on the wordmark + marketing headline accents is **kept** ("keep crimson, drop slant"). Rich-text content (`.prose`) and the editor's Italic button are deliberately untouched (user content).
- **Brand mark = the Proscene call-board glyph** in two colours: **paper** (cream `#F5F2EA`) and **ink** (dark `#15181F`). The in-page marks are **transparent** (no tile), so they're applied by **contrast** — ink on light surfaces, paper on dark — via theme-adaptive `body[data-theme]` pairs for app surfaces and static choices for the always-light nav / always-dark footer. Canonical sources in `transparent-icons/`.
- The **favicon + installed-app-icon pack is intentionally frozen** on the prior dark badge set (user: "keep the current favicon"); `favicon.svg` adapts to the OS light/dark preference. Installed-app icons use the dark (ink) badge to match the dark manifest splash.

**Reason.** Founder-driven brand direction; transparency for new users (the open-beta band); and accuracy (the marketing UI mockups were based on early models — the Script demo was rebuilt to match the real PDF-cue-sheet tool).

**Impact.** Marketing-only/chrome-only; no schema, permissions, or server actions touched. Not browser-verified in-session (incomplete `node_modules`); relies on CI / a Vercel preview. The marketing product demos other than Script were audited as faithful and left as-is; a visual verification pass on a preview is the open follow-up.

---

## 2026-06-15 — Org-creation wizard + onboarding survey columns

**Decision:** Promote workspace creation from a single-field inline form to a guided four-step wizard at `/workspaces/new`, and persist an optional onboarding survey on the organization.

- **New route, reused chrome.** The wizard renders full-screen via the existing `.np-overlay`/`.np-root` CSS island (shared with the New Production wizard) rather than a new design system. Steps: Workspace (name + logo) → About your company (survey) → Invite team → Review.
- **Schema addition — accepted as deliberate, not speculative.** Added three **nullable** columns to `organizations`: `annual_shows`, `team_size`, `production_types` (text[]). Dev-rules discourage speculative schema, but the user explicitly wanted onboarding to capture this; columns are nullable (survey fully skippable) and stored as the free-text bucket labels from `features/workspace/constants.ts`. They are **never used for access decisions**. Threaded through `createOrganization(name, profile?)`; the legacy signup path passes no profile and is unaffected.
- **Logo uploaded after creation.** The signed-upload path is org-scoped (`org-logos/{orgId}/…`), so the picked file is held in the browser and uploaded only once `createWorkspace` has returned an org id and switched the user in. Logo + invites are best-effort: a failure surfaces as a non-fatal warning on the success screen because the workspace already exists and the caller is its admin.
- **No role gate.** Consistent with the pre-existing `createWorkspace` action — any signed-in user may create a workspace. This is intentionally also the path a previously view-only user takes to become an admin of their own company.

**Impact.** New: `app/(app)/workspaces/new/{page.tsx,create-workspace-wizard.tsx}`, `features/workspace/constants.ts`. Edited: `db/schema/organizations.ts`, `lib/organization.ts`, `features/workspace/actions.ts` (`createWorkspace` now takes a string **or** `CreateWorkspaceInput`), `app/(app)/(default)/settings/workspace-switcher.tsx` (inline form → link). `tsc`/`eslint` clean; not browser-verified. Requires `npm run db:push`.

---

## 2026-06-15 — Designer Seats: à la carte sub-product for itinerant designers

**Decision.** Add a personal (per-user) sub-product, separate from the org plans,
so itinerant designers who pay $0 today can keep the Script + Blocking tools
across gigs. It is a **single-player, siloed workspace** (own uploaded script +
AI parse + one ground plan; **no Document Center**, no scheduling/reports/sharing),
NOT access into any org's data. Ladder: **Single tool $5.99/mo**, **Designer
bundle (Script+Blocking) $9.99/mo** — both 1 production swap-and-replace — and
**Designer Pro $14.99/mo** for unlimited concurrent productions. All monthly +
annual (~10×). When a paying org **invites** a designer they become a normal
member and gain the org's full suite on top — **no extra charge, no org discount.**
A "pro/fullsize" **Focus view** (curated single-purpose chrome) is the default
shell for designer-seat users and an optional toggle for full-suite users.

**Reason.** Reviewer interviews surfaced a real population that won't buy the full
suite and often designs for non-subscribing companies. Single-player siloing makes
the seat **useless as an org-plan dodge** (no sharing/scheduling/reports), so it
only ever converts $0 users — no cannibalization. $14.99 sits cleanly between the
$9.99 bundle and Season's $25 (1 production, full toolset) on a different value
axis (many-shows/two-tools/solo vs one-show/all-tools/shared).

**Impact.** Spec: `docs/feature-specs/21-designer-seats.md` (PROPOSED — no code,
schema, or Stripe products yet). Mockups: `docs/mockups/designer-focus-view*.html`.
When built: a new per-user entitlement axis layered on top of `can()` and the org
billing guard (never grants a role-lacked capability, never touches org billing);
designer is a persona, not a 7th role; personal Stripe subs flip a per-user
entitlement; AI parse cap + a modest storage ceiling must scale for Designer Pro.
Focus view is a shell variant, not a fork of the Script/Blocking tools. Preserve
the CallBoard-specific **orthogonal elbow leader lines** with draggable,
text-anchored cue cards. Public brand is **Proscene** (relabel mockups).

---

## 2026-06-15 — Designer referral incentive (stacking, two-sided)

**Decision.** Reward designers for converting the orgs they work with: **two-sided**
(referred org gets the planned 15%-off-first-term coupon from Feature 18; designer
earns seat credit), **stacking 3 months free per referred org up to 12 months/year**
(rewards repeat referrers — the persona's strength — over a one-and-done bonus),
paid as **comped time/credit, not cash**. Reward **vests only after the org's first
invoice clears and isn't refunded** (attribution via a referral code applied at
checkout) to prevent throwaway-org fraud.

**Reason.** Designers touch many companies a year, each a high-trust warm intro —
the most valuable distribution channel for reaching org subscribers. A seat-year
(~$99–179) is a fraction of an org sub ($249–799/yr), so the trade is strongly
net-positive; the reward mostly helps the designer on their *other* non-paying gigs
since a converted org already comps them the full suite. Likely the change that
finally justifies real Stripe coupon/promo-code infra (Feature 18 left it a stub).

**Impact.** Added to `docs/feature-specs/21-designer-seats.md` (still PROPOSED).

---

## 2026-06-15 — Designer referral: lockstep vesting (anti-fraud fix)

**Decision.** Correcting the prior entry: the referral reward is **NOT** granted
upfront and "after first invoice clears" is insufficient. Instead, **grant 1 free
designer-month per month the referred org stays paid, in arrears, capped at 3.**
Annual org subs ($249+) may vest all 3 upfront (prepay dwarfs the reward). Claw
back on refund/chargeback; exclude education/heavily-discounted orgs; self-referral
heuristics as a tripwire.

**Reason.** The "fake org, pay one $25 month, claim 3 free months, cancel" exploit
nets the attacker +$5–20. Lockstep vesting kills it structurally: an org-month
($25) always costs more than a designer-month ($9.99–14.99), so each paid org-month
bought to unlock a free designer-month is a guaranteed net loss — no "is this org
real?" judgment required.

**Impact.** Updated the referral section of `docs/feature-specs/21-designer-seats.md`.
