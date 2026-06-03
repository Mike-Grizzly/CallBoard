# Feature Spec: Announcements

## Purpose

A bulletin board for the company and individual productions. Lets authorized users post notices that are visible to everyone with access.

## User stories

- As a director, I want to post a notice about an upcoming production meeting so that my cast sees it on their production dashboard.
- As an admin, I want to post an org-wide update (e.g. studio closure) visible across all productions.
- As a cast member, I want to read announcements posted for my show without needing to check email.
- As an admin/producer, I want to pin important announcements so they always appear at the top.

## Status

**Implemented** — not fully verified in browser.

## Data model

### `announcements` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations (cascade) |
| `production_id` | uuid (nullable) | FK → productions (cascade); null = org-wide |
| `created_by` | uuid | FK → profiles (cascade) |
| `title` | text | Required |
| `body` | text | Rich text HTML, optional |
| `pinned` | boolean | Default false |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

## Routes / pages

| Route | Description |
|-------|-------------|
| `/announcements` | Global view — all announcements user can see; create org-wide |
| `/productions/[slug]/announcements` | Production-scoped view; create for this production |

## Components

| File | Type | Purpose |
|------|------|---------|
| `app/(app)/announcements/page.tsx` | Server | Global announcements page |
| `app/(app)/announcements/announcement-form.tsx` | Client | Org-wide create form |
| `app/(app)/announcements/announcement-delete-button.tsx` | Client | Delete button |
| `app/(app)/announcements/announcement-pin-button.tsx` | Client | Pin/unpin toggle |
| `app/(app)/productions/[slug]/announcements/page.tsx` | Server | Production announcements page |
| `app/(app)/productions/[slug]/announcements/announcement-form.tsx` | Client | Production create form |
| `app/(app)/productions/[slug]/announcements/announcement-delete-button.tsx` | Client | Delete button |
| `app/(app)/productions/[slug]/announcements/announcement-pin-button.tsx` | Client | Pin/unpin toggle |
| `features/announcements/queries.ts` | — | DB queries |
| `features/announcements/actions.ts` | Server actions | create, delete, togglePin |

## Permissions

| Action | Who |
|--------|-----|
| View announcements | All roles (`announcements:view`) |
| Create announcement | admin, producer, director (`announcements:create`) |
| Delete announcement | Author OR admin/producer (`productions:manage`) |
| Pin/unpin | admin, producer only (`productions:manage`) |

## Scope rules

- **Org-wide:** `production_id IS NULL` — visible to all org members on `/announcements`
- **Production-scoped:** `production_id IS SET` — visible on that production's announcements page and on `/announcements` for members of that production
- `/announcements` shows: org-wide + all productions user is in (or ALL productions for admin/producer)
- `/productions/[slug]/announcements` shows: that production's announcements + org-wide

## Architecture notes

- Follows the same server action + client component pattern as documents/reports
- Global page uses `getAnnouncementsForUser(userId, orgId, canManageProductions)` — two code paths depending on whether the user has `productions:manage`
- `revalidatePath("/announcements")` and `revalidatePath("/productions")` called after all mutations
- Pinning uses `updatedAt` to track when pin state changed

## Manual test checklist

- [ ] Director can post a production announcement on `/productions/[slug]/announcements`
- [ ] Cast member can view that announcement but has no "Post" form
- [ ] Admin can pin the announcement; pin indicator appears and it sorts to top
- [ ] Author can delete their own announcement; admin can delete anyone's
- [ ] Cast member cannot delete or pin
- [ ] Admin posts org-wide from `/announcements`; it shows on that page with "Org-wide" badge
- [ ] Org-wide announcement appears on a production's announcements page with "Org-wide" badge
- [ ] Production announcements appear on `/announcements` for members of that production
- [ ] Production announcements do NOT appear on `/announcements` for users not in that production
- [ ] Announcements card on production overview shows correct count
- [ ] Announcements tab on production detail navigates correctly

## Notifications (2026-06-03 — implemented, not browser-verified)

Posting an announcement now actively notifies its audience (previously
pull-only). Targeting is **scope-based**, not a mention syntax:

- `createAnnouncement` resolves the audience from the announcement's scope —
  `getOrganizationMembers` for org-wide (`production_id IS NULL`),
  `getProductionMembers` for production-scoped — and calls
  `fanoutAnnouncement` (`features/notifications/announce.ts`). The author is
  excluded.
- Delivery is per-user by channel, stored in the new `notification_preferences`
  table (`in_app`, `email`, `push`; missing row = defaults of in-app + email
  on, push off). Edited at `/settings/notifications`.
  - **in_app (updated 2026-06-03):** surfaced as a **top-of-content acknowledge
    banner** (`components/app-shell/announcement-banner.tsx`), shown when the user
    has unacknowledged announcements in their audience and cleared as each is
    acknowledged (reuses `announcementAcks`, so managers still see the ack rollup).
    Works on desktop and mobile. The earlier rail bell was removed; `fanoutAnnouncement`
    still writes `notifications` rows but nothing renders them yet (see decision-log
    + open-questions, 2026-06-03).
  - **email:** sent via the existing Resend pipeline (one message per recipient,
    batched ≤100). Best-effort — email failure never fails the post.
  - **push:** modeled but **inert** (no transport yet — see decision-log
    2026-06-03 and open-questions). The settings toggle is disabled.
- `@mention`s inside the body still create `mentions` rows (dashboard Mentions
  bento) as before — unchanged and complementary to the broadcast fan-out.

### New/changed files

| File | Purpose |
|------|---------|
| `db/schema/notification-preferences.ts` | Per-user channel toggles |
| `features/notifications/preferences.ts` | Get/bulk-get prefs with defaults |
| `features/notifications/announce.ts` | Scope fan-out + Resend email |
| `features/notifications/actions.ts` | `updateNotificationPreferences` |
| `features/announcements/actions.ts` | Calls fan-out after insert |
| `components/app-shell/notification-bell.tsx` | Bell promoted to global (rail) |
| `app/(app)/(default)/settings/notifications/*` | Preference page + form |

### Manual test checklist (notifications)

- [ ] `npm run db:push` creates `notification_preferences`
- [ ] Org-wide announcement → every other org member gets a bell notification
- [ ] Production announcement → only that production's members are notified
- [ ] Author does not notify themselves
- [ ] Turning off "Email" in `/settings/notifications` stops the email but keeps the bell
- [ ] Email arrives with title, author, snippet, and a working "View announcement" link
- [ ] Rail bell dropdown opens upward and is readable

## Open questions

- Should stage managers have `announcements:create`? Currently they cannot post. (Current permission map excludes them.)
- ~~Email distribution of announcements is deferred~~ — **shipped 2026-06-03**
  (scope-based fan-out, in-app + email). Phone push remains deferred (Phase 2,
  Web Push). See `docs/open-questions.md` → Notifications questions.
