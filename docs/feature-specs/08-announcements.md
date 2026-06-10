# Feature Spec: Announcements

## Purpose

A bulletin board for the company and individual productions. Lets authorized users post notices that are visible to everyone with access.

## User stories

- As a director, I want to post a notice about an upcoming production meeting so that my cast sees it on their production dashboard.
- As an admin, I want to post an org-wide update (e.g. studio closure) visible across all productions.
- As a cast member, I want to read announcements posted for my show without needing to check email.
- As an admin/producer, I want to pin important announcements so they always appear at the top.

## Status

**Implemented + live in production.** Base announcements plus scope-based
notifications (acknowledge banner + email) shipped via PR #25 (2026-06-03).

**Broadcast redesign (2026-06-10).** Reworked into a multi-audience broadcast
tool matching the design prototype: send to the whole company **or any set of
productions at once** (new join table), with **priority** (normal / important /
urgent), an explicit **require-acknowledgement** flag, and a composer modal with
a live preview + reach counts. Desktop "Announcements Center" and the
production-scoped page now share one client surface
(`components/announcements/announcements-center.tsx`). The composer is
responsive (preview pane collapses on ≤840px). Migration applied to the
production Supabase project (additive + backfill; legacy `production_id` kept).

## Data model

### `announcements` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → organizations (cascade) |
| `production_id` | uuid (nullable) | **Legacy.** Superseded by `org_wide` + the join table. Still written for single-target posts (null for org-wide/multi); not read for audience resolution. |
| `created_by` | uuid | FK → profiles (cascade) |
| `title` | text | Required |
| `body` | text | Rich text HTML, optional |
| `priority` | text | `normal` \| `important` \| `urgent` (CHECK), default `normal` |
| `require_ack` | boolean | Default false. Drives the Acknowledge action + the unacked banner. |
| `org_wide` | boolean | Default false. true = everyone in the org; false = the productions in the join table. **Source of truth** for audience. |
| `pinned` | boolean | Default false |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

### `announcement_productions` table (new — multi-audience join)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `announcement_id` | uuid | FK → announcements (cascade) |
| `production_id` | uuid | FK → productions (cascade) |
| `created_at` | timestamptz | — |

Unique on `(announcement_id, production_id)`. An announcement is **org-wide**
(`org_wide = true`, no rows here) or scoped to the **set** of productions listed
here. Reach/ack audience = the deduped union of those productions' members.

## Routes / pages

| Route | Description |
|-------|-------------|
| `/announcements` | Global view — all announcements user can see; create org-wide |
| `/productions/[slug]/announcements` | Production-scoped view; create for this production |

## Components

| File | Type | Purpose |
|------|------|---------|
| `app/(app)/(default)/announcements/page.tsx` | Server | Global page — serializes data → `AnnouncementsCenter` |
| `app/(app)/(default)/announcements/announcement-delete-button.tsx` | Client | Delete button (shared by the Center) |
| `app/(app)/(default)/announcements/announcement-pin-button.tsx` | Client | Pin/unpin toggle (shared by the Center) |
| `app/(app)/productions/[slug]/announcements/page.tsx` | Server | Production page — same Center, composer locked to the show |
| `components/announcements/announcements-center.tsx` | Client | Header, permission banner, filter pills, card list, toast |
| `components/announcements/announcement-composer.tsx` | Client | Composer modal: audience picker, priority, toggles, live preview |
| `components/announcements/announcement-detail-drawer.tsx` | Client | Title trigger → detail drawer + ack roster |
| `app/(app)/(default)/dashboard/announcement-ack-button.tsx` | Client | Acknowledge toggle + progress (reused in cards) |
| `features/announcements/queries.ts` | — | DB queries (audience via `org_wide` + join table) |
| `features/announcements/actions.ts` | Server actions | create (multi-audience), delete, togglePin, acknowledge, getDetail |
| `features/announcements/format.ts` | — | Shared presentation helpers (avatar colour, initials, relative time, role label) |

The old inline create forms (`announcement-form.tsx` on both pages) and the
production-folder pin/delete buttons were removed — superseded by the shared
composer + Center.

## Permissions

| Action | Who |
|--------|-----|
| View announcements | All roles (`announcements:view`) |
| Create announcement | admin, producer, director (`announcements:create`) |
| **Broadcast company-wide** | admin, producer only (`productions:manage`) — enforced in `createAnnouncement` |
| Post to a production | A creator with access to that production (`userCanAccessProduction`) |
| Delete announcement | Author OR admin/producer (`productions:manage`) |
| Pin/unpin | admin, producer only (`productions:manage`) |

## Scope rules

- **Org-wide:** `org_wide = true` — visible to all org members on `/announcements`
- **Production-scoped:** `org_wide = false` + one or more rows in `announcement_productions` — visible on each targeted production's page, and on `/announcements` for members of any targeted production
- `/announcements` shows: org-wide + announcements targeting any production the user is in (or ALL for admin/producer)
- `/productions/[slug]/announcements` shows: announcements targeting that production + org-wide

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

## Notifications (2026-06-03 — shipped to production via PR #25)

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
| `features/announcements/queries.ts` | `getUnacknowledgedAnnouncements` (banner) |
| `components/app-shell/announcement-banner*.tsx` | In-app acknowledge banner (server + client) |
| `components/app-shell/app-frame.tsx` | `banner` slot above page content |
| `app/(app)/(default)/settings/notifications/*` | Preference page + form |
| `components/app-shell/notification-bell.tsx` | Superseded by the banner; currently unused |

### Manual test checklist (notifications)

- [x] `notification_preferences` table created in production Supabase
- [x] Org-wide announcement → fan-out writes a row per other org member (verified in DB)
- [x] Author excluded from the fan-out
- [ ] Acknowledge banner appears at top of content for a recipient with an unacked announcement
- [ ] Acknowledging from the banner clears it AND shows the user as acknowledged in the manager rollup on the announcements page
- [ ] Production announcement → banner only appears for that production's members
- [ ] Turning off "Email" in `/settings/notifications` stops the email (banner still shows)
- [ ] Email arrives with title, author, snippet, and a working "View announcement" link
- [ ] Banner renders on mobile (content column, not the hidden rail)

## Open questions

- Should stage managers have `announcements:create`? Currently they cannot post. (Current permission map excludes them.)
- ~~Email distribution of announcements is deferred~~ — **shipped 2026-06-03**
  (scope-based fan-out, in-app + email). Phone push remains deferred (Phase 2,
  Web Push). See `docs/open-questions.md` → Notifications questions.

## Announcement detail drawer (implemented 2026-06-03)

Clicking an announcement **title** on `/announcements` or
`/productions/[slug]/announcements` opens a detail drawer — right-side panel on
desktop, bottom sheet on mobile (≤720px) — showing the full announcement plus
an **acknowledgement roster** (who has / hasn't acknowledged, acked first, with
relative timestamps). Acknowledging from the drawer is optimistic and reuses
`acknowledgeAnnouncement`.

- Data: `getAnnouncementDetailForUser` (queries) → `getAnnouncementDetail`
  (server action, auth + audience enforced). Body is sanitized server-side.
- UI: `components/announcements/announcement-detail-drawer.tsx`
  (`AnnouncementTitleTrigger` + drawer). Audience roster excludes the author.
- Not yet wired from the dashboard announcements list or the banner (follow-up).
- Roster is visible to anyone who can view the announcement (consistent with the
  existing public N/M ack count); gate to managers later if needed.

### Original request / rationale (2026-06-03)

- **Desktop:** a right-hand side drawer (mirror `app/(app)/(default)/people/person-drawer.tsx`;
  other examples: `document-drawer.tsx`, `event-drawer.tsx`, `trash-drawer.tsx`).
- **Mobile:** the same content as a bottom sheet (slides up from the bottom),
  matching the mobile drawer/bottom-sheet pattern used elsewhere.

**Contents:**
- The full announcement (title, rich-text body, author, scope, posted time).
- An **acknowledgement roster** — who has acknowledged and who hasn't, not just
  the `N/M` count. The acknowledge action lives here too (so reading = the place
  you ack).

**Implementation notes / gaps:**
- `getAckInfoForAnnouncements` returns counts (`acked`/`total`/`mine`) but NOT the
  list of who acknowledged. A new query is needed: the audience roster (org members
  for org-wide, production members for scoped) left-joined to `announcement_acks`
  to mark each person acked / not-acked, with ack timestamps.
- Gate the roster view to managers where appropriate (`productions:manage` /
  `settings:manage`), or show everyone their own ack state plus the rollup.
- Reuse `acknowledgeAnnouncement` for the in-drawer ack toggle.
- This pairs naturally with the acknowledge banner: banner = "act on it",
  drawer = "read it + see who's seen it".
