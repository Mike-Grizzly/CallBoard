# Step 6: Document Center

## Purpose
Centralized document management per production with categorized uploads, in-app viewing, comments with @mentions, soft delete/restore, and preparation for future AI script analysis.

## User story
As a stage manager, I can upload scripts, schedules, and other production files organized by type. All team members can view and download documents, comment on them using @mentions, and restore accidentally deleted files from the Trash.

## Status: IMPLEMENTED + OVERHAULED (2026-05-12)

## Data model

### `documents` table
- `id`, `productionId`, `uploadedBy`, `title`, `fileName`, `fileSize`, `contentType`, `storagePath`
- `folderId` (nullable FK → `document_folders`) — folder assignment, changeable post-upload
- `documentType` — script | schedule | design | music | reference | general
- `processingStatus` — none (default); reserved for future AI analysis
- `deletedAt` (nullable timestamptz) — soft delete; `NULL` = live, non-null = in trash
- `createdAt`

### `document_folders` table
- `id`, `productionId`, `name`, `sortOrder`
- Default folders seeded on production creation: Script, Music/Score, Schedules, Design/Tech, References, General

### `document_comments` table
- `id`, `documentId`, `authorId`, `body`, `createdAt`
- `body` stores raw text with `@{First Last}` tokens for @mentions

### `notifications` table (`db/schema/notifications.ts`)
- `id`, `recipientId`, `type`, `title`, `body`, `link`, `readAt`, `createdAt`
- Created when a user is @mentioned in a document comment

## Routes/pages
- `/productions/[slug]/documents` — document list with upload form; row click opens drawer
- `/productions/[slug]/documents?doc={id}` — pre-opens drawer for a specific document (shareable link)

## Components

### Core list
- `documents-client.tsx` — full client component: folder sections, row click → drawer, `initialDocId` from URL
- `document-upload-form.tsx` — title, type dropdown, file picker, folder selection
- `document-drawer.tsx` — right-side portal drawer: inline PDF/image viewer + comments column
- `document-row-menu.tsx` — ⋮ menu (Download, Share link, Delete); portal-rendered for correct z-position

### Drawer internals
- `document-comments-panel.tsx` — comment list + `MentionTextarea` input; fetches via `fetchDocumentComments`
- `folder-select.tsx` — inline `<select>` to reassign folder; calls `moveDocument` on change

### Reusable (in `components/ui/`)
- `mention-textarea.tsx` — textarea with @mention autocomplete dropdown; Tab inserts top suggestion; Enter submits
- `mention-body.tsx` — renders `@{First Last}` tokens as accent-colored highlighted spans

### Topbar
- `notification-bell.tsx` — bell icon with red unread-count badge; dropdown lists notifications; marks all read on open
- `trash-drawer.tsx` — trash icon with amber dot badge; right-side portal drawer listing soft-deleted docs + reports; Restore / Permanent Delete per item; purge countdown (≤3 days = warning)

## Server actions (`features/documents/actions.ts`)
- `uploadDocument(formData)` — uploads to Supabase Storage, records in DB; requires `documents:upload`
- `deleteDocument(formData)` — **soft delete** (sets `deletedAt`); does NOT touch Supabase Storage; requires `documents:upload`
- `restoreDocument(formData)` — clears `deletedAt`; requires `documents:upload`
- `permanentlyDeleteDocument(formData)` — removes from Supabase Storage then hard-deletes DB record; requires `documents:upload`
- `getDocumentUrl(storagePath)` — signed URL for in-browser viewing (1-hour); **no production-membership check**
- `getDocumentDownloadUrl(storagePath, fileName)` — signed URL with `{ download: fileName }` for forced download
- `moveDocument(formData)` — updates `folderId`; requires `documents:upload`
- `createFolder(formData)` — creates a new folder; requires `documents:upload`
- `postComment(formData)` — inserts comment, parses `@{First Last}` tokens, creates notifications for mentioned users
- `fetchDocumentComments(documentId)` — server action wrapper; called client-side to refresh comments
- `getDocumentDownloadUrl`, `getDocumentUrl` — no permission check (any authenticated user)

## Queries (`features/documents/queries.ts`)
- `getDocumentsByProduction(productionId)` — live docs only (`deletedAt IS NULL`), with uploader + folder info
- `getDocumentById(documentId)` — single live doc
- `getDeletedDocumentsByProduction(productionId)` — soft-deleted docs for trash drawer
- `getDocumentComments(documentId)` — all comments with author info, ascending
- `getFoldersByProduction(productionId)` — all folders, sorted

## Permissions
- `documents:view` — see document list and open viewer (all roles)
- `documents:upload` — upload, delete, restore, permanently delete, move, create folders (admin, producer, director, stage_manager)
- Upload form, row menu Delete, folder create — only shown to users with `documents:upload`

## Notification bell (`features/notifications/actions.ts`)
- `getUnreadNotificationCount()` — count of unread for current user; called in layout
- `getNotifications()` — all notifications for current user
- `markNotificationsRead(ids?)` — marks specific or all as read

## Soft delete / Trash drawer
- Delete sets `deletedAt`; item disappears from all production lists
- Trash drawer (topbar) shows all deleted docs + reports for the production
- Restore clears `deletedAt`; item reappears in production list
- Permanent delete removes Supabase Storage file + DB record
- 30-day purge window displayed in UI; items ≤3 days from purge show a warning — **no automated purge exists yet** (manual only)

## Edge cases / known limitations
- `getDocumentUrl()` and `getDocumentDownloadUrl()` have no production-membership check
- No file type validation (any file type accepted)
- No duplicate file detection
- Storage path: `documents/{productionId}/{timestamp}-{filename}`
- `DOCUMENT_TYPES` must be in `constants.ts`, NOT in a `"use server"` file — non-function exports from server action files cause hydration errors

## Architecture notes to preserve
- `createPortal(content, document.body)` required for `document-row-menu.tsx` and `trash-drawer.tsx` — the `.anim-in` class uses `transform: translateY(4px)` which creates a CSS stacking context trapping `position: fixed` children at wrong coordinates
- Row menu position calculated via `btnRef.current.getBoundingClientRect()` — not from event, for stability; repositioned on scroll
- Clipboard share-link uses `navigator.clipboard.writeText()` with `textarea + execCommand` fallback for HTTP environments
- PDF fullscreen: 40px opaque bar *above* the iframe (not overlapping it) prevents UI clash with browser PDF toolbar
- PDF thumbnail sidebar suppressed via `#navpanes=0&pagemode=none` appended to signed URL
- `@{First Last}` token format: unambiguous, parseable, stored verbatim in `body`
- `MentionTextarea` and `MentionBody` are generic — usable anywhere in the app, not document-specific
- `deletedAt` column on `documents` and `rehearsal_reports` — added via Supabase MCP migration; Drizzle schema updated accordingly
