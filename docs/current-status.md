# Current Status

**Last updated:** 2026-05-07

**Current milestone:** Steps 1-9 complete. Notes feature shipped.

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

### Step 5: Reports — IMPLEMENTED
- Rehearsal report creation with date, general notes, schedule notes
- Rich text editor (TipTap) for report content
- Report list per production, ordered by date
- Report detail page with HTML rendering
- Daily log feature: personal rich text notes per user per production
- "Import from daily log" button when creating a new report
- Report file attachments via Supabase Storage (10MB limit)
- Signed URL downloads for attachments (1-hour expiry)
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

### Step 8: Blocking Tool (Phase 1) — IMPLEMENTED

- **New role:** `choreographer` (7th role, has `blocking:edit` + standard director-level caps)
- **New capabilities:** `blocking:view` (all roles), `blocking:edit` (admin, producer, director, choreographer, stage_manager)
- **New DB tables:** `production_scenes`, `scene_beats`, `stage_configurations`, `blocking_positions`
- **Schema change:** `production_memberships` now has `character_name` (nullable)
- **New feature modules:** `features/scenes/` (queries, actions, validation), `features/blocking/` (queries, actions, constants)
- **Set piece library:** 15 SVG shapes (chair, armchair, couch, loveseat, beds, tables, desk, stairs, door, window, grand piano, podium, platform)
- **Routes:** `/productions/[slug]/blocking` (canvas), `/productions/[slug]/blocking/setup` (wizard)
- **Blocking canvas:** PDF background (rendered via pdfjs-dist v5), number line ruler overlay with toggleable SL/SR and US/DS grids, drag-and-drop actor tokens + set pieces (@dnd-kit/core), autosave per beat, in-session undo (50 states)
- **Actor tokens:** Circle with initials, actor name + character name (italic), auto color-coded
- **Scene/Beat manager:** Left panel — Act/Scene/Beat hierarchy, add/delete; "Capture Beat" button records current layout as a beat and advances to the next automatically
- **Stage setup wizard:** 2-step flow — select ground plan PDF + enter proscenium width/depth, then 2-point click calibration on PDF for scale; original PDF in Document Center is untouched
- **Number line ruler:** Proscenium baseline with tick marks every 2', labels every 5'; SL/SR and US/DS grid lines are toggleable (both off by default)
- **Permissions:** SM/Director/Choreographer/Admin/Producer can drag and edit; Cast/Crew view only
- **Known limitations (Phase 2):** Set piece rotation UI, character name assignment UI in member management, multi-page ground plan support, print/export

### Step 9: Notes — IMPLEMENTED

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

## Scaffolded only (not implemented)

- **Announcements** — placeholder page exists, capability defined, feature directory has only .gitkeep
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
