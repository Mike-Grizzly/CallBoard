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
- `app/(app)/productions/[slug]/members/production-member-manager.tsx` — checkbox multi-select, role dropdown, bulk assign

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
- Slug generation is in `validation.ts` — keep production creation validation centralized there
