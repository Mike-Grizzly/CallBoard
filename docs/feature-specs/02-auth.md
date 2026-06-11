# Step 2: Authentication

## Purpose
Wire up Supabase email/password authentication with signup, login, logout, password reset, email verification, and route protection.

## User story
As a theatre company member, I can create an account, log in, reset my password, and be redirected away from protected pages when not authenticated.

## Status: IMPLEMENTED
- Password reset flow exists in code but was not fully tested due to Supabase email rate limits during development. Needs verification.
- Social sign-in (Google) added. App side is complete; requires the Google
  provider to be enabled in the Supabase dashboard (Authentication →
  Providers) before the button works. Apple is intentionally held off (needs
  a paid Apple Developer membership) — see "Social sign-in" below.

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
  PKCE code for a session — no callback changes were needed.
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
  redirect URI in the Google Cloud Console, and ensure the app's
  `${NEXT_PUBLIC_SITE_URL}/auth/callback` is in Supabase's allowed redirect
  URLs.

## Server actions (`app/actions/auth.ts`)
- `login()` — email/password sign in
- `signInWithOAuth()` — starts Google OAuth (redirects to provider)
- `signup()` — creates account, stores first_name/last_name/requested_role in user metadata
- `resendVerification()` — resend signup confirmation email
- `requestPasswordReset()` — sends reset email
- `updatePassword()` — validates and updates password
- `logout()` — signs out and redirects to /login

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

## Architecture notes to preserve
- Three Supabase client factories: server (async cookies), browser (public keys), proxy (NextRequest/NextResponse)
- `proxy.ts` is the Next.js 16 equivalent of `middleware.ts` — do not create a middleware.ts
- Auto-sync in `getCurrentUser()` is the only place profiles and org memberships are created
- User metadata (first_name, last_name, requested_role) is set during signup and read during profile creation
