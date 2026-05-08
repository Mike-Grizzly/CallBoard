"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import {
  Pin,
  Trash2,
  Plus,
  Circle,
  CheckCircle2,
  PenLine,
  Tag,
  Calendar,
  Eye,
  EyeOff,
  Settings,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";
import type { NoteWithAuthor, NoteTagRow } from "@/features/notes/queries";
import type { NoteFilter } from "@/features/notes/constants";
import { TAG_COLOR_OPTIONS } from "@/features/notes/constants";
import {
  createNote,
  updateNote,
  deleteNote,
  createNoteTag,
  deleteNoteTag,
} from "@/features/notes/actions";

// ── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1 hover:bg-[color:var(--accent)]",
        active && "bg-[color:var(--accent)] text-[color:var(--primary)]",
      )}
    >
      {children}
    </button>
  );
}

function EditorToolbar({
  editor,
}: {
  editor: ReturnType<typeof useEditor>;
}) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[color:var(--border)] px-2 py-1.5">
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="mx-1 h-4 w-px bg-[color:var(--border)]" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="mx-1 h-4 w-px bg-[color:var(--border)]" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <span className="text-xs font-medium">L</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <span className="text-xs font-medium">C</span>
      </ToolbarBtn>
      <div className="mx-1 h-4 w-px bg-[color:var(--border)]" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>
  );
}

// ── Note editor (right panel) ─────────────────────────────────────────────────

function NoteEditor({
  note,
  tags,
  currentUserId,
  canManageTags,
  productionSlug,
  onClose,
  onNoteUpdated,
}: {
  note: NoteWithAuthor;
  tags: NoteTagRow[];
  currentUserId: string;
  canManageTags: boolean;
  productionSlug: string;
  onClose: () => void;
  onNoteUpdated: (updated: Partial<NoteWithAuthor> & { id: string }) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [isTodo, setIsTodo] = useState(note.isTodo);
  const [isCompleted, setIsCompleted] = useState(note.isCompleted);
  const [tagId, setTagId] = useState<string | null>(note.tagId ?? null);
  const [dueDate, setDueDate] = useState(note.dueDate ?? "");
  const [visibility, setVisibility] = useState(note.visibility);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [, startTransition] = useTransition();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthor = note.createdBy === currentUserId;

  const scheduleSave = useCallback(
    (fields: Parameters<typeof updateNote>[2]) => {
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        startTransition(async () => {
          await updateNote(note.id, productionSlug, fields);
          setSaveStatus("saved");
          onNoteUpdated({ id: note.id, ...fields });
        });
      }, 600);
    },
    [note.id, productionSlug, onNoteUpdated],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: note.content,
    onUpdate: ({ editor: e }) => {
      scheduleSave({ content: e.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-4 py-3 focus:outline-none min-h-[200px]",
      },
    },
  });

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave({ title: val });
  }

  function handlePinToggle() {
    const next = !isPinned;
    setIsPinned(next);
    startTransition(async () => {
      await updateNote(note.id, productionSlug, { isPinned: next });
      onNoteUpdated({ id: note.id, isPinned: next });
    });
  }

  function handleTodoToggle() {
    const next = !isTodo;
    setIsTodo(next);
    if (!next) setIsCompleted(false);
    startTransition(async () => {
      await updateNote(note.id, productionSlug, {
        isTodo: next,
        isCompleted: next ? isCompleted : false,
      });
      onNoteUpdated({
        id: note.id,
        isTodo: next,
        isCompleted: next ? isCompleted : false,
      });
    });
  }

  function handleCompleteToggle() {
    const next = !isCompleted;
    setIsCompleted(next);
    startTransition(async () => {
      await updateNote(note.id, productionSlug, { isCompleted: next });
      onNoteUpdated({ id: note.id, isCompleted: next });
    });
  }

  function handleTagChange(id: string | null) {
    setTagId(id);
    setShowTagPicker(false);
    startTransition(async () => {
      await updateNote(note.id, productionSlug, { tagId: id });
      onNoteUpdated({ id: note.id, tagId: id ?? undefined });
    });
  }

  function handleDueDateChange(val: string) {
    setDueDate(val);
    scheduleSave({ dueDate: val || null });
  }

  function handleVisibilityToggle() {
    const next = visibility === "private" ? "shared" : "private";
    setVisibility(next);
    startTransition(async () => {
      await updateNote(note.id, productionSlug, { visibility: next });
      onNoteUpdated({ id: note.id, visibility: next });
    });
  }

  async function handleDelete() {
    if (!confirm("Delete this note?")) return;
    await deleteNote(note.id, productionSlug);
    onNoteUpdated({ id: note.id, _deleted: true } as never);
    onClose();
  }

  const selectedTag = tags.find((t) => t.id === tagId);
  const authorName =
    note.createdByFirstName || note.createdByLastName
      ? `${note.createdByFirstName} ${note.createdByLastName}`.trim()
      : note.createdByEmail;

  const canEdit = isAuthor || canManageTags;

  return (
    <div className="flex h-full flex-col">
      {/* Header row */}
      <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-4 py-2">
        {/* Tag badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => canEdit && setShowTagPicker((p) => !p)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
              selectedTag
                ? "text-white"
                : "bg-[color:var(--accent)] text-[color:var(--muted-foreground)]",
              canEdit && "hover:opacity-80",
            )}
            style={selectedTag ? { backgroundColor: selectedTag.color } : {}}
            title={canEdit ? "Change tag" : undefined}
          >
            <Tag className="h-3 w-3" />
            {selectedTag ? selectedTag.name : "No tag"}
          </button>

          {showTagPicker && (
            <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-1 shadow-md">
              <button
                type="button"
                onClick={() => handleTagChange(null)}
                className="w-full rounded px-2 py-1 text-left text-xs text-[color:var(--muted-foreground)] hover:bg-[color:var(--accent)]"
              >
                No tag
              </button>
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTagChange(t.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-[color:var(--accent)]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                  {t.id === tagId && <Check className="ml-auto h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due date */}
        {canEdit && (
          <div className="flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
            <Calendar className="h-3 w-3" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="border-0 bg-transparent text-xs text-[color:var(--muted-foreground)] focus:outline-none"
            />
          </div>
        )}
        {!canEdit && dueDate && (
          <span className="flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
            <Calendar className="h-3 w-3" />
            {dueDate}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* To-do toggle */}
          {canEdit && (
            <button
              type="button"
              onClick={handleTodoToggle}
              title={isTodo ? "Remove to-do" : "Make to-do"}
              className={cn(
                "rounded p-1.5 hover:bg-[color:var(--accent)]",
                isTodo && "text-[color:var(--primary)]",
              )}
            >
              {isTodo ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Visibility toggle */}
          {canEdit && (
            <button
              type="button"
              onClick={handleVisibilityToggle}
              title={
                visibility === "private" ? "Visible only to you" : "Shared with team"
              }
              className="rounded p-1.5 hover:bg-[color:var(--accent)]"
            >
              {visibility === "shared" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Pin */}
          {canEdit && (
            <button
              type="button"
              onClick={handlePinToggle}
              title={isPinned ? "Unpin" : "Pin"}
              className={cn(
                "rounded p-1.5 hover:bg-[color:var(--accent)]",
                isPinned && "text-amber-500",
              )}
            >
              <Pin className="h-4 w-4" />
            </button>
          )}

          {/* Delete */}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete note"
              className="rounded p-1.5 text-[color:var(--muted-foreground)] hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 hover:bg-[color:var(--accent)]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-6">
        {isTodo && canEdit && (
          <button
            type="button"
            onClick={handleCompleteToggle}
            className="mb-3 flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]"
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
            <span>{isCompleted ? "Mark incomplete" : "Mark complete"}</span>
          </button>
        )}

        {canEdit ? (
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className={cn(
              "w-full border-0 bg-transparent text-3xl font-semibold tracking-tight focus:outline-none",
              isCompleted && "text-[color:var(--muted-foreground)] line-through",
            )}
          />
        ) : (
          <h2
            className={cn(
              "text-3xl font-semibold tracking-tight",
              isCompleted && "text-[color:var(--muted-foreground)] line-through",
            )}
          >
            {title || "Untitled"}
          </h2>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {canEdit ? (
          <div className="mx-4 mt-4 overflow-hidden rounded-md border border-[color:var(--border)]">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none px-6 py-4"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[color:var(--border)] px-4 py-2 text-xs text-[color:var(--muted-foreground)]">
        <span>
          {saveStatus === "saving" ? "Saving…" : "Saved automatically"}
          {" · "}
          {visibility === "shared" ? "Visible to team" : "Visible only to you"}
        </span>
        <span>
          {authorName} ·{" "}
          {new Date(note.updatedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ── Note list item ────────────────────────────────────────────────────────────

function NoteListItem({
  note,
  tags,
  selected,
  onClick,
}: {
  note: NoteWithAuthor;
  tags: NoteTagRow[];
  selected: boolean;
  onClick: () => void;
}) {
  const tag = tags.find((t) => t.id === note.tagId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg px-3 py-2.5 text-left transition-colors",
        selected
          ? "bg-[color:var(--accent)]"
          : "hover:bg-[color:var(--accent)]/50",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0 text-[color:var(--muted-foreground)]">
          {note.isTodo ? (
            note.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )
          ) : (
            <PenLine className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              note.isCompleted &&
                "text-[color:var(--muted-foreground)] line-through",
            )}
          >
            {note.title || "Untitled"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {tag && (
              <span
                className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            )}
            {note.dueDate && (
              <span className="text-xs text-[color:var(--muted-foreground)]">
                {note.dueDate}
              </span>
            )}
          </div>
        </div>
        {note.isPinned && (
          <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        )}
      </div>
    </button>
  );
}

// ── Tag manager modal ─────────────────────────────────────────────────────────

function TagManager({
  tags,
  organizationId,
  onClose,
  onTagAdded,
  onTagRemoved,
}: {
  tags: NoteTagRow[];
  organizationId: string;
  onClose: () => void;
  onTagAdded: (tag: NoteTagRow) => void;
  onTagRemoved: (tagId: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLOR_OPTIONS[0]);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function handleAdd() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createNoteTag(organizationId, name.trim(), color);
      if (result.error) {
        setError(result.error);
      } else if (result.tag) {
        onTagAdded(result.tag as NoteTagRow);
        setName("");
        setError("");
      }
    });
  }

  function handleRemove(tagId: string) {
    startTransition(async () => {
      await deleteNoteTag(tagId, organizationId);
      onTagRemoved(tagId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Manage Tags</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-[color:var(--accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm">{tag.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="rounded p-0.5 text-[color:var(--muted-foreground)] hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-center text-sm text-[color:var(--muted-foreground)]">
              No tags yet.
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-[color:var(--border)] pt-4">
          <p className="text-xs font-medium text-[color:var(--muted-foreground)]">
            Add tag
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
          />
          <div className="flex flex-wrap gap-1.5">
            {TAG_COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2",
                  color === c
                    ? "border-[color:var(--foreground)]"
                    : "border-transparent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-md bg-[color:var(--primary)] px-3 py-1.5 text-sm font-medium text-[color:var(--primary-foreground)] hover:opacity-90"
          >
            Add Tag
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<NoteFilter, string> = {
  all: "All",
  todo: "To-do",
  pinned: "Pinned",
  notes: "Notes",
  done: "Done",
};

export function NotesPanel({
  notes: initialNotes,
  tags: initialTags,
  productionId,
  productionSlug,
  currentUserId,
  canCreate,
  canManageTags,
  organizationId,
}: {
  notes: NoteWithAuthor[];
  tags: NoteTagRow[];
  productionId: string;
  productionSlug: string;
  currentUserId: string;
  canCreate: boolean;
  canManageTags: boolean;
  organizationId: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState(initialTags);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [showTagManager, setShowTagManager] = useState(false);
  const [, startTransition] = useTransition();

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const filtered = notes.filter((n) => {
    if (filter === "todo") return n.isTodo && !n.isCompleted;
    if (filter === "pinned") return n.isPinned;
    if (filter === "notes") return !n.isTodo;
    if (filter === "done") return n.isCompleted;
    return true;
  });

  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  function handleCreate() {
    startTransition(async () => {
      const result = await createNote(productionId, productionSlug);
      if (result.id) {
        // Add optimistic note
        const optimistic: NoteWithAuthor = {
          id: result.id,
          productionId,
          createdBy: currentUserId,
          title: "",
          content: "",
          isTodo: false,
          isCompleted: false,
          isPinned: false,
          tagId: null,
          dueDate: null,
          visibility: "private",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByFirstName: "",
          createdByLastName: "",
          createdByEmail: "",
        };
        setNotes((prev) => [optimistic, ...prev]);
        setSelectedId(result.id);
      }
    });
  }

  function handleNoteUpdated(
    updated: Partial<NoteWithAuthor> & { id: string; _deleted?: boolean },
  ) {
    if (updated._deleted) {
      setNotes((prev) => prev.filter((n) => n.id !== updated.id));
      setSelectedId(null);
      return;
    }
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
    );
  }

  return (
    <div className="flex h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-xl border border-[color:var(--border)]">
      {/* Left sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-[color:var(--border)]">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold">Notes</h2>
          <div className="flex items-center gap-1">
            {canManageTags && (
              <button
                type="button"
                onClick={() => setShowTagManager(true)}
                title="Manage tags"
                className="rounded p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--accent)]"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="flex items-center gap-1 rounded-md bg-[color:var(--primary)] px-2.5 py-1 text-xs font-medium text-[color:var(--primary-foreground)] hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 overflow-x-auto border-b border-[color:var(--border)] px-2 pb-2">
          {(["all", "todo", "pinned", "notes", "done"] as NoteFilter[]).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f
                    ? "bg-[color:var(--accent)] text-[color:var(--foreground)]"
                    : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]",
                )}
              >
                {FILTER_LABELS[f]}
              </button>
            ),
          )}
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto p-2">
          {notes.length === 0 && (
            <div className="mt-8 text-center">
              <PenLine className="mx-auto mb-2 h-8 w-8 text-[color:var(--muted-foreground)]" />
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No notes yet.
              </p>
              {canCreate && (
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                  Click + New to get started.
                </p>
              )}
            </div>
          )}

          {pinned.length > 0 && (
            <>
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Pinned
              </p>
              {pinned.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  tags={tags}
                  selected={selectedId === note.id}
                  onClick={() => setSelectedId(note.id)}
                />
              ))}
              {unpinned.length > 0 && (
                <p className="mb-1 mt-3 px-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  All
                </p>
              )}
            </>
          )}

          {unpinned.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              tags={tags}
              selected={selectedId === note.id}
              onClick={() => setSelectedId(note.id)}
            />
          ))}

          {filtered.length === 0 && notes.length > 0 && (
            <p className="mt-4 text-center text-sm text-[color:var(--muted-foreground)]">
              No notes match this filter.
            </p>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            tags={tags}
            currentUserId={currentUserId}
            canManageTags={canManageTags}
            productionSlug={productionSlug}
            onClose={() => setSelectedId(null)}
            onNoteUpdated={handleNoteUpdated}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <PenLine className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-medium text-[color:var(--muted-foreground)]">
              Select a note to view it
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-3 flex items-center gap-1.5 rounded-md bg-[color:var(--primary)] px-3 py-1.5 text-sm font-medium text-[color:var(--primary-foreground)] hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New note
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tag manager modal */}
      {showTagManager && (
        <TagManager
          tags={tags}
          organizationId={organizationId}
          onClose={() => setShowTagManager(false)}
          onTagAdded={(tag) => setTags((prev) => [...prev, tag])}
          onTagRemoved={(id) =>
            setTags((prev) => prev.filter((t) => t.id !== id))
          }
        />
      )}
    </div>
  );
}
