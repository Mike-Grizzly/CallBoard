# UX Backlog — actionable fixes from the 2026-07-03 UI/UX review

**Status:** Active working doc. Tracking convention: when a task lands, append `— ✅ DONE (branch/PR, date)` to its heading; if a task is rejected or superseded, append `— ❌ WON'T DO (reason, date)` instead of deleting it.
**Source:** Full-surface UI/UX review (2026-07-03): four code-inspection passes (marketing site, app shell/IA, key flows, cross-surface consistency) plus live browser verification of all nine public pages at 1440px and 390px. Companion to `qa-backlog.md` (functional bugs); this doc is UX/IA/design-system work.
**Rebased against main 2026-07-07:** billing was re-enabled after the review (PR #66, `BILLING_ENABLED=true`, Stripe still in sandbox). Tasks M3/M6/M7 were re-verified and updated to match — trust the task text below, not the 07-03 review narrative in `current-status.md`, where they differ.
**How to use:** Tasks are grouped into phases (M/R/N/B/S) and sized XS–L. Each task has acceptance criteria and, where relevant, a security note. Suggested batching into PRs is at the bottom.

---

## Execution guide for a fresh session (read this first)

This doc assumes no memory of the review session that produced it. Before starting any task:

1. **Read, in order:** `CLAUDE.md` (repo root), `docs/session-start.md`, `docs/architecture.md`, `docs/dev-rules.md`, then the **Security ground rules** below. Do not skip these — several tasks touch surfaces with documented invariants.
2. **Line numbers in this doc drift.** File paths are reliable; line refs were accurate on 2026-07-03. When a `file:line` doesn't match, grep the same file for the quoted identifier/string (e.g. `data-noop`, `btn ghost lg`, `PARSE_LIMIT_PER_PRODUCTION`) rather than trusting the number.
3. **Owner-decision tasks — do not guess on money or brand.**
   - **M1 (school pricing): ASK THE OWNER before editing.** It's a pricing promise; either answer changes real copy on three pages. Do not pick a side yourself.
   - Tasks with a stated recommendation (R3 → option b or c, R7 → unmark the asterisk, N9 → delete dead CSS, M7 → remove social icons) may be implemented as recommended if the owner is unavailable — say so explicitly in the PR description and log it in `decision-log.md`.
   - M12/M13 are decision-only: produce a written recommendation, don't restyle the brand unprompted.
4. **Marketing content model:** the marketing pages are big HTML template-literal strings in typed TS files (`app/(marketing)/home-content.ts`, `features/content.ts`, `pricing/content.ts`, `faq/content.ts`, `blog/content.ts`) injected via `dangerouslySetInnerHTML` — this is authored static content, not user input; edit the HTML strings directly. Sanity can *override* some sections at runtime (hero, pricing tiers, FAQ items, blog posts) — the static files are the always-present fallback, so copy fixes go in the static files AND, where a Sanity document exists for the same content, flag in the PR that the CMS copy needs the same edit (owner does that in Sanity Studio).
5. **Running the app in a sandbox (no real env):** copy `.env.example` → `.env.local` with placeholder values (keep the real public `NEXT_PUBLIC_SANITY_PROJECT_ID` that's already in the example). Marketing pages, `/login`, and `/signup` render without a database; `(app)` pages need a live `DATABASE_URL` and will not render — review app surfaces by code inspection or on a preview deploy.
   **Known gotcha:** in a network-restricted sandbox, server-side Sanity fetches hang for minutes (the connection blackholes instead of refusing) and every marketing page blocks on them. Workaround until M10 lands: start the dev server with a dead proxy so CMS fetches fail instantly and fall back to static content:
   `HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 NO_PROXY=localhost,127.0.0.1 npm run dev`
6. **Visual verification** (required for anything user-visible, per `dev-rules.md`): headless Chromium is preinstalled in Claude Code web sandboxes at `/opt/pw-browsers/chromium-*/chrome-linux/chrome`; use `playwright-core` with `executablePath` pointed there (do NOT run `playwright install`). Screenshot at **1440×900 and 390×844**, `waitUntil: "domcontentloaded"` plus a short fixed wait — `networkidle` never settles while Sanity fetches dangle. First hit per route in dev compiles on demand and can take ~30s; use generous timeouts.
7. **Checks before every commit:** `npm run type-check`, `npm run lint`, `npm test`, `npm run build` (build works with placeholder env; it fails only at page-data collection needing `DATABASE_URL`, which is a known, acceptable condition documented in `current-status.md`).
8. **Scope discipline:** one batch (see table at bottom) per branch/PR. Don't mix marketing copy with app behavior changes. Update `current-status.md` + this doc's checkboxes at session end per the closeout workflow in `dev-rules.md`.

---

## Security ground rules (read before touching ANY task)

We have just completed a pentest plus two internal hardening batches (see `current-status.md` 2026-06-18/19 and 2026-06-29). **Nothing in this backlog requires loosening any control.** Every task here is copy, client-side UI, or wiring of an *existing already-gated* server action. Any implementation that finds itself wanting to bypass these invariants is wrong — stop and redesign the task.

Invariants that must survive every PR from this doc:

1. **Storage stays deny-all.** The `attachments` bucket keeps RLS enabled with zero policies. No new `authenticated` policies, ever. All object reads/writes/signed URLs stay behind server actions using the admin client + `requireCurrentUser` + `can()` + `userCanAccessProduction`.
2. **Authorization lives in server actions, never only in the UI.** Client-side confirmation dialogs, previews, hidden buttons, and nav gating are UX conveniences on top of server checks — adding them must never be accompanied by removing or "simplifying" the server-side `can()` / `userCanAccessProduction` / resource-ownership checks (the 2026-06-29 audit closed the last gaps; don't reopen them).
3. **Draft report visibility:** every new report-reading surface (including the new distribute-preview in R1) goes through `canViewDraftReports(role)` / `userCanReadReport` (`features/reports/visibility.ts`, `features/reports/attachments.ts`).
4. **Rich text renders only through `sanitizeHtml`** (`lib/sanitize.ts`). Any new preview/render path (R1!) uses the same sanitizer as the existing render path — no new `dangerouslySetInnerHTML` on unsanitized content.
5. **`proxy.ts` remains the auth layer.** No `middleware.ts`. Adding routes to `PUBLIC_ROUTES` requires explicit justification (none of these tasks needs one).
6. **Auth rate limiting stays fail-closed in production** (`lib/rate-limit.ts`). Untouched by this backlog.
7. **No constants exported from `"use server"` files** (hydration + accidental-exposure hazard). New UI constants go in `constants.ts` files.
8. **No new secrets or keys reach the client.** Marketing CMS work (M11) keeps `SANITY_API_READ_TOKEN` server-only.
9. **Do not build global search as a side effect of N2.** A real search feature is a new cross-tenant query surface that needs its own authz design (per-capability, per-production scoping). N2 only *removes* the dead button.
10. **File-upload validation stays as hardened** (no SVG logos/set pieces, storage-path traversal rejection, size caps). Nothing here touches uploads except cosmetics.
11. **Recipient hardening stays:** `sendReport` continues to filter recipients to actual production members server-side regardless of what the picker UI sends.
12. **Deletions in this doc are soft/UI-level or dead code only.** Removing the dead `cool` theme CSS, density CSS, or an unused nav entry has no data-path impact. Anything touching data deletion (R2) wires an existing gated action; it does not add new delete capability.

Per-PR checklist (copy into the PR description):
- [ ] No server action lost or weakened a permission / tenancy / ownership check
- [ ] No new render path bypasses `sanitizeHtml`
- [ ] No storage/RLS/proxy/rate-limit changes
- [ ] New client code sends no request an unmodified client couldn't already send
- [ ] `tsc`, `eslint`, tests, `next build` green

---

## Phase M — Marketing: truth & conversion

The site's voice and demos are strong; the problem is claims the app doesn't back, plus a few conversion-path bugs verified live in a browser.

### M1 · Fix the school pricing contradiction — **P0 · XS** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07; owner chose "discounted, not free")
Contact page promises the Company plan **free** for verified students/educators (`app/(marketing)/contact/page.tsx:19-22`, incl. the page title), while pricing (`pricing/content.ts:104,276`) and FAQ (`faq/content.ts:113`) say school pricing is discounted and explicitly "isn't free." Pick one policy (owner decision) and make all three pages agree.
**Accept:** the words "free" and "discounted" cannot both be found describing school pricing; contact page title matches the chosen policy.

### M2 · Marketing truth pass — unbacked feature claims — **P0 · M**
Ported verbatim from the design handoff without verification (`features/content.ts:1-5` header admits this). For each claim: either soften to what ships, or move under an explicit "coming soon" treatment (the pattern already exists — "Per-role line highlighting · Beta soon").

| # | Claim | Where | Reality |
|---|---|---|---|
| a | Conflict detection (company-wide) | `home-content.ts:107-123`, `features/content.ts:231-243,315-329,496`, **fake changelog post** `blog/content.ts:64-78` | Does not exist anywhere in the app |
| b | Drag-to-reschedule calendar | `home-content.ts:107` | No drag-to-reschedule |
| c | "Works offline" | `home-content.ts:198`, `features/content.ts:534` | No service worker / offline caching |
| d | App Store / Google Play app | `faq/content.ts:43`, pricing table "Mobile app" | Responsive web app / PWA only |
| e | Reminders "by text" (SMS) | `faq/content.ts:51` | Web push only; no SMS integration |
| f | Calendar subscribe from Google/Apple/Outlook | `features/content.ts:308` | No iCal/.ics feed; own help manual says in-app only |
| g | "Export every report to PDF" | features + FAQ | Email distribution only; no PDF/print path |
| h | Script parse "free for the next company" | features AI section | Cache is per-organization (`features/scripts/parse.ts:307-314`), never cross-company |

Verified-accurate claims to keep as-is: AI analysis + the "4 of 5 analyses" quota (matches `PARSE_LIMIT_PER_PRODUCTION = 5`), call confirmations/read receipts, blocking, report email distribution, people directory + emergency contacts, push notifications, CSV/spreadsheet cast import, participant-free pricing model.
**Accept:** every row above is either softened or explicitly marked coming-soon; the fake "New: conflict detection" blog card is removed or rewritten about a real capability.
**Security note:** copy-only. Alternatively, if any of (b/f/g) get *built* instead of softened, they are separate feature specs — an .ics feed in particular is a new unauthenticated data-exposure surface (signed per-user feed URLs) and must NOT be improvised inside a copy PR.

### M3 · Pricing page: default to "For companies" — **P0 · XS** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07)
Initial state is `data-aud="designers"` (`pricing/page.tsx:49`), so the first thing every visitor sees is the individual Proscene Studio panel rather than the company plans. *(Re-verified after the 2026-07 billing launch: Studio is now purchasable with real "Get started" CTAs, so this is less broken than at review time — but companies are still the primary audience and the headline product; they should be the default panel.)*
**Accept:** first paint shows Season/Repertory/Company; individuals still one toggle away; deep links (`?aud=`) still work.

### M4 · Restore "Sign in" for mobile marketing visitors — **P0 · XS** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07)
`.nav-cta .sign-in{display:none}` at the mobile breakpoint (`marketing.css:445`) and the hamburger menu (`_components/nav.tsx:49-61`) contains only page links. Existing users on phones have no path to login. Add "Sign in" to the hamburger menu (simplest) and/or keep it visible in the bar.
**Accept:** at 390px a visitor can reach `/login` in ≤2 taps from any marketing page.

### M5 · Home hero "Book a demo" is invisible on the night hero — **P0 · XS** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07)
`home-content.ts:247` uses `class="btn ghost lg"` — ghost = transparent bg + `--ink-2` dark-gray text (`marketing.css:170`) on the dark hero. Verified illegible in screenshot. The fix exists: change the class to `btn on-night lg` — `.btn.on-night` (`marketing.css:174`) is the dark-surface variant built for exactly this (the features-page hero at `features/content.ts:16` uses plain `btn lg` and is legible; matching that is also acceptable).
**Accept:** secondary hero CTA meets WCAG AA contrast on the night background in a screenshot check.

### M6 · Post-billing-launch messaging audit — **P0 · S** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07)
*(Rewritten 2026-07-07: billing is now ON, which inverts this task.)* The open-beta banner correctly auto-hides (`pricing/page.tsx:51` gates on `!BILLING_ENABLED`), but the **JSON-LD structured data on home and pricing still tells Google "Free during open beta" with price 0** (`app/(marketing)/page.tsx:38`, `pricing/page.tsx:38`) — now-false pricing metadata on the two highest-intent pages. Fix the schema to the real offer (60-day free trial, tiers from `pricing/content.ts`). Then sweep the remaining copy against the live story ("60-day trial from first production, no card"): home hero note (`home-content.ts:273` — currently consistent), signup footer line, FAQ billing answers.
**Accept:** JSON-LD offers match real pricing; no page or metadata claims the product is free-in-beta; home/pricing/signup/FAQ tell the same trial story.
**Security note:** copy/metadata only; do not touch `BILLING_ENABLED`, billing gates, or Stripe config (go-live checklist in `current-status.md` is owner-only).

### M7 · Kill or wire the dead interactive elements — **P1 · S** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07; removed social icons + wired invites link, per recommendation)
Still `data-noop` after the billing launch: three footer social icons (`_components/footer.tsx`, href="#") and pricing "How invites work" (`pricing/content.ts:61`). JSON-LD `sameAs` is empty, confirming no social presence. *(The three Studio "Notify me" CTAs flagged at review time became real signup links in the billing launch — resolved.)*
**Recommendation:** remove the social icons until real accounts exist; link "How invites work" to the existing help-manual article on invites (`/help/...` — find the invites page under the people or get-started section).
**Accept:** nothing on the marketing site looks clickable but does nothing.

### M8 · Blog index honesty — **P1 · S** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07; trimmed to the one real post pending Sanity publish of the SEO drafts)
Every card links to the single real post (`blog/content.ts:3`); the featured card says 8 min read, its grid duplicate 6 min. Trim the index to real posts (the four Phase-1 SEO drafts in `docs/seo/blog-drafts/` are ready to publish via Sanity — publishing them fixes this properly). Rename footer "What's new" → "Blog" (or build a real changelog later).
**Accept:** every blog card is a distinct real post; read times consistent; no footer label promising a changelog.

### M9 · FAQ dual-mode fragility — **P2 · S**
Static FAQ has a hand-built sidebar with **hardcoded counts** (`faq/content.ts:24-28`); when Sanity FAQ items exist the whole body swaps to `SanityFaq` (`faq/page.tsx:36-40`) with a different layout and the custom sidebar vanishes. Either derive counts from the content array, or commit to one rendering path.
**Accept:** category counts always match rendered items; layout identical regardless of CMS state.

### M10 · Marketing pages must not block on Sanity — **P1 · M**
Observed while running the site: with the CMS unreachable, server rendering of Sanity-backed pages hangs for minutes (fetch has no timeout; the request blackholes). ISR masks this in production until a revalidate misses. Add a short timeout (e.g. 3s via `AbortSignal.timeout` in the `loadQuery` helper, `lib/sanity/queries.ts`) falling back to the static content that already exists for every page.
**Accept:** with Sanity unreachable, every marketing page renders its static fallback in <5s.
**Security note:** keep `SANITY_API_READ_TOKEN` server-only; timeout handling must not log the token or expose draft content on the public path.

### M11 · Marketing home hydration warnings — **P2 · S**
Dev overlay reports hydration issues on `/` (React diff points at `style` attributes inside the injected HTML, e.g. `section.night` with `padding-top:0px`; likely `dangerouslySetInnerHTML` markup vs the Sanity hero swap). Harmless-looking but masks real hydration regressions and shows in every dev session.
**Accept:** `/` renders in dev with zero hydration warnings.

### M12 · Brand seam: amber marketing → crimson app — **P2 · decision + S**
The site is spotlight-amber "paper & spotlight"; clicking "Start free" lands on a crimson split-screen (`app/signup/`) with a red submit button — verified jarring in screenshots. Also two logo asset systems (inline `BrandMark` SVG on marketing vs `brand-paper.svg`/`brand-ink.svg` image files on signup). Owner decision: is amber the brand or the marketing costume? Then make auth screens bridge the two (shared accent on the CTA, one logo component).
**Accept:** decision in `decision-log.md`; auth screens use the shared `BrandMark`; palettes deliberate rather than accidental.

### M13 · Marketing dark mode — **P3 · decision**
Marketing is deliberately always-light (scoped `.ps-site`); the app has three themes. A dark-theme app user who hits a marketing link gets flashbanged. Fine to keep as a brand choice — but log it as a decision rather than an accident. No code required if the answer is "keep light."

---

## Phase R — Reports & destructive-action safety

The single most consequential action in the product (distributing a report to the whole company) has less friction than deleting a call template, while several irreversible removals have none at all. All fixes below are client-side friction wiring existing gated server actions.

### R1 · Preview + confirm before "Distribute" — **P0 · M**
"Distribute" (`reports/_components/report-form.tsx:358-398`) flips a draft to distributed in one click; the auto-opened recipient picker previews *who*, never *what*. Add a preview step: render the report exactly as recipients will see it inside a confirm surface ("Distribute to N people"). Two existing render paths to reuse — the report detail page components under `app/(app)/productions/[slug]/reports/[reportId]/` (what in-app recipients see) and the email HTML builder in `features/reports/send-report.ts` (what inboxes get); the in-app rendering is the sensible preview. The recipient picker itself is `email-report-button.tsx` in the same `[reportId]` folder.
**Accept:** distributing requires seeing the rendered report + an explicit confirm; "Save draft" stays one click.
**Security note:** preview must reuse the existing sanitized render path (`sanitizeHtml` — ground rule 4) and existing queries; the author already holds `reports:create` so no visibility change. No new server action needed.

### R2 · Wire up report delete/retract — **P0 · S**
`deleteReport` exists (`features/reports/actions.ts:370`, billing-guarded, soft-delete) but **no UI calls it** — a wrongly distributed report can only be edited. Add a delete action (report detail overflow + list row menu) using `ConfirmDialog` with the 30-day-trash recovery copy; deleted reports already surface in the production trash drawer.
**Accept:** a report manager can move a report to trash from the detail page; it appears in the trash drawer; restore works; cast/crew never see a delete affordance (`can()`-gated in UI as well as server).
**Security note:** call the existing action only. Permanent purge stays behind `reports:delete` (admin/producer, per 2026-06-19 hardening) — do not surface permanent delete outside the trash drawer.

### R3 · Recipient picker: make "everyone" a choice, not a default — **P0/P1 · S**
`email-report-button.tsx:196-221` pre-selects the entire production. Over-sending is the default outcome. Options: (a) keep default-all but the send button always states the count and requires no other change — weakest; (b) default to department-relevant recipients with one-click "Entire production"; (c) default none + prominent "Select all". Recommend (b) or (c) — owner call.
**Accept:** sending to everyone requires a deliberate selection or an explicit count-bearing confirm.
**Security note:** server keeps filtering recipients to production members regardless (ground rule 11).

### R4 · Adopt `ConfirmDialog` everywhere; retire native `confirm()`/`alert()` — **P1 · M**
The branded dialog (`components/ui/confirm-dialog.tsx`) is used in 3 places; native `confirm()` ships in: `calls/[callId]/edit/delete-call-button.tsx:16`, `documents/document-delete-button.tsx:11`, `documents/document-row-menu.tsx:161`, `announcements/announcement-delete-button.tsx:15`, `notes/notes-panel.tsx:364`, `[slug]/trash-drawer.tsx:92`, `productions/archive-buttons.tsx:28,111`, `people/person-drawer.tsx:115`, `settings/workspace/transfer-ownership-form.tsx:65`, `settings/workspace/logo-uploader.tsx:115`, `script/ai/ai-review-client.tsx:544`. Native `alert()` for errors in `archive-buttons.tsx:41,120` and `document-row-menu.tsx:148` → inline error/toast (see S3).
**Accept:** zero `window.confirm`/`window.alert` in `app/` + `components/` (grep-verifiable).

### R5 · Add confirmation to the unguarded destructive actions — **P0 · S**
Currently single-click with no confirm at all:
- Delete video + all its timestamp notes — `videos/videos-client.tsx:186-201,694-701`
- Remove person from production — `members/cast-crew-board.tsx:179-183`; also `people/person-drawer.tsx:99-111`
- Remove member from the **entire organization** — `settings/members/member-list.tsx:131-140`
- Delete note tag — `notes/notes-panel.tsx:717-721`
Use `ConfirmDialog` (danger variant) naming the person/thing. Inconsistency to fix alongside: the hard account-delete right next to the unconfirmed removals *does* confirm.
**Accept:** each of the four flows shows a named confirm before the server action fires.

### R6 · One production archive/delete implementation — **P1 · S**
Two parallel UIs: branded `production-card-menu.tsx:142,161` (ConfirmDialog, 30-day copy) vs `productions/archive-buttons.tsx` (native confirm + alert). Keep the branded one, refactor `archive-buttons` to use it.
**Accept:** one shared confirm implementation for archive/delete/restore of productions.

### R7 · Wizard: "opening night required" — enforce or unmark — **P1 · XS** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07; unmarked, per recommendation)
The new-production wizard banner says "Only opening night is required" and renders a red asterisk (`new-production-wizard.tsx:831,858`) but `canAdvance`/`submit` only validate title (`:522-525,:332-336`). Either enforce it or remove the asterisk + banner claim. (Recommend unmark: quick-add already proves title-only launches are fine.)
**Accept:** visual requirement markers match actual validation.

### R8 · Wizard rehearsal times: real time inputs — **P2 · XS**
Free-text "7:00 PM" strings (`new-production-wizard.tsx:905-918`) while the call form uses `type="time"`. Unify on time inputs.

---

## Phase N — Navigation & IA

### N1 · Mount the notification bell — **P1 · S**
`components/app-shell/notification-bell.tsx` is complete (loading/empty/populated, mark-read, per-row links) and referenced nowhere — confirm with grep before assuming it still works; it may have drifted since it was built. There is no persistent notification inbox in the shell. Mount it in the rail (`components/app-shell/rail.tsx` — the footer row next to `ThemeControl` is the natural spot) and surface an equivalent entry on mobile (e.g. dashboard header or the More page, `app/(app)/(default)/more/page.tsx`).
**Accept:** unread notifications reachable from every app screen; mark-read works; count badge visible.
**Security note:** bell queries are already per-user; mounting adds no new data exposure. Verify the dropdown links respect production access (they link to items the user was notified about, which are membership-gated at the target page anyway).

### N2 · Remove the dead search button — **P1 · XS** — ✅ DONE (claude/ux-backlog-batch-1-ig6614, 2026-07-07)
Production topbar renders a Search icon with no handler (`productions/[slug]/layout.tsx:245-252`). Remove it. If/when global search is wanted, spec it separately (ground rule 9 — new cross-tenant query surface needs its own authz design).
**Accept:** no non-functional affordances in the topbar.

### N3 · Promote Cast & Crew to a tab; give Blocking its own icon — **P1 · S**
The drag-to-assign casting board (`/members`) is reachable only via a topbar button while ten lesser surfaces get tabs; Overview and Blocking share the same `Layout` icon (`layout.tsx:126-176`). Add Cast & Crew to the tab strip (keep the exact `canManage` gate it has today) and pick a distinct Blocking icon (e.g. Move/Map).
**Accept:** Cast & Crew appears in the strip for managers only; no duplicate icons; tab count pressure acknowledged — consider dropping the separate topbar button.
**Security note:** gating must remain `productions:manage` — promotion to a tab must not widen visibility.

### N4 · Single source of truth for nav items — **P1 · M**
Three hand-maintained lists with independently copied capability gating: `components/app-shell/nav-items.ts` (rail), `app/(app)/(default)/more/page.tsx` ITEMS, `components/app-shell/mobile-tab-bar.tsx` TABS. Also `NAV_ITEMS` carries a dead "Productions/Theater" entry that the rail filters out. Consolidate into one definition (label, href, icon, capability, surfaces) consumed by all three.
**Accept:** adding/gating a nav item is a one-file change; dead entry removed; existing gating byte-identical (write a small test asserting each surface's rendered items per role).
**Security note:** this is where gating could silently loosen — the per-role test is the guard.

### N5 · Settings hub cleanup — **P2 · M**
`/settings` mixes org identity, a duplicate org switcher (the rail badge already switches orgs), theme, and links to account/workspace/notifications/billing/members; production settings live in a separate tree. Minimum: remove the duplicate switcher, group the hub into Account / Workspace / Notifications sections with descriptions, and cross-link production settings.
**Accept:** one org-switcher surface on desktop (rail); hub reads as a directory, not a junk drawer.

### N6 · Breadcrumbs / back affordance for deep routes — **P2 · M**
Only one static crumb exists (`Productions › {title}`); deep pages like `calls/templates/[id]/edit` (5 levels) give no positional context. Extend the crumb to include tab + subpage, or add a consistent back link on subpages.
**Accept:** from any depth, one visible click returns to the parent list.

### N7 · Production switcher in the production topbar — **P2 · S**
Switching shows requires exiting to the rail/index. Make the breadcrumb title a dropdown of the user's productions (same list the rail shows — reuse its gated query).

### N8 · Onboarding dialog: stop interrupting existing users — **P1 · S**
`OnboardingDialog` fires whenever the user lacks notification prefs (`dashboard/page.tsx:532`) — including long-time users on populated dashboards. Fold notification prefs into the `/setup` wizard as a fourth optional card for new admins, and for existing users show a dismissible banner/card instead of a modal. Related known item: setup survey data is captured but unused (`open-questions.md` 2026-06-15) — if it stays unused, trim the survey to shorten setup.
**Accept:** modal appears at most once, only in a first-run context; a "not now" never re-prompts on next login.

### N9 · Delete dead design axes — **P2 · S**
`[data-theme="cool"]` CSS is unreachable (ThemePref offers light/dusk/dark/system — `lib/theme.ts:8-9`); `data-density` compact/comfy CSS exists but body is hard-coded `"regular"` (`app/layout.tsx:85`). Delete both blocks (or ship them — owner call; recommend delete).
**Accept:** no theme/density CSS that no UI can reach; `globals.css` shrinks accordingly.

---

## Phase B — Mobile

### B1 · Mobile rehearsal-report form — **P0 · L**
Marketing promises "file the report from the table, your laptop, or your phone in the wings." The report *detail* has `MobileReportDetail`; the *form* is the same dense desktop grid with 3-column editors and modals. This is the highest-value mobile investment in the app: a stacked single-column variant with the tabbed sections as an accordion, dept-note entry inline instead of modal, and the existing staged-attachment flow.
**Accept:** a report can be created, dept-noted, attached, and distributed comfortably at 390px (screenshot-verified); no desktop regression.

### B2 · iOS auto-zoom: floor auth inputs at 16px — **P1 · XS**
The parked issue (`open-questions.md`, Mobile/iOS): WebKit auto-zooms on <16px inputs at login and the zoom sticks after sign-in. Two clever fixes failed; the boring one hasn't been tried — floor the login/signup `.field` font-size at 16px so the zoom never triggers. `ZoomReset` can then be removed if verified.
**Accept:** typing into login/signup on iOS Safari causes no layout zoom (on-device verify — add to tester guide).

### B3 · Mobile tab-strip scroll affordance — **P2 · S**
At ≤720px all ~10 production tabs become a horizontal scroller; trailing tabs (Blocking, Script, Settings) are invisible without scrolling and nothing hints there's more. Add an edge fade + partial-tab peek (ensure the strip never ends exactly at a tab boundary at common widths).
**Accept:** at 390px it is visually obvious the strip scrolls.

### B4 · "More" page triage — **P2 · M**
Six top-level destinations (Productions, Documents, Announcements, Activity, People, Settings) live two taps deep under More with no badges. Minimum: unread/count badges on More items (announcements, activity) and on the More tab itself. Consider swapping Notes → Announcements in the 5-tab bar based on actual usage.
**Accept:** a cast member with an unread announcement sees a badge without opening More.

---

## Phase S — Design-system consolidation

The systemic finding: good primitives exist but lost the adoption war — two button systems (cva `<Button>` in newer forms vs `.btn` classes in every main tab), five independent drawer implementations, a toast system that exists only inside the cast board, three hand-inlined empty-state styles, zero skeletons, no focus trapping on any overlay, and a 13,174-line `globals.css`. None of this needs a rewrite; it needs steady consolidation with a "leave it better than you found it" rule.

### S1 · Shared `<Drawer>` primitive — **P1 · L**
Five parallel implementations, each with its own Escape handler + CSS namespace: `people/person-drawer.tsx` (pp-), `components/announcements/announcement-detail-drawer.tsx` (ann-), `calendar/event-drawer.tsx` (cal-), `documents/document-drawer.tsx`, `[slug]/trash-drawer.tsx` (the only portal-based one). Extract one `<Drawer>` (portal, Escape, backdrop, focus trap per S4, mobile bottom-sheet mode like the call tray) and migrate one drawer per PR.
**Accept:** all five drawers render through the shared primitive; per-surface CSS namespaces collapse to content styles only.

### S2 · Global toast provider — **P1 · M**
Only `members/cast-crew-board.tsx:106-134` has toasts (hand-rolled `.ax-toast`). Extract it into a provider + `useToast()`; adopt in the surfaces currently using `window.alert` or silent success (R4/R6 depend on this).
**Accept:** one toast API; cast board migrated; alert()-error sites migrated.

### S3 · Shared `<EmptyState>` — **P2 · S**
Three hardcoded font sizes for the same concept (`documents-client.tsx:337` 14px, `script/page.tsx:60` 15px, `notes-panel.tsx:1082` 13px) vs the designed `pp-empty` pattern in people (`people-directory.tsx:328-340` — icon + context-aware copy). Componentize the people version; adopt everywhere.
**Accept:** all list surfaces use `<EmptyState icon title hint action?>`; people's context-aware copy pattern (different message when filters are active) preserved.

### S4 · Focus trapping + focus return on all overlays — **P1 · M**
Every drawer/modal handles Escape + backdrop click; **none** traps focus or returns it on close (ConfirmDialog has autoFocus only). This is the app's one systemic a11y hole. Implement once in the shared Drawer (S1) + ConfirmDialog + remaining modals.
**Accept:** Tab cycles within any open overlay; closing returns focus to the trigger; verified with keyboard-only walkthrough of documents, people, announcements, calls tray.

### S5 · Route-level loading states — **P2 · M**
Only `blocking/loading.tsx` and `script/loading.tsx` exist (spinners). Members, documents, videos, announcements, notes, calls have none — slow transitions show a frozen frame. Add lightweight `loading.tsx` (shared skeleton or centered spinner) per production tab.
**Accept:** every production tab shows immediate feedback on navigation.

### S6 · Button unification (ongoing rule, not a big-bang) — **P2 · ongoing**
Newer forms use cva `<Button>` (`components/ui/button.tsx`); main tabs use `.btn` (script 24×, blocking 21×, documents 15×…). Don't mass-migrate; adopt the rule "any touched component converts to `<Button>`" and note it in `dev-rules.md`.

### S7 · `globals.css` decomposition (ongoing) — **P3 · ongoing**
13,174 lines, one file, five section comments. Marketing already demonstrates per-page CSS files. Adopt "when you touch a surface, move its namespace block (`pp-*`, `ann-*`, `cc-*`, `sv-*`…) into a co-located CSS file"; N9's dead-code deletion is the first shrink.

### S8 · Decompose the two giant components (opportunistic) — **P3 · L**
`script/script-viewer.tsx` (158KB, 93 hooks) and `blocking/blocking-canvas.tsx` (107KB, 51 hooks, ~40 state atoms: drag, undo, PDF paging, markers, set pieces, arrows, lasso, ghosting, comments, CRUD). Extract custom hooks/subcomponents when features next touch them — not as a standalone rewrite.

### S9 · TipTap bullets don't render — **P1 · XS**
Known issue (`open-questions.md` UX questions): Tailwind prose reset strips list styles in rich-text display. User-visible formatting bug in notes/reports/announcements. Scope list styles back in for `RichTextDisplay` content.
**Accept:** bullets/numbered lists author and render correctly everywhere rich text displays (all themes).
**Security note:** CSS-only; keep rendering through `sanitizeHtml` untouched.

### S10 · A11y semantics on the thin surfaces — **P2 · S**
`components/announcements/announcements-center.tsx` has 1 aria across 257 lines; notification bell dropdown lacks menu semantics; members board is aria-thin (aria=2). Pass: labels on icon buttons, `role`/`aria-expanded` on disclosure controls, list semantics on feeds. (Script viewer is the reference — 31 aria attrs, `aria-pressed` tabs.)

---

## Additional observations (noticed during review; low priority or decision-only)

- **Announcements/Documents/Reports appear both as workspace pages and production tabs with identical names** — the all-shows vs this-show scoping is implied, never labeled. Consider eyebrow labels ("All productions" / show name) on the workspace variants.
- **Focal call / dashboard is genuinely excellent** — the theatre-aware greeting engine, RSVP rollups, and progress-to-opening bars are the product's personality. Protect them in any dashboard rework (`open-questions.md` "UI port questions" contemplates re-porting `/dashboard` to the newer Workspace Home design — if that happens, carry these behaviors over).
- **`app/(app)/calendar` sits outside the `(default)` route group** its siblings use — harmless routing oddity; fold in whenever the file moves anyway.
- **FAQ claims closed shows become a "read-only archive"** — archiving exists, but verify the archived state is actually enforced read-only end-to-end before the claim stays.
- **Signup account-type choice ("I run productions" vs "I'm a participant") is good** but the participant path drops workspace naming with no preview of what a participant account can do — a one-line explainer under the radio would reduce mis-picks (participants who should be waiting for an invite instead).
- **Trial countdown pill + trial banner**: `BILLING_ENABLED` flipped back on 2026-07 — the messaging re-audit is now task M6. When Stripe moves from sandbox to live keys (owner go-live checklist in `current-status.md`), give marketing + in-app billing copy one more pass.
- **Design tokens are healthy** — OKLCH palette, accent-strong AA handling on dark themes, flash-free theme boot (cookie + pre-paint script + `useSyncExternalStore`) are all done right; consolidation work should build on these, not replace them.
- **Keep as-is (deliberately reviewed, no change wanted):** invited-user rescue flows (signup `account_exists` detection + login reset hint + invite footer), quick-add production, call form smart defaults, generate-form default-on "skip clashes," document upload v2 guardrails, save-draft-anywhere wizard, Focus mode as designer-seat home, per-role capability nav gating.

---

## Suggested batching

| Batch | Contents | Theme |
|---|---|---|
| 1 (copy + one-liners, ship this week) | M1 M3 M4 M5 M6 M7 M8, R7, N2 | Marketing truth + dead-affordance sweep; zero risk |
| 2 (action safety) | R1 R2 R3 R5, S2 (toast, prerequisite for R4/R6), R4 R6 | Destructive-action friction; ConfirmDialog adoption |
| 3 (IA) | N1 N3 N4 N8, B3 | Bell, Cast & Crew tab, nav single-source, onboarding |
| 4 (mobile) | B1 B2 B4 | Report form is the centerpiece |
| 5 (system) | S1 S4 S3 S5 S9 S10, N5 N6 N7 N9, M9 M10 M11 | Drawer/focus/empty/loading + settings/breadcrumbs |
| Ongoing rules | S6 S7 S8, M12 M13 decisions | Note in `dev-rules.md` |

Every batch ends with the security checklist from the top of this doc, plus `tsc` + `eslint` + tests + `next build`, and screenshot verification for visual changes.
