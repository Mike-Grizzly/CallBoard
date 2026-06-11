# Architecture

## App purpose

Show Portal is a lightweight production portal for small theatre companies. It provides a single shared workspace per show for communication, reports, documents, schedules, file uploads, and role-based visibility.

The app is being built as an MVP in strict vertical slices.

## Tech stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.3 |
| UI library | React | 19.2.4 |
| Language | TypeScript (strict mode) | 5.x |
| CSS | Tailwind CSS | v4 |
| UI primitives | Local shadcn-style components | Custom |
| Icons | lucide-react | 0.468.0 |
| Auth / DB / Storage | Supabase | 2.47.8 |
| ORM | Drizzle | 0.38.3 |
| Rich text | TipTap | 3.22.5 |
| Deployment target | Vercel-ready, local-first during MVP | — |

## Folder structure

```
app/
  (app)/                    Route group for authenticated app shell
    layout.tsx              App shell: topbar + sidebar + main content
    dashboard/              Personalized dashboard
    productions/            Production CRUD, detail, sub-features
      [slug]/
        reports/            Rehearsal reports (list, create, detail)
        documents/          Document center (list, upload, viewer)
        log/                Daily log (rich text per user)
        members/            Production team assignment
    reports/                Placeholder (top-level)
    documents/              Placeholder (top-level)
    announcements/          Placeholder
    activity/               Placeholder
    settings/
      members/              Org-wide member management (admin)
  login/                    Login page
  signup/                   Signup page + confirmation
  forgot-password/          Password reset request + confirmation
  reset-password/           Password reset form
  auth/callback/            Supabase auth callback (PKCE + implicit)
  actions/auth.ts           Auth server actions
  layout.tsx                Root HTML layout
  page.tsx                  Redirects to /dashboard
  globals.css               Tailwind v4 theme tokens

components/
  ui/                       Local primitives: button, card, separator, rich-text-editor
  app-shell/                Topbar, sidebar, logout button, nav items, placeholder page

features/
  productions/              Queries, actions, validation for productions
  members/                  Queries, actions for org + production memberships
  reports/                  Queries, actions, validation, attachments for reports
  logs/                     Queries, actions for daily production logs
  documents/                Queries, actions, constants for document center
  announcements/            Empty (.gitkeep only)
  activity/                 Empty (.gitkeep only)

lib/
  auth.ts                   getCurrentUser, requireCurrentUser, auto-profile sync
  permissions.ts            Capability map, can() function
  organization.ts           getOrCreateDefaultOrganization (lazy singleton)
  utils.ts                  cn() Tailwind class helper
  supabase/
    server.ts               Server-side Supabase client
    client.ts               Browser-side Supabase client
    proxy.ts                Proxy-context Supabase client (Next.js 16)

db/
  index.ts                  Drizzle client (postgres-js, prepare: false)
  schema/                   All Drizzle table definitions (9 tables)

types/
  roles.ts                  ROLES array and Role type

proxy.ts                    Next.js 16 proxy (replaces middleware.ts)
drizzle.config.ts           Drizzle Kit config
next.config.ts              Next.js config (serverActions body size limit)
```

## Routing approach

- Next.js 16 App Router with file-based routing
- `(app)` route group wraps all authenticated pages with the app shell layout
- `proxy.ts` replaces `middleware.ts` (Next.js 16 breaking change) for auth route protection
- Dynamic routes use `[slug]` for productions and `[reportId]`/`[documentId]` for detail pages
- `params` is a `Promise` in Next.js 16 (must be awaited)

## Server / client component patterns

- **Server components** (default): All page.tsx files, topbar, data fetching
- **Client components** ("use client"): Sidebar (active state), forms, buttons with click handlers, rich text editor, file upload/download/delete interactions
- **Server actions** ("use server"): All mutations (create, update, delete), file uploads
- Pattern: Server component fetches data and checks permissions, passes props to client components for interactivity

## Supabase usage

### Auth
- Email/password authentication via `@supabase/ssr`
- Three Supabase client factories: server (async cookies), browser (public keys), proxy (NextRequest/NextResponse)
- Session refresh happens in `proxy.ts` on every navigation
- Auth callback handles both PKCE code exchange and implicit token_hash flows
- Signup stores `first_name`, `last_name`, `requested_role` in Supabase user metadata

### Database
- Supabase PostgreSQL accessed via Drizzle ORM
- Connection string uses Transaction Pooler with `prepare: false` for serverless compatibility
- Direct Drizzle queries in server components and server actions — no API layer
- RLS is enabled on database tables but not enforced (server-side connection bypasses RLS)

### Storage
- Single bucket: `attachments` (private)
- Used for report attachments, production documents, and workspace logos
- Storage paths:
  - `reports/{reportId}/{timestamp}-{filename}`
  - `documents/{productionId}/{timestamp}-{filename}`
  - `org-logos/{orgId}/{timestamp}.{ext}` — workspace logo (SVG/PNG/JPG)
- Access via signed URLs with 1-hour expiry, generated server-side.
  `getSignedLogoUrl` (cached per request in `lib/workspace-logo.ts`)
  signs the logo path for the rail badge + settings headers without
  issuing duplicate signs across layout + page.
- RLS policies on `storage.objects`: authenticated users can INSERT, SELECT, DELETE on the `attachments` bucket
- File size limits: 64MB for documents, 10MB for report attachments,
  2MB for workspace logos

## Database schema

9 tables currently defined:

| Table | Purpose | Key relations |
|-------|---------|---------------|
| `organizations` | Top-level tenant. `logo_url` (nullable) holds an `attachments` bucket path. | — |
| `profiles` | User profiles (extends Supabase auth). `selected_organization_id` (nullable) drives the workspace switcher. | organizations (selected) |
| `organization_memberships` | Users to orgs with role | profiles, organizations |
| `productions` | Shows/workspaces. `archived_at` (nullable) soft-archives a production — hidden from default lists, never hard-deleted. | organizations |
| `production_memberships` | Users to productions with role | profiles, productions |
| `rehearsal_reports` | Daily rehearsal reports | productions, profiles |
| `production_logs` | Personal daily notes per user per production | productions, profiles |
| `report_attachments` | Files attached to reports | rehearsal_reports, profiles |
| `documents` | Production documents with type categorization | productions, profiles |

All tables use UUID primary keys, cascade deletes on foreign keys, and timezone-aware timestamps.

**Known schema concern:** Composite unique constraints on membership tables were removed because `drizzle-kit push` hangs when they are present. Duplicate memberships are prevented in application code (upsert pattern) but not enforced at the database level.

## Role and permission architecture

### Roles (6 total)
`admin`, `producer`, `director`, `stage_manager`, `cast`, `crew`

### Capabilities (10 total)
`productions:view`, `productions:manage`, `reports:view`, `reports:create`, `documents:view`, `documents:upload`, `announcements:view`, `announcements:create`, `activity:view`, `settings:manage`

### Permission matrix

| Capability | admin | producer | director | stage_manager | cast | crew |
|-----------|-------|----------|----------|---------------|------|------|
| productions:view | Y | Y | Y | Y | Y | Y |
| productions:manage | Y | Y | — | — | — | — |
| reports:view | Y | Y | Y | Y | Y | Y |
| reports:create | Y | Y | Y | Y | — | — |
| documents:view | Y | Y | Y | Y | Y | Y |
| documents:upload | Y | Y | Y | Y | — | — |
| announcements:view | Y | Y | Y | Y | Y | Y |
| announcements:create | Y | Y | Y | — | — | — |
| activity:view | Y | Y | Y | Y | Y | Y |
| settings:manage | Y | — | — | — | — | — |

### Where permissions are enforced
- **Server actions**: All mutation actions call `requireCurrentUser()` and check `can(role, capability)` before proceeding
- **Page components**: Permission checks gate UI elements (buttons, forms, links) and redirect unauthorized users
- **Sidebar**: Nav items filtered by capability
- **Production access**: Users without `productions:manage` must have a production membership to view production detail pages; non-assigned users see dimmed/locked cards on the list page

### Where permissions are NOT enforced
- `getDocumentUrl()` and `getAttachmentUrl()` generate signed URLs without checking if the requesting user has access to the parent production or report
- Supabase Storage RLS policies allow any authenticated user to read/write/delete any file in the `attachments` bucket
- Query functions (getDocumentsByProduction, getReportsByProduction, etc.) do not check production membership — the page-level check is the only gate

## Auth architecture

- First user in the organization automatically becomes `admin`
- Subsequent users default to `cast` (most restrictive role)
- Signup form includes a "requested role" dropdown — the value is stored on the profile but has no automatic effect; admins see it as a hint in the member management UI
- `getCurrentUser()` auto-creates a profile, a new organization, and
  an admin membership on first access for self-signups (sync pattern);
  for invited users the profile + membership already exist from invite time
- `requireCurrentUser()` redirects to `/login` if not authenticated

## Multi-tenancy

- A user can be a member of multiple organizations via
  `organization_memberships`; the user's "current org" for a given
  request is resolved by `getCurrentUser()` from
  `profiles.selected_organization_id`, falling back to the user's
  first membership when the selection is stale (org deleted, user
  removed from it, never set). The resolver writes the fallback
  back to the column so subsequent reads are deterministic.
- `CurrentUser` carries `organizationId`, `organizationName`,
  `organizationLogoUrl`, and `role` — derived per-request, never
  cached cross-request.
- **Self-signup** creates a new org via `createOrganization()`
  (`lib/organization.ts`) with the new user as `admin`. Org name
  comes from the required signup-form field
  (`organization_name`, carried on `auth.user_metadata`). The new
  org is set as the user's `selected_organization_id`.
- **Invites** (`features/members/actions.ts`) write the profile +
  membership rows at invite time, scoped to
  `currentUser.organizationId`, so invited users land in the
  inviter's org on first login.
- **Org switcher:** `WorkspaceRailBadge` (always visible) + inline
  switcher in Settings. `switchOrganization` (in
  `features/workspace/actions.ts`) verifies the caller is actually a
  member of the target org, then writes `selected_organization_id`.
- **Create new workspace:** `createWorkspace` (any signed-in user)
  spins up a fresh org, makes the caller its first admin, and
  auto-switches them into it. Available inline from the rail badge
  menu and the settings switcher.
- **Workspace rename:** `renameWorkspace` (admin-gated) updates
  `organizations.name`. The slug stays stable — slugs aren't
  user-facing.
- **Workspace logo:** `organizations.logo_url` holds a path inside the
  `attachments` bucket. Two-step upload (`requestWorkspaceLogoUpload`
  → browser → Storage → `finalizeWorkspaceLogoUpload`) so heavy
  bytes skip the Next.js server. Server validates admin role, MIME
  (SVG/PNG/JPG), 2MB cap, and that the path lives under
  `org-logos/{currentOrgId}/`. Client also enforces ≈square shape
  (5% tolerance, skipped for SVG).
- **Transfer workspace ownership:**
  `transferWorkspaceOwnership(targetUserId, newSelfRole)` runs in
  one DB transaction — promote target to admin first, then demote
  caller to a chosen non-admin role. Refuses self-targeting and
  refuses `admin` as the new self-role. Target must already be a
  workspace member.
- **Last-admin protection:** `updateMemberRole` and `removeMember`
  refuse to demote/remove the sole remaining admin so the workspace
  can't end up admin-less.
- "Default Organization" (slug `default`) still exists in
  production as a legacy workspace from the single-org beta;
  not special-cased in code anymore — just a row like any other.

## Production lifecycle

- Productions are **never hard-deleted**. `archiveProduction` /
  `unarchiveProduction` (in `features/productions/actions.ts`,
  gated by `productions:manage` and org-scoped) flip the
  `productions.archived_at` timestamp.
- Active list queries (`getProductionsByOrganization`,
  `getUserProductions`, the rail) filter out archived rows.
  `getArchivedProductionsByOrganization` is the explicit list for
  the "Archived productions" disclosure on `/productions`.
- `getProductionBySlug` does NOT filter archived rows — admins can
  still navigate to an archived production's pages to view history
  or restore it from the list view.

## What is intentionally not implemented yet

- Announcements feature (placeholder only)
- Activity log feature (placeholder only)
- AI script analysis (schema prepared, no processing logic)
- Document comments/annotations (UI placeholder, no data model)
- Tests
- Mobile navigation drawer
- Phone push notifications (Web Push / PWA — Phase 2; the `push` channel is
  modeled in `notification_preferences` but inert). Announcement notifications
  via in-app bell + email shipped 2026-06-03; rehearsal-report email predates it.
- Real-time updates
- Org switcher / Settings UI to rename the current org

## Patterns to preserve

1. **Vertical slice development** — each feature is a complete slice (schema, queries, actions, UI)
2. **Feature module structure** — `features/{name}/queries.ts`, `actions.ts`, `validation.ts`, `constants.ts`
3. **Server action pattern** — `"use server"`, accept FormData, return typed result with optional `error` field, permission check early return, `revalidatePath()` for cache invalidation
4. **Query pattern** — async functions with Drizzle, type inference via `Awaited<ReturnType<typeof fn>>[number]`
5. **Permission gating** — `can(user.role, capability)` in server actions AND page-level UI
6. **Supabase Storage** — private bucket, signed URLs, server-side URL generation
7. **Auto-sync user** — `getCurrentUser()` creates profile + org membership on first access
8. **Local UI primitives** — shadcn-style components (Button, Card, Separator), not installed from packages
9. **TipTap rich text** — used for daily logs and report notes; `RichTextDisplay` for rendering HTML
10. **proxy.ts** — Next.js 16 replacement for middleware.ts

## Patterns to avoid changing without explicit approval

1. Do not switch from Supabase to another auth/storage provider
2. Do not replace Drizzle with another ORM
3. Do not replace TipTap with another editor
4. Do not introduce an API layer between server components and the database
5. Do not collapse the per-user `organization_memberships` lookup
   in `getCurrentUser` back to a singleton helper — the multi-org
   refactor (2026-05-28) deliberately removed that pattern
6. Do not change the role/capability architecture without explicit approval
7. Do not move from local UI primitives to a component library without approval
8. Do not change the proxy.ts routing approach
