# Current Status

**Last updated:** 2026-05-29

**App name:** **Proscene** (renamed from "CallBoard" on 2026-05-27 — the `callboard` domain could not be secured). The product is **live at [https://proscene.app](https://proscene.app)** with a verified email sending domain. The rebrand updates the rail wordmark (`Pro<em>scene</em>`), the rail/icon mark glyph (`C` → `P`), the four auth-screen brand headers (login, signup, forgot-password, reset-password), the PWA manifest, root metadata (`title` / `applicationName` / `appleWebApp.title`), `apple-icon.tsx`, `public/icon.svg` + `public/icon-maskable.svg`, the rehearsal-report email footer ("Sent via Proscene"), and `package.json` / `package-lock.json` `name`. The Supabase project is still literally named `CallBoard` in the Supabase dashboard — backticked `CallBoard` references in these docs point to that project identifier and are intentionally unchanged. Colors and design tokens are unchanged. PR [#10](https://github.com/Mike-Grizzly/CallBoard/pull/10) merged to `main` 2026-05-27.

**Email + domain infrastructure (2026-05-27):** the email pipeline that gated most of P3 is now wired end-to-end. `proscene.app` is registered at Namecheap; DNS for both Resend (SPF + DKIM + MX on `send.proscene.app`) and Vercel (apex A record on `@`, CNAME on `www`) is live and verified. Resend SMTP is plugged into **Supabase → Auth → SMTP Settings** as a custom SMTP provider (host `smtp.resend.com`, port `465`, sender `noreply@proscene.app`). Supabase **Site URL** = `https://proscene.app`; the redirect-URL allowlist covers `localhost:3000`, `call-board.vercel.app` (Vercel auto URL, kept as fallback), and `proscene.app` (all with `/**` glob). Vercel env: `NEXT_PUBLIC_SITE_URL=https://proscene.app`, `RESEND_FROM_EMAIL=noreply@proscene.app`. Smoke test passed — Supabase Dashboard → Send Magic Link delivered an email from `noreply@proscene.app` with a link resolving to `https://proscene.app/...`. **Still to verify end-to-end against the live deploy:** the app's own `/forgot-password` flow, the member-invite flow, and a rehearsal-report email (D2 in `launch-roadmap.md` is now fully resolved as infrastructure; the P3 checklist items that depended on it are unblocked). See `decision-log.md` (2026-05-27 — email + domain wiring).

**Current milestone:** Steps 1-13 complete + Script Editor (Step 14) + Personal Calendar (Step 15) + People Directory (Step 16) + full mobile/PWA pass (P2) + Proscene rebrand and email/domain wiring (P3 prep). All work through 2026-05-27 is merged to `main` (mobile/PWA via PR #9, rebrand via PR #10, docs catch-up via PR #11) and live at `proscene.app`.

**Launch planning:** the path from feature-complete MVP to a soft launch (testing site + invited testers) and on to public launch is tracked in `docs/launch-roadmap.md`. Phases P0 (security hardening), P1 (Vercel deployment), and the email-deliverability + custom-domain unlocks for P3 are shipped. **P2 (mobile/PWA) is functionally complete**: bottom-tab mobile nav, PWA manifest, all 8 slices of the per-screen responsive audit, view-only mode for the blocking canvas and script editor, and a landscape-phone rule for blocking. Remaining P2 items before P3: real touch-editing support (currently view-only on phones), live device verification including "Add to Home Screen", and the deferred polish items below. **P3 (beta) is now unblocked**: with email + custom domain live, the remaining P3 work is end-to-end flow verification (invite, password reset, report email), beta org-model confirmation (D5), tester onboarding docs, and a feedback channel. See `decision-log.md` (2026-05-21 / 05-22 / 05-27).

## Feature status

### Step 1: Foundation & App Shell — IMPLEMENTED
- App shell with topbar, sidebar, and main content area
- Route structure with placeholder pages for all planned features
- Tailwind v4 theme with CSS variables
- Local UI primitives (Button, Card, Separator)
- Root redirect to /dashboard
- Sidebar nav items with icons and capability-based filtering
- **Mobile navigation (2026-05-22, P2):** at phone widths (≤720px) primary
  nav is a 5-tab bottom bar (Today / Calendar / Reports / Notes / More) —
  context-aware: inside a production the tabs scope to that production's
  sub-routes (`mobile-tab-bar.tsx`). A new `/more` page hosts the
  workspace destinations that fall off the tab bar. The 64px icon-rail is
  kept for tablet widths (721–1100px). The earlier slide-in drawer
  (same day) was superseded after reviewing the mobile demo files. See
  `docs/launch-roadmap.md` P2.
- **Not fully verified:** mobile drawer behavior on real devices (built and
  type-checked only); broader responsive layout of inner pages

### Step 2: Auth — IMPLEMENTED
- Supabase email/password auth (signup, login, logout)
- Signup form with first name, last name, position/role picker
- Email verification flow with confirmation page and resend
- Forgot password / reset password flow
- `proxy.ts` route protection (Next.js 16 replacement for middleware)
- Auth callback handler (PKCE + implicit flows)
- Auto-profile creation on first login
- First user in org becomes admin, subsequent users get "cast" role
- **UI port (2026-05-20):** all auth screens (login, signup, signup-confirm, forgot/reset password) restyled to the warm design on a new `.auth-*` CSS block; the stale "Show Portal" brand corrected to "CallBoard". See `docs/ui-port-roadmap.md`.
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
- **UI port (2026-05-20):** the org member page (`/settings/members`) and production member page (`/productions/[slug]/members`) restyled to the warm `people.jsx` table look — `.pp-table` rows, role-tinted avatars, role pills — on a new `.pp-*` CSS block. See `docs/ui-port-roadmap.md`.
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
- **New-production builder (2026-05-29):** the old single-form `/productions/new` was replaced by a two-path creation flow. The "+" on `/productions` now opens a menu with **Full setup** and **Quick add**:
  - *Full setup* is a 6-step wizard (Basics → Calendar → Departments → Roles → Team → Review) ported from the design's `new-production.jsx` into a typed client component (`new/new-production-wizard.tsx`, styled under `.np-root` in `globals.css`). Opens as a full-screen **overlay** in-app (lazy-loaded via `next/dynamic`) and also renders as a linkable, refresh-safe **page** at `/productions/new`. The actor autocomplete reads real org members; team members are assigned (existing org users) or invited via the existing `inviteMembers`/Supabase-admin path (new emails require `settings:manage`, skips reported on the launch screen). Persists via `createProductionFull`.
  - *Quick add* is a small modal (show name + optional opening date) → `quickCreateProduction` creates a `draft` and routes to the hub.
  - **Schema (applied 2026-05-29):** `productions` gained `venue`, `season`, `first_rehearsal_date`, `tech_start_date`, `rehearsal_days` (jsonb), `rehearsal_start`, `rehearsal_end`; new tables `production_departments` and `production_roles` (RLS enabled to match the rest of the schema). Applied additively to the `CallBoard` Supabase project; equivalent to `npm run db:push` from the updated Drizzle schema.

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
- **UI port (2026-05-20):** production + global announcement pages restyled to the warm `.ann-card` design (colored scope rail, author avatar, scope pill, display-font title); the create form moved to a warm `.card`. See `docs/ui-port-roadmap.md`.
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
- **Scheduler UX pass (2026-05-29):**
  - *Swipeable week view.* `week-view.tsx` was rebuilt as a single scroll container with a frozen time-gutter (`position: sticky; left`) and frozen day headers (`sticky; top`). The day strip shows **3 days on phone (≤720px), 5 on tablet (≤1100px), full 7 on desktop**. Column width is measured in JS (`--week-day-w` set to an exact px from the scroll-port width via `ResizeObserver`) because percentage grid tracks resolve unreliably inside a horizontally-overflowing scroller — that was making columns too wide and breaking snap. `scroll-snap-type: x mandatory` gives clean day-to-day snapping. On mount / week change it auto-scrolls so **today is the first visible column** (falls back to the navigated day). The old ≤720px rule that squeezed 7 columns into a 38px gutter was removed.
  - *Create affordance.* The calendar/scheduler now exposes call creation directly: a "Schedule call" button in the toolbar (desktop/tablet) and a circular **FAB** bottom-right on phones. Scoped production calendars (and single-production workspaces) jump straight to that production's new-call form (prefilled with the cursor date); the multi-production workspace calendar opens a small production picker sheet first. Gated on `reports:create` via the existing `canEdit`.
  - *Outlook-style call form.* The rehearsal call create/edit form (`calls/new/call-form.tsx`) was restyled from stacked sections into grouped "cards" with icon · label · control rows (date/time/location inline, focus/scenes/cast/schedule/notes stacked). New `.cform-*` CSS block in `globals.css`. Server action and fields unchanged. (Pattern is a candidate to extend to other forms once validated.)

## Performance pass (2026-05-20)

Branch `claude/improve-page-performance-YXRgv` — page-load optimizations, no behavior change except reports pagination:

- **Production layout no longer over-fetches.** `app/(app)/productions/[slug]/layout.tsx` runs on every production sub-page and fetched full reports/documents/announcements/deleted-items rows only to read `.length` for tab badges. Replaced with `COUNT(*)` queries: `getReportCountByProduction`, `getReportStatusCounts`, `getDeletedReportCountByProduction` (reports), `getDocumentCountByProduction`, `getDeletedDocumentCountByProduction` (documents), `getAnnouncementCountByProduction` (announcements).
- **Blocking page N+1 fixed.** `getScenesWithBeats` in `features/scenes/queries.ts` issued one beats query per scene; now a single `inArray` query grouped in memory.
- **TipTap is lazy-loaded.** `RichTextDisplay` moved to its own server-safe file `components/ui/rich-text-display.tsx` (no TipTap import); the editor loads on demand via `components/ui/rich-text-editor-lazy.tsx` (`next/dynamic`, `ssr: false`). Display-only pages no longer ship the ~300KB editor bundle.
- **Reports list is paginated.** `/productions/[slug]/reports` pages 25 rows at a time via `?page=` (preserves the `?status=` filter). `getReportsByProduction` takes optional `{ status, limit, offset }`; calling it with no options is unchanged.
- **Request-level dedup with `React.cache()`.** The layout and the page of a single request each ran the full auth chain — `getCurrentUser` (a Supabase `auth.getUser()` network call plus DB queries), `getOrCreateDefaultOrganization`, `getProductionBySlug` — independently. These three are now wrapped in `cache()`, so each runs once per request. `getCurrentUser` also parallelizes its org + profile lookups. This was the main cause of multi-second tab loads.

## Script & blocking PDF performance (2026-05-20)

- **Parsed PDFs are cached.** New `lib/pdf.ts` exposes `loadPdfDocument(url)`, which caches the parsed `PDFDocumentProxy` per URL. Previously both the script viewer and the blocking canvas re-downloaded and re-parsed the whole PDF on every page turn / zoom change (and the script thumbnail panel loaded it a third time). Now the document loads once and navigation only renders a page.
- **Loading states.** A `.pdf-spinner` (new `@keyframes spin` in `globals.css`) shows while a PDF page renders in both viewers. New route-level `loading.tsx` files for the `script/` and `blocking/` segments give an immediate response on tab switch instead of a frozen-feeling gap.

## People directory & mass upload (2026-05-20)

Branch `claude/people-mass-upload-feature-PkU2l` — new Step 16. Full spec in
`docs/feature-specs/16-people-directory.md`.

- **New `/people` page** (admin-only, in the Workspace rail section) — org-wide
  directory with stat-card filters, search, category/production/status filters,
  table and card views, and a person detail/edit drawer.
- **Mass upload** via an Add People modal with three paths: a manual
  single-person form, a CSV importer (auto-detect delimiter, column mapping,
  validated preview), and a bulk paste wizard.
- **Invite model** — uploaded people become Supabase auth users in an
  `invited` state via the Admin API; `profiles` stays 1:1 with auth users so
  org and production memberships need no FK changes. `lib/auth.ts` promotes
  `invited` → `active` on first sign-in. Requires a new env var
  `SUPABASE_SERVICE_ROLE_KEY` (server-only) — already listed in `.env.example`.
- **Multi-production assignment** — multi-select people and assign them to a
  production in bulk, or assign from the drawer; reuses `assignProductionMember`.
- **Schema:** `profiles` gained `phone`, `pronouns`, `status`, `last_active_at`
  (all additive) — applied to the `CallBoard` project via Supabase MCP migration
  `add_people_directory_profile_columns`.
- New feature module files: `features/members/{constants,validation}.ts`,
  `inviteMembers` / `updatePersonProfile` / `setMemberStatus` / `resendInvite`
  in `features/members/actions.ts`, `getPeopleDirectory` in `queries.ts`, and
  `lib/supabase/admin.ts` (service-role client).
- **Not yet done:** live verification of the invite email flow against the
  Supabase project — needs `SUPABASE_SERVICE_ROLE_KEY` set, the callback URL in
  the Auth "Redirect URLs" allowlist, and (for bulk invites) custom SMTP.

## Mobile navigation & PWA (2026-05-22)

Branch `claude/bold-einstein-hHMHD` — first slice of launch-roadmap **P2**.

- **Mobile drawer navigation.** New client shell
  `components/app-shell/app-frame.tsx` wraps the `(app)` layout. On desktop
  it is a passive wrapper (the rail stays in the CSS grid). At ≤720px it
  renders a sticky top bar (hamburger + brand) and turns the rail into an
  off-canvas slide-in drawer: dimmed backdrop, close (X) button,
  Escape-to-close, background scroll lock, focus moved into the drawer, and
  auto-close on navigation (drawer state is derived from the route, so no
  state-syncing effect). `globals.css` gained a mobile-navigation block; the
  existing icon-collapse media query was rescoped to
  `min-width: 721px and max-width: 1100px` so phones get the drawer and
  tablets keep the 64px icon rail. `Rail`'s `<aside>` got `id="app-rail"`
  for `aria-controls`.
- **Installable PWA.** `app/manifest.ts` (`MetadataRoute.Manifest`:
  standalone display, `/dashboard` start URL, `#fbf8f3` theme/background).
  Icons: `public/icon.svg` + `public/icon-maskable.svg` (the Proscene "P"
  mark), and `app/apple-icon.tsx` which generates a 180×180 PNG
  `apple-touch-icon` via `next/og` `ImageResponse` (iOS does not accept SVG
  touch icons). Root layout gained `icons` / `appleWebApp` metadata and a
  `viewport` export with `themeColor`. No new dependency.
- **Production tab strip.** The production header has up to 8 tabs in a
  flex row with no overflow handling, so on a phone it forced a sideways
  scroll of the whole page. At ≤720px `.tabs` is now a contained
  horizontal scroller (edge-to-edge, snap, hidden scrollbar);
  `production-tabs.tsx` scrolls the active tab into view on route change.
- **View-only phone mode for mouse-built tools.** The blocking canvas and
  the script editor are drag-and-drop / draw-built and unusable by touch.
  New `lib/use-is-phone.ts` hook (`useSyncExternalStore` over a
  `matchMedia` query). At ≤720px the blocking canvas derives
  `canEdit = canEditProp && !isPhone` (its single edit gate, so all edit
  affordances drop out); the script editor locks the tool to `pointer`,
  hides the drawing tools, and hides the annotation panel's edit/delete
  controls. Script bookmarks stay usable (navigation aid). Touch *editing*
  remains future P2 work — the goal is at least tablet parity for blocking.
- **Bottom-tab nav replaces the drawer (slice 1 of demo port, 2026-05-24).**
  Following review of the new Claude-design mobile demo, the slide-in drawer
  was retired in favour of a 5-tab bottom bar (Today / Calendar / Reports /
  Notes / More). `components/app-shell/mobile-tab-bar.tsx` is the new client
  shell; tabs are context-aware — inside `/productions/[slug]/*` they scope
  to that production, otherwise they fall back to workspace routes. The
  `app/(app)/layout.tsx` `AppFrame` is now a passive wrapper that just
  renders the rail + main + `<MobileTabBar />`; the desktop rail is hidden
  at ≤720px via `.rail { display: none }` in the mobile block. `.main` gains
  bottom padding for the fixed bar plus the iOS home-indicator safe area.
- **Mobile Today / Dashboard (slice 2, 2026-05-24).** New server component
  `app/(app)/(default)/dashboard/mobile-today-hero.tsx` renders inside the
  existing `/dashboard` page and is CSS-gated to phone widths. Layout
  mirrors the demo's "Promptbook" variant: greeting + next-call hero card
  (production, time range, focus, location pill, "Open production" footer)
  + 2×2 stat grid (Productions / Mentions / Pinned / Next call). The
  desktop `.home-hero` and the "Upcoming rehearsals & calls" grid (now
  marked `.dashboard-desktop-only`) are hidden at ≤720px so they don't
  double up. Existing announcements / productions browser / mentions /
  pinned sections still render below — they'll get mobile passes in later
  slices.
- **Calendar week-view overflow fix (2026-05-24).** The week and day grids
  used `repeat(N, 1fr)` (= `minmax(auto, 1fr)`) so event titles forced
  columns wider than the viewport, pushing the page sideways on phones.
  Switched to `minmax(0, 1fr)` so columns can shrink below content and
  events truncate inside them. `.cal-canvas` also gained `min-width: 0`.
- **Week-view header on phones (2026-05-24).** The day-of-week header
  was still bleeding into adjacent columns at ≤720px (weekday + date in
  a flex row, too wide for ~43px columns). At phone widths `.week-day-h`
  now stacks vertically (column, centered) with smaller fonts and the
  hour gutter shrinks from 60px → 38px to give days more room.
- **Mobile notes list ↔ editor swap (slice 5, 2026-05-24).** The two-column
  notes panel (360px list + editor) collapses to a single column at
  ≤720px and CSS-swaps between views based on selection: with no note
  selected the list fills the screen; tapping a note swaps to the
  editor with a "← Notes" back button at the top to return. The outer
  wrapper now has class `.notes-panel` and `data-editor-open` attribute;
  `.notes-list-col` / `.notes-editor-col` mark the two columns. No
  state-management changes — the existing `selectedId` drives the toggle.
- **Workspace notes feed at `/notes` (2026-05-24).** The bottom-tab
  "Notes" used to fall back to `/dashboard` when not in a production
  (because notes were per-production), so tapping it from anywhere
  outside a show did nothing visible. New `app/(app)/(default)/notes/`
  route lists *every* note the caller has authored across every
  production they belong to (admin/producer sees the org), newest-first
  by `createdAt`. Cards match the mobile demo: colored production rail,
  todo circle / pencil icon, title (strikethrough when complete), 2-line
  excerpt, tag pill + due-date + relative-time footer. New query
  `getAllNotesForUser` joins `production_notes` to `productions` for
  title/slug/color. Tapping a card deep-links into the production-scoped
  editor via `?id=` — `NotesPanel` accepts an `initialSelectedId` prop
  and pre-selects when the id matches. Mobile tab bar now points Notes
  at `/notes` unconditionally; production-scoped notes are still reached
  via the production tab strip.
- **Script viewer mobile chrome (slice 6, 2026-05-24).** At ≤720px the
  layout collapses to a single column, the 52px tool sidebar is hidden
  (view-only mode disables editing anyway), and the 248px right panel
  stacks beneath the PDF.
- **Documents + People mobile layout (slice 8, 2026-05-24).** Documents
  used a 220px folder rail + 1fr docs grid that didn't fit on a phone.
  Outer + folder rail + main got marker classes (`.docs-shell`,
  `.docs-folders`, `.docs-main`); at ≤720px the grid collapses to a
  single column and the folder rail becomes a horizontally-scrollable
  pill strip at the top of the page. People uses a real `<table>` with
  many columns; the wrapper (`.pp-table-wrap`) now scrolls horizontally
  on phone and the table keeps a `min-width: 600px` so columns stay
  legible. Notifications: the existing notification bell in the
  production topbar and the dashboard mentions section already cover
  the in-app cases — a formal `/notifications` inbox is deferred.
- **Blocking mobile layout (slice 7, 2026-05-24).** The blocking canvas
  uses a 3-column editor layout (220px scenes/beats · canvas · 240px
  set-pieces/comments). On a phone that left no room for the canvas.
  Outer wrapper, left panel, center canvas, and right panel got marker
  classes (`.bk-shell`, `.bk-side-left`, `.bk-center`, `.bk-side-right`).
  At ≤720px the grid collapses to a single column and stacks: canvas
  first (full width, ≥56vh tall — actor tokens stay aligned because
  positions are stored as canvas percentages), then the scenes/beats
  panel below (max 50vh, scrollable), then the comments/notes panel
  (max 50vh, scrollable). The fullscreen edge case still uses the
  desktop grid — mobile users don't hit it. Editing remains disabled
  on phone (existing view-only mode).
- **Script viewer compact PDF + quick bookmarks (2026-05-24).** Slice 6
  still required panning to read the PDF on a phone — the canvas
  rendered at its high-DPI scale (~1300px wide) overflowed the
  viewport. The PDF canvas is now CSS-scaled to fit the viewport
  width on phone (`canvas { width: 100% !important; height: auto }`);
  the SVG annotation overlay already uses `viewBox` so it scales
  correctly with the canvas. Workspace padding and page shadow are
  zeroed on phone so the script fills edge-to-edge. A new floating
  bookmarks button (`.sv-mobile-bookmarks-btn`, fixed above the tab
  bar) opens a bottom sheet that reuses the existing `BookmarksPanel`
  — users no longer have to scroll past the entire PDF to reach
  bookmarks. The right-panel bookmarks below the canvas are still
  available as a second route.
- **Today tab always returns to workspace dashboard (2026-05-24).** The
  bottom-tab "Today" used to scope itself to the current production when
  inside a show (per the demo's single-production mental model), which
  felt confusing — "Today" implied "home". It now always routes to
  `/dashboard` and `isActive` only on `/dashboard`.
- **Deferred polish** (noted 2026-05-24, fix later): the production-view
  visuals feel a little forced once we drop into a show — a follow-up
  pass should clean up the per-production mobile chrome (production
  header, tab strip density, etc.) together. The broader review of
  production-context mobile navigation also remains open.
- **Calendar mobile polish (slice 4, 2026-05-24).** Four demo-pattern
  changes to the calendar at phone widths: (a) the `EventDrawer` slides
  up from the bottom as a sheet instead of from the right as a side
  drawer (CSS-only at ≤720px, reuses the existing animation primitives);
  (b) the month view renders each cell as a single tap-target `<button>`
  with the date in the top-right and up to 5 colored pip dots — chips
  with titles only appear on desktop (branched in `month-view.tsx` via
  `useIsPhone`); (c) tapping a day in the month view opens a new
  `DaySheet` bottom sheet listing that day's events instead of jumping
  the whole view to "day" — selecting an event there dismisses the day
  sheet and opens the full `EventDrawer`; (d) the toolbar (prev/next,
  period label, view switcher) is compacted on phone — smaller period
  label, tighter view-switcher buttons.
- **Mobile reports list + detail (slice 3, 2026-05-24).** Two new server
  components — `mobile-reports-list.tsx` and `mobile-report-detail.tsx` —
  render alongside the existing desktop layouts in `/productions/[slug]/reports`
  and `/.../reports/[reportId]`. At ≤720px the desktop table / multi-card
  layout is hidden (`.reports-desktop`, `.report-detail-desktop`) and the
  mobile views appear (`.reports-mobile`, `.report-detail-mobile`). List
  cards match the demo: date strip + report number + status pill + summary
  + chevron. Detail stacks date + status + Pin/Email/Edit actions, a hero
  card with call/start/end times and Present/Absent/Late stat tiles, then
  General notes, Scenes worked, Next rehearsal, all 12 Department notes
  as small cards, Schedule changes / Line notes / Injuries, and
  Attachments — no tabbed panels on phone, everything stacks. PinButton /
  EmailReportButton / AttachmentUpload client components are reused as-is.
- **Production calendar unified with workspace `/calendar` (2026-05-24).**
  Per user direction, the per-production calls page (`/productions/[slug]/calls`)
  now renders the same `<CalendarClient />` as the workspace `/calendar`,
  filtered to just that production. Same 4 views, same sidebar, same
  event drawer — no UX divergence. The old standalone month grid is
  gone. `CalendarClient` dropped `.page` from its outer div so the
  component is portable; `.cal-page` is now self-sufficient (own padding,
  `flex: 1; min-height: 0`). `.page` itself became a flex column to
  allow children to flex-fill. A `.page:has(> .cal-page)` rule strips
  outer padding when the calendar is nested inside the production
  layout's `.page` wrapper, so padding doesn't double up. Trade-off: the
  old page's inline "Schedule call" button is gone (matches the
  dashboard, which never had one); editing existing calls still works
  via the calendar drawer's "Edit" link.
- **Verified:** `next build` compiles, `tsc --noEmit` passes. No new
  `eslint` errors (two pre-existing `set-state-in-effect` errors in
  `blocking-canvas.tsx` are unrelated and untouched).
  **Not verified:** live device behavior — there is no `.env.local` in this
  environment so the build cannot collect page data (`DATABASE_URL` unset).
  "Add to Home Screen" on real iOS/Android still needs checking.

## Blocking tool mobile polish + ground-plan rasterization (2026-05-27)

Branch `claude/vibrant-tesla-5kjsA` — follow-up P2 work after the
2026-05-24 responsive audit, driven by on-device testing on iPhone.

- **Ground plan rasterized at setup time.** Replaces live pdf.js
  rendering on every blocking-page load with a one-time client-side
  JPEG capture during the stage setup wizard. New
  `ground_plan_image_path` column on `stage_configurations` (migration
  applied via Supabase MCP). The setup wizard's calibration canvas
  is captured with `canvas.toBlob` (q=0.85) and uploaded to
  `attachments/ground-plans/<productionId>/<ts>.jpg`; the blocking
  page prefers this `<img>` background and only falls back to pdf.js
  for legacy stage configs without an image. Fixes iOS Safari OOM
  ("Can't open this page") on vector-heavy architectural ground plans
  — the OOM was upstream of rasterization in pdf.js's parser, so
  lowering render scale couldn't fix it. Side effect: faster blocking
  loads on every device (no PDF parsing per visit).
- **Auto-seed first scene + beat.** A new editor opening blocking on
  a fresh production no longer hits an empty canvas that silently
  swallows drag/drops. `ensureFirstSceneAndBeat` (idempotent) creates
  Scene 1 / Beat 1 in `page.tsx` whenever the editor has edit
  permission and the production has no beats yet. Also fixed
  `firstBeatId` selection to flatMap across scenes so an empty first
  scene doesn't strand `currentBeatId` at null when later scenes have
  beats.
- **Mobile view-only beat navigator.** On phone (≤720px) the editor
  sidebars (off-stage cast picker, set-pieces picker), the layer
  toggle, and the desktop edit toolbar are hidden. A new compact
  `bk-beat-nav` bar above the canvas shows the current scene + beat
  label + `N / M` counter with prev/next chevron buttons; horizontal
  pointer swipes across the canvas (touch-only, >50px, predominantly
  horizontal, <600ms) advance/retreat one beat. Scenes/beats list,
  beat comments, and beat notes are still visible.
- **Mobile token sizes.** Actor circles drop 38→26px, labels
  10.5→9.5px, set-piece tokens 64×48→44×33 via `.bk-actor-circle`,
  `.bk-actor-label`, `.bk-set-piece-token` class hooks overridden in
  the ≤720px media query. Desktop sizing is unchanged.
- **Toolbar shift fix.** Undo button always renders (disabled +
  dimmed when history is empty) so the first drag no longer pops it
  into existence and shifts the row. `.btn > svg { flex-shrink: 0 }`
  added globally so toolbar icons don't compress against their labels
  when the row tightens. Subtitle pinned to a single line via
  `.truncate` + `min-width: 0` on the title block + `flex-shrink: 0`
  on the button row so a longer subtitle can't grow the title block
  vertically and re-center the buttons. Capture Beat padding bumped
  to `0 14px` with `gap: 8` so the icon + label have breathing room.
- **iOS auto-zoom after sign-in — PARKED.** Two fix attempts in
  `components/app-shell/zoom-reset.tsx` did not resolve the
  zoomed-in-after-auth behavior. Tracked in
  `docs/open-questions.md → Mobile / iOS questions` with next steps
  to try. Component stays in the tree; it's harmless.

**Other fixes in this branch:**
- Mobile horizontal-overflow guard via `overflow-wrap: anywhere` on
  body and `overflow-x: hidden` on `.page` at ≤720px (without
  breaking the fixed bottom tab bar, which was the failure mode of
  earlier `overflow-x: clip` attempts on `body`).
- Form inputs floored to `font-size: max(16px, 1em)` at ≤720px to
  prevent iOS input auto-zoom on most app forms (sign-in's `.field`
  class overrides this with higher specificity — intentional, the
  user prefers zoom-in there).

## Beta-prep session (2026-05-27)

The work that takes P3 from "infrastructure-only" to a real soft-launch
state. All merged to `main` via PRs
[#13](https://github.com/Mike-Grizzly/CallBoard/pull/13),
[#14](https://github.com/Mike-Grizzly/CallBoard/pull/14),
[#15](https://github.com/Mike-Grizzly/CallBoard/pull/15),
[#16](https://github.com/Mike-Grizzly/CallBoard/pull/16), and
[#17](https://github.com/Mike-Grizzly/CallBoard/pull/17). Each item
verified end-to-end against the live `proscene.app` deploy unless
flagged otherwise.

**Invite flow** — works end-to-end.
- `/invite/accept` welcome page shows inviter + organization name
  (PR #13). `inviteMembers` + `resendInvite` pass `invited_by_name`
  and `organization_name` in the Supabase invite metadata; the email
  template (custom HTML in Supabase Auth → Emails → Templates → "Invite
  user") reads `{{ .Data.invited_by_name }}` / `{{ .Data.organization_name }}`.
- `/auth/confirm` two-step OTP page fixes Gmail's link-scanner burning
  the single-use invite OTP before the human could click (PR #14). The
  page renders a "Continue" button on GET (safe for scanners to
  pre-fetch — token untouched); only the form POST calls `verifyOtp`
  and redirects to `?next=`. Handles all four OTP types: `invite`,
  `recovery`, `signup`, `email`.

**Password reset flow** — verified end-to-end (2026-05-27). The
"Reset Password" template in Supabase Auth was rewritten to match
the Proscene-branded invite design and to route through `/auth/confirm`
(`type=recovery&next=/reset-password`) rather than the default
`{{ .ConfirmationURL }}` magic link, so the scanner-burn fix
applies there too. The earlier "if the button doesn't work, paste
this URL" fallback row was removed at user direction — felt
phishy / sketchy in the email body.

**Delete person on `/people`** — `removeMember` (the existing
"Remove from org" action) was only deleting org membership and only
revalidating `/settings/members`, so dashboard-deleted users still
appeared on the People page. New `deletePerson(userId)` action
(PR #13) deletes the `profiles` row (cascades to memberships,
mentions, reports, documents, announcements, notes, notifications,
pins) and then the Supabase auth user via the admin API. "Not
found" errors from the admin API are swallowed so a half-cleaned
user (already removed from the dashboard) still gets the profile
side cleared. New "Delete account" button in the person drawer with
a `window.confirm` warning that the cascade also deletes content
the person authored. Also added `/people` to `removeMember`'s
revalidation set.

**Rehearsal report email overhaul** (PRs #15 + #16) — five fixes
surfaced when sending a real report through Gmail:
- Attachments now actually attach. `send-report.ts` fetches each
  attachment from Supabase Storage as a Buffer and passes them to
  Resend's `attachments: [{ filename, content }]` field. Capped at
  35 MB total payload (Resend hard limit is 40 MB); anything over
  the budget is skipped with a soft warning so the email still
  sends.
- Email body now includes Attendance (Present/Absent/Late stat
  tiles + per-person attendance notes), Scenes Worked, Breaks,
  Schedule Changes, Line Notes, Injuries / Incidents, and an
  Attachments list. Each section is hidden when its underlying
  JSONB array is empty so short reports stay compact.
- Department notes layout switched from a fixed-width 2-column
  table to stacked label-above-value cards with a 3px left accent
  bar, light slate background, and uppercase eyebrow label —
  long values no longer squash inside a narrow column. Email-safe,
  no media queries.
- "Distribute" button was silently no-oping if General Notes was
  empty (validation required it). Validation rule dropped — many
  reports legitimately only have department notes. Distribute now
  saves status as `distributed`, redirects to `?email=1`, and the
  `EmailReportButton` auto-opens the recipient picker so the user
  can send in one flow. `useEffect` strips the `?email=1` flag so
  refreshes don't keep popping the modal.
- Inline attachments — replaces the "save draft first to attach"
  tip card with a real `AttachmentStaging` section in the report
  form. Files are picked client-side, held as `File` objects with
  a "pending" pill, and uploaded after the server action returns a
  `reportId`. Works on both `/new` and `/edit`; edit mode also
  lists existing attachments with remove buttons backed by a new
  `deleteReportAttachment` server action. `createReport` /
  `updateReport` now return `{ reportId, slug, justDistributed }`
  instead of redirecting; the form orchestrates uploads + navigation
  client-side.
- Bonus: every user-supplied string in the email is now
  HTML-escaped before injection.

**Settings landing page + Send feedback link** (PR #17). `/settings`
was a redirect to `/settings/members`; converted into a real
landing page with an account header card and a list of
destinations. **Send feedback** (mailto to `feedback@proscene.app`)
is visible to every role; **Organization members** only renders for
`settings:manage`. Dropped the capability gate on the Settings
entry in the rail and the mobile More page so cast/crew can reach
it.

**Tester onboarding guide** at `docs/tester-guide.md`. Single page
covering: getting in (invite flow + Add-to-Home-Screen), what
features to try (workspace + per-production), known rough edges,
how to give feedback, and a tiered post-beta roadmap. Multi-org is
flagged as **week-1 of beta** work, not long-term, per the D5
direction below.

**Feedback channel** — `feedback@proscene.app` set up as an
ImprovMX free alias forwarding to `mikegrigsby2010@gmail.com`.
Apex-domain SPF record (`v=spf1 include:spf.improvmx.com ~all` on
`@`) coexists fine with the Resend SPF on `send.proscene.app`
(different host name). Verified end-to-end (2026-05-27).

**P0 password requirements** — set in Supabase Auth →
Sign In/Providers → Email on 2026-05-27. Closes the last P0 item.
Leaked-password protection still deferred to P6 (Pro-plan feature).

**Add-to-Home-Screen** — verified on iPhone 2026-05-27. Manifest
+ apple-touch-icon + Proscene branding all render correctly.

**Decision locked — D5 (org model).** Single-org launch with one
non-profit theatre company for week 0; multi-org refactor opens
that up within week 1 of beta so additional companies can join in
walled-off workspaces. Multi-org therefore moves out of long-term
into the during-beta Tier 1 roadmap. See `decision-log.md`
(2026-05-27 — multi-org during beta week 1).

## Multi-org refactor (2026-05-28)

**Multi-organization support** — closing the D5 week-1 deliverable.
`getCurrentUser` no longer routes everyone through
`getOrCreateDefaultOrganization`; instead it reads the caller's
actual `organization_memberships` row and returns that org. Two
runtime paths:

- **Self-signup.** A new auth user with no profile lands in
  `lib/auth.ts`, which calls `createOrganization()` (in
  `lib/organization.ts`) with the name they typed on the signup
  form and inserts a membership with role `admin`. They are the
  sole member of a fresh, walled-off workspace.
- **Invited user.** `features/members/actions.ts` already created
  their `profiles` row and `organization_memberships` row at invite
  time, scoped to `currentUser.organizationId`. First login finds
  both rows, promotes profile status `invited → active`, and
  returns the inviter's org. No code change needed there — it was
  already multi-org correct, only the runtime helper was wrong.

**Signup form** now has a required **Organization name** field
(autocomplete `organization`). The value rides on
`auth.signUp()` user_metadata as `organization_name`; the auth
helper pulls it back out on first login and falls back to
"{First Last}'s organization" if blank.

**Org slug.** `createOrganization` slugifies the name and retries
with a 2-byte hex suffix on collision (`uniqueSlugFor`). Slugs are
not user-facing today — they exist because the schema marks
`organizations.slug` `unique` — but the deterministic-first-try
behavior keeps them human-readable when we eventually surface them.

**Callsite sweep.** All ~25 pages and feature actions that did
`const org = await getOrCreateDefaultOrganization()` now read
`user.organizationId` directly. The helper is deleted from
`lib/organization.ts`. Verified callers were only ever reading
`org.id`, never `org.name` or `org.slug` — the refactor is a pure
substitution.

**Existing data.** The "Default Organization" row in production is
left as-is per the 2026-05-28 product decision; existing testers
keep their workspace and can rename it later (Settings UI for org
rename is not yet built). New self-signups create their own orgs
immediately.

**Explicitly not in this round** — Settings UI to rename the
current org, org switcher (deferred from D5 week 1; ships when a
user actually ends up in multiple orgs). Org-membership status
flow (pending/approved) is unchanged.

## Settings overhaul (2026-05-29)

Closes the deferred items from the 2026-05-28 multi-org entry and
fills in real account/workspace management.

**Schema:** added `profiles.selected_organization_id` (uuid,
nullable, FK to `organizations.id` on delete set null). Powers the
org switcher; `getCurrentUser` reads it with self-healing fallback to
the user's first membership when stale.

**`CurrentUser` type** now carries `organizationName` so rail/header
surfaces don't need an extra query.

**Account settings — `/settings/account` (every user).**
Edit first/last name, phone, pronouns. Change password (verify
current via `signInWithPassword`, then `updateUser({ password })`).
Profile edits also sync `auth.user_metadata` so signup/invite emails
have the latest name. Email change deferred (needs re-verification
flow).

**Workspace settings — `/settings/workspace` (admin only).**
Rename current workspace (60-char cap; slug stays stable since
slugs aren't user-facing). Shows member + admin counts. Deep-links
to `/settings/members` for role changes.

**Org switcher.** `WorkspaceRailBadge` always shows the current
workspace name just below the rail brand. Click opens a menu with
the user's other orgs, or "No other workspaces yet" when they only
belong to one. Same switcher inline on the settings landing.
`switchOrganization` server action verifies caller membership, writes
`selected_organization_id`, revalidates `/` layout; client calls
`router.refresh()`.

**Members — last-admin safeguard.** Refuses to demote OR remove the
sole remaining admin in an org. Surfaces a clear error so the
operator knows to promote another admin first. Stacks with the
existing "can't change/remove yourself" rules.

**Settings landing reframed** around the workspace: org name as the
headline, signed-in user + role below, switcher inline, then a list
of destinations (Account, Workspace, Members, Send feedback).

**Explicitly NOT shipped in this round:**
- Email change with re-verification.
- Delete workspace / delete account.
- Transfer-workspace flows.
- Account-level avatar upload / workspace logo.

## Scaffolded only (not implemented)

- **Activity log** — placeholder page exists, capability defined, feature directory has only .gitkeep
- **AI script analysis** — `documentType` and `processingStatus` fields exist in documents schema, no processing logic
- **Document comments/annotations** — placeholder sidebar in document viewer, no data model or functionality

## Not implemented

- Tests (zero test files in repo)
- Dark mode
- Email notifications
- Real-time updates
- PWA offline support / service worker (basic installable PWA shipped 2026-05-22; offline caching deferred — roadmap D7)

## Known limitations

- No composite unique constraints on membership tables (removed because drizzle-kit push hangs with them) — duplicate memberships prevented in app code only
- `getDocumentUrl()` and `getAttachmentUrl()` do not check if the requesting user has access to the parent production/report
- Supabase Storage RLS policies are broad (any authenticated user can access any file in `attachments` bucket)
- No file type validation on uploads (any file type accepted)
- No duplicate file detection
- `dangerouslySetInnerHTML` in RichTextDisplay without HTML sanitization
- TipTap bullet points not rendering due to Tailwind prose CSS reset
- `drizzle-kit push` is effectively retired — it crashes introspecting CHECK constraints on this Supabase database (a `drizzle-kit` CLI bug, unrelated to `drizzle-orm`). Schema changes are applied via the Supabase SQL Editor / MCP, with `db/schema/*` kept in sync by hand. See decision-log entries dated 2026-05-20.
- README.md is outdated (still says "Phase 1: Foundation and app shell")

## Risks for future review

- Storage access control needs hardening before production deployment
- Rich text HTML rendering should be sanitized before accepting untrusted content
- Membership uniqueness should be enforced at the database level
- File upload security (type validation, malware scanning) should be addressed before public launch
