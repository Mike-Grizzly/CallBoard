# Launch Roadmap — CallBoard

**Created:** 2026-05-21
**Status:** Active — this is the working plan to take CallBoard from a
feature-complete MVP to a soft launch with invited testers, and on to a
public launch.

## How to read this

CallBoard is feature-rich — 16 build steps are implemented (see
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
- **Domain:** free platform URLs (`*.vercel.app`) during beta; register a
  real domain before the public launch.

### Decisions — see the Decisions section

Still open: D3 beta Supabase project · D5 beta org model · D6
scaffolded-feature scope · D7 PWA offline support.

Resolved 2026-05-21: **D1** (added `isomorphic-dompurify`) · **D2** (domain
being registered) · **D4** (uploads go client-direct to Supabase Storage).

## Phase overview

| Phase | Goal | Gates | Owner |
|---|---|---|---|
| **P0** | Security hardening — **done 2026-05-21** | Soft launch | Claude |
| **P1** | Deploy testing site to Vercel | Soft launch | Shared |
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
- [ ] **Password strength (free substitute for leaked-password
  protection).** Leaked-password protection (HaveIBeenPwned check) is a
  Supabase **Pro-plan** feature — decision 2026-05-21: skip it for the
  closed beta, re-enable at P6 when the project moves to Pro. Interim:
  set Password Requirements (minimum length 8+, character mix) under
  Authentication → Sign In/Providers → Email — free on every plan. — **S**, You
- [ ] **Server-action ID ownership checks.** Mutating actions (e.g.
  `uploadDocument`, `uploadCustomSetPiece`) still trust a client-supplied
  `productionId`. A broad ownership-check sweep is **deferred** — the
  signed-URL read leaks were the high-value fix. (extends into P6)
- [ ] **Storage RLS (defense-in-depth).** Current `attachments` bucket
  policies let any authenticated user read/write/delete any file. The
  signed-URL fix above is the real gate; scoping `storage.objects` RLS by
  path is harder and lower priority — **deferred**, does not block beta.

---

## P1 — Deploy the testing site to Vercel

Goal: a live `*.vercel.app` URL running the real app against a real
Supabase project. This is the first time the app is built and run for
real — the dev container has no `DATABASE_URL`, so the production build
is unverified.

- [ ] Create the Vercel project, link the GitHub repo, set the production
  branch. — Shared
- [ ] Choose the beta Supabase project — see **Decision D3**.
- [ ] Set Vercel environment variables: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` (the `*.vercel.app` URL),
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. — Shared
- [ ] In Supabase → Auth → URL Configuration, add the deployed URL as the
  Site URL and to the Redirect URLs allowlist, so `/auth/callback`,
  password reset, and invite links resolve. — You
- [ ] Verify the production build succeeds and the deployed site loads. — Claude
- [ ] Rework the three upload flows (documents, report attachments,
  blocking set pieces) to **client-direct Supabase Storage uploads**: the
  server action checks permissions and issues a one-time signed upload
  URL, the browser sends the file straight to Supabase, then a server
  action records only the metadata. — Claude, **M/L**
- [ ] Raise the `attachments` bucket file-size limit 25 MB → 50 MB
  (Supabase free-plan maximum). — **S**, You
- [ ] Smoke test on the deployed site: signup → first user becomes admin
  → create a production → upload a file → file a rehearsal report. — Shared

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

- [ ] **Mobile navigation.** The sidebar rail is simply hidden on mobile
  with no replacement — there is currently no way to navigate on a phone.
  Add a mobile drawer / bottom nav. — **M**
- [ ] **Responsive audit.** Walk every screen at phone widths. The
  blocking canvas and script editor need the most attention. — **L**
- [ ] **Touch interactions.** @dnd-kit drag, PDF annotation drawing, and
  the set-piece rotation handle are mouse-built — test and fix for
  touch. — **M**
- [ ] **PWA manifest.** Add `manifest.webmanifest`, app icons, an
  `apple-touch-icon`, and theme-color meta. A basic installable PWA needs
  **no new dependency**. — **M**
- [ ] **PWA offline support (optional).** A service worker for offline /
  caching would need a library — see **Decision D7**. — **M**
- [ ] Verify "Add to Home Screen" on iOS Safari and Android Chrome. — **S**

Result: testers can install CallBoard to their home screen and use it
like an app — the free interim "app" while the native wrapper waits for
P5.

---

## P3 — Beta testing program (the soft launch)

- [ ] Confirm the beta org model — see **Decision D5**. The MVP is
  single-org: the first signup becomes admin, everyone else joins the
  same workspace as `cast`. This shapes who you can recruit.
- [ ] Write short tester onboarding instructions (how to sign up, what to
  try, known limitations).
- [ ] Set up a feedback channel (a form, an email alias, or GitHub
  issues).
- [ ] Test the invite flow end-to-end against the live project — depends
  on email working (**D2**): invite → email → `/auth/callback` →
  `/reset-password` → `invited` promoted to `active`.
- [ ] Establish a bug-triage cadence; feed fixes back through P0-style
  hardening and normal feature work.
- [ ] Verify password reset end-to-end (never fully tested — Supabase
  email rate limits during dev).

---

## P4 — Marketing / landing site + auth wiring

You build the marketing/landing site (pricing, product info). It stays
**separate** from the app — auth lives entirely in the CallBoard app.

**Connection model (recommended, lowest-risk):** the marketing site's
CTAs ("Get started", "Sign up", "Log in") are plain links to the app —
`https://<app-url>/signup` and `/login`. No shared code, no embedded
auth forms, no Supabase keys on the marketing site.

- [ ] Build the marketing site (static site / Framer / Webflow / a
  separate small Next project — your call). — You
- [ ] Point its CTAs at the app's `/signup` and `/login` routes. During
  beta that is the `*.vercel.app` URL; post-domain it becomes
  `app.callboard.com`. — You
- [ ] Claude wires the app side: confirm `NEXT_PUBLIC_SITE_URL`, the
  Supabase redirect-URL allowlist, and an optional post-signup redirect
  back to a chosen page. — **S**, Claude
- [ ] Subdomain plan (once a domain exists, P6): `callboard.com` =
  marketing, `app.callboard.com` = the product.

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
| **D1** | Sanitization library for the XSS fix (P0). | **Resolved 2026-05-21** — added `isomorphic-dompurify`; sanitization centralised in `lib/sanitize.ts`. |
| **D2** | Email deliverability during beta. Sandbox email won't reach external testers. | **Resolved 2026-05-21** — domain being registered, so a Resend sending domain + Supabase custom SMTP can be set up. Unblocks report and invite emails to real testers. |
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
