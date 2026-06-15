# Step 2: Authentication

## Purpose
Wire up Supabase email/password authentication with signup, login, logout, password reset, email verification, and route protection.

## User story
As a theatre company member, I can create an account, log in, reset my password, and be redirected away from protected pages when not authenticated.

## Status: IMPLEMENTED
- Password reset flow exists in code but was not fully tested due to Supabase email rate limits during development. Needs verification.
- Social sign-in (Google) — **LIVE and verified working in production**
  (`www.proscene.app`), merged to `main` via PR #41. The Google provider is
  enabled in the Supabase dashboard. Apple is intentionally held off (needs a
  paid Apple Developer membership) — see "Social sign-in" below.

## Data model
- `profiles` — auto-created on first login from Supabase auth user (id, email, firstName, lastName, requestedRole)
- `organization_memberships` — auto-created with role assignment (first user = admin, others = cast)

## Routes/pages
- `/signup` — signup form (first name, last name, email, password, position picker)
- `/signup/confirm` — email verification confirmation with resend button
- `/login` — login form (email, password)
- `/forgot-password` — password reset request form
- `/forgot-password/confirm` — check-your-email confirmation
- `/reset-password` — new password form
- `/auth/callback` — Supabase auth callback (PKCE code exchange + implicit token_hash)

## Components
- `app/signup/signup-form.tsx` — client form with name, email, password, position dropdown
- `app/login/login-form.tsx` — client form with email, password
- `app/forgot-password/forgot-password-form.tsx` — client form with email
- `app/reset-password/reset-password-form.tsx` — client form with password + confirm
- `app/signup/confirm/resend-form.tsx` — resend verification email

## Social sign-in (Google)
- `signInWithOAuth()` server action (`app/actions/auth.ts`) asks Supabase for
  the provider's authorization URL and redirects the browser to it. The
  provider returns the user to `/auth/callback`, which already exchanges the
  PKCE code for a session — no callback changes were needed. The `redirectTo`
  origin is derived from the **request headers** (`requestOrigin()`), not a
  fixed `NEXT_PUBLIC_SITE_URL`, so the provider returns the user to the same
  domain they started on (localhost / Vercel preview / production) — required
  because the PKCE code-verifier cookie is domain-scoped.
- `components/auth/oauth-buttons.tsx` renders the Google button on both
  `/login` and `/signup` (Supabase resolves an existing user to a sign-in and
  a new one to a signup, so the same button serves both).
- OAuth users have no `first_name`/`last_name` metadata, so
  `lib/auth.ts → deriveName()` falls back to Google's `given_name`/`family_name`
  or splits a `full_name`/`name`. Profile + org creation is otherwise identical
  to email/password signup.
- **Apple held off:** the wiring is provider-agnostic — re-enable it by adding
  `"apple"` to `OAUTH_PROVIDERS` (`app/actions/auth.ts`) and a second button in
  `oauth-buttons.tsx`. Deferred because Apple Sign In requires a paid Apple
  Developer Program membership.
- **Dashboard setup required (one-time):** In Supabase → Authentication →
  Providers, enable Google and supply the Google OAuth client ID/secret. Add
  `https://avqgfzrcwegebtbvmcwo.supabase.co/auth/v1/callback` as an authorized
  redirect URI in the Google Cloud Console. In Supabase → Authentication → URL
  Configuration, add every origin's `/auth/callback` to **Redirect URLs**
  (`http://localhost:3000/auth/callback`, the production callback, and a
  preview wildcard like `https://*.vercel.app/auth/callback`). **This is
  mandatory:** Supabase silently falls back to the **Site URL** (the homepage)
  for any `redirectTo` that isn't allow-listed — the symptom is "OAuth lands on
  the homepage instead of /dashboard".

## OAuth troubleshooting (lessons from the initial rollout)
The Google flow worked end-to-end once these were understood — keep them in
mind before re-debugging:
- **Read the Supabase auth logs** (Authentication → Logs, or MCP `get_logs`
  service `auth`). The healthy sequence is `GET /authorize → GET /callback →
  POST /token (200) → app redirects to /dashboard`. A **successful `login`
  audit event but NO `POST /token`** means the browser was sent somewhere
  other than `/auth/callback`, so the code was never redeemed — i.e. the
  redirect fell back to the Site URL (homepage).
- **Test on the canonical production domain, not a preview.** The PKCE
  code-verifier cookie is domain-scoped: if you start the flow on a Vercel
  preview (`*.vercel.app`) but `redirectTo`/Site URL sends you to
  `www.proscene.app`, the cookie set on the preview isn't present on prod and
  the exchange fails. (The `requestOrigin()` change keeps the redirect on the
  starting domain, but the cleanest test is still prod-on-prod.)
- **apex vs www.** `proscene.app` and `www.proscene.app` are different cookie
  origins. The Supabase Site URL, `NEXT_PUBLIC_SITE_URL`, and the domain you
  actually visit should all be the **same** host (`www.proscene.app`). An
  apex→www redirect that drops the path will strip `/auth/callback?code=…` and
  dump the user on the homepage.
- **The feature only works where its code is deployed.** During rollout,
  production briefly ran a `main` build without the OAuth code, so the Google
  button "vanished" and the post-login redirect had nowhere to land. Ship to
  `main` and redeploy production before testing there. Env var changes
  (`NEXT_PUBLIC_SITE_URL`) require a fresh deploy to take effect.
- **Consent screen shows `…supabase.co`, not "Proscene" (cosmetic, deferred).**
  Setting the Google OAuth App name + logo does NOT override this on a Testing
  (unverified) app using Supabase's shared callback domain. The only reliable
  fix is the Supabase **Custom Domain** add-on (paid). Details + recommendation
  in `open-questions.md` → "Google consent screen shows `…supabase.co`".

## Server actions (`app/actions/auth.ts`)
- `login()` — email/password sign in
- `signInWithOAuth()` — starts Google OAuth (redirects to provider)
- `signup()` — creates account, stores first_name/last_name/requested_role in user metadata
- `resendVerification()` — resend signup confirmation email
- `requestPasswordReset()` — sends reset email
- `updatePassword()` — validates and updates password
- `logout()` — signs out and redirects to /login

## Invite / sign-in clarity (2026-06-15)
Two fixes for invited users getting stranded (beta feedback "issues signing in"):
- **Existing-account invites now notify.** A brand-new invitee gets Supabase's
  `inviteUserByEmail` email (set-password link → `/invite/accept`). But someone
  who *already* has a Proscene account is added to the org silently by
  `inviteMembers`' `"added"` branch. That branch now calls
  `sendOrgInviteNotification()` (`features/notifications/announce.ts`): an in-app
  notification (type `org_invite`, scoped to the new org for the cross-org
  switcher bubble) + a best-effort "you've been added to {org}" email, both
  respecting notification prefs. Best-effort — never fails the invite.
- **Signup "account exists" is now actionable.** `AuthResult` carries an optional
  `code: "account_exists"`; `signup()` sets it when Supabase reports an existing
  account (empty `identities[]`). `app/signup/signup-form.tsx` renders that case
  with "Were you invited? Check your email for the invite link" + **Sign in** /
  **Set / reset password** links instead of a dead-end sentence. This does NOT
  change Supabase's anti-enumeration behavior (we already disclosed "account
  exists"); the open-questions note about the reset screen not naming the invite
  stands.
- **Forgot-password confirm** (`app/forgot-password/confirm/page.tsx`) notes the
  reset link doubles as first-password setup for invited users.

### Invite hardening — self-service recovery (2026-06-15)
Closes the remaining "can't join" dead-ends for invitees (expired/used links,
no-password login):
- **Expired/used email links no longer dead-end.** `app/auth/callback/route.ts`
  and `app/auth/confirm/page.tsx` used to send *every* verification failure to
  `/login?error=auth_callback` — useless for an invitee with no password.
  Failures on **invite/recovery** links (detected by the `next` param —
  `/invite/accept` or `/reset-password`) now route to `/forgot-password?expired=1`;
  OAuth/other failures keep the login error.
- **`/forgot-password?expired=1`** shows a "Get a new link" banner explaining the
  link expired/was used and that a fresh one also sets a first password for
  invited users. Reuses the existing `requestPasswordReset` action — Supabase
  recovery works on unconfirmed invited accounts, so it's a universal
  self-service recovery path that doesn't depend on the original invite link
  still being alive.
- **Login dead-end (E).** A failed sign-in (`app/login/login-form.tsx`) now shows
  a "Were you invited, or never set a password? Set / reset it here" recovery
  link. Generic for all failures, so no account-enumeration change.

**Config the user owns (not code):**
- **Email-link expiry.** Bump Supabase → Authentication → Email → "Email OTP
  Expiration" so invite/recovery links don't lapse before people check mail.
  Tradeoff: the security advisor prefers short OTP expiry; the new self-service
  recovery above makes the exact TTL far less critical (a lapsed link is now
  recoverable in two clicks), so set it to taste.
- **Deliverability.** Invite emails are sent by Supabase Auth via the configured
  Resend SMTP. If invites aren't arriving: confirm SMTP is enabled in Supabase →
  Auth → SMTP, the `send.proscene.app` domain is verified in Resend, and check
  Supabase Auth logs for send failures.

**Future option (not built):** a passwordless "email me a sign-in link"
(`signInWithOtp`) on `/login` would make joining essentially failure-proof, at
the cost of a new action + UI. The forgot-password recovery path already gives
passwordless entry (link → set password → in), so this is deferred.

**Manual test steps (needs a live deploy — not sandbox-verifiable):**
1. Invite a brand-new email → it gets a Supabase invite email → click link →
   `/invite/accept` → set password → lands in app. (happy path unchanged)
2. Invite a brand-new email, then **don't** click the link — go to `/signup`
   and sign up with that email → see "account already exists" with Sign in /
   Set-reset password links → click "Set / reset password" → request link →
   email → set password → in.
3. Click an **expired** (or already-used) invite link → land on
   `/forgot-password?expired=1` with the "Get a new link" banner → request →
   fresh link → set password → in.
4. Invite an email that **already has an account** → invitee gets an in-app
   notification (org switcher bubble) + email "you've been added to {org}".
5. Try to **log in** as an invited-but-no-password user → "Invalid login
   credentials" → recovery link → forgot-password → in.

## Account settings (Settings → Account, 2026-06-15)
Self-serve account management in `features/account/actions.ts`:
- **`updateAccountProfile`** — name / phone / pronouns (existing).
- **`changePassword`** — verifies current password via a sign-in attempt, then
  `updateUser({password})` (existing). Note: only works for password accounts;
  an OAuth-only user has no current password.
- **`changeEmail`** — `updateUser({email}, {emailRedirectTo})`; Supabase emails a
  confirmation (and, with "Secure email change" on, also the old address) and
  flips the auth email only on confirm. `profiles.email` is **not** written here;
  `lib/auth.ts#getCurrentUser` reconciles it from the verified auth email on the
  next request (keyed on auth UID — never an email lookup, so it can't adopt
  another profile).
- **`signOutEverywhere`** — `signOut({scope:"global"})` revokes every session
  including the current one → `/login?signed_out=1`.
- **`deleteOwnAccount`** — type-your-email confirm (re-checked server-side).
  Removes the user's production + org memberships everywhere, soft-deletes any
  org left memberless, deletes the `profiles` row (cascades authored content,
  like `deletePerson`) and the Supabase auth user → `/login?deleted=1`.
  **Guarded**: refuses if the user is the only admin of an org that still has
  other members (hand off admin / delete that workspace first).
- **Time zone — intentionally not offered.** Call/rehearsal times are stored
  timezone-naive (`calls.callTime` is plain text) and shown as wall-clock time,
  which is the correct theatre model ("7 PM at the theatre"). A per-user tz
  override would misrepresent them. See `decision-log.md` (2026-06-15).

## Route protection (`proxy.ts`)
- Public routes: `/login`, `/signup`, `/auth/callback`, `/forgot-password`, `/reset-password`
- Unauthenticated users on protected routes → redirect to `/login` with `next` param
- Authenticated users on `/login` or `/signup` → redirect to `/dashboard`
- Session refresh on every navigation via `supabase.auth.getUser()`

## Auto-sync pattern (`lib/auth.ts`)
- `getCurrentUser()` fetches Supabase auth user
- If no profile exists in DB, creates one from auth metadata
- If no org membership exists, creates one (first user = admin, rest = cast)
- Returns `CurrentUser` with role and organizationId
- `requireCurrentUser()` wraps with redirect to `/login` if null

## Permissions
- No capability checks in auth itself — auth is the prerequisite for all other permission checks

## Edge cases
- Supabase rate-limits verification emails during development
- Auth callback handles both PKCE (code exchange) and implicit (token_hash) flows
- Cookie set errors are swallowed in server component rendering (Next.js restriction, handled in `lib/supabase/server.ts`)
- `proxy.ts` replaces `middleware.ts` — this is a Next.js 16 breaking change

## Manual test checklist
- [ ] Can create a new account with email/password
- [ ] Receive verification email and confirm
- [ ] Can log in with verified credentials
- [ ] Redirected to `/login` when accessing protected page while unauthenticated
- [ ] Redirected to `/dashboard` when accessing `/login` while authenticated
- [ ] Logout clears session and redirects to `/login`
- [ ] First user in org automatically gets admin role
- [ ] Second user gets cast role
- [ ] Requested role from signup appears in profile
- [ ] Password reset flow works end-to-end (NEEDS VERIFICATION)
- [x] Sign in with Google works end-to-end (verified in production, 2026-06-11)
- [ ] New Google user lands in an auto-created admin workspace with name from Google profile

## Architecture notes to preserve
- Three Supabase client factories: server (async cookies), browser (public keys), proxy (NextRequest/NextResponse)
- `proxy.ts` is the Next.js 16 equivalent of `middleware.ts` — do not create a middleware.ts
- Auto-sync in `getCurrentUser()` is the only place profiles and org memberships are created
- User metadata (first_name, last_name, requested_role) is set during signup and read during profile creation
