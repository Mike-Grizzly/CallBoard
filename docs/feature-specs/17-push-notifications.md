# Feature Spec: Web Push Notifications (PWA)

## Purpose

Deliver phone/desktop push notifications to the installed PWA, so users get
alerted the instant an announcement is posted — even when Proscene is closed.
This fills the `push` channel that was previously modeled but inert (see
`08-announcements.md` and the 2026-06-03 notifications work).

## User story

- As a cast member with Proscene on my iPhone Home Screen, I enable push in
  Settings → Notifications and get a lock-screen alert when a director posts an
  announcement to my show.
- As a user on several devices, I enable push on each one independently.

## Status

**Implemented** — not yet browser-verified end to end on a real device.

## Approach

Standard Web Push (VAPID + service worker), chosen over a native wrapper for
Phase 1: it is fully additive, deploys through Vercel like the rest of the app,
and needs no app stores or Apple Developer account. A future Capacitor wrapper
reuses everything here (the `push_subscriptions` table and `sendPushToUsers`
helper) and only swaps the delivery channel to APNs/FCM. See
`docs/open-questions.md` → Notifications.

## Data model

### `push_subscriptions` table (`db/schema/push-subscriptions.ts`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles (cascade) |
| `endpoint` | text | Push-service URL for one device. Treated as a credential. |
| `p256dh` | text | Client public key for payload encryption |
| `auth` | text | Client auth secret for payload encryption |
| `user_agent` | text (nullable) | For humans to recognize a device |
| `created_at` | timestamptz | — |

One row per device. `endpoint` uniqueness is enforced in app code
(delete-then-insert), not a DB constraint — see the CLAUDE.md note about unique
constraints hanging `drizzle-kit push`.

The `notification_preferences.push` flag (existing) gates whether a user is in
the push fan-out. It is driven entirely by the subscribe/unsubscribe flow, NOT
the channel-preferences form (which now only writes in-app/email).

## Files

| File | Type | Purpose |
|------|------|---------|
| `db/schema/push-subscriptions.ts` | Schema | New table |
| `features/push/send.ts` | Server | `sendPushToUsers(userIds, payload)` — VAPID config, encrypted send, prunes dead (404/410) subs. Best-effort. |
| `features/push/actions.ts` | Server actions | `savePushSubscription`, `deletePushSubscription` (keep `push` pref in sync) |
| `public/sw.js` | Service worker | Handles `push` (show notification) + `notificationclick` (focus/open URL) |
| `app/(app)/(default)/settings/notifications/push-toggle.tsx` | Client | Per-device enable/disable: registers SW, requests permission, subscribes |
| `features/notifications/announce.ts` | Server | Fan-out now sends push to recipients with `prefs.push` |
| `app/(app)/(default)/settings/notifications/page.tsx` | Server | Renders `<PushToggle />` |
| `app/(app)/(default)/settings/notifications/notification-preferences-form.tsx` | Client | Push toggle removed (now device-managed) |

## Security

- **VAPID private key is server-only** (`VAPID_PRIVATE_KEY`). Only the public
  key is exposed to the browser (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
- **`push_subscriptions` is sensitive** — an endpoint is a capability. The table
  follows the project convention: **RLS enabled, no policies**, all access via
  the Drizzle pooler role through server actions. No client `supabase.from()`.
- Server actions call `requireCurrentUser()`; users can only delete their own
  subscriptions. The send path lives inside the already-permission-gated
  announcement fan-out — no new public endpoints.
- Push is best-effort: `sendPushToUsers` swallows its own errors so a dead
  device never fails announcement creation (mirrors the email path).

## Deployment / setup steps (REQUIRED — not automated)

1. **Generate a VAPID keypair once** (reuse forever; rotating invalidates all
   existing subscriptions): `npx web-push generate-vapid-keys`.
2. **Add three env vars** to Vercel (Production AND Preview) and local
   `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT` (a `mailto:` or site URL). See `.env.example`.
3. **Create the table via the Supabase SQL editor / MCP** — NOT `npm run
   db:push`, which is retired on this project (it crashes introspecting CHECK
   constraints; see current-status "Known limitations"). Keep `db/schema/*` in
   sync by hand (already done). Run:
   ```sql
   CREATE TABLE IF NOT EXISTS public.push_subscriptions (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
     endpoint    text NOT NULL,
     p256dh      text NOT NULL,
     auth        text NOT NULL,
     user_agent  text,
     created_at  timestamptz NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
     ON public.push_subscriptions(user_id);

   -- RLS on, no policies: the app uses the pooler role (bypasses RLS) while the
   -- anon/authenticated PostgREST roles are denied — matches every other table.
   ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
   ```

## Manual test checklist

- [ ] `push_subscriptions` table created via SQL editor/MCP; RLS enabled
- [ ] Settings → Notifications shows the "Push notifications" card
- [ ] On an installed PWA, "Enable on this device" prompts for permission and
      flips to "Push is on for this device."
- [ ] `notification_preferences.push` becomes true after enabling
- [ ] A second account posts an announcement → a notification arrives on the
      enabled device with the app closed
- [ ] Tapping the notification opens the announcement
- [ ] Saving in-app/email preferences does NOT turn push off
- [ ] "Turn off" unsubscribes the device and (if it was the last) clears the
      push pref
- [ ] Non-PWA / unsupported browser shows the explanatory message rather than a
      broken button

## Open questions

- Only announcements push today. Mentions and rehearsal-report notifications go
  through a separate path (`mentions` table) and could call `sendPushToUsers`
  too — wire up if desired.
- No per-device labels/management UI beyond the current device. A "your devices"
  list could be added if users accumulate stale subscriptions.
- iOS requires the PWA be added to the Home Screen before Web Push works at all
  — acceptable for Phase 1; revisit with Capacitor if reliability demands it.
