# 16 — People Directory & Mass Upload

## Purpose

An org-wide people directory at `/people` that lets admins add cast, crew, and
creative team **once** at the organization level, then assign them to any
number of productions. Replaces the "members can only appear after they sign
up themselves" limitation with an invite flow, and adds bulk import so a whole
season's worth of people can be added in one pass.

## User story

An admin opens **People** from the sidebar, clicks **Add people**, and either
types one person in, uploads a CSV, or pastes a list. Each person is invited by
email and (optionally) assigned to productions in the same step. Later, the
admin multi-selects people in the table and assigns them to a production in
bulk, or opens a person to edit their profile, change their role, resend an
invite, or deactivate them.

## Status

**Implemented (2026-05-20)** — not yet verified against a live Supabase project
(requires `SUPABASE_SERVICE_ROLE_KEY`).

## Approach — invites

Invited people become real Supabase auth users in an *unconfirmed* state via
the Admin API (`inviteUserByEmail`, or `createUser` when "send invite" is
unchecked). This keeps `profiles` 1:1 with auth users, so `organization_memberships`
and `production_memberships` need no FK changes and invited people can be
assigned to productions immediately. Status `invited` = unconfirmed auth user;
`lib/auth.ts` promotes them to `active` on first sign-in.

## Data model

`profiles` gained four columns (additive, nullable/defaulted — safe for
`drizzle-kit push`):

- `phone` text, nullable
- `pronouns` text, nullable
- `status` text NOT NULL default `'active'` — `active | invited | inactive`
- `last_active_at` timestamptz, nullable

No new tables. Org/production membership tables are unchanged.

## Routes / pages

- `/people` — `app/(app)/(default)/people/page.tsx` (server component, gated)

## Components

- `people-directory.tsx` — client root: search, filters, stat cards, selection, toast
- `people-views.tsx` — `PeopleTable` and `PeopleCards`
- `person-drawer.tsx` — detail/edit drawer, role/status controls, assignment list
- `add-people-modal.tsx` — 3 upload paths: manual form, CSV (map + preview), bulk paste wizard
- `assign-production-modal.tsx` — bulk assign selected people to a production
- `helpers.ts` — display helpers + client-side CSV export

Feature module `features/members/`:

- `constants.ts` — `ROLE_META`, categories, statuses, CSV fields, sample CSV
- `validation.ts` — pure parsers (delimited CSV, pasted list, role matching)
- `queries.ts` — `getPeopleDirectory()`
- `actions.ts` — `inviteMembers`, `updatePersonProfile`, `setMemberStatus`, `resendInvite`
- `lib/supabase/admin.ts` — service-role client (server-only)

## Permissions

The People page and all invite/edit/status actions require `settings:manage`
(admin only). Production assignment uses the existing `assignProductionMember`
action gated on `productions:manage`. The demo's separate "permission level"
concept is collapsed into CallBoard's single role model — the Permission column
shows a role-derived tier (Admin / Editor / Viewer) and is read-only.

## Edge cases

- Inviting an email already in the org → skipped, reported in the result summary
- Inviting an email with an existing profile but no org membership → linked, "added"
- Duplicate emails within one upload batch → deduped
- CSV rows missing name/email → flagged invalid, excluded from import
- CSV "Production" column matched to a production by title; unmatched → no assignment
- Invite emails require `SUPABASE_SERVICE_ROLE_KEY`; without it the invite
  actions return a clear error (the page, parsing, and UI still work)

## Manual test checklist

1. Sidebar shows **People** for admins only; `/people` redirects non-admins
2. Add a single person with "send invite" on → appears with "Invite pending"
3. Upload the sample CSV → map columns, preview, import; rows appear
4. Bulk-paste a list → review, set default role/production, import
5. Multi-select rows → "Assign to production" → people gain the assignment
6. Open a person → edit name/phone/pronouns, change role, deactivate, resend invite
7. Accept an invite email → user can set a password and lands signed in;
   their status flips to `active`
8. Export / Export selected download a CSV

## Open questions

- Invite email template must be enabled in the Supabase dashboard
- `last_active_at` is only set on the invite→active promotion; it is not a
  precise per-request "last seen" — per-request writes were avoided on purpose
- `/settings/members` still exists and overlaps with `/people`; left in place
  to avoid touching the Step 3 page — a future cleanup could redirect it

## Architecture notes

- `inviteMembers` takes a typed object argument (not `FormData`) because the
  payload is nested; other actions keep the `(prevState, FormData)` shape
- CSV is parsed client-side for live preview; the server action re-validates
- No new npm dependency — the CSV/paste parsers are hand-written in `validation.ts`
