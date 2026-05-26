# Current Status

**Last updated:** 2026-05-22

**Current milestone:** Steps 1-13 complete + Script Editor (Step 14) + Personal Calendar (Step 15) + People Directory (Step 16). Latest: org-wide people directory at `/people` with invite-based mass upload (manual / CSV / bulk paste) and multi-production assignment.

**Launch planning:** the path from feature-complete MVP to a soft launch (testing site + invited testers) and on to public launch is tracked in `docs/launch-roadmap.md`. Phase 0 (security hardening) and Phase 1 (Vercel deployment) are complete — the app is live at `call-board.vercel.app` on the `CallBoard` Supabase project, smoke test passed. P2 (mobile/PWA) is in progress: mobile drawer navigation and the PWA manifest landed 2026-05-22; the responsive audit, touch-interaction fixes, and live device verification remain. Next after P2: P3 (beta testers). See `decision-log.md` (2026-05-21 / 05-22).

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
  Icons: `public/icon.svg` + `public/icon-maskable.svg` (the CallBoard "C"
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
