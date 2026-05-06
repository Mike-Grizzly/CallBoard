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

## Open questions

- Should stage managers have `announcements:create`? Currently they cannot post. (Current permission map excludes them.)
- Email distribution of announcements is deferred — tracked as a future feature alongside the rehearsal report overhaul.
