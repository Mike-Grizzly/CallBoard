# Feature Spec: Notes ("My Notes")

## Status: IMPLEMENTED — UI ported to warm theatre design system

## Overview

Per-production personal notes workspace for each team member. Notes are always
private to their author. All production members can create notes; higher-permission
roles (admin, producer, director, stage_manager) can manage the shared tag library.

## Data model

### `note_tags` table
Org-level tags shared across all productions.
- `id` UUID PK
- `organization_id` FK → organizations
- `name` TEXT
- `color` TEXT (hex)
- `created_by` FK → profiles
- `created_at`

Default tags seeded lazily on first access via `getNoteTagsByOrg()`:
Follow-up, Blocking, Props, Costumes, Technical, Safety.

### `production_notes` table
- `id` UUID PK
- `production_id` FK → productions
- `created_by` FK → profiles
- `title` TEXT (default "")
- `content` TEXT (TipTap HTML, default "")
- `is_todo` BOOLEAN (default false)
- `is_completed` BOOLEAN (default false)
- `is_pinned` BOOLEAN (default false)
- `tag_id` FK → note_tags (nullable, SET NULL on delete)
- `due_date` TEXT nullable — auto-populated to today on creation
- `visibility` TEXT (always stored as "private"; toggle removed from UI)
- `created_at`, `updated_at` TIMESTAMPTZ

## Permissions

| Capability | admin | producer | director | choreographer | stage_manager | cast | crew |
|---|---|---|---|---|---|---|---|
| notes:view | Y | Y | Y | Y | Y | Y | Y |
| notes:create | Y | Y | Y | Y | Y | Y | Y |
| notes:manage_tags | Y | Y | Y | — | Y | — | — |

`notes:create` gates editing and deleting (authors only; `notes:manage_tags`
overrides for moderation).

## Feature module

`features/notes/`
- `constants.ts` — DEFAULT_NOTE_TAGS (6 defaults), TAG_COLOR_OPTIONS (9 hex colours), NoteFilter type
- `queries.ts` — getNotesByProduction, getNoteTagsByOrg (with lazy seed), types
- `actions.ts` — createNote (auto-sets dueDate=today), updateNote, deleteNote, createNoteTag, deleteNoteTag

## Routes

- `/productions/[slug]/notes` — server page + NotesPanel client component

## UI components

`app/(app)/productions/[slug]/notes/`
- `page.tsx` — server component, fetches notes + tags, checks auth/permissions
- `notes-panel.tsx` — client component containing:
  - `NotesPanel` — two-column grid layout (360px list + 1fr editor), filter state, optimistic creates
  - `NoteRow` — compact note row; to-do circle is a clickable button; animated strikethrough + colour fade on completion
  - `NoteEditor` — right panel with TipTap editor, header controls, auto-save
  - `TagManager` — modal (React portal into document.body, backdrop blur) for adding/removing org tags (manage_tags only)

## Key behaviours

- **Tab label:** "My Notes" (3rd tab in the production strip, after Rehearsal Reports)
- **Always private:** Notes are personal. Visibility toggle was removed; all notes are author-only
- **Note list** shows pinned notes grouped at top, then all others
- **Filter tabs:** All, To-do, Pinned, Notes (Done filter removed)
- **To-do filter:** Shows all to-dos; completed ones sort to the bottom with strikethrough
- **Strikethrough animation:** Checking a to-do animates a line across the title (350ms) and fades the colour simultaneously; the item holds its list position during the animation before sinking to the bottom (~420ms delay)
- **To-do row check:** Circle/checkmark in the list is directly clickable without opening the note
- **Auto-date:** New notes get today's date pre-filled in the due date field
- **Auto-save:** TipTap `onUpdate` and title `onChange` debounced 600ms → `updateNote` server action
- **To-do toggle:** Header circle/check button converts note into a checkable task
- **Tag picker:** Dropdown in header; defaults seeded on first note load
- **Tag manager:** Settings icon (manage_tags only) opens a full-viewport portal modal with backdrop blur
- **Optimistic create:** New note added to list immediately with server-returned ID
- **Delete:** Confirm dialog → server action → removes from local state

## Production detail integration

- Notes card on production overview links to the tab
- "My Notes" tab added to ProductionTabs bar (position 3, visible to all with notes:view)

## Known limitations / Phase 2 candidates

- Visibility is always "private" at the UI level but NOT enforced at the query level — all production members technically see all notes in the DB. Should be enforced before production use
- No real-time updates — other team members' new notes appear only on page reload
- No search or full-text filter
- Due dates are stored as text strings (no dedicated date picker widget beyond browser native `<input type="date">`)
- Cross-production notes view deferred to a later step
