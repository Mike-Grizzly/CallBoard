# QA & Product Workflow Backlog

Source: Phase 2 external review — QA / product workflow notes (section 5). These are
product, workflow, and theater-domain-fit items, **not** security findings (those were
handled separately and are not catalogued here). Safe to track in the repo.

- **Status:** ☐ todo · ◐ in progress · ☑ done
- **Type:** 🐞 bug · ✨ polish · 🏗️ feature · 🤔 product decision
- **Effort:** XS (<1h) · S (½ day) · M (1–2 days) · L (multi-day) — rough estimates.

**Process (owner request):** bugs are fixed directly. For **polish and feature** items,
the problem and the intended change are written up for owner review **before** coding,
so the owner understands what is changing.

---

## Decisions (owner, 2026-06-29)

1. **Casting model — multi-character tracks: APPROVED.** Support a single person cast in
   two or more characters (e.g. an actor covering multiple supporting roles): one person
   → multiple character slots / role grouping. Today the model enforces one-person-one-role.
2. **Blocking list membership: APPROVED, with an exception.** The blocking list shows the
   show's characters plus uncast/unassigned people in the production. EXCLUDE admin, crew,
   designers, and production-management roles. EXCEPTION: include performer-adjacent roles
   such as **Dance Captain** (a role just below the choreographer that also appears on stage).
3. **Union productions: APPROVED (target market).** Proscene should support union
   productions. Implementation approach to be proposed when this batch is scoped — likely a
   production-level union flag plus per-person union status, feeding break/attendance rules
   and report fields.
4. **Non-cast people in cast assignment: filter out.** Only castable people appear in the
   cast-assignment list.

---

## Execution order

1. **Batch 1 — Real bugs** ← in progress
2. **Batch 2 — Polish sweep**
3. **Batch 3 — Report inputs wired to real data** (scenes, characters, people)
4. **Batch 4 — Attendance model** (schema change)
5. **Batch 5 — Blocking enhancements** (model now decided — see Decision 2)
6. **Batch 6 — Setup/config & presets**

Polish/feature items each get a problem-and-fix write-up before they are coded.

---

## A. Setup & Production Creation

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ☑ | Reject absurd/invalid years in date validation | 🐞 | XS | 1 |
| ☑ | Copy/paste dates between fields | ✨ | S | 2 |
| ☑ | Date entry overall is cumbersome (DateField + react-day-picker) | ✨ | M | 2 |
| ☑ | Drag-and-drop file upload (reusable `<FileDropzone>`) | ✨ | M | 2 |
| ☑ | Role/character labels not capitalized (AI-parse data, not CSS) | ✨ | XS | 2 |
| ☑ | Department thumbnails hard to read in dark mode | ✨ | S | 2 |
| ☑ | Non-cast people show up during cast assignment → filter out | 🐞 | S–M | 2 |
| ☐ | Configurable season options (workspace level) | 🏗️ | M | 6 |
| ☐ | Production/name presets | 🏗️ | S–M | 6 |
| ☐ | Department-based dropdowns for role creation | 🏗️ | M | 6 |
| ☐ | Workspace presets for a typical show structure | 🏗️ | M–L | 6 |
| ☐ | More flexible rehearsal patterns | 🏗️ | M | 6 |
| ☐ | Separate weekday/weekend rehearsal times | 🏗️ | M | 6 |
| ☐ | Setup wizard saves progress mid-flow | 🏗️ | L | 6 |
| ☐ | Multi-character tracks (Decision 1) | 🏗️ | L | 3/6 |

## B. Script / PDF viewing

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ◐ | PDF viewer fails on first click, recovers after tab switch | 🐞 | M | 1 |
| ◐ | Script PDF download navigates away instead of new tab | 🐞 | S | 1 |
| ☑ | Read-only doc/PDF controls look editable to non-editors (closes S3) | 🐞 | S–M | 1 |
| ☑ | Clearer file-selection control (the bare white square) | ✨ | S | 2 |

## C. Rehearsal Reports

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ☑ | New items don't appear until manual refresh after save/send | 🐞 | M | 1 |
| ☑ | Placeholder text should name the input type ("Scene Name") | ✨ | XS | 2 |
| ☐ | Clearer line-note input guidance | ✨ | S | 2 |
| ☐ | Reorderable department notes | 🏗️ | S–M | 3 |
| ☐ | Scenes-worked autofill from the show's scenes | 🏗️ | M | 3 |
| ☐ | Scenes-worked: duration + timestamp ranges | 🏗️ | S–M | 3 |
| ☐ | Line-note character dropdowns | 🏗️ | M | 3 |
| ☐ | Incident person dropdown + free-text option | 🏗️ | M | 3 |
| ☐ | Richer attendance states (excused/unexcused absence + late) | 🏗️ | M–L | 4 |
| ☐ | SM toggle for excused/unexcused visibility | 🏗️ | M | 4 |
| ☐ | Union/non-union status per person (Decision 3) | 🏗️ | M | 4 |

## D. Blocking / Stage Setup

| Status | Item | Type | Effort | Batch |
|---|---|---|---|---|
| ☑ | "Enter" button is an unlabeled dark square | 🐞 | S | 1 |
| ☐ | Set pieces should start empty | ✨ | S | 2 |
| ☑ | Ground-plan window should be larger (global rail collapse + Focus mode) | ✨ | S | 2 |
| ☐ | Upload a ground plan directly from the blocking picker | 🏗️ | M | 5 |
| ☐ | Ground-plan zoom | 🏗️ | M | 5 |
| ☐ | Draggable proscenium left/right boundaries | 🏗️ | M | 5 |
| ☐ | Set-piece preset library | 🏗️ | M–L | 5 |
| ☐ | Custom set-piece uploads saved to a reusable show library | 🏗️ | M | 5 |
| ☐ | Blocking list = characters + uncast people, excl. admin/mgmt (Decision 2) | 🏗️ | M | 5 |

---

## Batch 1 progress (2026-06-29)

- ☑ **Report list/detail staleness** — `createReport`/`updateReport` now
  `revalidatePath` the reports list, the report detail, and the production
  overview. Fixed.
- ☑ **Ungated folder dropdown** — `FolderSelect` is read-only for users without
  `documents:upload`. Fixed. The script viewer's scene/song edit controls were
  found to be *already* gated on `canManage = documents:upload`, so true
  non-editors (cast/crew) don't see them — worth a browser confirm but no code
  gap found there.
- ◐ **PDF viewer fails on first click, recovers after tab switch** — owner could
  NOT reproduce (viewer rendered fine on first open). Suspected to be a
  first-*upload* loading state rather than a navigation race; proposed follow-up
  is loading indicators wherever the PDF/script is still fetching. Left OPEN to
  revisit with fresh test accounts after merge. No code change made.
- ◐ **"Script PDF download navigates away"** — owner could NOT reproduce on
  desktop Chrome (PC + Mac): downloads fire immediately as intended. Consistent
  with the code (signed URL with `{ download }` = attachment disposition; "View"
  opens a new tab; in-viewer exports are blobs). Left OPEN for cross-device /
  cross-browser testing post-merge (Safari/Firefox/mobile are the likely
  variance). No code change made.
- ☑ **"Enter" button black-on-black on stage setup** — FIXED. Root cause was a
  CSS cascade-layer bug, not the tokens: the global `button`/`input`/`select`
  resets in `globals.css` were UNLAYERED, and in Tailwind v4 unlayered rules beat
  layered utilities regardless of specificity. So `button { color: inherit }`
  overrode the `text-[color:var(--primary-foreground)]` utility on the shadcn
  `<Button>`, making the default CTA's label inherit the surrounding ink →
  black-on-black in light mode (white-on-white in dark). Fix: wrapped those resets
  in `@layer base` so utilities win again. This also corrects any other
  utility-styled control that was hit by the same override. (Build verified;
  worth a quick visual sanity-check on buttons app-wide on the preview deploy.)

## Batch 2 progress (polish sweep, 2026-06-30)

- ☑ **Date entry** — new `<DateField>` (`components/ui/date-field.tsx`): typeable
  /pasteable MM/DD/YYYY committed on blur/Enter, calendar popover
  (react-day-picker), weekday hint, min/max bounds. Wired into the new-production
  wizard's four date fields.
- ☑ **Absurd-year validation** — `yearOutOfRange()` rejects typos (year outside
  now-5…now+10) on all four production dates; enforced server-side in
  `validateProductionForm` and client-side via the DateField bounds.
- ☑ **Drag-and-drop uploads** — see the coverage section below.
- ☑ **Role/character capitalization** — AI-parse role names and scene titles are
  title-cased on apply (`capitalizeWords` in `features/scripts/actions.ts`); the
  parser stores verbatim, so this is a display fix at apply-time, not CSS.
- ☑ **Non-cast filtered from cast assignment** — the slot picker on the
  cast/crew board lists only `role === "cast"` people (Decision 4).
- ☑ **Report placeholder text** — empty-state inputs now name the field
  ("Scene name", etc.) instead of generic prompts.
- ☑ **Department thumbnails in dark mode** — the dark `-soft` department tokens
  were too close to the page ink to read. Bumped lightness/chroma on the six
  `--c-*-soft` tokens in `globals.css` (dark block only) so the chips read
  against the dark surface. Light mode unchanged.
- ☑ **Ground-plan window too small** — added an **expand-canvas** toggle to the
  blocking toolbar (`blocking-canvas.tsx`). It collapses both side panels
  (off-stage cast + set pieces/comments) and drops the shell to a single `1fr`
  column so the ground plan gets the full width. Independent of the existing
  fullscreen toggle, so the two compose (fullscreen + expanded = maximum room).
  Available in the standalone page and Focus View; off by default.

Still open in Batch 2: **Set pieces should start empty** (✨) and **clearer
line-note input guidance** (✨) — small, not blocking the merge; carry forward.

## Owner test round (2026-06-30)

Owner tested the batch-2 work in light mode. Bugs found were fixed directly;
feature-shaped requests are written up for approval before coding (per process).

Fixed directly (pushed):
- 🐞 **Date field didn't auto-format / calendar opened in the past** — typing
  bare digits now masks to MM/DD/YYYY live; pasted ISO/US dates commit on paste;
  the calendar opens on today (clamped to range), not the year-5 minimum.
- 🐞 **Upload row misalignment** — the per-file row top-aligns so the
  filename/size caption no longer pushes the Type/Folder selects off the title.
- 🐞 **"Save draft" stayed on the report** — draft save now returns to the
  reports list; distribute / save-changes still open the report.

Confirmed working by owner: the black-on-black button fix (light + dark) and the
report list refresh-on-save.

Owner chose to hold the merge and build the feature requests into this branch.

Built into the branch (owner-approved 2026-06-30):
- ☑ ✨ **Script auto-parse opt-out toggle** — "Auto-fill cast from this script"
  (on by default) in the wizard. Off = the PDF uploads as the default script,
  no parse; run the AI read later from the Script tab. Added
  `attachWizardScriptByPath` for the un-parsed attach.
- ☑ 🏗️ **Documents upload v2** — checkbox multi-select + bulk folder/type
  assignment, pre-upload thumbnails (image + PDF first page), scroll-count
  header + bottom fade, remove-row slide/fade animation.
- ☑ ✨ **Setup-wizard department icons** — now fully monochrome (neutral
  surface, ink that strengthens when active); selection shown by card chrome.
- ☑ 🏗️ **Blocking "more room" rework** — removed the expand-canvas toggle and
  the blocking tool's local fullscreen button. Added a **global rail collapse**
  (icon-strip, persisted, flash-free) and made **Focus mode** the clear
  full-screen path (relabeled + accented entry button).

- ☑ 🛠️ **Cast-role test login** — created a dedicated `cast` account (email
  confirmed) in the Default Organization, cast on *The Color Purple*, for
  verifying read-only gating. Credentials shared privately with the owner, not
  stored here. Delete it after testing (or ask and it'll be removed).

Second test pass (2026-06-30):
- ☑ 🐞 **Test login "Database error querying schema"** — the manually-created
  auth user had NULL token columns (confirmation_token, recovery_token,
  email_change, email_change_token_new); GoTrue scans those as non-null
  strings, so login failed. Set them to '' — login works. (Lesson: when
  creating Supabase users by SQL, default those columns to '', not NULL.)
- ☑ 🐞 **Upload rows collapsed to slivers** — rows carry `overflow:hidden` for
  the remove animation, which drops a flex item's min-height floor to 0, so the
  capped-height list squeezed them instead of scrolling. Added `flex-shrink:0`.
- ☑ ✨ **Smoother rail collapse** — animated `grid-template-columns` on `.app`
  (reduced-motion-gated); labels nowrap so they don't reflow mid-slide.
- ☑ ✨ **Doc-list delete animation** — the documents list now plays the same
  slide/fade-out as the upload rows when a doc is deleted (list owns the delete
  via `onRequestDelete`).

Third test pass (2026-06-30, cast test account):
- ☑ 🐞 **Cast (and every returning login) forced to org "setup" screen** —
  `login()` redirected to `/setup`, which only bounces to `/dashboard` when the
  org's `onboardedAt` is set; the Default Organization was never onboarded, so
  everyone landed on the setup form. Login now goes to `/dashboard`; `/setup` is
  guarded to `settings:manage` (admins) so members never see it. (New-org
  onboarding still runs via the email-confirm callback.)
- ☑ 🐞 **Document drawer folder control ungated** — the drawer's folder
  `<select>` wasn't gated, so cast saw an editable control whose change silently
  no-ops (`moveDocument` is `documents:upload`-only). Now read-only for
  non-editors (canManage threaded through).
- ☑ ✨ **Document drawer animation** — now uses the app's side-drawer
  slide+fade (pp-slide / pp-fade) instead of the generic fade-up.
- ✔️ **Cast personal bookmarks** — confirmed working: the "Bookmark" button is
  ungated and bookmarks are per-user (saved on a production-access check, not
  `documents:upload`). Manager-only gating is only the SHARED cue/scene/AI
  structure. No change needed.

Still open from this round:
- 🏗️ **Choreographer team spot** — surfaces only when the Choreography
  department is enabled (off by default in the wizard). Open question: make it
  always-on like Director/SM/Producer, or leave it department-driven.
- 🤔🏗️ **Org = paid account model (Canva/Monday style)** — owner wants org
  creation treated as a deliberate, billable action, and a clearer free (personal
  user) vs paid (org member) entitlement split. Personal accounts get view/basic
  only; an org invite grants paid features while in that org; switching back to a
  personal workspace drops to free. This is a billing/entitlement architecture
  piece — needs its own scoping pass, not a quick fix. Deferred for a dedicated
  write-up.

## Drag-and-drop upload coverage (`<FileDropzone>`)

Reusable component in `components/ui/file-dropzone.tsx` (drag-or-click,
single/multi, accept filter, theme-correct). Wired in:
- **Documents** — multi-file with per-file rows (Title/Type/Folder + remove),
  caps (20 files / 64MB each / 200MB total), scrollable list.
- **New-production wizard** — single-file script (drop box added; the existing
  button is kept for people who prefer it).
- **Focus/Studio doc/floorplan upload** (`focus-doc-upload.tsx`) — single-file.
- **Focus/Studio script upload** already had its own drag-drop, left as is.

Remaining surfaces that still use plain file inputs (can adopt `<FileDropzone>`
incrementally; not script/floorplan so lower priority): workspace logo, the
onboarding/setup logo, report attachments, blocking custom set-piece upload,
and the people-import modal.

## Already shipped (from this section)

- ☑ **Draft rehearsal reports hidden from cast/crew** — fixed in the security-hardening
  work (PR #65); enforced server-side via `canViewDraftReports`.
