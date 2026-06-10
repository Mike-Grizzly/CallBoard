# Current Status

**Last updated:** 2026-06-10

**Session 2026-06-10 (AI script analysis — OCR for scanned scripts, branch `claude/wonderful-newton-vo7sog`, not yet merged / not live-verified):** scanned/image-only PDFs are no longer rejected. `runScriptParse` (`features/scripts/parse.ts`) detects a missing text layer (extracted text < 200 chars) and switches to a **vision path** — it hands the PDF to Claude's native PDF/vision pipeline (which OCRs each page) by passing the existing Supabase **signed URL** as a `{type:"url"}` `document` block (no base64 inflation, no Files API). A separate `VISION_SYSTEM_PROMPT` returns the same cast/scenes but bookmarks as a **`page` integer** (no text to anchor against on a scan); `resolveVisionBookmarks` validates the page is in-range — bookmarks on scans are best-effort, cast/scenes unaffected. **Page cap** `MAX_SCANNED_PAGES = 250` (image+text tokens per page would otherwise overflow context). **Cache** is fingerprinted on raw file bytes for scans (empty text would collide across different scans and poison the cross-org `script_cache`); text PDFs keep the text fingerprint. The wizard auto-fill path inherits this (same `runScriptParse`). Caveat copy on the AI-setup page updated. Cost on scans is higher (~$1–2/script) but bounded by the existing caps. Full detail: `feature-specs/19-ai-script-analysis.md` + `decision-log.md` (2026-06-10). **Also pinned (awaiting file):** a tester's valid PDF renders blank in the Script tool's pdfjs canvas but fine in the Documents iframe — diagnosis logged in `open-questions.md`, holding for the file.

**Session 2026-06-09 (AI Script Analysis — Phase 1, branch `claude/serene-cray-kmpjry`, NOT yet merged / not device-verified):** the first AI feature. A director can upload a PDF script and have Claude propose a production template, reviewed by a human before anything is written to the real tables. **Three outputs (Phase 1):** (1) cast/character list with a Principal/Supporting/Ensemble classification → `production_roles`; (2) Act/Scene breakdown → `production_scenes`; (3) page-accurate bookmarks for scenes + musical numbers, seeded onto every production member's per-user `script_annotations`. Per-role script highlighting is **Phase 2 (not built)**. **Architecture:** new `@anthropic-ai/sdk` dependency (model `claude-opus-4-8`, adaptive thinking, JSON-only prompt + parse — `output_config` structured outputs is beta-only in SDK 0.103, so not used); new server-only `script_parses` staging table (RLS-on/no-policies, created live via Supabase MCP `create_script_parses`); async run via `POST /api/scripts/[parseId]/run` (`runtime=nodejs`, `maxDuration=300`, work deferred with `after()` so it survives client navigation); per-page text extracted server-side with `unpdf` (a serverless-safe pdfjs build — the original `pdfjs-dist/legacy` attempt threw `DOMMatrix is not defined` on Vercel's Node runtime; verified working in a Node smoke test). **Flow:** Documents row menu → "Analyze with AI" (`startScriptParse` stages a row + sets `documents.processingStatus='processing'`, client kicks the run route) → review page `/productions/[slug]/script/ai` polls `fetchLatestScriptParse` while processing → on ready, an editable cast/scene/bookmark form → **Apply** (`applyScriptParse`) writes roles/scenes + seeds bookmarks, or **Discard**. A notification + push fires to the requester when the parse is ready (`sendScriptParseReady`). **New files:** `lib/anthropic.ts`, `db/schema/script-parses.ts`, `features/scripts/parse.ts`, `app/api/scripts/[parseId]/run/route.ts`, `app/(app)/productions/[slug]/script/ai/{page,ai-review-client}.tsx`; extended `features/scripts/{actions,queries,constants}.ts`, `features/notifications/announce.ts`, `documents/document-row-menu.tsx`. **Setup the user owns:** set `ANTHROPIC_API_KEY` in Vercel + local (`.env.example` documents it). **Not yet verified:** no live parse run against a real script (needs the key); very long scripts may need Vercel Fluid compute to exceed 300s; scanned/image-only PDFs are rejected (no OCR). **Cost guardrails (added same session):** each parse is a real per-token Anthropic charge (~$0.30–$0.50/script), so `startScriptParse` enforces a concurrency lock + a rolling cap (5 parses / 30 days per production), and `runScriptParse` logs `input_tokens`/`output_tokens` onto the row (shown on the review page). No pricing-tier change — a per-tier monthly quota is the deferred future lever. **Wizard auto-fill (added same session):** the new-production wizard's Roles step can upload a script and AI pre-fills the cast (parse pipeline generalized for pre-production parses via nullable `production_id`/`document_id` + `storage_path`; per-user cap 5/30 days; `attachWizardScript` carries the PDF over as the production's default script on launch). **Plan gating** for all AI = the existing `assertCanMutate` gate (paid OR active trial), so no new plan logic. **Accuracy + refinement pass (after first real-script test):** (1) bookmarks now resolve by **verbatim anchor** matched in the extracted text (no more page-number drift; unfindable bookmarks dropped); (2) **corrective re-parse** — a "Not quite right?" box re-runs with the director's notes + previous result (`reparseWithNotes`, new `script_parses.notes`); (3) **global script-recognition cache** (`script_cache`, fingerprint-keyed, cross-org) reuses a human-verified breakdown of the identical file with no model call — stores ONLY `{title,roles,scenes,bookmarks}`, never annotations/casting/production data/script text. Full spec: `docs/feature-specs/19-ai-script-analysis.md`.

**Session 2026-06-09 (Billing & monetization + multi-workspace polish — merged to `main`):** the full paid-product layer landed.
- **Plans & trial:** `organizations.plan` (`free`|`season`|`repertory`|`company`, limits 1/1/3/∞) + write-once `trial_started_at`. The 60-day trial is anchored to the org's **first production** (not signup) and is ungameable (deleting/archiving the show or editing dates can't reset it). Concurrency gate blocks starting a show over the plan limit; grandfathered orgs (all pre-existing) bypass every gate.
- **Graduated lock:** day 0–60 full → **60–90 "finish your run" grace** (reports/announcements/schedules/notes stay editable; scripts/blocking/scenes/uploads lock) → **90+ read-only**. Enforced via `features/billing/guard.ts` (`assertCanMutate` full-writes, `assertCanOperate` operational) wired across the mutating actions; `lib/billing.ts` `trialPhase()`/`mutationLevel()`.
- **Stripe (org-level):** 3 products × monthly/annual via six `STRIPE_PRICE_<PLAN>_<INTERVAL>` env vars; `createCheckoutSession(plan, interval)`; signature-verified webhook maps price→plan. **Subscribing during the trial collects the card now but defers the first charge to day 60** (`subscription_data.trial_end`). Stripe `trialing` treated as subscribed. Customer Portal for manage/upgrade (needs "switch plans" enabled in Stripe).
- **Lifecycle cron:** `vercel.json` daily `/api/cron/billing-lifecycle` (CRON_SECRET-gated) → milestone emails to **all org admins** (day 30 nudge, 55 warning, 90 read-only, 120/150/173 purge warnings) and the **day-180 file purge** (90 days after lock; removes storage objects only, scoped to the org's productions, never DB rows / other orgs / workspace logos). Idempotent via `organizations.billing_lifecycle_stage`.
- **UI:** in-app trial banners (nudge/grace/read-only, dismissible), upper-right **trial countdown pill**, website-style **plan cards** on Settings → Billing, and a trial-start announcement on first-production launch.
- **Signup individual-vs-org split:** "I run productions" (names a workspace) vs "I'm a participant" (personal "{First}'s workspace", no company to name). Participants never trigger billing — only orgs that create productions do.
- **Marketing:** pricing page + homepage teaser + FAQ rewritten to the subscription tiers, "participants always free," and an Education section (manual verification via the contact form). Annual/monthly toggle; comparison checkmarks centered.
- **Multi-workspace correctness:** fixed a cross-org leak — rail/dashboard/calendar listed productions across **all** orgs; now scoped to the active workspace via `getVisibleProductions(user)` (managers see all org shows, participants see only theirs — the Canva/Monday model). New **cross-org alert bubbles** on the org switcher (mentions + notifications since last switch-in; clears on switch, items stay unread within the org) — added `notifications.organization_id` + `organization_memberships.last_viewed_at`.
- **Docs:** new `docs/admin-playbook.md` (comp/grandfather an org, recover an admin, extend a trial, lifetime deals, Stripe coupon durations) with confirmed-correct SQL.
- **Live setup still owned by the user:** add `CRON_SECRET` in Vercel; enable "Customers can switch plans" + add products in the Stripe portal; confirm `RESEND_FROM_EMAIL` domain is verified for the lifecycle emails; (optional) create a Stripe coupon to automate the 15% nudge.

**Last updated (prior):** 2026-06-05

**Shipping to `main` 2026-06-05 (branch `claude/magical-ride-usNEW`):** the ProScene marketing site (root `/`, plus /features /pricing /reviews /blog /faq) and a multi-tenant authorization hardening pass (see the Marketing website port + decision-log/​open-questions entries below). Known follow-ups carried into the next session: wire the marketing CTAs to /signup, reconcile "ProScene"/`app.proscene.live` casing, and the live `attachments` Storage policy flip (code-ready). `main` was merged into the branch and the tree compiles (`next build`), tsc + eslint clean.

**App name:** **Proscene** (renamed from "CallBoard" on 2026-05-27 — the `callboard` domain could not be secured). The product is **live at [https://proscene.app](https://proscene.app)** with a verified email sending domain. The rebrand updates the rail wordmark (`Pro<em>scene</em>`), the rail/icon mark glyph (`C` → `P`), the four auth-screen brand headers (login, signup, forgot-password, reset-password), the PWA manifest, root metadata (`title` / `applicationName` / `appleWebApp.title`), `apple-icon.tsx`, `public/icon.svg` + `public/icon-maskable.svg`, the rehearsal-report email footer ("Sent via Proscene"), and `package.json` / `package-lock.json` `name`. The Supabase project is still literally named `CallBoard` in the Supabase dashboard — backticked `CallBoard` references in these docs point to that project identifier and are intentionally unchanged. Colors and design tokens are unchanged. PR [#10](https://github.com/Mike-Grizzly/CallBoard/pull/10) merged to `main` 2026-05-27.

**Email + domain infrastructure (2026-05-27):** the email pipeline that gated most of P3 is now wired end-to-end. `proscene.app` is registered at Namecheap; DNS for both Resend (SPF + DKIM + MX on `send.proscene.app`) and Vercel (apex A record on `@`, CNAME on `www`) is live and verified. Resend SMTP is plugged into **Supabase → Auth → SMTP Settings** as a custom SMTP provider (host `smtp.resend.com`, port `465`, sender `noreply@proscene.app`). Supabase **Site URL** = `https://proscene.app`; the redirect-URL allowlist covers `localhost:3000`, `call-board.vercel.app` (Vercel auto URL, kept as fallback), and `proscene.app` (all with `/**` glob). Vercel env: `NEXT_PUBLIC_SITE_URL=https://proscene.app`, `RESEND_FROM_EMAIL=noreply@proscene.app`. Smoke test passed — Supabase Dashboard → Send Magic Link delivered an email from `noreply@proscene.app` with a link resolving to `https://proscene.app/...`. **Still to verify end-to-end against the live deploy:** the app's own `/forgot-password` flow, the member-invite flow, and a rehearsal-report email (D2 in `launch-roadmap.md` is now fully resolved as infrastructure; the P3 checklist items that depended on it are unblocked). See `decision-log.md` (2026-05-27 — email + domain wiring).

**Session 2026-06-04 (Web Push notifications — branch `claude/modest-cerf-WFWuE`, not yet merged):** the previously-inert `push` channel now has a real transport. Added a `public/sw.js` service worker, a `push_subscriptions` table (server-only, RLS-on/no-policies), `features/push/send.ts` (`sendPushToUsers` — VAPID send, best-effort, prunes dead subs), `features/push/actions.ts` (per-device subscribe/unsubscribe that also drives the `notification_preferences.push` flag), and a per-device "Enable on this device" card on `/settings/notifications` (the old disabled push toggle was removed from the channel form; `updateNotificationPreferences` no longer writes `push`). Announcement fan-out now delivers push to opted-in recipients. **Setup before this works:** add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` env vars (Vercel + local), create `push_subscriptions` via the Supabase SQL editor/MCP with RLS enabled (NOT `db:push`), and `npm install` (new dep: `web-push`). Not yet device-verified. New dependency and full steps in `feature-specs/17-push-notifications.md` and `decision-log.md` (2026-06-04 — Web Push).

**Session 2026-06-04 (cont. — @mentions push + notification onboarding, branch `claude/modest-cerf-WFWuE`):** (1) **@mentions now send phone push** (gated on `prefs.push`) from all mention sites — announcements, notes, rehearsal reports, and blocking beat comments — via a shared best-effort helper `features/mentions/notify.ts`. Multiple mentions in a single write (e.g. across a rehearsal report's sections) are batched into one "N new mentions" push. Email was deliberately not added for mentions. (2) **Signup notification onboarding** — a first-dashboard `OnboardingDialog` (shown when the user has no `notification_preferences` row) asks how they want alerts: email (toggle) + phone push (per-device enable, reusing the new `usePushSubscription` hook). (3) **In-app is now always on** — removed the in-app toggle from Settings (static "Always on" row); `updateNotificationPreferences` forces it true. No schema changes, no new env vars. Rehearsal reports left untouched (manual send). "Upcoming-rehearsal reminders" logged as a future feature (needs a scheduled trigger). See `decision-log.md` (2026-06-04 — Push for @mentions…) and `feature-specs/17-push-notifications.md`.

**Session 2026-06-04 (cont. — New Production wizard people entry, branch `claude/modest-cerf-WFWuE`):** the wizard's cast and crew steps now both use **name autocomplete over org members** (shared `PersonAutocomplete`, capturing the picked member's email). The crew step dropped its manual Email column. At **Launch**, everyone named (cast actors + crew) is resolved to an org email (picked or exact name match); anyone not in the org triggers a **skippable `InvitePrompt`** modal to enter emails and send invites (or skip). Cast actors who are org members are now added as production members (`Cast — Principal/Ensemble`), in addition to staying as the character's actor label. Client-only — reuses the existing `createProductionFull`/`applyWizardTeam` assign-or-invite-by-email server path; no DB/env/server changes. See `decision-log.md` (2026-06-04 — New Production wizard).

**Current milestone:** Steps 1-13 complete + Script Editor (Step 14) + Personal Calendar (Step 15) + People Directory (Step 16) + full mobile/PWA pass (P2) + Proscene rebrand and email/domain wiring (P3 prep). All work through 2026-05-27 is merged to `main` (mobile/PWA via PR #9, rebrand via PR #10, docs catch-up via PR #11) and live at `proscene.app`.

**Session 2026-05-29 (merged to `main`):** a feature/UX pass landed four bodies of work (details in the per-feature sections below). (1) **New Production builder** — a Full-setup wizard + Quick-add replacing the single-form `/productions/new` (new schema applied live). (2) **Rehearsal scheduler** — Outlook-style grouped-card call form, a responsive swipeable week view (3 days phone / 5 tablet / 7 desktop), an in-calendar create affordance with a slide-in call tray, and smarter time defaults (next-hour start, +2h end). (3) **Script reader** — a dedicated immersive mobile reader (continuous scroll, page scrubber, page-grid with search + bookmarks) plus desktop tweaks (keyboard nav, jump-to-page, instant flips, fit-width, Read mode, bookmark search) and Phase 2 freehand ink (highlighter/pen/eraser, private per user). Deferred/optional follow-ups from this session are tracked in `docs/open-questions.md`.

**Launch planning:** the path from feature-complete MVP to a soft launch (testing site + invited testers) and on to public launch is tracked in `docs/launch-roadmap.md`. Phases P0 (security hardening), P1 (Vercel deployment), and the email-deliverability + custom-domain unlocks for P3 are shipped. **P2 (mobile/PWA) is functionally complete**: bottom-tab mobile nav, PWA manifest, all 8 slices of the per-screen responsive audit, view-only mode for the blocking canvas and script editor, and a landscape-phone rule for blocking. Remaining P2 items before P3: real touch-editing support (currently view-only on phones), live device verification including "Add to Home Screen", and the deferred polish items below. **P3 (beta) is now unblocked**: with email + custom domain live, the remaining P3 work is end-to-end flow verification (invite, password reset, report email), beta org-model confirmation (D5), tester onboarding docs, and a feedback channel. See `decision-log.md` (2026-05-21 / 05-22 / 05-27).

**Session 2026-06-03 (PR #25, squash-merged to `main` as commit 693a3ca — live in production):** (1) **Dashboard stat-chip alignment fix** — the header chips (new mentions / announcements / active shows) centered the icon against the two-line text block, floating the number above the icon; aligned the number's line-box to the icon. (2) **Real notifications for announcements (Phase 1)** — announcements now actively notify their audience (scope-based fan-out: org members for org-wide, production members for scoped, author excluded) across user-chosen channels. New `notification_preferences` table (`in_app`/`email`/`push`), `features/notifications/announce.ts` (fan-out + Resend email), `/settings/notifications` preference page, and the notification bell promoted to a **global** rail control (was production-only). `push` is modeled but inert (no transport yet; Web Push is Phase 2). The `notification_preferences` table was created directly in the production Supabase project (verified live). See `decision-log.md` (2026-06-03) and the Notifications section of `feature-specs/08-announcements.md`. **Update (same day):** after preview testing, the in-app surface was changed from a rail bell to a **top-of-content acknowledge banner** (appears for unacknowledged announcements, clears on acknowledge, works on mobile); the rail bell was removed (the `notifications` table is still written but no longer surfaced — see open-questions). Also: invite hardening for login-less profiles + a "Pending invite" badge, a production data cleanup (orphan profiles deleted), and a security guardrail comment against email-based profile adoption. **All merged to `main` (PR #25) and deployed to production `proscene.app` on 2026-06-03.** A follow-up (**PR #26**) adds the **announcement detail drawer** — clicking an announcement title opens a right-side drawer (desktop) / bottom sheet (mobile) showing the full announcement and an acknowledgement roster (who has/hasn't acknowledged, acked-first with timestamps), wired into the global + production announcements pages. Not yet wired from the dashboard list or the banner (follow-up).

**Session 2026-06-04 (PR #27 + PR #28, merged to `main`):** a mentions pass that took @mentions from "general notes only" to working everywhere they're offered. **PR #27** fixed the blocking-tool @mention so beat-comment mentions actually notify. **PR #28** (this session) — (1) **Report mentions across all note fields**: the unified `writeContextMentions()` now scans every mention-bearing section of a report — General Notes + all 12 department notes (rich-text `data-id`) and the structured note groups (schedule changes, attendance, line notes, injuries — plain `@{Name}` tokens resolved to ids against org members). (2) **Per-section notifications**: a person tagged in several sections of one report gets one notification *per section* (labeled `Report <date> · <section>`), not a single merged row. (3) **Blocking mentions deep-link to the beat**: `getMentionsForUser` resolves the beat from the comment, the dashboard links to `/blocking?beat=<id>`, and the blocking page reads `?beat=` (validated) to open that beat + its scene. (4) **Dashboard mention list fixes**: unread mentions now sort first (they were hidden behind the 4-/5-item caps), a **View all** toggle reveals the rest, and each card has a **dismiss (×)** (`dismissMention` action). (5) **Inline mention chips while editing**: the structured note fields and the blocking beat-comment composer now use `components/ui/mention-input.tsx` — a contenteditable field that renders `@{Name}` tokens as chips as you type (with the @ picker) and serializes back to the same `@{Name}` string, so storage/display/extraction are unchanged. Plain-text display of those tokens uses `components/ui/mention-text.tsx`. See `decision-log.md` (2026-06-04) and the Mentions sub-section of Step 13 below.

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
- `features/mentions/write.ts` — idempotent `writeMentions(html, ctx)`: deletes all existing mentions for `contextType+contextId`, then re-inserts by extracting `data-id` from mention HTML. Called after announcement create and note autosave
- `db/schema/mentions.ts` table: `organizationId`, `productionId`, `mentionedUserId`, `mentionedById`, `contextType` (report/announcement/note/blocking), `contextId`, `contextTitle`, `snippet` (first 200 chars stripped of HTML), `readAt`

**Report-wide + plain-text mentions (2026-06-04, PR #28)**
- `writeContextMentions(params)` in `features/mentions/write.ts` — the report path now uses this instead of `writeMentions`. It accepts an array of `sources`, each a mention-bearing section with either `html` (rich-text, `data-id`) or `text` (plain `@{Name}` tokens resolved to ids against `members`), plus an optional `label`. Writes **one notification per (user, section)** — de-duped within a section, separate across sections — and excludes the author. Idempotent per context (delete-then-insert).
- `reportMentionSources(data)` in `features/reports/actions.ts` builds the sources: General Notes + each of the 12 department notes (html), and the structured groups schedule changes / attendance / line notes / injuries (text). `contextTitle` per row = `Report <date> · <section>`.
- **Plain-text mention format:** structured note fields store `@{Full Name}` tokens (not `data-id`). Resolution to a user id matches the token against org members' full name or email (`getOrganizationMembers`).
- `components/ui/mention-input.tsx` — contenteditable inline editor that renders `@{Name}` tokens as `.mention-inline` chips while typing, with the @ picker; serializes back to the `@{Name}` string. Supports `singleLine`, `onSubmit` (Enter-to-send), `disabled`. Used by the four structured report fields (`subtab-editors.tsx`, `summary-editors.tsx`) and the blocking beat-comment composer (`components/blocking/beat-comment-section.tsx`). Replaced the plain `MentionTextarea` in those places (`MentionTextarea` remains as the source of `MentionMember`/`memberFullName`).
- `components/ui/mention-text.tsx` — display helper that renders `@{Name}` tokens as chips in the read-only report views (`[reportId]/page.tsx`, `mobile-report-detail.tsx`). Beat-comment display uses the pre-existing `MentionBody`.
- **Blocking mentions:** beat-comment mentions (`contextType: "blocking"`, `contextId` = beat-comment id) now deep-link. `getMentionsForUser` left-joins `beat_comments` to expose `beatId`; the dashboard builds `/productions/<slug>/blocking?beat=<beatId>`; `blocking/page.tsx` reads `?beat=` (validated against the production's beats) and opens that beat, deriving its scene.

**Dashboard mention cards**
- Mention cards are clickable: clicking navigates to the source context (`/productions/[slug]/reports/[id]`, etc.) and marks the mention as read
- Fade-not-remove UX: clicking a card fades the blue unread highlight immediately (optimistic) but the card stays visible in the Unread tab until navigation completes — prevents jarring disappearance
- Mark-as-unread: read cards show a circle button on hover to restore unread state (optimistic via `unfadedIds` set)
- Mark all as read: ghost button in the mentions section header, only shown when there are unread items
- Cards use `<div role="button">` rather than `<button>` to allow nested interactive elements (mark-as-unread button)
- **(2026-06-04, PR #28)** Both dashboard mention surfaces (`bento-mentions.tsx` desktop, `MdMentions` in `mobile-dashboard.tsx`) cap the list (4 desktop / 5 mobile); unread mentions are now **sorted first** in `dashboard/page.tsx` so they're never hidden behind the cap, a **View all** toggle expands the rest, and each card has a **dismiss (×)** calling `dismissMention(id)` (`features/mentions/actions.ts`) which deletes the recipient's row.

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
- **Mobile reader — Phase 1 (2026-05-29):** phones now get a dedicated immersive reader (`mobile-script-reader.tsx`) instead of the view-only desktop viewer. `page.tsx` renders `ScriptScreen`, which routes phones → reader, desktop → `ScriptViewer` (via `useIsPhone`). The reader is a full-screen dark surface with **continuous vertical scrolling** (windowed: only current ± 2 pages painted to `<canvas>`, far pages cleared to cap memory), a floating **page scrubber** (current/total, ▲▼, drag-to-scrub), and a full-screen **page-grid** overlay with search (page # or bookmark title), an All-pages/Bookmarks filter, lazy thumbnails, and per-page bookmark ribbons. Bookmarks tapped here persist via the existing `saveAnnotations` action; existing highlight annotations render read-only over pages. CSS under `.msr-*` in `globals.css`. The old `.sv-*` phone overrides are now unused on phones.
- **Mobile reader — Phase 2 freehand ink (2026-05-29):** the reader now has a bottom **drawing palette** (highlighter / pen / eraser + the 5-color row). New `InkAnnotation` type (`type:"ink"`, normalized `points`, `tool`, `size` as a fraction of page width) added to the annotation union in `constants.ts` with `INK_SIZES`/`INK_OPACITY`/`inkPathD` helpers. Drawing is **private per user** and persists via `saveAnnotations` alongside bookmarks. The palette is **toggled** by a pencil FAB (hidden by default; a Close button in the palette deselects + hides it). While a tool is active the page scroll is **locked** (`.msr[data-drawing] .msr-scroll { overflow:hidden; touch-action:none }`) so a finger draws cleanly instead of scrolling — navigate via the scrubber, or deselect/close to scroll. Implementation notes: the active stroke is tracked in a ref and drawn imperatively into one fixed overlay `<path>` (no per-move React renders), committed to state once on pointer-up; the eraser is a **point/segment eraser** (drops points within a ~3%-of-width radius and keeps surviving runs as separate strokes, so only the touched part disappears); each page's ink layer is an `<svg>` that captures touch only while a tool is active. The **desktop viewer renders ink read-only** (`AnnotationShape` + the PDF-export compositor handle `"ink"`; the annotations side-panel ignores it) and the **desktop Read-mode overlay passes `allowDrawing={false}`** (reading only). Palette/ink CSS under `.msr-palette` / `.msr-ink` / `.msr-draft`.
- **Reader cohesion polish (2026-05-29):** the reader/Read-mode overlay now **slides up** into place (`msr-in`, matching the call tray / day sheet; the page grid uses `msr-grid-in`) so it reads as a reader opening rather than a navigation to another site, and it's brand-styled — a "P" brand mark + Newsreader display-font title in the header, crimson `--msr-accent` on the active bookmark/scrubber number/grid filter/page ribbons, a branded spinner for the initial load, and a warm shimmer behind each page until its canvas paints. Off-screen pages use `content-visibility: auto` so the shimmer/paint stays cheap across 200+ pages; a `prefers-reduced-motion` guard disables the entrance + shimmer.
- **Desktop tweaks (2026-05-29):** additive, no change to the annotation model. (1) **Keyboard nav** — ←/→ and PgUp/PgDn flip pages, Home/End jump to first/last, `+`/`-` zoom (ignored while typing in a field). (2) **Jump-to-page** — the "n / total" indicator is now a click-to-type page field. (3) **Instant flips** — an effect pre-renders the current page ±1 into the bitmap cache so next/prev is immediate. (4) **Fit-width zoom** — a `Maximize2` toggle adds a continuous "Fit" scale (re-renders at `workspaceWidth / pageWidth` so canvas, text layer, and annotations stay aligned); the zoom in/out buttons switch back to the fixed steps. (5) **Read mode** — a `BookOpen` button opens the same `MobileScriptReader` as a full-screen overlay (`onExit`/`onBookmarksChange`/`startPage` props added) so the immersive view is previewable on desktop with zero changes to the annotation viewer; bookmarks made there sync back into the desktop panel. (6) **Bookmark search** — the bookmarks panel gains a filter (title or page #) once there are more than 3.

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
  - *Create affordance.* The calendar/scheduler exposes call creation directly: a "Schedule call" button in the toolbar (desktop/tablet) and a circular **FAB** bottom-right on phones. Gated on `reports:create`.
  - *Slide-in builder tray.* Creating a call now opens the form as a **slide-in tray overlaid on the calendar** (`call-tray.tsx`) — a right-side drawer on desktop, a bottom sheet on phones (matching the event drawer / day sheet). It uses dedicated full-slide keyframes (`call-tray-in-right` / `call-tray-in-up`) and a stable height (88vh on mobile) so it doesn't pop/resize while the cast lazy-loads (via the `getCallTrayData` server action). On mobile a **grab bar** at the top dismisses it (tap or drag-down). On save the tray closes and the calendar refreshes in place (`router.refresh()`), no navigation. Scoped/single-production calendars open it directly; the multi-production workspace picks a production first. Full-page `/calls/new` + `/calls/[id]/edit` routes still exist (deep links, edit); `createCall`/`updateCall` return `{ success }` instead of redirecting so both the tray and the pages decide their own follow-up.
  - *Week-scroll fix.* `.cal-main` was missing `min-width: 0`, so the fixed-px day columns blew the `1fr` track out to full content width — the week showed ~2 columns and wouldn't scroll sideways. Added `min-width: 0` down the `.cal-main → .week → .week-scroll` chain so the overflow happens inside the scroller (3/5/7 columns swipe correctly). The grid box is also sized `width: max-content` (set in JS alongside the column widths) so the sticky time-gutter's containing block spans the whole strip and stays pinned to the last day instead of detaching at the far right.
  - *Grab-bar drag.* The tray's entrance keyframes use `fill: both`, which keeps overriding inline `transform`, so the drag couldn't move the panel — the touch-start handler now clears `animation`/`transition` so the sheet tracks the thumb and snaps back / animates out on release.
  - *Smarter time defaults.* A new call defaults its start to the **top of the next hour**, and the **end auto-fills to start + 2h** (and re-estimates whenever the start changes). Times are now controlled inputs in `call-form.tsx`.
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

**Settings landing reframed** around the workspace: org name + logo
(when set) as the headline, signed-in user + role below, switcher
inline, then a list of destinations (Account, Workspace, Members,
Send feedback).

### Follow-up pass — same day (PR #20, merged 2026-05-29)

Round-two additions that landed on top of the initial settings
overhaul before PR #20 merged:

- **Create new workspace from the switcher.** New `createWorkspace`
  server action — any signed-in user can spin up a fresh workspace,
  becomes its first admin, and gets auto-switched into it. Inline
  "Create workspace" form lives in both the rail badge menu and the
  settings landing switcher.

- **Inline password-match check.** The "Confirm new password" field
  on `/settings/account` warns as the user types, sets
  `aria-invalid` + `aria-describedby`, and disables the submit
  button until both fields match.

- **Archive productions (soft delete only).** New
  `productions.archived_at TIMESTAMPTZ` column + index on
  `(organization_id, archived_at)`. `archiveProduction` /
  `unarchiveProduction` server actions (admin/producer via
  `productions:manage`, org-scoped). Active list and rail hide
  archived rows; managers see a collapsible "Archived productions"
  disclosure at the bottom of `/productions` with restore buttons.
  Hover-revealed archive icon on each card. **Hard delete is
  intentionally not implemented** — too much downstream history
  (reports, calls, blocking) to throw away; archive is the right
  primitive.

- **Transfer workspace ownership.**
  `transferWorkspaceOwnership(targetUserId, newSelfRole)` runs in
  one transaction: promote the target to admin first, then demote
  the caller to a chosen non-admin role. Refuses self-targeting and
  refuses `admin` as the new self-role. Form lives on
  `/settings/workspace`; empty state when the caller is the only
  member.

- **Workspace logo.** New `organizations.logo_url TEXT` column —
  stores a Supabase Storage path inside the existing `attachments`
  bucket. Upload flow: `requestWorkspaceLogoUpload` returns a signed
  upload URL → browser uploads straight to Storage (bypasses the
  25MB action body cap) → `finalizeWorkspaceLogoUpload` writes the
  column and cleans up the previous file. `removeWorkspaceLogo`
  clears + deletes. Server-side: admin-only, MIME allow-list
  (SVG/PNG/JPG), 2MB cap, storage path locked to the caller's
  workspace. Client-side: same MIME allow-list, 2MB cap, square
  shape (5% tolerance; skipped for SVG since it can ship without
  intrinsic dimensions). `getSignedLogoUrl` (per-request `cache()`)
  signs the path for display in the rail badge (replaces the
  building icon when set) and on settings page headers.
- `CurrentUser` now also carries `organizationLogoUrl` so rail +
  settings headers don't need an extra query.

**Explicitly NOT in scope (per product decision, 2026-05-29):**
- **Email change with re-verification.** A user's email is
  permanently read-only on `/settings/account` for now — the field
  renders disabled with a hint. No "verify new email" / magic-link
  rebinding flow exists. (If a fresh session asks "is email linking
  done?" — the answer is no, and it's deferred on purpose, not
  missing.)
- **Delete workspace / delete account.** Out of scope.
- **Transfer workspace to a person who isn't already a member** —
  transfer only works among current members. Add the new owner via
  invite first.
- **Account-level avatar upload.** Out of scope this round.

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

## Dashboard command center + RSVP + announcement acks (2026-05-29)

Branch `claude/bold-babbage-qxwCO`. Ported the uploaded dashboard draft and
mobile new-production builder into the app, and built the two genuinely-new
features the draft implied (the rest was derivable from existing data).

**New features (schema applied to the `CallBoard` Supabase project, RLS
enabled to match the rest of the schema):**
- **Call confirmations (RSVP).** `call_confirmations` (one row per
  call+user, `status` defaults `confirmed`). `getCallConfirmSummary`
  (features/calls/queries) returns called total (production members),
  confirmed count + avatars, and the caller's status. `confirmCall(callId)`
  (features/calls/actions) is an idempotent member self-confirm toggle. The
  RSVP UI lives on the dashboard focal-call panel (member self-confirm).
- **Announcement acknowledgements.** `announcement_acks` (one row per
  announcement+user). `getAckInfoForAnnouncements` returns acked count,
  audience size (org members for org-wide, production members for scoped),
  and the caller's ack. `acknowledgeAnnouncement(id)` is an idempotent
  toggle. The Acknowledge button + progress shows in the dashboard bento and
  on the global `/announcements` cards.

**Desktop dashboard redesign (>720px).** `app/(app)/(default)/dashboard/page.tsx`
now renders a command center inside `.dd-wrap` (gated by the existing
`.dashboard-desktop-only`): greeting band + status chips, a hero row (focal
next-call panel with a live countdown + RSVP confirm, and a Today timeline
built from today's calls with a NOW marker), show tiles with
week-toward-opening progress + principal avatars + per-show unread badges +
next call, and a 3-up bento (mentions with mark-read preserved /
announcements with Acknowledge / pinned). All `.dd-*` styles were added to
`globals.css`, reusing existing tokens. New client components:
`focal-call.tsx`, `bento-mentions.tsx`, `announcement-ack-button.tsx`.
Derivable queries added with no schema beyond the two tables above:
`getCastForProductions` (members), and `getUserProductions` now also returns
`venue` + `firstRehearsalDate`.

**Phone dashboard unchanged.** The existing phone experience (MobileTodayHero
+ announcements/productions/mentions/pinned) is preserved behind a new
`.dashboard-phone-only` gate; the desktop command center is hidden at ≤720px.

**Mobile new-production wizard.** Added a ≤720px layout to the existing
`.np-root` wizard: the desktop step rail is replaced by a compact step header
+ segmented progress bar (new `.np-mobile-bar` element, hidden on desktop),
the form is one-step-per-screen, and the action bar sticks to the bottom with
a full-width Continue/Launch. Pure layout — steps, fields, and `createProductionFull`
wiring are unchanged.

**Verified:** `tsc --noEmit` passes; `eslint` clean on all changed files.
**Not verified:** live behavior — no `DATABASE_URL` in this environment, so
`next build` can't collect page data and the UI wasn't exercised against real
data. Countdown assumes `calls.callTime` is stored as 24h `HH:MM`.

## Mobile dashboard command center (2026-05-29)

Branch `claude/bold-babbage-qxwCO`. Ported the uploaded `mobile-dashboard.jsx`
/ `mobile-shell.jsx` design into the app, replacing the phone dashboard.

- New client component `app/(app)/(default)/dashboard/mobile-dashboard.tsx`
  renders the phone command center inside the existing `.dashboard-phone-only`
  gate: greeting + status chips, focal next-call card (live countdown + RSVP
  confirm via `confirmCall`), Today timeline (today's calls + NOW marker),
  a horizontal **shows carousel** (week-to-opening progress, principal
  avatars, unread badge, next call), mentions (mark-read on tap), announcements
  (reuses `AnnouncementAckButton`), and pinned. Fed entirely by data the
  dashboard page already fetches — no new queries.
- `dashboard/page.tsx` now builds small serialized arrays (`mdTimeline`,
  `mdShows`, `mdAnnouncements`, `mdPins`) and renders `<MobileDashboard>` for
  phone; the desktop command center is unchanged. The previous phone layout
  (`MobileTodayHero` + the legacy stacked feeds) is no longer rendered.
- The draft's standalone chrome (its own appbar/bottom-tab-bar/toast and the
  `.mob-root` token block) was intentionally omitted — the app already
  provides the bottom tab bar, safe-area pads, and design tokens. All styles
  added to `globals.css` scoped under `.md-root` (renders only on phone), with
  a small subset of the mobile-shell primitives (`.mob-card`, `.sec-h*`,
  `.mbtn`, `.tap`) included under the same scope.

**Verified:** `tsc --noEmit` + `eslint` clean. **Not verified:** live device
rendering (no `DATABASE_URL` here).

### Follow-up (2026-05-29)

The desktop + mobile dashboard command center, RSVP, and announcement acks
were confirmed working by the user. The orphaned `mobile-today-hero.tsx` was
deleted (nothing imported it; `tsc` + `eslint` clean). Branch
`claude/bold-babbage-qxwCO` merged to `main`.

## Notes → Notion-style editor (2026-05-29)

Branch `claude/bold-babbage-qxwCO`. Reworked the production notes editor
(`app/(app)/productions/[slug]/notes/notes-panel.tsx`) to feel like a real
document surface rather than a tacked-on panel.

**Desktop**
- **Slash commands** — `/` opens a block menu (Text, H1/H2/H3, bulleted/
  numbered list, quote, divider, code). New `SlashCommand` TipTap extension
  (`components/ui/slash-command.ts` + `slash-command-list.tsx`) built on the
  existing `@tiptap/suggestion` dep — no new library. `allow` guard fires only
  at block start / after whitespace so it won't hijack `/` mid-word.
- **Selection bubble toolbar** (`@tiptap/react/menus` `BubbleMenu`) with
  bold/italic/underline/strike/highlight + heading/list, replacing the
  always-on fixed toolbar. Shared `FormatButtons` group.
- **Placeholder** ("… press / for blocks") via `@tiptap/extension-placeholder`.
- **Spacious document** — large display-font title, 760px centered column,
  generous margins, larger prose (`.note-doc` / `.note-title-input` /
  `.note-prose`).

**Mobile (≤720px) — immersive, like the script reader**
- The editor column becomes a full-screen overlay (`position:fixed; inset:0;
  z-index:70`, `msr-in` slide-up) in the app's warm light palette.
- Top bar: back · centered **"Private" pill** · spacer (`.note-mobile-topbar`).
- **Keyboard accessory bar** (`.note-accessory`) pins `FormatButtons` to the
  bottom; the editor root height is JS-synced to `window.visualViewport` (ref
  mutation, no state) so the bar rides above the on-screen keyboard. Slash +
  bubble still work. The save-status footer is hidden on phone.

All styles in `globals.css` (`.note-*`, `.slash-*`). Autosave, mentions, tags,
to-do/pin, and the workspace `/notes` feed are unchanged.

**Verified:** `tsc --noEmit` clean; `eslint` clean on all new/changed files
(one pre-existing `set-state-in-effect` warning in the unrelated TagManager
remains). **Not verified:** live behavior — no `DATABASE_URL` here. The
visual-viewport keyboard tracking and the BubbleMenu need real-device checks.

### Notes Notion-pass round 2 (2026-05-29)

Follow-up to the Notion-style editor — the four items the user approved:
- **Checkboxes + links** — to-do checklists via `TaskList`/`TaskItem`
  (`@tiptap/extension-list`, now an explicit dep) with a `/todo` slash item;
  inline links via `@tiptap/extension-link` (explicit dep) with a Link button
  in the bubble menu. Sanitizer extended to keep task lists + styled links in
  the read-only path (display checkboxes forced disabled).
- **Editor chrome cleanup** — removed the bordered top metadata bar; tag, due
  date, and to-do/pin/delete now live in a quiet pill **properties row under
  the title** (`.note-props`). No desktop close 'X'.
- **Sidebar restyle** — `NoteRow` is now a Notion-style page row (`.note-row`:
  page/checkbox icon, hover + inset-ring active, quiet tag-dot + due meta).
- **`/notes` feed** — the workspace feed now tiles cards in a responsive grid
  (`repeat(auto-fill, minmax(320px, 1fr))`) so it fills the width instead of a
  single narrow column.

Plus desktop layout fix (full-width sidebar column + filling editor, no
1180px centering) and editor QoL (autofocus title, Enter→body, click-to-focus).

**Verified:** `tsc` + `eslint` clean (one pre-existing TagManager
set-state-in-effect warning remains). **Not verified:** live device behavior.

## Dark mode (2026-05-29)

Branch `claude/bold-babbage-qxwCO`. App-wide light/dark/system theming, built
on the design-token system (`body[data-theme]`), which already had a dark
token block.

- **Preference model:** Light / Dark / **System** (follows OS, live). Stored in
  a `proscene-theme` cookie (device-level, not the DB). New users default to
  System; existing users stay Light until they choose.
- **No-flash SSR:** the root layout (`app/layout.tsx`, now async) reads the
  cookie and renders `body[data-theme]` server-side; an inline `<script>` at
  body start resolves "system" against `prefers-color-scheme` and corrects the
  attribute + mobile `theme-color` before paint.
- **Switch UI:** `components/app-shell/theme-control.tsx` — a segmented
  Light/Dark/System control in **Settings → Appearance** and the **mobile More
  page**, plus a compact cycle button in the **rail footer**. Applies instantly
  (no reload) and persists via cookie; on "System" it follows live OS changes
  via `matchMedia`. State uses `useSyncExternalStore` (seeded with a
  server-read `initialPref`) so there's no setState-in-effect and no active-
  option flicker. `lib/theme.ts` (client apply/read) + `lib/theme-server.ts`
  (cookie read).
- **Native controls:** `color-scheme` set per theme (`:root` light, dark block
  dark) so scrollbars, date inputs, and form controls render dark.
- **Audit:** the app is token-driven, so the dark block flips nearly
  everything. The few literal whites (toggle knobs, PDF/document page
  backgrounds, the calendar "today" pip) are intentional and left as-is; auth
  screens use `var(--bg)` and go dark automatically.

**Verified:** `next build` compiles + `tsc` + `eslint` clean (build stops only
at page-data collection because this env has no `DATABASE_URL`). **Not
verified:** live visual QA of the dark palette on real screens — the dark
token values are a reasonable starting point and may want tuning.

### Dusk theme (2026-05-29)

Added a third palette, **Dusk** — a soft "dim" theme between light and dark
(warm charcoal `--bg` ~oklch(0.305), lower contrast than dark, gentle for
evening use). New `body[data-theme="dusk"]` token block; the switch is now
**Light · Dusk · Dark · System** everywhere (segmented + rail cycle).
`ThemePref`/`EffectiveTheme`, the no-flash inline script, the cookie
validators, and the status-bar `theme-color` map all updated. `tsc`/`eslint`
clean.

## Marketing website port (2026-06-05) — branch `claude/magical-ride-usNEW`, NOT merged

The standalone ProScene marketing site (hand-built static HTML/CSS/JS,
uploaded by the user) is ported into the app under a new isolated
`app/(marketing)/` route group. See `decision-log.md` (2026-06-05) for the
approach and `open-questions.md` (Marketing website) for follow-ups.

- **Routes:** `/` (landing), `/features`, `/pricing`, `/reviews`,
  `/blog`, `/blog/[slug]`, `/faq`. The root `/` is the marketing homepage (the old `app/page.tsx` `/` →
  `/dashboard` redirect was removed 2026-06-05); users sign in at `/login`
  and land in the app at `/dashboard` after auth.
- **Isolation:** all marketing tokens + base styles are scoped to a
  `.ps-site` wrapper (`app/(marketing)/marketing.css`) so they cannot leak
  into the app and the app's `body[data-theme]` dark/dusk system cannot
  recolor marketing pages. Per-page `<style>` blocks scoped under
  `[data-page="…"]`. `feature-demos.css` + `dash-hero.css` load only on
  `/features`.
- **Approach:** faithful-HTML render — page bodies via
  `dangerouslySetInnerHTML` from authored static content (no user input);
  shared chrome (`Nav`/`Footer`) and interactions (reveal-on-scroll, mobile
  menu, pricing billing toggle, FAQ search + scrollspy, feature scroll-demo
  engine, blog tabs) are real React/client components under
  `app/(marketing)/**`.
- **Fonts:** Inter via `next/font` (`--font-inter`); Geist Mono inherited
  from the app's root layout.
- **Wired:** nav "Sign in" → `/login`, "Start free" → `/signup`. In-page CTAs
  remain `data-noop` placeholders (match the mockups) pending a decision on
  where they route.
- **Assets:** placeholder set-piece SVGs in `public/marketing/setpieces/`.
- **Not built yet:** Payload CMS (planned; needs `next` ≥ 16.2.6), Stripe,
  GTM, brand-casing/domain reconciliation, real blog content, CTA wiring.
- **Verified:** `next build` compiles cleanly (only fails afterward on the
  app's `DATABASE_URL` requirement, unrelated); `tsc --noEmit` and `eslint`
  pass. **Not** browser-verified from this environment (no `.env.local`/DB) —
  smoke-test on a preview deploy or local `npm run dev`.
- **Live app:** untouched. Nothing reaches production until merged.
