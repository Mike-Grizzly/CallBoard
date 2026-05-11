# Current Status

**Last updated:** 2026-05-11

**Current milestone:** Steps 1-12 complete. Call schedule calendar shipped. UI port Phase 1 (design tokens / shell) done, Phase 2 (per-tab visual port) in progress. Overview tab ported. Rehearsal Reports tab now at full demo parity — schema expanded with status, attendance, breaks, scenes, schedule changes, line notes, injuries; new editor matches the demo exactly; edit flow exists; email dialog uses the demo's modal chrome. The per-production tab is now labelled "Rehearsal Reports" and sits second after Overview. RLS enabled on all public tables. See `docs/feature-specs/11-rehearsal-report-demo-parity.md` for the full scope.

## Feature status

### Step 1: Foundation & App Shell — IMPLEMENTED
- App shell with topbar, sidebar, and main content area
- Route structure with placeholder pages for all planned features
- Tailwind v4 theme with CSS variables
- Local UI primitives (Button, Card, Separator)
- Root redirect to /dashboard
- Sidebar nav items with icons and capability-based filtering
- **Not fully verified:** Mobile responsive behavior (sidebar hidden, no mobile drawer)

### Step 2: Auth — IMPLEMENTED
- Supabase email/password auth (signup, login, logout)
- Signup form with first name, last name, position/role picker
- Email verification flow with confirmation page and resend
- Forgot password / reset password flow
- `proxy.ts` route protection (Next.js 16 replacement for middleware)
- Auth callback handler (PKCE + implicit flows)
- Auto-profile creation on first login
- First user in org becomes admin, subsequent users get "cast" role
- **Not fully verified:** Password reset flow was deferred due to Supabase email rate limits during testing

### Step 3: Roles & Permissions — IMPLEMENTED
- 6 roles: admin, producer, director, stage_manager, cast, crew
- 10 capabilities with `can(role, capability)` function
- Permission checks in all server actions
- Role-based sidebar nav filtering
- Org member management UI (admin-only settings page)
- Role dropdown with change/remove capabilities
- Requested role hint visible to admins in member list
- Admin cannot change own role or remove self
- **Not fully verified:** All role/capability edge cases across every page and action

### Step 4: Productions — IMPLEMENTED
- Production CRUD (create with title, dates, status)
- Slug-based routing
- Production list with organization scope
- Production detail page with overview, tabs, team roster
- Production membership system (assign users to productions with roles)
- Bulk member assignment with checkbox multi-select
- Access gating: non-assigned users see dimmed/locked production cards
- Non-assigned users without `productions:manage` are redirected from production detail
- Personalized dashboard with stats (admin) and assigned productions list

### Step 5: Reports — IMPLEMENTED (overhauled 2026-05-06)
- Structured rehearsal report: header (date, scheduled call, actual start, end), TipTap general notes, 12 fixed department text fields, next-rehearsal block
- Per-production auto-incremented `report_number` (MAX+1 in server action)
- **Email Report** button: recipient picker (entire production or individual checkboxes), sends HTML email via Resend (`resend` package, `RESEND_API_KEY` + `RESEND_FROM_EMAIL` env vars)
- Reports list shows `#N — {date}`; legacy `scheduleNotes` still renders if populated
- Daily log feature: personal rich text notes per user per production
- "Import from daily log" button when creating a new report (fills general notes)
- Report file attachments via Supabase Storage (10MB limit), signed URL downloads (1-hour expiry)
- **Known issue:** TipTap bullet points not working due to Tailwind prose CSS reset

### Step 6: Documents — IMPLEMENTED
- Document center per production
- Upload form with title, document type (6 categories), file picker
- Document list with type badges, file size, uploader info
- Delete with confirmation dialog
- In-app document viewer (PDF iframe, image display, text iframe, fallback download)
- Download via signed URLs (1-hour expiry)
- Comments sidebar placeholder in viewer (no data model yet)
- Schema includes `processingStatus` field for future AI script analysis

### Step 7: File Uploads — IMPLEMENTED
- Supabase Storage integration using `attachments` bucket
- Used by both report attachments (Step 5) and document center (Step 6)
- Server action body size limit increased to 25MB in next.config.ts
- Storage RLS policies: authenticated users can insert/select/delete
- Signed URLs generated server-side with 1-hour expiry
- File size validation: 25MB for documents, 10MB for report attachments

### Step 8: Announcements — IMPLEMENTED
- `announcements` table: org-scoped with optional `production_id` (null = org-wide)
- Production-scoped announcements page at `/productions/[slug]/announcements`
- Global announcements page at `/announcements` showing all announcements the user can see
- Rich text body via TipTap (optional)
- Pinning: admin/producer only
- Delete: author or admin/producer
- Org-wide badge on all announcement cards
- Announcements tab and overview card added to production detail page
- **Not fully verified:** Live testing in browser pending

### Step 9: Rehearsal Report Overhaul — IMPLEMENTED
- Structured department-by-department format replacing free-form TipTap
- Header block: report number, scheduled/actual times, next rehearsal info
- 12 fixed department note fields
- **Email Report** button — sends HTML email via Resend with recipient picker (entire production or individual members)
- Schema applied via Supabase MCP `apply_migration`; `resend` package added

### Step 10: Blocking Tool (Phase 1 + Phase 2) — IMPLEMENTED

- **New role:** `choreographer` (7th role, has `blocking:edit` + standard director-level caps)
- **New capabilities:** `blocking:view` (all roles), `blocking:edit` (admin, producer, director, choreographer, stage_manager)
- **New DB tables:** `production_scenes`, `scene_beats`, `stage_configurations`, `blocking_positions`
- **Schema changes:** `production_memberships.character_name` (nullable); `stage_configurations.ground_plan_page` (int, default 1)
- **New feature modules:** `features/scenes/` (queries, actions, validation), `features/blocking/` (queries, actions, constants)
- **Set piece library:** 15 SVG shapes (chair, armchair, couch, loveseat, beds, tables, desk, stairs, door, window, grand piano, podium, platform)
- **Routes:** `/productions/[slug]/blocking` (canvas), `/productions/[slug]/blocking/setup` (wizard)
- **Blocking canvas:** PDF background (rendered via pdfjs-dist v5), number line ruler overlay with toggleable SL/SR and US/DS grids, drag-and-drop actor tokens + set pieces (@dnd-kit/core), autosave per beat, in-session undo (50 states)
- **Actor tokens:** Initials from firstName[0]+lastName[0]; only character name shown under circle; auto color-coded
- **Set piece rotation:** ±15° buttons appear on hover; rotation stored and restored per beat
- **Cross-scene beat copy:** First beat of a new scene automatically inherits positions from the last beat of the previous scene
- **Multi-page ground plans:** Page selector in setup wizard; prev/next page controls on canvas; `ground_plan_page` stored in stage config
- **Export PNG:** "Export" button composites PDF canvas + tokens into a downloadable PNG via browser Canvas API
- **Recalibrate shortcut:** "Recalibrate Only" button skips directly to calibration when an existing config exists
- **Character name assignment:** Inline editable character name on cast member rows in the production members page
- **Scene/Beat manager:** Left panel — Act/Scene/Beat hierarchy, add/delete; "Capture Beat" auto-labels and advances
- **Stage setup wizard:** 2-step — select ground plan PDF + enter proscenium width/depth, then 2-point click calibration
- **Number line ruler:** Proscenium baseline with ticks every 2', labels every 5'; toggleable SL/SR and US/DS grid lines
- **Permissions:** SM/Director/Choreographer/Admin/Producer can edit; Cast/Crew view only
- **Known future work (Phase 3):** Set piece rotation via drag handle (free angle); full beat-breakdown export (multi-page PDF or print view)

### Step 11: Notes — IMPLEMENTED

- Two-panel Notion-like interface per production (`/productions/[slug]/notes`)
- Notes list with filter tabs (All, To-do, Pinned, Notes, Done)
- Pinned notes grouped at top of list
- Unified note type with optional to-do checkbox and completion toggle
- Pin toggle, visibility toggle (private/shared), due date field
- Org-level tag library with colored tags; seeded with 7 defaults on first access
- Admin/producer/director/stage_manager can add/remove tags via tag manager modal
- TipTap rich text editor with auto-save (600ms debounce)
- Notes added as card on production overview and tab in production nav
- **Known limitation:** Visibility toggle is display-only — no query-level enforcement; all team members see all notes (deferred)

### Step 12: Call Schedule Calendar — IMPLEMENTED

- `end_time text` column added to `calls` table (Supabase migration applied 2026-05-08)
- `/productions/[slug]/calls` — month calendar grid: all calls shown as chips per day, colour-coded by status (upcoming/live/past), prev/next month navigation via `?month=YYYY-MM` search param
- Hover any future day → `+` icon to create a call with that date pre-filled (`?date=YYYY-MM-DD`)
- Upcoming calls list view below the calendar for linear at-a-glance scheduling
- `getNextCall` is now time-aware: skips calls whose `end_time` has passed today; returns `isLive` flag when current time is within `callTime–endTime` window
- Production dashboard header shows three states: **"Live · In Rehearsal"** (orange pulse) when inside window, **"Today's Call"** (amber) when today but not yet started, **"Upcoming Call"** (muted) otherwise
- End time displayed under call start time on dashboard header card
- "Schedule call" header button replaced with **"Calls"** → opens calendar
- **Calls** tab added to production tabs (visible to all members; create/edit gated to `reports:create`)
- After create/edit/delete, users land back on the calendar
- Delete button extracted to a client component (`DeleteCallButton`) — fixes pre-existing server-component error (`onClick` on server-rendered form)
- `features/calls/` has `queries.ts`, `actions.ts` (no new libs introduced)
- **Not verified:** Real-time live-status flipping without page reload (status is computed server-side at render time)

## Scaffolded only (not implemented)

- **Activity log** — placeholder page exists, capability defined, feature directory has only .gitkeep
- **AI script analysis** — `documentType` and `processingStatus` fields exist in documents schema, no processing logic
- **Document comments/annotations** — placeholder sidebar in document viewer, no data model or functionality

## Not implemented

- Tests (zero test files in repo)
- Multi-organization support (hardcoded "default" org)
- Dark mode
- Email notifications
- Real-time updates
- Mobile navigation drawer

## Known limitations

- No composite unique constraints on membership tables (removed because drizzle-kit push hangs with them) — duplicate memberships prevented in app code only
- `getDocumentUrl()` and `getAttachmentUrl()` do not check if the requesting user has access to the parent production/report
- Supabase Storage RLS policies are broad (any authenticated user can access any file in `attachments` bucket)
- No file type validation on uploads (any file type accepted)
- No duplicate file detection
- `dangerouslySetInnerHTML` in RichTextDisplay without HTML sanitization
- TipTap bullet points not rendering due to Tailwind prose CSS reset
- `drizzle-kit push` may hang — SQL was applied directly via Supabase SQL Editor for later tables
- README.md is outdated (still says "Phase 1: Foundation and app shell")

## Risks for future review

- Storage access control needs hardening before production deployment
- Rich text HTML rendering should be sanitized before accepting untrusted content
- Membership uniqueness should be enforced at the database level
- File upload security (type validation, malware scanning) should be addressed before public launch
