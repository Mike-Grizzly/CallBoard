@AGENTS.md

# Show Portal — Project Context for Claude Code

This is a production portal for small theatre companies, built in vertical slices. It started as a 7-step MVP and has since grown substantially — treat `/docs/current-status.md` and `/docs/feature-specs/` as the authoritative status, not this header.

## Quick orientation

- **Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Supabase (auth/DB/storage), Drizzle ORM, TipTap rich text. Also: Stripe (billing/trials), web-push (notifications), pdf.js + Tesseract + Anthropic (AI script analysis), Sentry
- **DB:** ~36 tables — `db/schema/` is the source of truth. Core: organizations, profiles, organization_memberships, productions, production_memberships. Plus production setup (production_departments, production_roles, production_scenes), reports (rehearsal_reports, report_attachments), documents (documents, document_folders, document_comments), notes & tags, calls/calendar (calls, call_templates, call_confirmations), blocking (stage_configurations, blocking_positions, scene_beats, beat_arrows, beat_comments, custom_set_pieces), scripts/AI (script_parses, script_annotations, script_ocr, script_cache), video (rehearsal_videos, video_timestamp_notes), announcements (+acks/+productions), notifications/push, and pins/mentions
- **Auth:** Supabase email/password + Google OAuth (`signInWithOAuth` in `app/actions/auth.ts`, buttons in `components/auth/oauth-buttons.tsx`), `proxy.ts` (NOT middleware.ts), auto-profile creation in `lib/auth.ts`. Auth actions are rate-limited via `lib/rate-limit.ts` (fails **closed** in production)
- **Permissions:** `can(role, capability)` in `lib/permissions.ts` — 8 roles (admin, producer, director, choreographer, creative, stage_manager, cast, crew), 18 capabilities
- **Storage:** Single `attachments` bucket in Supabase Storage, signed URLs (1hr expiry)
- **Scope:** Productions/dashboard, reports, documents & folders, file uploads, announcements, notes, calls & calendar, people directory, push notifications, billing/trials, AI script analysis, rehearsal video, blocking/stage setup, and designer seats. See `/docs/current-status.md` + `/docs/feature-specs/` for authoritative per-feature status

## Before working on features

For **small fixes** (typos, one-file changes): just read the relevant file and fix it.

For **feature work or multi-file changes**: read these docs first:
- `/docs/architecture.md` — system architecture, patterns to preserve
- `/docs/current-status.md` — what's built, what's not, known issues
- `/docs/dev-rules.md` — development rules and constraints
- The relevant `/docs/feature-specs/*.md` file

Summarize your understanding and planned file changes before editing.

## Design handoffs — how designs enter the codebase

Designs live in two places, both **read-only reference** — never edit the design
files to match the code; recreate the design in real code using this codebase's
components, tokens, and patterns. Full standard: `/docs/design-handoffs.md`.

- `design-reference/` — the global whole-app UI mockup (ported tab-by-tab).
- `handoff/<feature-name>/` — per-feature design drop-offs (one folder each;
  the owner commits these straight to `main`). Each README's first line is a
  `**Status:**` marker.

On startup or when design work is requested, **scan `handoff/*/` for folders not
marked `Implemented`, summarize them, but do NOT start building one unless the
owner explicitly asks.** When asked: branch off `main`, recreate against existing
patterns, test, set the handoff's `**Status:** Implemented — <date>`, and do the
docs closeout.

## Critical patterns — do not break these

1. **Server actions** return typed results with optional `error` field, check `can(role, capability)`, call `revalidatePath()`
2. **Feature modules** live in `features/{name}/` with `queries.ts`, `actions.ts`, optional `validation.ts` and `constants.ts`
3. **Permission checks** happen in BOTH server actions (security) AND UI components (UX)
4. **proxy.ts** handles auth — do NOT create a middleware.ts
5. **`params` is a Promise** in Next.js 16 pages — must be awaited
6. **Constants must NOT be exported from `"use server"` files** — causes hydration errors. Use separate `constants.ts`
7. **Supabase Storage** uses the **service-role admin client** (`lib/supabase/admin.ts`) for all object reads/writes/signed-URLs; browser uploads use signed upload tokens. Both bypass RLS, so access control lives **entirely** in the server actions (`requireCurrentUser` + `can()` + `userCanAccessProduction`). The `attachments` bucket RLS is intentionally **deny-all** (RLS enabled, no policies) as defense-in-depth — do NOT add broad `authenticated` policies back
8. **`experimental.serverActions.bodySizeLimit: "64mb"`** in next.config.ts — required for file uploads
9. **Production-scoped access** goes through `userCanAccessProduction(user, productionId)` (`lib/auth.ts`) — it enforces the tenant boundary (production belongs to the user's org), a `productions:manage` override, and production membership. Do NOT re-implement this check ad hoc; route production-scoped reads, mutations, and signed-URL issuance through it. (Several actions still inline the equivalent logic — prefer the helper, and treat consolidating them as ongoing hardening.)
10. **Report draft visibility:** draft rehearsal reports are visible only to report managers (`reports:create` holders). Use `canViewDraftReports(role)` (`features/reports/visibility.ts`) at EVERY report read path — list, detail, attachment signed-URLs, and dashboard/activity surfaces. Cast/crew see a report only once it is distributed

## Known issues to not re-introduce

- `users` table name conflicts with Supabase — table is named `profiles` (file is still `db/schema/users.ts`)
- Composite unique constraints on membership tables cause `drizzle-kit push` to hang — prevented in app code instead
- TipTap requires `immediatelyRender: false` for SSR
- `dangerouslySetInnerHTML` is used in `RichTextDisplay` and the announcement drawer/center — but the HTML is sanitized via `lib/sanitize.ts` (`RichTextDisplay` sanitizes inline; announcement `bodyHtml` is sanitized at the query layer in `features/announcements/queries.ts`). Keep any new rich-text render path running through `sanitizeHtml`

## Session closeout

Before ending any development session, update:
- `/docs/current-status.md` — what changed
- Relevant `/docs/feature-specs/*.md` — updated status
- `/docs/decision-log.md` — if decisions were made
- `/docs/open-questions.md` — if new risks or questions found

## Full documentation

See `/docs/README.md` for the complete documentation index.
