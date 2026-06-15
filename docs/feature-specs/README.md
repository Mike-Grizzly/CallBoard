# Feature Specs

One file per vertical slice. Each spec documents what was built, how it works, and what to watch out for.

## Organization

Each feature spec includes:

- **Purpose** — what the feature does and why
- **User story** — who uses it and how
- **Status** — complete, partial, scaffolded, planned, or not implemented
- **Data model** — tables and fields involved
- **Routes/pages** — URL paths and page components
- **Components** — UI components involved
- **Permissions** — who can do what
- **Edge cases** — known limitations or gotchas
- **Manual test checklist** — steps to verify the feature works
- **Open questions** — unresolved issues specific to this feature
- **Architecture notes** — patterns to preserve

## Maintenance

Each feature spec must be updated when its feature changes. Status should reflect what is actually in the repo, not what is planned.

## Files

| File | Feature | Status |
|------|---------|--------|
| `01-foundation-app-shell.md` | Foundation & App Shell | Implemented |
| `02-auth.md` | Authentication | Implemented |
| `03-roles-permissions.md` | Roles & Permissions | Implemented |
| `04-productions.md` | Productions & Dashboard | Implemented |
| `05-reports.md` | Reports & Daily Log | Implemented |
| `06-documents.md` | Document Center | Implemented |
| `07-file-uploads.md` | File Upload Infrastructure | Implemented |
| `08-announcements.md` | Announcements | Implemented (not fully verified) |
| `09-rehearsal-report-overhaul.md` | Rehearsal Report Overhaul | Planned |
| `10-calls-calendar.md` | Call Schedule Calendar | Implemented |
| `12-rehearsal-templates.md` | Rehearsal Templates & Schedule Generation | Implemented (not browser-verified) |
| `13-document-folder-privacy.md` | Role-Restricted (Private) Document Folders | Implemented (not browser-verified) |
| `16-people-directory.md` | People Directory & Mass Upload | Implemented (not fully verified) |
| `17-push-notifications.md` | Web Push Notifications (PWA) | Implemented (not fully verified) |
| `20-rehearsal-video.md` | Rehearsal Video (link-only embeds + timestamp notes) | Implemented (not browser-verified) |
| `21-designer-seats.md` | Designer Seats (à la carte sub-product + Focus view) | Proposed / not implemented |
