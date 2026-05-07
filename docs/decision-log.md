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

**Impact:** Ground plan display is static (no PDF interactivity, no multi-page navigation in Phase 1). pdfjs-dist v5 uses `{ canvas, viewport }` render API (not the older `canvasContext` form).

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
