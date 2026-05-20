# Current Status

**Last updated:** 2026-05-19

**Current milestone:** Steps 1-13 complete + Script Editor (Step 14) + Personal Calendar (Step 15). Latest: cross-production calendar at `/calendar` with month/week views, production color filters, and a per-production color column reused by the sidebar rail.

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
- **UI port (2026-05-20):** `/productions` list restyled to the warm `.prod-card` design (status dot, display-font title, Opens/Closes footer, "Open hub" hover CTA); locked non-assigned cards retained. See `docs/ui-port-roadmap.md`.

### Step 5: Reports — IMPLEMENTED (overhauled 2026-05-06; daily log removed 2026-05-15)
- Structured rehearsal report: header (date, scheduled call, actual start, end), TipTap general notes, 12 fixed department text fields, next-rehearsal block
- Per-production auto-incremented `report_number` (MAX+1 in server action)
- **Email Report** button: recipient picker (entire production or individual checkboxes), sends HTML email via Resend (`resend` package, `RESEND_API_KEY` + `RESEND_FROM_EMAIL` env vars)
- Reports list shows `#N — {date}`; legacy `scheduleNotes` still renders if populated
- Report file attachments via Supabase Storage (10MB limit), signed URL downloads (1-hour expiry)
- **Removed:** Daily log feature and "Import from daily log" button (redundant with report general notes)
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

### Step 10: Blocking Tool (Phase 1 + Phase 2 + Phase 3 UI + Phase 4 arrows/layers/notes) — IMPLEMENTED

- **New role:** `choreographer` (7th role, has `blocking:edit` + standard director-level caps)
- **New capabilities:** `blocking:view` (all roles), `blocking:edit` (admin, producer, director, choreographer, stage_manager)
- **New DB tables:** `production_scenes`, `scene_beats`, `stage_configurations`, `blocking_positions`, `custom_set_pieces`, `beat_arrows`; `scene_beats.notes` (text column)
- **Schema changes:** `production_memberships.character_name` (nullable); `stage_configurations.ground_plan_page` (int, default 1)
- **New feature modules:** `features/scenes/` (queries, actions, validation), `features/blocking/` (queries, actions, constants)
- **Set piece library:** 15 built-in SVG shapes (chair, armchair, couch, loveseat, beds, tables, desk, stairs, door, window, grand piano, podium, platform) + user-uploaded custom pieces
- **Routes:** `/productions/[slug]/blocking` (canvas), `/productions/[slug]/blocking/setup` (wizard)
- **Blocking canvas:** PDF background (rendered via pdfjs-dist v5), number line ruler overlay with toggleable SL/SR and US/DS grids, drag-and-drop actor tokens + set pieces (@dnd-kit/core), autosave per beat, in-session undo (50 states)
- **Actor tokens:** Initials from firstName[0]+lastName[0]; only character name shown under circle; auto color-coded
- **Set piece rotation:** Free-angle corner drag handle (pointer capture, delta-based angle tracking); rotation stored and restored per beat
- **Cross-scene beat copy:** First beat of a new scene automatically inherits positions from the last beat of the previous scene
- **Multi-page ground plans:** Page selector in setup wizard; prev/next page controls on canvas; `ground_plan_page` stored in stage config
- **Export PNG:** "Export" button composites PDF canvas + tokens into a downloadable PNG via browser Canvas API
- **Recalibrate shortcut:** "Recalibrate Only" button skips directly to calibration when an existing config exists
- **Character name assignment:** Inline editable character name on cast member rows in the production members page
- **Scene/Beat manager:** Left panel — Act/Scene/Beat hierarchy, add/delete; "Capture Beat" auto-labels and advances
- **Stage setup wizard:** 2-step — select ground plan PDF + enter proscenium width/depth, then 2-point click calibration
- **Number line ruler:** Proscenium baseline with ticks every 2', labels every 5' on the SL/SR axis; US/DS horizontal grid lines show spacing only (no depth labels); toggleable independently
- **Thin semi-transparent grid:** SL/SR and US/DS grid lines rendered at `rgba(80,80,80,0.15)`, z-layered above floorplan, below all tokens; square grid when both axes enabled (US/DS spacing matches SL/SR 2ft spacing)
- **Immersive canvas layout:** Canvas fills full available viewport via negative margin bleed (no wasted whitespace); fullscreen mode via `position:fixed; inset:0; z-index:9999`; Escape key exits fullscreen
- **Accurate drag placement:** Off-stage tokens land at cursor position using `activatorEvent.clientX + delta.x` (not tile rect)
- **Custom set piece uploads:** Users with `blocking:edit` can upload SVG, PNG, or JPG (max 5 MB) to use as set pieces. Stored in Supabase Storage `attachments` bucket under `set-pieces/{productionId}/`. DB table `custom_set_pieces` tracks metadata. Signed URLs (1hr) generated server-side; custom pieces render centered in their canvas tokens
- **PDF flash fix:** Ground plan PDF is rendered once to an offscreen canvas and cached as an `ImageBitmap` in module-level memory, keyed by stable file path. Subsequent beat switches and `router.refresh()` calls reuse the bitmap — no canvas clear/redraw flicker
- **Movement arrows (auto):** Togglable overlay showing straight-line arrows from current beat to next beat positions for each actor; edge-to-edge (not center-to-center); colored per actor; hidden for stationary actors
- **Draw-your-own arrows:** "Draw Arrow" mode (pencil tool) — click to set start, click to finish; snaps color to nearest actor token; arrows stored in `beat_arrows` DB table; delete via hover button; persists across beat navigation
- **Layer toggle:** Toolbar segmented control switches between "Actors" and "Set Pieces" layers; non-active layer tokens get `pointerEvents: none` so they cannot be accidentally moved
- **Per-beat notes:** Collapsible TipTap rich-text notes section in right panel (between Set Pieces and Beat Comments); 1-second debounce autosave to `scene_beats.notes`; resets on beat navigation via `key={beatId}`
- **Permissions:** SM/Director/Choreographer/Admin/Producer can edit; Cast/Crew view only
- **Known future work:** Full beat-breakdown export (multi-page PDF or print view with scene/beat snapshots)

### Step 11: Notes ("My Notes") — IMPLEMENTED + UI PORTED

- Tab labelled **"My Notes"**, 3rd position in production tab strip (after Rehearsal Reports)
- Two-column grid layout (360px list + 1fr editor) matching the warm theatre design system
- Notes are **always private** — visibility toggle removed from UI; stored as "private" in DB
- Filter tabs: All, To-do, Pinned, Notes (Done filter removed; completed to-dos sort to bottom of To-do view)
- To-do rows have a **clickable circle** in the list — checks off without opening the note
- **Animated strikethrough:** line draws across title over 350ms + colour fade; item holds list position during animation before sinking (~420ms)
- **Auto-date:** new notes pre-fill due date with today
- Pinned notes grouped at top; tag picker dropdown in editor header
- Org-level tag library seeded with 6 defaults: Follow-up, Blocking, Props, Costumes, Technical, Safety
- Tag manager modal uses **React portal** (escapes CSS transform stacking context), **backdrop blur**, click-outside-to-close
- TipTap rich text editor with auto-save (600ms debounce)
- **Known limitation:** Privacy not enforced at query level — all production members can technically read all notes in DB

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

### Step 13: @Mentions + Dashboard Improvements — IMPLEMENTED (2026-05-15)

**@Mention autocomplete (write path)**
- `@tiptap/extension-mention` + `@tiptap/suggestion` added (pinned to exact `3.22.5` to match existing TipTap packages)
- `components/ui/mention-suggestion.ts` — shared TipTap suggestion config: filters members by name, renders a floating `ReactRenderer` popup, keyboard navigable
- Mention nodes render as inline chips (`<span class="mention-inline">`) in all rich-text editors
- Editors with mention support: report general notes, all 12 department note modals, announcement body, My Notes editor
- `features/mentions/write.ts` — idempotent `writeMentions(html, ctx)`: deletes all existing mentions for `contextType+contextId`, then re-inserts by extracting `data-id` from mention HTML. Called after every report create/update, announcement create, and note autosave
- `db/schema/mentions.ts` table: `organizationId`, `productionId`, `mentionedUserId`, `mentionedById`, `contextType` (report/announcement/note), `contextId`, `contextTitle`, `snippet` (first 200 chars stripped of HTML), `readAt`

**Dashboard mention cards**
- Mention cards are clickable: clicking navigates to the source context (`/productions/[slug]/reports/[id]`, etc.) and marks the mention as read
- Fade-not-remove UX: clicking a card fades the blue unread highlight immediately (optimistic) but the card stays visible in the Unread tab until navigation completes — prevents jarring disappearance
- Mark-as-unread: read cards show a circle button on hover to restore unread state (optimistic via `unfadedIds` set)
- Mark all as read: ghost button in the mentions section header, only shown when there are unread items
- Cards use `<div role="button">` rather than `<button>` to allow nested interactive elements (mark-as-unread button)

**Dashboard pinning**
- Pin cards on the dashboard now show an unpin button on hover (absolutely positioned, `opacity:0` by default, revealed on hover)
- Unpin is optimistic: card removed from local state immediately, server action fires in background
- `PinnedSection` converted from server to client component to hold local pin state

**Navigation rename**
- "Calls" tab renamed to "Rehearsal Schedule" in the production tab strip

### Step 14: Script Editor ("Your Script" tab) — IMPLEMENTED

- "Your Script" tab added to every production (gated to production members)
- Per-user PDF annotation editor; annotations are private per user
- **Annotation tools:** highlight (draw box), highlight (text selection), sticky note (with text), cue marker (box + leader line to margin with cue number + description)
- Left/right leader side toggle for cue tool; leader line connects at bottom edge of box
- **Annotations panel** (right column): grouped into "Cues" and "Notes" sections with section headers and count badges; sorted top-to-bottom by position
- **Inline editing:** pencil button on note/cue panel items opens in-place text fields; Enter or blur to confirm, Escape to cancel
- **Bookmarks panel** (above annotations panel): add titled bookmark for any page, click to navigate, sorted by page, accent highlight on current page
- **Page thumbnails sidebar:** collapsible (toggle via LayoutList icon in toolbar); all pages rendered progressively at 0.25× scale; cached in module-level map; sticky positioning; auto-scrolls active page into view
- **Zoom controls:** 5 steps (75–200%) in nav bar; each zoom level cached separately in bitmap cache
- **Breathing room:** PDF page floats on `--bg-sunken` workspace background with enhanced drop shadow
- **Download annotated PDF:** renders every page at 2× quality with annotations composited via Canvas 2D API; assembled with jsPDF; shows per-page progress
- **Auto-save:** 1.5s debounce after any annotation/bookmark change; saves to `script_annotations` DB table (per-user, per-script)
- **Stale script banner:** shown when the default script is replaced; dismissible
- **DB:** `script_annotations` table with `annotations`, `bookmarks`, `pageOverrides`, `hasStalePages` JSONB/boolean columns; `documents.isDefaultScript` + `documents.scriptVersion` fields; "Set as default script" action in document row menu
- **Known scaffold:** `pageOverrides` data model exists (stored/loaded) but no UI to set overrides yet

### Step 15: Personal Calendar — IMPLEMENTED

- Top-level `/calendar` route — restyled to match `design-reference/jsx/tab-calendar.jsx` 1:1
- Two-column layout: 248px sidebar (mini-month + production filter + upcoming) + main canvas
- Four views: **month**, **week**, **day**, **agenda** — swappable via segmented `.seg` control; client-side switching (no page reloads)
- Week + day views render an hourly grid (8 AM–11 PM) with events absolutely positioned by `(callTime, durMin)`; live "now" line in `--accent`
- Month view: 6×7 grid with `.month-chip` rows; up to 4 per cell, "+N more" jumps to day view
- Agenda view: 21-day window grouped by date, display-font day numbers, "Today" pill
- Event drawer slides in from the right with type chip, display-font title, production link, when/where, Edit + Open schedule actions
- Each event chip/block uses its production's color via `--evt-color` CSS variable, mixed into background + border via `color-mix`
- Production filter (sidebar) toggles which shows are included; admins/producers see all org productions, members see only their own
- Mini-month picker shows event pips and respects today / cursor highlights
- Data window: `-45d / +120d` from page load — generous enough to cover typical month/week/day/agenda navigation without refetch
- New `productions.color` column (nullable text storing a palette token); deterministic hash fallback via `fallbackColorTokenForId`; legacy `var(--c-...)` strings normalized at read time
- Color picker swatches on the new-production form; same color reused in the sidebar rail's production dot and the productions list card
- New query: `getCallsForUserInRange({ userId, organizationId, startDate, endDate, manageAll })` in `features/calls/queries.ts`
- All calendar styles live in `app/globals.css` under `.cal-*`, `.week-*`, `.month-*`, `.day-*`, `.agenda-*`, `.mini-*`, plus utility helpers `.seg`, `.row`, `.gap-sm`, `.mono`, `.truncate`, `.anim-in`
- **DB migration** was applied directly via Supabase MCP (`add_production_color`) — no `pnpm db:push` needed

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
