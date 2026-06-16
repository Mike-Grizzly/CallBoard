# Step 4: Productions & Dashboard

## Purpose
Production CRUD, production membership (team assignment), access gating, and a personalized dashboard.

## User story
As an admin, I can create productions and assign team members. As a member, I see my assigned productions on the dashboard and can access their detail pages. Non-assigned members see productions as locked.

## Status: IMPLEMENTED

## Data model
- `productions` — id, organizationId, title, slug, status (draft/active/archived), openingDate, closingDate
- `production_memberships` — maps user to production with role

## Routes/pages
- `/productions` — production list (all org productions, non-assigned shown dimmed/locked)
- `/productions/new` — create production form (requires `productions:manage`)
- `/productions/[slug]` — production detail (overview, tabs, team roster)
- `/productions/[slug]/members` — production team management (requires `productions:manage`)
- `/dashboard` — personalized: admin sees stats cards; all users see assigned productions list

## Components
- `app/(app)/productions/production-list.tsx` — production cards with lock icon for non-assigned
- `app/(app)/productions/new/create-production-form.tsx` — title, dates, status form
- `app/(app)/productions/[slug]/production-tabs.tsx` — client tab navigation (Overview, Reports, Documents, Daily Log)
- `app/(app)/productions/[slug]/members/cast-crew-board.tsx` — the drag-to-assign **Cast & Crew board** (see section below). Replaced the old `cast-list.tsx` + `production-member-manager.tsx` (both removed) by unifying character casting and team assignment into one two-zone board.

## Server actions
- `createProduction(formData)` in `features/productions/actions.ts` — validates, creates production with generated slug; requires `productions:manage`
- `assignProductionMember(formData)` in `features/members/actions.ts` — bulk assign users to production with role; requires `productions:manage`; upsert pattern (update role if already assigned)
- `removeProductionMember(formData)` in `features/members/actions.ts` — remove from production; requires `productions:manage`

## Queries
- `getProductionsByOrganization(orgId)` — all productions for org
- `getProductionBySlug(orgId, slug)` — single production lookup
- `getUserProductions(userId)` — productions user is assigned to, with role
- `getProductionMembers(productionId)` — team roster
- `getProductionMembership(userId, productionId)` — single membership check

## Validation (`features/productions/validation.ts`)
- `validateProductionForm(formData)` — validates title (required), dates, generates slug from title

## Access gating
- Production list: all org productions shown; non-assigned users see dimmed cards with lock icon (can see but not click)
- Production detail: users without `productions:manage` must have a production membership — otherwise redirected to `/productions`
- "New production" button: only shown if user has `productions:manage`

## Dashboard
- Admin: stats cards (total productions, total members, active shows)
- All users: list of assigned productions with role badges, dates, status

## Edge cases
- Slug generated from title (lowercased, spaces to hyphens) — no uniqueness check at DB level
- Bulk assignment sends user_ids as JSON array in FormData
- No composite unique on `production_memberships` — upsert pattern prevents duplicates in app code
- Production tabs are defined in the overview page and passed to `ProductionTabs` component — adding new tabs requires updating the tabs array in `page.tsx`

## Manual test checklist
- [ ] Admin can create a new production with title and dates
- [ ] Production appears in the list
- [ ] Admin can assign members to a production (bulk checkbox + role)
- [ ] Assigned members can access the production detail page
- [ ] Non-assigned members see the production as locked/dimmed in the list
- [ ] Non-assigned members are redirected when trying to access the production detail directly
- [ ] Dashboard shows assigned productions for the current user
- [ ] Admin dashboard shows stats cards
- [ ] Production tabs (Overview, Reports, Documents, Daily Log) navigate correctly

## Architecture notes to preserve
- Production access gating happens at the page level in `page.tsx`, not in queries
- `getUserProductionIds()` returns a Set for O(1) lookups in the production list
- Tabs are defined as an array in the production overview `page.tsx` — tabs are not dynamic per feature module
- Slug generation is in `validation.ts` (`slugify`) — keep production creation validation centralized there; `actions.ts#generateUniqueSlug` adds org-uniqueness on top

## New-production builder (2026-05-29)
Two creation paths, surfaced from the "+" menu on `/productions` (`new-production-trigger.tsx`):

- **Full setup** — 6-step wizard (`new/new-production-wizard.tsx`, a typed client component ported from the design's `new-production.jsx`; styles scoped under `.np-root` in `globals.css`). Steps: Basics → Calendar → Departments → Roles → Team → Review, then a launch screen. Mounts as a full-screen **overlay** in-app (lazy via `next/dynamic`) and also renders as a standalone **page** at `/productions/new` (full-screen, covers the app rail). Submits the whole payload to `createProductionFull(input)`.
- **Quick add** — small modal (show name + optional opening date) → `quickCreateProduction(input)` creates a `draft` and routes to the hub.

Behavior:
- Actor autocomplete pulls real org members via `getOrgUsersForWizard(organizationId)`.
- Team step: existing org members are assigned to the production directly (`productions:manage`); brand-new emails are invited into the org via the Supabase Admin API (mirrors `features/members/actions.ts#inviteMembers`) — this requires `settings:manage`, and any rows that can't be actioned are surfaced in the launch screen's "couldn't be added" list rather than failing the launch.
- Wizard team-role labels map to the fixed role set via `appRoleForTeamLabel` in `wizard-constants.ts`.

Schema added (additive, applied to the `CallBoard` Supabase project + Drizzle schema):
- `productions`: `venue`, `season`, `first_rehearsal_date`, `tech_start_date`, `rehearsal_days` (jsonb), `rehearsal_start`, `rehearsal_end`
- `production_departments` (one row per enabled dept key), `production_roles` (cast list: name/actor/type/sort_order). Uniqueness enforced in app code, not via composite constraints. RLS enabled to match the rest of the schema.

## Cast & Crew board — drag-to-assign (2026-06-16)
Rebuild of `/productions/[slug]/members` from the `handoff/cast-crew-drag-assign`
design. Replaces the old stacked "cast list + bulk-assign card + current-team
table" (`cast-list.tsx` + `production-member-manager.tsx`, both removed) with one
**two-zone board** (`cast-crew-board.tsx`, a `"use client"` component):

- **Left — Company roster:** every org member (`getPeopleDirectory`), searchable
  + chip-filterable (All / Unassigned / Cast / Creative / Crew). Each card is a
  native HTML5 **drag source** on desktop; assigned people are dimmed with a tick.
- **Right top — Characters:** one **single-occupant slot** per `production_roles`
  row. Dropping a person calls `assignRoleToMember(roleId, userId)` (which already
  swaps/moves: an actor only holds one character, and casting grants production
  access). The `×` calls `unassignRole(roleId)`.
- **Right bottom — Production team:** one **multi-occupant bucket** per production
  role (`producer, director, choreographer, stage_manager, crew` — the role enum
  minus `admin` and `cast`). Dropping a person calls `assignProductionMember`;
  the chip `×` calls `removeProductionMember`. **The buckets are the real role
  enum, NOT the prototype's invented departments** (Wardrobe / Deck Crew / Music
  Director) — see decision-log 2026-06-16.
- **Person drawer:** reuses the People directory's `PersonDrawer` verbatim (per the
  handoff's "do not fork a second drawer"). Opened by clicking any roster card,
  filled slot, or team chip.
- **Touch / ≤859px:** drag is replaced by **tap-to-assign**. A Casting board ⇄
  Company toggle, a `+` on each person (→ role bottom-sheet), and tapping an empty
  slot/bucket (→ people bottom-sheet, unassigned first). The sheet is a new
  `.cc-sheet` surface; the inline "Invite & cast" path (admin-only, reuses
  `inviteAndAssignRole`) lives in the cast-a-character sheet so that capability
  from the old cast-list isn't lost.
- **Feedback:** a live `Cast n/total` + `Team n` progress readout and a toast
  (`.ax-toast`, red on error) on every mutation.

No new libraries, no schema change. All mutations reuse existing server actions
and `router.refresh()` (no divergent optimistic state). CSS ported into
`globals.css` (`.ax-*` + `.cc-sheet*`). `tsc` + `eslint` clean; `next build`
compiles + typechecks (page-data step needs live `DATABASE_URL`, unrelated).
**Not browser-verified** — no display in the sandbox.

### Manual test checklist (cast & crew board)
- [ ] Desktop: drag a company member onto an empty character slot → they're cast, slot fills, toast confirms, roster card dims
- [ ] Dragging an already-cast person to a different character moves them (old slot clears)
- [ ] `×` on a filled slot uncasts (person keeps production access; only the character clears)
- [ ] Drag a person into a team role bucket → they appear as a chip; chip `×` removes them from the production
- [ ] Clicking a roster card / filled slot / team chip opens the reused PersonDrawer
- [ ] Search + each filter chip (Unassigned/Cast/Creative/Crew) narrow the roster correctly
- [ ] ≤859px: board/company toggle works; `+` on a person opens the role sheet; tapping an empty slot/bucket opens the people sheet
- [ ] Admin-only "Invite & cast" in the cast-a-character sheet provisions + casts a new person
- [ ] A non-admin with `productions:manage` (producer) can assign but the drawer's org-management actions surface a permission error rather than silently succeeding
- [ ] Light/dark/dusk/cool themes render (tokens inherit; the `.drop` highlight uses `--accent`)

## Manual test checklist (new builder)
- [ ] "+" on `/productions` opens the Full setup / Quick add menu (manage roles only)
- [ ] Quick add creates a draft from just a name and lands on the hub
- [ ] Full setup overlay walks all 6 steps; Continue is gated on a title at step 1
- [ ] Launch creates the production with dates, departments, and roles persisted
- [ ] Team: existing org members get a production membership; new emails get an invite email; skips are reported
- [ ] `/productions/new` opens the wizard full-screen on direct load / refresh
- [ ] Dark/cool themes render correctly inside the wizard (tokens inherit, not pinned)
