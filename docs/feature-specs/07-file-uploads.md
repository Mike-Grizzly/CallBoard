# Step 7: File Upload Infrastructure

## Purpose
Shared file upload infrastructure used by both report attachments (Step 5) and the document center (Step 6). Supabase Storage integration, signed URLs, size limits, and access control.

## User story
As a team member with upload permissions, I can upload files to productions. Files are stored securely and accessed via time-limited signed URLs.

## Status: IMPLEMENTED

## Current user flow

### Upload (documents)
1. User navigates to production > Documents tab
2. Fills in title, selects document type, picks file
3. Submits form → server action validates size (64MB), uploads to Supabase Storage, records metadata in DB
4. Page revalidates, new document appears in list

### Upload (report attachments)
1. User views a report detail page
2. Clicks "Attach file" label, selects file
3. File upload triggers → server action validates size (10MB), uploads to Supabase Storage, records in DB
4. Page revalidates, attachment appears

### View/Download
1. User clicks view (eye icon) or download button
2. Client component calls server action → generates signed URL (1-hour expiry)
3. View: opens URL in new tab (browser renders PDF/images natively)
4. Download: triggers file download via anchor element

### In-app viewer (documents only)
1. User clicks document title in list
2. Navigates to `/productions/[slug]/documents/[documentId]`
3. Server component fetches document metadata and signed URL
4. Client `DocumentViewer` component renders based on content type (PDF iframe, image tag, text iframe, or download fallback)

## Where uploads appear in the app
- `/productions/[slug]/documents` — document upload form and list
- `/productions/[slug]/reports/[reportId]` — attachment upload on report detail

## What users can upload today
- **Documents:** Any file type, up to 64MB, with title and category
- **Report attachments:** Any file type, up to 10MB
- No file type restrictions are enforced

## Supabase Storage implementation

### Bucket
- Single bucket: `attachments` (private)
- Used for both documents and report attachments

### Storage paths
- Documents: `documents/{productionId}/{timestamp}-{filename}`
- Report attachments: `reports/{reportId}/{timestamp}-{filename}`

### Signed URLs
- Generated server-side via `supabase.storage.from("attachments").createSignedUrl(path, 3600)`
- 1-hour expiry
- Used for both viewing and downloading

### RLS policies on `storage.objects`
```sql
-- Any authenticated user can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Any authenticated user can read
CREATE POLICY "Authenticated users can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

-- Any authenticated user can delete
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');
```
**These policies are permissive** — any authenticated user can access any file in the bucket, not just files in their assigned productions.

## Database impact
- `documents` table: stores document metadata including storagePath
- `report_attachments` table: stores attachment metadata including storagePath
- File content is NOT stored in the database — only the Supabase Storage path

## Role/permission behavior
- **Upload documents:** Requires `documents:upload` (admin, producer, director, stage_manager)
- **Delete documents:** Requires `documents:upload` (same roles)
- **Upload report attachments:** Requires `reports:create` (admin, producer, director, stage_manager)
- **View/download:** `getDocumentUrl()` and `getAttachmentUrl()` have NO permission checks — they accept a storage path and return a signed URL
- **Cast and crew** can view documents and reports but cannot upload or delete

## File size validation
- Documents: 64MB limit checked in `uploadDocument()` server action
- Report attachments: 10MB limit checked in `uploadReportAttachment()` server action
- Next.js server action body size limit: 64MB (configured in `next.config.ts` under `experimental.serverActions.bodySizeLimit`, mirrored by `proxyClientMaxBodySize`). Raised from 25MB on 2026-06-11 to accept OCR'd scripts (Adobe OCR can bloat a scan to ~50MB).
- **Caveat (large files through the server action):** uploads go through a server action (FormData), so they're bounded by `bodySizeLimit` **and** the host's request-body cap. The Supabase Storage bucket's own per-file limit (dashboard) must also be ≥ the app limit. For files materially larger than this, the scalable path is a **direct browser→Supabase upload via a signed upload URL** (the workspace-logo uploader already does this to sidestep the action body cap) — not yet wired for documents/scripts.

## File type validation
- **None.** Any file type is accepted. No allowlist or blocklist.

## Upload progress/loading states
- Upload form button changes text to "Uploading..." during pending state
- Uses React `useTransition` for non-blocking UI updates
- Error messages displayed inline below the form
- Success message shown for 3 seconds then cleared

## Error states
- File too large: "File size must be under 64MB" / "File size must be under 10MB"
- Missing file: "Please select a file to upload"
- Missing title: "Title is required" (documents only)
- Storage upload failure: "Upload failed: {message}" (surfaced from Supabase)
- Permission denied: "You don't have permission to upload documents/attachments"

## Duplicate file handling
- **None.** Users can upload the same file multiple times. Each upload gets a unique storage path due to timestamp prefix.

## File naming conventions
- Storage path: `{type}/{parentId}/{Date.now()}-{originalFilename}`
- Original filename is preserved in the DB `fileName` column
- Filenames are NOT sanitized (special characters, spaces, unicode are passed through)

## Access control / security concerns

### Current state (needs hardening before production)
1. **Signed URL generation has no permission check.** `getDocumentUrl()` and `getAttachmentUrl()` accept any storage path and return a signed URL. They call `requireCurrentUser()` (so unauthenticated users are blocked) but do NOT verify the user has access to the parent production or report.
2. **Storage RLS is overly permissive.** Any authenticated user can read, write, or delete any file in the `attachments` bucket — not scoped to production membership.
3. **No file type validation.** Executable files, HTML files, or other potentially dangerous content could be uploaded.
4. **No filename sanitization.** Special characters in filenames could cause issues with storage paths or URL encoding.
5. **No malware scanning.** Files are stored and served without any content inspection.
6. **Orphaned file risk.** If the DB insert fails after a successful storage upload, the file remains in storage with no DB record.
7. **`dangerouslySetInnerHTML` in `RichTextDisplay`** renders HTML from the editor without sanitization. While content comes from TipTap (which produces structured HTML), a compromised or malicious user could inject arbitrary HTML.

### What IS enforced
- Authentication required for all server actions (via `requireCurrentUser()`)
- Capability checks on upload and delete actions (`documents:upload`, `reports:create`)
- File size limits checked in server actions
- Signed URLs expire after 1 hour
- Storage bucket is private (not publicly accessible)
- Page-level production membership check gates access to the documents and reports pages

## Manual test checklist
- [ ] Upload a document under 64MB — succeeds
- [ ] Upload a document over 64MB — shows error
- [ ] Upload a report attachment under 10MB — succeeds
- [ ] Upload a report attachment over 10MB — shows error
- [ ] View a PDF document in the in-app viewer
- [ ] View an image document in the in-app viewer
- [ ] Download a document via the download button
- [ ] Delete a document — file removed from storage and DB
- [ ] User without upload permission cannot see upload form
- [ ] User without upload permission cannot see delete button
- [ ] Upload with empty title shows validation error (documents)
- [ ] Upload with no file selected shows validation error
- [ ] Multiple uploads to the same production work correctly
- [ ] Signed URL expires after 1 hour (manual check or note)

## Known limitations
- No file type restrictions
- No duplicate detection
- No progress bar for large uploads
- No batch upload (one file at a time)
- No file preview in the upload form
- In-app viewer depends on browser's native PDF/image rendering
- Storage RLS needs to be scoped to production membership before production deployment

## Architecture notes to preserve
- Single `attachments` Supabase Storage bucket for all file types
- Server actions handle the full upload lifecycle (validate → storage upload → DB insert)
- Signed URLs are generated on demand, not stored
- `next.config.ts` must have `experimental.serverActions.bodySizeLimit: "64mb"` — removing this breaks document uploads
- Non-function constants must NOT be exported from `"use server"` files — causes hydration errors in client components (see `features/documents/constants.ts`)
- The `attachments` bucket and its RLS policies were created manually via Supabase Dashboard/SQL Editor — they are not managed by Drizzle
