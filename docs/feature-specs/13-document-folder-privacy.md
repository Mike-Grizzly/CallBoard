# Feature Spec: Role-Restricted (Private) Document Folders (Step 13)

**Status:** IMPLEMENTED (2026-06-11) — branch `claude/private-folders`. Live-migrated (`add_folder_visibility`); `tsc`/`eslint` clean. Not browser-verified.

## Purpose

Backlog item "per-role private folders". Lets managers restrict a document
folder (and the files in it) to specific production roles, so e.g. a "Stage
Management" or "Producers" folder is hidden from cast/crew. Previously every
folder and document was visible to everyone with `documents:view`.

## Model

`document_folders` gains:

| Column | Type | Notes |
|--------|------|-------|
| `visibility` | text NOT NULL default `'everyone'` | `'everyone'` or `'restricted'` |
| `allowed_roles` | `text[]` (nullable) | roles that may see a restricted folder |

Existing folders default to `everyone` (no behavior change). Documents are not
changed — a document inherits the visibility of its folder; unfiled documents
(`folder_id` null) stay visible to all members.

## Access rule (pure helper `canViewFolder` in `features/documents/constants.ts`)

A viewer may see a folder when:
- they can manage the production (`productions:manage` → admin/producer), **or**
- `visibility !== 'restricted'`, **or**
- their **production role** (`production_memberships.role`) is in `allowed_roles`.

Used both server-side (query/page filtering) and client-side (UI). Visibility
keys off the viewer's *production* role, not their org role, so the same person
can be SM on one show and cast on another.

## Enforcement points

| Surface | Behavior |
|---------|----------|
| Documents page (`documents/page.tsx`) | Filters the folder rail to visible folders and drops documents filed in hidden folders before they reach the client. |
| Document viewer (`[documentId]/page.tsx`) | `notFound()` if the doc's folder isn't visible to the viewer — blocks direct-URL access. |
| Folder pickers / upload form | Receive the already-filtered folder list, so uploaders can only file into folders they can see. |

## Permissions

- Creating / editing folder visibility: `documents:upload` (admin, producer,
  director, stage_manager) — unchanged from folder creation today. No new
  capability added.
- Viewing: governed by `canViewFolder` (production role).

## UI

- **`FolderEditor`** (`folder-editor.tsx`) — portal modal for create **and** edit:
  name + "Restrict to specific roles" toggle + role checkboxes
  (`RESTRICTABLE_ROLES` / `ROLE_LABELS`). Replaces the old inline-name create.
- Folder rail: a lock icon on restricted folders; a hover pencil (for
  `documents:upload`) opens the editor to rename / change visibility.
- Header subtitle shows "visible to <roles>" for a restricted active folder
  instead of "shared with the team".

## Key files

| File | Role |
|------|------|
| `db/schema/documents.ts` | `visibility` + `allowedRoles` on `documentFolders` |
| `features/documents/constants.ts` | `FolderVisibility`, `ROLE_LABELS`, `RESTRICTABLE_ROLES`, `canViewFolder` |
| `features/documents/actions.ts` | `createFolder` (+ visibility), new `updateFolder` |
| `features/documents/queries.ts` | folders/doc-by-id now select visibility + allowedRoles |
| `app/(app)/productions/[slug]/documents/page.tsx` | server-side filtering |
| `app/(app)/productions/[slug]/documents/[documentId]/page.tsx` | viewer gate |
| `app/(app)/productions/[slug]/documents/folder-editor.tsx` | create/edit modal |
| `app/(app)/productions/[slug]/documents/documents-client.tsx` | rail lock/edit, subtitle |

## Manual test steps

1. As an SM/admin: New folder → name "SM Only", toggle Restrict, check Stage
   Management → Create. Lock icon shows on the rail.
2. Upload a file into "SM Only".
3. Log in as a **cast** member on that production: the "SM Only" folder and its
   file do not appear; opening the file's URL directly 404s.
4. Log in as a **stage_manager**: folder + file visible.
5. Edit the folder → add Cast → cast member now sees it.
6. Admin/producer: always sees all folders regardless of restriction.
7. Set a folder back to "everyone": visible to all again.

## Known limitations / follow-ups

- The Documents tab **badge count** counts all non-deleted docs, so it can show
  a number higher than what a restricted viewer can actually open (count only,
  no titles leak). Tightening the count is a follow-up.
- The Script tool's default-script path doesn't check folder visibility; don't
  rely on a restricted folder to hide a script set as the production default.
- Restriction is by role, not by individual person or department entity.
- No folder delete (folders still can't be deleted — unchanged from before).
- Not browser-verified yet.
