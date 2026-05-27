# Launch Roadmap — Proscene

**Created:** 2026-05-21
**Status:** Active — this is the working plan to take Proscene from a
feature-complete MVP to a soft launch with invited testers, and on to a
public launch.

## How to read this

Proscene is feature-rich — 16 build steps are implemented (see
`current-status.md`) — but it has **never been deployed or used by anyone
outside development**. This roadmap covers that gap: security hardening,
deployment, the mobile experience, a beta-tester program, the marketing /
landing site, and a native app.

Work is grouped into phases. **Phases 0–3 deliver the soft launch** (a
testing site with invited testers). **Phases 4–6 lead to the public
launch.** Phases overlap — see the dependency notes on each.

Effort sizing: **S** = a few hours · **M** = roughly one work session ·
**L** = multiple sessions.

### Decisions locked 2026-05-21

- **Hosting:** Vercel (testing site and eventual production).
- **Mobile:** ship an installable **PWA now** (free), add a **native App
  Store / Play Store wrapper after beta**.
- **Domain:** the product was renamed from CallBoard to **Proscene** on
  2026-05-27 (the `callboard` domain could not be secured) and lives at
  **`proscene.app`**, wired to Vercel and live. The Vercel auto-URL
  `call-board.vercel.app` is kept as a fallback during beta.

### Decisions — see the Decisions section

Still open: D3 beta Supabase project · D5 beta org model · D6
scaffolded-feature scope · D7 PWA offline support.

Resolved 2026-05-21: **D1** (added `isomorphic-dompurify`) · **D4**
(uploads go client-direct to Supabase Storage).
Resolved 2026-05-27: **D2** (`proscene.app` registered, Resend domain
verified, Supabase custom SMTP wired — emails now send from
`noreply@proscene.app`).

## Phase overview

| Phase | Goal | Gates | Owner |
|---|---|---|---|
| **P0** | Security hardening — **done 2026-05-21** | Soft launch | Claude |
| **P1** | Deploy testing site to Vercel — **done 2026-05-22** | Soft launch | Shared |
| **P2** | Mobile web experience + PWA | Soft launch (partial) | Claude |
| **P3** | Beta testing program | *is* the soft launch | Shared |
| **P4** | Marketing / landing site + auth wiring | Public launch | You + Claude |
| **P5** | Native app wrapper (App Store / Play Store) | Public launch | Claude |
| **P6** | Pre-public-launch hardening | Public launch | Shared |

P0, P1, and P2 can run in parallel. **No external tester is invited (P3)
until P0 is complete** — testers will be handling each other's data.

---

## P0 — Security hardening — DONE (2026-05-21)

These were real vulnerabilities confirmed in the code, not theoretical
risks. They had to land before anyone outside the team touches the app.

- [x] **Signed-URL access control.** `getDocumentUrl`,
  `getDocumentDownloadUrl`, `getAttachmentUrl`, and `getCustomSetPieceUrls`
  accepted a client-supplied storage path and signed it with no checks.
  They now take a record **id**, load the authoritative row, and verify
  access via `userCanAccessProduction()` (new, in `lib/auth.ts`) before
  signing. All callers updated.
- [x] **HTML sanitization.** Added `isomorphic-dompurify` and
  `lib/sanitize.ts`; `RichTextDisplay` and the notes panel now sanitize
  before `dangerouslySetInnerHTML`, closing the stored-XSS vector.
- [x] **File-type validation.** `uploadDocument` and
  `uploadReportAttachment` now enforce a MIME allowlist (PDF, common
  images, Office docs). `uploadCustomSetPiece` already had one.
- [x] **Filename sanitization.** Document and report-attachment uploads
  sanitize the filename used in the storage path.
- [x] **Notes privacy enforcement.** `getNotesByProduction` now filters to
  the caller's own notes (notes are private by design since Step 11).
- [x] **Password strength (free substitute for leaked-password
  protection).** Set in Supabase Auth → Sign In/Providers → Email on
  2026-05-28. Leaked-password protection (HaveIBeenPwned check) is a
  Supabase **Pro-plan** feature — re-enable at P6 when the project
  moves to Pro.
- [ ] **Server-action ID ownership checks.** Mutating actions (e.g.
  `uploadDocument`, `uploadCustomSetPiece`) still trust a client-supplied
  `productionId`. A broad ownership-check sweep is **deferred** — the
  signed-URL read leaks were the high-value fix. (extends into P6)
- [ ] **Storage RLS (defense-in-depth).** Current `attachments` bucket
  policies let any authenticated user read/write/delete any file. The
  signed-URL fix above is the real gate; scoping `storage.objects` RLS by
  path is harder and lower priority — **deferred**, does not block beta.

---

## P1 — Deploy the testing site to Vercel — DONE (2026-05-22)

The app is live at **`call-board.vercel.app`**, running against the
`CallBoard` Supabase project. Smoke test passed: create production, upload
documents (incl. an 8 MB script — proving the D4 Vercel-bypass), create and
view rehearsal reports.

- [x] **Beta Supabase project** — reuse the current `CallBoard` project (D3).
- [x] **Upload rework (D4).** The three upload flows (documents, report
  attachments, blocking set pieces) upload **client-direct to Supabase
  Storage** via server-issued signed upload URLs — verified live with an
  8 MB file.
- [x] Vercel project created, GitHub repo linked, production branch set to
  `claude/soft-launch-readiness-pmxel`.
- [x] Vercel environment variables set (Supabase keys, `DATABASE_URL`,
  `NEXT_PUBLIC_SITE_URL`, Resend).
- [x] Production build verified on Vercel; the deployed site loads.
- [x] Smoke test passed (productions, uploads, reports).
- [x] Storage bucket — the `attachments` bucket has no file-size limit set,
  so it already accepts up to the plan maximum; the "raise to 50 MB" step is
  moot.
- [x] **Supabase Auth → URL Configuration** — Site URL + Redirect URLs set
  to `call-board.vercel.app` so password-reset and email links resolve.

**Issues shaken out during deploy (all environment, not app bugs):**
1. **Vercel Deployment Protection** was on — it gated the whole site behind
   a Vercel login; disabled it.
2. **Stale deployment** — Vercel had built a commit predating D4, so large
   uploads still failed; forced a redeploy of branch HEAD.
3. **`isomorphic-dompurify` crashed server-side** — its jsdom dependency
   fails in the Vercel runtime; swapped to `sanitize-html` (see decision
   log, 2026-05-22).

**Deployment workflow going forward.** `main` is the Vercel production
branch — every merge into `main` auto-deploys to `call-board.vercel.app`.
Feature work happens on per-session branches; Vercel auto-deploys each
branch to its own preview URL with no setup, and merging the branch into
`main` ships it live. (During the initial P1 deploy the production branch
was temporarily pointed at the `claude/soft-launch-readiness-pmxel` branch
to get the site up before merging; it returns to `main` once that branch is
merged.)

**Why the upload rework (Decision D4, locked).** Uploads currently POST
the file *through* a Next.js server action. Vercel's serverless functions
reject any request body over ~4.5 MB — on **every** Vercel plan; it is an
infrastructure limit, not a billing tier — so large uploads (e.g. script
PDFs) would fail in production even though they work locally. Routing the
file directly from the browser to Supabase Storage removes Vercel from the
path entirely; it is also faster and cheaper, and is the standard
production pattern. The size cap then becomes the Supabase bucket setting
(50 MB on the free plan; higher requires Supabase Pro — see Scaling notes).

**Note — email during beta.** Resend's sandbox sender
(`onboarding@resend.dev`) only delivers to your own Resend account
address, and Supabase's built-in invite email is rate-limited to a few per
hour. So **report emails and invite emails will not reach real testers**
until a sending domain is verified. See **Decision D2**.

---

## P2 — Mobile web experience + PWA

This is the real work behind "an app that mirrors the mobile site." The
app must be *good on a phone browser* before either a PWA or a native
wrapper is worth shipping. See the **Mobile app feasibility** section
below for the full picture.

- [x] **Mobile navigation — done 2026-05-22 (revised to bottom tabs).** The
  rail used to collapse to a cramped 64px icon strip at all widths below
  1100px. A slide-in drawer landed first (2026-05-22 morning), then was
  superseded the same day after reviewing the Claude-design mobile demo:
  primary nav at ≤720px is now a **5-tab bottom bar** (Today / Calendar /
  Reports / Notes / More) — `components/app-shell/mobile-tab-bar.tsx`,
  context-aware (inside `/productions/[slug]/...` the tabs scope to that
  production's sub-routes; outside they go to the workspace equivalents).
  The desktop rail is hidden at phone widths and a new `/more` page hosts
  the destinations that fall off the tab bar (Productions, People,
  Documents, Announcements, Activity, Settings, Sign out). The 64px icon
  strip is retained for tablet widths (721–1100px). — **M**
- [x] **Responsive audit — done 2026-05-24.** Eight slices walked the
  per-screen mobile pass, each guided by the Claude-design mobile demo
  in `design-reference/`. All landed as new mobile-only renders or
  CSS-only column collapses, gated at ≤720px; desktop layouts are
  untouched. Highlights:
  - Production tab strip is a contained horizontal scroller.
  - Today/Dashboard: new `mobile-today-hero.tsx` (greeting + next-call
    card + 2×2 stats).
  - Reports list + detail: new `mobile-reports-list.tsx` +
    `mobile-report-detail.tsx` (date strip + status pill + stacked
    sections, no tabs on phone).
  - Calendar: bottom-sheet event drawer, month view shows pip dots
    instead of chips, new `day-sheet.tsx`, toolbar compaction.
  - Workspace `/notes` feed across all productions plus list↔editor
    swap in the per-production panel.
  - Script viewer: tool sidebar hidden, right panel stacks below the
    PDF, PDF is CSS-scaled to viewport width, floating bookmarks
    button opens a bottom sheet.
  - Blocking: 3-column editor stacks vertically; landscape rule hides
    side panels so the PDF fills the viewport.
  - Documents folder rail collapses to a horizontal pill strip;
    `/people` table now scrolls horizontally inside its wrapper.
  - Production calendar unified with `/calendar` so production and
    workspace use the same calendar UI (just data-filtered).
  - Workspace dashboard/calendar/notes routes for the bottom-tab
    targets.
- [ ] **Touch interactions.** @dnd-kit drag, PDF annotation drawing, and
  the set-piece rotation handle are mouse-built — test and fix for
  touch. — **M**
  - *Interim 2026-05-22:* the blocking canvas and the script editor are
    now **view-only on phones** (≤720px) — editing is disabled rather than
    broken. Full touch editing (the goal is at least tablet parity for
    blocking) is still the open work here.
- [x] **PWA manifest — done 2026-05-22.** Added `app/manifest.ts`
  (standalone display, `/dashboard` start URL, theatre-cream theme color),
  SVG app icons (`public/icon.svg` + a maskable variant), a generated PNG
  `apple-touch-icon` via `app/apple-icon.tsx` (`next/og` `ImageResponse`),
  and `themeColor` / `appleWebApp` metadata in the root layout. No new
  dependency. — **M**
- [ ] **PWA offline support (optional).** A service worker for offline /
  caching would need a library — see **Decision D7**. — **M**
- [x] Verify "Add to Home Screen" on iOS Safari and Android Chrome. (Verified on iPhone 2026-05-28.)

**Done so far (2026-05-22 → 05-27):** bottom-tab mobile nav, PWA
manifest, all 8 slices of the per-screen responsive audit, view-only
phone mode for the blocking canvas + script editor, the Today-tab
fix to always return to the workspace dashboard, and the 2026-05-27
blocking-mobile follow-up (ground plan rasterized at setup so the
blocking canvas renders an `<img>` instead of pdf.js — fixes iOS
Safari OOM and speeds desktop loads; mobile beat nav with swipe;
smaller on-canvas tokens; toolbar layout-shift fix; auto-seed first
scene/beat so editors land on a usable canvas). Add-to-Home-Screen
verified on iPhone 2026-05-28. **Still open before P3 close:** real
touch-editing support (blocking/script — the goal is at least tablet
parity for blocking), the iOS post-auth zoom reset (parked — see
`open-questions.md → Mobile / iOS questions`), and the deferred
polish items noted in `current-status.md` (production-view chrome
cleanup, formal `/notifications` inbox, broader production-context
nav review). User testing in P3 will surface the next round of
styling/UX adjustments.

Result: testers can install Proscene to their home screen and use it
like an app — the free interim "app" while the native wrapper waits for
P5.

---

## P3 — Beta testing program (the soft launch)

- [x] **Email + custom domain infrastructure (2026-05-27).** `proscene.app`
  registered at Namecheap; Resend domain verified (SPF + DKIM + MX on
  `send.proscene.app`); Supabase custom SMTP wired (host `smtp.resend.com`,
  port 465, sender `noreply@proscene.app`); Site URL + redirect-URL
  allowlist updated; Vercel custom domain live (apex A record + `www`
  CNAME, certs auto-provisioned). Smoke test: Supabase Dashboard → Send
  Magic Link delivered an email from `noreply@proscene.app` with a link
  resolving to `https://proscene.app/...`. The Vercel auto-URL
  `call-board.vercel.app` is kept as a fallback. See `current-status.md`
  and `decision-log.md` (2026-05-27).
- [ ] Confirm the beta org model — see **Decision D5**. The MVP is
  single-org: the first signup becomes admin, everyone else joins the
  same workspace as `cast`. This shapes who you can recruit.
- [ ] Write short tester onboarding instructions (how to sign up, what to
  try, known limitations).
- [ ] Set up a feedback channel (a form, an email alias, or GitHub
  issues). Quickest path now that the sending domain is verified:
  forward `feedback@proscene.app` to a personal inbox via ImprovMX (free,
  ~5 min, coexists with the Resend `send.` MX record because the hosts
  differ).
- [x] **Verify invite flow end-to-end against the live deploy
  (2026-05-28).** Invite from Settings → People → Proscene-branded
  email arrives from `noreply@proscene.app` → `/auth/confirm` (the
  scanner-safe two-step confirm page added in PR #14) → `/invite/accept`
  (welcome with inviter + org name, set password) → signed in at
  `/dashboard`, profile auto-promoted from `invited` to `active`.
  Required two follow-up PRs after the first failed test: PR #13
  added the dedicated `/invite/accept` landing + invite metadata;
  PR #14 added `/auth/confirm` to fix Gmail's link-scanner burning
  the single-use OTP before the human could click. The Supabase
  "Invite user" email template body is custom — see
  `current-status.md` 2026-05-28 entry for the template and the
  required `href`.
- [ ] **Verify the app's `/forgot-password` flow end-to-end** — the
  Supabase Dashboard magic link works, but `/forgot-password` uses a
  different code path (the app reads `NEXT_PUBLIC_SITE_URL` for the
  `redirectTo`). Confirm against the live deploy.
- [ ] **Verify a rehearsal-report email** sends from
  `noreply@proscene.app` and renders correctly in Gmail / Outlook / iOS
  Mail.
- [ ] Establish a bug-triage cadence; feed fixes back through P0-style
  hardening and normal feature work.

---

## P4 — Marketing / landing site + auth wiring

You build the marketing/landing site (pricing, product info). It stays
**separate** from the app — auth lives entirely in the Proscene app.

**Connection model (recommended, lowest-risk):** the marketing site's
CTAs ("Get started", "Sign up", "Log in") are plain links to the app —
`https://<app-url>/signup` and `/login`. No shared code, no embedded
auth forms, no Supabase keys on the marketing site.

- [ ] Build the marketing site (static site / Framer / Webflow / a
  separate small Next project — your call). — You
- [ ] Point its CTAs at the app's `/signup` and `/login` routes. During
  beta that is the `*.vercel.app` URL; post-domain it becomes
  `proscene.app` (e.g. `https://proscene.app/signup`). — You
- [ ] Claude wires the app side: confirm `NEXT_PUBLIC_SITE_URL`, the
  Supabase redirect-URL allowlist, and an optional post-signup redirect
  back to a chosen page. — **S**, Claude
- [ ] Domain plan (P6): the product lives at `proscene.app`. If a
  separate marketing site is wanted, decide whether it lives on a
  different domain or on a path of `proscene.app` (e.g. `/` for marketing
  and `/app` or a subdomain `app.proscene.app` for the product). The
  earlier `callboard.com` / `app.callboard.com` split is obsolete.

**Pricing.** A pricing *page* is just content and you can build it now.
**Paid plans / plan gating need a billing integration (e.g. Stripe)** —
that is a separate post-launch feature, not built and not in current
scope. During beta, present pricing as informational or "coming soon."

**Avoid:** embedding the Supabase signup form into the marketing site —
it would require the Supabase client and keys there and duplicate the
auth UI. Just link to the app.

---

## P5 — Native app wrapper (App Store / Play Store)

After beta, wrap the deployed PWA in a native shell with **Capacitor**.
Capacitor loads the live site in a native WebView and produces real iOS
and Android apps — the app literally mirrors the site, with no second
codebase. See the feasibility section below.

- [ ] Add Capacitor; configure the iOS and Android projects. — **M**
- [ ] App icons, splash screens, point the wrapper at the production
  URL. — **S**
- [ ] Handle deep links so the auth callback returns into the app. — **M**
- [ ] Add at least one genuine native capability (push notifications is
  the natural choice) so the app is not a bare website wrapper — this
  also helps App Store review pass. — **M/L**
- [ ] Build and submit to the App Store and Play Store. — **L**

**Accounts needed:** Apple Developer (~$99/yr), Google Play (one-time
$25), plus Xcode (macOS) and Android Studio for builds.

---

## P6 — Pre-public-launch hardening

- [ ] Register the real domain; move the app and marketing site to
  subdomains; update `NEXT_PUBLIC_SITE_URL` and the Supabase redirect
  allowlist.
- [ ] Verify a sending domain on Resend; set `RESEND_FROM_EMAIL`;
  configure Supabase custom SMTP (Resend SMTP) so invite emails scale
  past the built-in rate limit.
- [ ] Enable leaked-password protection (HaveIBeenPwned check) in Supabase
  Auth — available once the project is on the Pro plan (deferred from P0).
- [ ] Resolve the production Supabase project (keep the beta project or
  cut a fresh one — see D3) and adopt proper SQL migration files
  (`drizzle-kit push` is effectively retired on this project).
- [ ] Add automated tests for critical flows — auth, production CRUD,
  uploads, permission gating (e.g. Playwright; new dependency, needs
  approval).
- [ ] Fix the known TipTap bullet-point bug (Tailwind prose reset).
- [ ] Finish the 4 unported shadcn forms + the Calls page wrapper
  (`ui-port-roadmap.md`, items 1–2).
- [ ] Resolve scaffolded-feature scope — see **Decision D6**.
- [ ] Full browser verification of every screen against the live project
  (the UI port was only build/type-checked).

---

## Decisions needed

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Sanitization library for the XSS fix (P0). | **Resolved** — sanitization centralised in `lib/sanitize.ts`. Started on `isomorphic-dompurify` (2026-05-21); swapped to `sanitize-html` 2026-05-22 after jsdom crashed in the Vercel server runtime. See decision log. |
| **D2** | Email deliverability during beta. Sandbox email won't reach external testers. | **Fully resolved 2026-05-27** — `proscene.app` registered at Namecheap, Resend sending domain verified (SPF + DKIM + `send` MX), Supabase custom SMTP wired (`smtp.resend.com:465`, sender `noreply@proscene.app`), Supabase Site URL + redirect allowlist updated, Vercel env vars set. Smoke test (Supabase Dashboard magic link) delivered. P3 application-flow tests are unblocked. |
| **D3** | Which Supabase project is the beta environment. | Reuse the current `CallBoard` project as the beta environment; cut a fresh production project at P6 if a clean slate is wanted. |
| **D4** | File uploads on Vercel. Server-action uploads fail above ~4.5 MB on every Vercel plan. | **Resolved 2026-05-21** — switch to client-direct Supabase Storage uploads via server-issued signed upload URLs; the file never touches Vercel. Raise the bucket limit to 50 MB (free-plan max); files beyond 50 MB require Supabase Pro. |
| **D5** | Beta org model. Single-org MVP: all testers share one workspace. | For beta, recruit a single theatre company (one shared workspace). Multi-org is a larger project — defer. |
| **D6** | Scaffolded features (Activity log, document comments, AI script analysis). | Cut from v1 — ship as "coming soon" or remove the placeholders. |
| **D7** | PWA offline support. | Ship a basic installable PWA now (no library); revisit a service worker only if testers ask for offline. |

---

## Scaling notes (post-launch)

### Storage is shared across the whole app, not per org

Supabase's storage allotment (1 GB on free, 100 GB included on Pro) is
**one number for the entire project** — every org's files draw from the
same pool. Supabase has no concept of the app's "organizations"; that is
purely an application-level idea.

100 GB is **not a hard wall.** On Pro, storage beyond the included 100 GB
is billed per GB used (~$0.02/GB/month) — the app keeps working, the bill
just grows. Early growth is absorbed automatically.

How storage scales as the app grows:

1. **Pro plan + overage** carries the first phase — pay only for usage
   above the included 100 GB.
2. **Per-org storage metering** — track each org's usage in the database
   and enforce plan-based quotas (e.g. free org 1 GB, paid tiers higher).
   This is the same project as adding paid billing — storage limits
   become a plan feature. Build it *with* paid plans, not before.
3. **Lifecycle policies** — archive or purge files from long-finished
   productions so old shows do not occupy storage forever.
4. **Dedicated storage (far future, large scale only)** — Supabase
   Storage is S3-compatible and can point at external object storage / a
   CDN if storage ever dwarfs everything else.

Do not build any of this now. The path is: Pro plan absorbs early growth,
then per-org metering arrives alongside paid plans.

---

## Mobile app feasibility — "how possible is that?"

Very possible, and inexpensive — **specifically because the goal is to
mirror the mobile site** rather than build a separate native product.
There are two layers:

1. **PWA (now, free).** The existing site becomes installable — home
   screen icon, full-screen, no browser chrome. It needs a web manifest
   and icons, not a rewrite. Works on iOS and Android. It is not in the
   app stores. This is P2.

2. **Native wrapper (post-beta).** Capacitor wraps the deployed site in a
   native WebView and produces real iOS/Android apps you submit to the
   App Store and Play Store. Because it loads the same live site, there
   is **no second codebase** — every web update ships to the app
   instantly. Many production apps work exactly this way. This is P5.

**On "most professional":** an App Store / Play Store listing reads as
the most professional, and the Capacitor wrapper gets you there without
building a separate native app. The honest tradeoff: a WebView wrapper
feels slightly less "native" than a true native app, and Apple can reject
apps that are *only* a thin website wrapper — which is why P5 includes
adding a real native capability (push notifications) and why P2 (a
genuinely good mobile web experience) comes first. Do P2 well and P5 is
mostly configuration.

**Not recommended:** a full native rewrite in React Native / Swift /
Kotlin. That is a second codebase to maintain forever, for a product
whose entire value is the shared web workspace.

Sequencing: **P2 (good mobile web + PWA) → beta → P5 (Capacitor wrapper +
store submission).** The free PWA covers the "app" need during beta; the
store apps follow once the product is stable.
