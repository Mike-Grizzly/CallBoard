# Feature Spec: Notes

## Status: IMPLEMENTED (not fully verified)

## Overview

Per-production notes with a Notion-like two-panel interface. Notes are shared within the production team but can be toggled private (visible only to author). All production members can view and create notes. Higher-permission roles (admin, producer, director, stage_manager) can manage the tag library.

## Data model

### `note_tags` table
Org-level tags shared across all productions.
- `id` UUID PK
- `organization_id` FK → organizations
- `name` TEXT
- `color` TEXT (hex)
- `created_by` FK → profiles
- `created_at`

Default tags are seeded lazily on first access via `getNoteTagsByOrg()`.

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
- `due_date` TEXT nullable
- `visibility` TEXT ("private" | "shared", default "private")
- `created_at`, `updated_at` TIMESTAMPTZ

## Permissions

| Capability | admin | producer | director | choreographer | stage_manager | cast | crew |
|---|---|---|---|---|---|---|---|
| notes:view | Y | Y | Y | Y | Y | Y | Y |
| notes:create | Y | Y | Y | Y | Y | Y | Y |
| notes:manage_tags | Y | Y | Y | — | Y | — | — |

`notes:create` also gates editing and deleting (authors only; manage_tags overrides for moderation).

## Feature module

`features/notes/`
- `constants.ts` — DEFAULT_NOTE_TAGS, TAG_COLOR_OPTIONS, NoteFilter type
- `queries.ts` — getNotesByProduction, getNoteTagsByOrg (with lazy seed), types
- `actions.ts` — createNote, updateNote, deleteNote, createNoteTag, deleteNoteTag

## Routes

- `/productions/[slug]/notes` — server page + NotesPanel client component

## UI components

`app/(app)/productions/[slug]/notes/`
- `page.tsx` — server component, fetches notes + tags, checks auth/permissions
- `notes-panel.tsx` — client component containing:
  - `NotesPanel` — two-panel layout, filter state, optimistic creates
  - `NoteListItem` — compact note row with icon, title, tag chip, pin indicator
  - `NoteEditor` — right panel with TipTap editor, header controls, auto-save
  - `TagManager` — modal for adding/removing org tags (manage_tags only)

## Key behaviors

- **Note list** shows pinned notes grouped at top, then all others
- **Filter tabs:** All, To-do, Pinned, Notes, Done
- **Auto-save:** TipTap `onUpdate` and title `onChange` debounced 600ms → `updateNote` server action
- **To-do toggle:** Header circle/check button converts note into a checkable task
- **Visibility toggle:** Eye icon switches between "private" (only author sees footer label) and "shared"; note is always readable to team regardless — visibility is informational in Phase 1
- **Tag picker:** Dropdown in header; defaults seeded on first note load
- **Tag manager:** Settings icon (manage_tags only) opens modal with add/remove
- **Optimistic create:** New note added to list immediately with server-returned ID
- **Delete:** Confirm dialog → server action → removes from local state

## Production detail integration

- Notes card added to production overview grid (all roles with notes:view)
- Notes tab added to ProductionTabs bar

## Known limitations / Phase 2 candidates

- Visibility "private" vs "shared" is display-only — no query-level filtering (all production members see all notes in the list regardless of visibility). This should be enforced at query level before production use.
- No real-time updates — other team members' new notes appear only on page reload
- No search or full-text filter
- Tag colors are a fixed preset palette — no color picker
- Due dates are stored as text strings (no date picker widget beyond browser native `<input type="date">`)
- Cross-production notes view (dashboard glimpse) deferred to a later step
