# Step 3: Roles & Permissions

## Purpose
Implement role-based access control with 6 roles, 10 capabilities, and an admin UI for managing organization members.

## User story
As an admin, I can view all org members, change their roles, and remove them. Members see UI elements appropriate to their permissions.

## Status: IMPLEMENTED

## Data model
- `organization_memberships` — maps user to org with role (admin, producer, director, stage_manager, cast, crew)
- `profiles` — includes `requestedRole` field from signup

## Routes/pages
- `/settings` — redirects to `/settings/members` (requires `settings:manage`)
- `/settings/members` — org member management (admin-only)

## Components
- `app/(app)/settings/members/member-list.tsx` — client component with role dropdown, remove button, requested role hint
- `lib/permissions.ts` — `CAPABILITIES` array, `CAPABILITY_MAP`, `can(role, capability)` function
- `types/roles.ts` — `ROLES` array, `Role` type

## Server actions (`features/members/actions.ts`)
- `updateMemberRole(formData)` — change org member's role; requires `settings:manage`; prevents self-role-change; validates role against ROLES array
- `removeMember(formData)` — delete org membership; requires `settings:manage`; prevents self-removal

## Queries (`features/members/queries.ts`)
- `getOrganizationMembers(orgId)` — all members with profile info and role
- `getUserProductionIds(userId)` — Set of production IDs user is assigned to

## Permission enforcement locations
- **Server actions:** All mutation actions check `can(user.role, capability)` early return
- **Page components:** UI elements conditionally rendered based on `can()`
- **Sidebar:** Nav items filtered by capability
- **Settings page:** Redirects non-admin users

## Capability matrix
See `/docs/architecture.md` for the full permission matrix.

## Edge cases
- Admin cannot change their own role (enforced in `updateMemberRole`)
- Admin cannot remove themselves (enforced in `removeMember`)
- Requested role from signup is displayed as a hint in the member list but has no automatic effect
- No composite unique on `organization_memberships` — duplicate memberships possible at DB level (prevented in app code)

## Manual test checklist
- [ ] Admin can see Settings > Members page
- [ ] Non-admin users cannot access Settings > Members (redirected)
- [ ] Admin can change another member's role via dropdown
- [ ] Admin cannot change their own role
- [ ] Admin can remove a member
- [ ] Admin cannot remove themselves
- [ ] Sidebar shows correct nav items for each role
- [ ] Requested role hint appears for members who selected a position during signup

## Architecture notes to preserve
- `can(role, capability)` is the single permission check function — do not create alternatives
- Roles are defined in `types/roles.ts` — keep in sync with `lib/permissions.ts` capability map
- Permission checks happen in BOTH server actions (security) AND UI components (UX) — do not remove either
- Org membership role is the sole source of a user's capabilities — production membership roles are stored but not yet used for capability resolution
