# Open Questions

Unresolved questions, risks, and concerns. Organized by area. Do not decide answers here unless the answer is clearly visible in the repo.

---

## Blocking tool questions (Phase 2 candidates)

- Should character names be assignable from the production members UI, or only from a dedicated blocking tool panel?
- Should the blocking tool support multi-page ground plans (currently only page 1 of the PDF is rendered)?
- Should blocking snapshots be printable / exportable to PDF?
- Should set pieces have a rotation control (drag handle or angle input)?
- Should beat positions be copyable between scenes (e.g., "start Act 2 Scene 1 from the final position of Act 1")?
- The number line ruler uses `preserveAspectRatio="none"` on the SVG, which distorts tick mark heights on non-square viewports — is this acceptable or should it be addressed?
- Should the calibration step be re-enterable without resetting the whole stage config?

## Product questions

- What is the next feature step after Step 8? (Announcements and Activity are scaffolded but no product decision has been made.)
- Should productions have additional statuses beyond draft/active/archived?
- Should there be a notification system when reports are filed or documents uploaded?
- Should the "requested role" from signup trigger any workflow (e.g., admin approval queue)?

## Architecture questions

- Should `drizzle-kit push` be fixed or should the project fully adopt SQL Editor for schema changes?
- When should the project move from `push` workflow to proper migrations?
- Is the single-org design sufficient for launch, or will multi-org be needed before v1?
- Should an API layer be introduced between the UI and database, or is the current direct-query pattern acceptable long-term?

## Permissions questions

- Should production-level roles override org-level roles, or should they be additive?
- Currently a user's org role is used for capability checks everywhere. Should production membership roles affect what a user can do within a specific production?
- Are the current capability assignments correct? (e.g., should `stage_manager` have `announcements:create`?)
- Should `cast` and `crew` have different permissions, or are they intentionally identical?

## File upload / storage questions

- **Access control gap:** `getDocumentUrl()` and `getAttachmentUrl()` generate signed URLs without verifying the user has access to the parent production or report. Should these actions check production membership before returning a URL?
- **Storage RLS is permissive:** Current policies allow any authenticated user to insert/select/delete any file in the `attachments` bucket. Should policies be scoped to production membership?
- **No file type validation:** Any file type is accepted for upload. Should there be an allowlist of accepted file types?
- **No duplicate detection:** Users can upload the same file multiple times. Is this acceptable or should duplicates be detected?
- **No virus/malware scanning:** Uploaded files are served back to users via signed URLs. Should files be scanned before serving?
- **File naming:** Storage paths use `{timestamp}-{filename}`. Should filenames be sanitized to remove special characters?
- **Orphaned files:** If a database insert fails after a successful storage upload, the file remains in storage with no DB record. Should there be cleanup logic?

## UX questions

- TipTap bullet points do not render due to Tailwind prose CSS reset. When should this be fixed?
- Mobile navigation: sidebar is hidden on mobile with no alternative. When should a mobile drawer be added?
- Should the document viewer support page-by-page navigation for multi-page PDFs?
- Should there be a search/filter capability on the documents list?
- Should the production overview cards show more metadata (dates, member count)?

## Testing / hardening questions

- There are zero test files in the repo. When should testing be introduced?
- What level of testing is appropriate for MVP? (Unit tests, integration tests, E2E?)
- Password reset flow was never fully tested due to Supabase email rate limits. Needs verification.
- Should server actions validate that referenced IDs (productionId, reportId, documentId) actually exist and belong to the correct org before proceeding?
- `dangerouslySetInnerHTML` in `RichTextDisplay` renders unsanitized HTML. Should a sanitization library (e.g., DOMPurify) be added?

## Scope control questions

- The MVP is being built in vertical slices. What is the definition of "MVP complete"?
- Is there a target launch date or user count?
- Should any of the scaffolded features (announcements, activity) be cut from MVP scope?
- When should UX polish become a priority vs. feature completion?
