@AGENTS.md

# Show Portal — Project Context for Claude Code

This is a lightweight production portal for small theatre companies. MVP built in vertical slices. Steps 1-7 are implemented.

## Quick orientation

- **Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Supabase (auth/DB/storage), Drizzle ORM, TipTap rich text
- **DB:** 9 tables — organizations, profiles, organization_memberships, productions, production_memberships, rehearsal_reports, production_logs, report_attachments, documents
- **Auth:** Supabase email/password, `proxy.ts` (NOT middleware.ts), auto-profile creation in `lib/auth.ts`
- **Permissions:** `can(role, capability)` in `lib/permissions.ts` — 6 roles, 10 capabilities
- **Storage:** Single `attachments` bucket in Supabase Storage, signed URLs (1hr expiry)
- **Features built:** Foundation, Auth, Roles/Permissions, Productions/Dashboard, Reports/Daily Log, Document Center, File Uploads
- **Not built yet:** Announcements, Activity Log (scaffolded as placeholders)

## Before working on features

For **small fixes** (typos, one-file changes): just read the relevant file and fix it.

For **feature work or multi-file changes**: read these docs first:
- `/docs/architecture.md` — system architecture, patterns to preserve
- `/docs/current-status.md` — what's built, what's not, known issues
- `/docs/dev-rules.md` — development rules and constraints
- The relevant `/docs/feature-specs/*.md` file

Summarize your understanding and planned file changes before editing.

## Critical patterns — do not break these

1. **Server actions** return typed results with optional `error` field, check `can(role, capability)`, call `revalidatePath()`
2. **Feature modules** live in `features/{name}/` with `queries.ts`, `actions.ts`, optional `validation.ts` and `constants.ts`
3. **Permission checks** happen in BOTH server actions (security) AND UI components (UX)
4. **proxy.ts** handles auth — do NOT create a middleware.ts
5. **`params` is a Promise** in Next.js 16 pages — must be awaited
6. **Constants must NOT be exported from `"use server"` files** — causes hydration errors. Use separate `constants.ts`
7. **Supabase Storage** uses anon key client (not service role) — RLS policies required on bucket
8. **`experimental.serverActions.bodySizeLimit: "64mb"`** in next.config.ts — required for file uploads

## Known issues to not re-introduce

- `users` table name conflicts with Supabase — table is named `profiles` (file is still `db/schema/users.ts`)
- Composite unique constraints on membership tables cause `drizzle-kit push` to hang — prevented in app code instead
- TipTap requires `immediatelyRender: false` for SSR
- `dangerouslySetInnerHTML` in `RichTextDisplay` — no sanitization (known risk, documented)

## Session closeout

Before ending any development session, update:
- `/docs/current-status.md` — what changed
- Relevant `/docs/feature-specs/*.md` — updated status
- `/docs/decision-log.md` — if decisions were made
- `/docs/open-questions.md` — if new risks or questions found

## Full documentation

See `/docs/README.md` for the complete documentation index.
