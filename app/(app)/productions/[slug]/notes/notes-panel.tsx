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
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
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
      className="btn ghost btn-icon"
      data-active={active ? "1" : "0"}
      style={{
        width: 26,
        height: 26,
        color: active ? "var(--accent)" : "var(--ink-3)",
      }}
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
    <div
      className="row"
      style={{
        flexWrap: "wrap",
        gap: 2,
        borderBottom: "1px solid var(--border)",
        padding: "6px 10px",
      }}
    >
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading"
      >
        <Heading2 style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <span style={{ fontSize: 11, fontWeight: 600 }}>L</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <span style={{ fontSize: 11, fontWeight: 600 }}>C</span>
      </ToolbarBtn>
      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo style={{ width: 13, height: 13 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo style={{ width: 13, height: 13 }} />
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
  const canEdit = isAuthor || canManageTags;

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
        class: "prose prose-sm max-w-none px-4 py-3 focus:outline-none",
        style: "min-height:200px",
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
      onNoteUpdated({ id: note.id, isTodo: next, isCompleted: next ? isCompleted : false });
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header row */}
      <div
        className="row-between"
        style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}
      >
        <div className="row" style={{ gap: 8 }}>
          {/* Todo complete toggle */}
          {isTodo && canEdit && (
            <button
              type="button"
              onClick={handleCompleteToggle}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: 0,
                color: isCompleted ? "var(--c-sage)" : "var(--ink-4)",
              }}
              title={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              {isCompleted ? (
                <CheckCircle2 style={{ width: 18, height: 18 }} />
              ) : (
                <Circle style={{ width: 18, height: 18 }} />
              )}
            </button>
          )}

          {/* Tag badge */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => canEdit && setShowTagPicker((p) => !p)}
              style={{
                background: "none",
                border: "none",
                cursor: canEdit ? "pointer" : "default",
                padding: 0,
              }}
              title={canEdit ? "Change tag" : undefined}
            >
              {selectedTag ? (
                <span
                  className="pill"
                  style={{
                    backgroundColor: selectedTag.color,
                    color: "white",
                    borderRadius: 999,
                  }}
                >
                  {selectedTag.name}
                </span>
              ) : (
                <span className="pill">
                  <Tag style={{ width: 10, height: 10 }} />
                  No tag
                </span>
              )}
            </button>

            {showTagPicker && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "100%",
                  zIndex: 10,
                  marginTop: 4,
                  width: 176,
                  padding: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTagChange(null)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-s)",
                    fontSize: 12,
                    color: "var(--ink-3)",
                  }}
                  className="hover-bg"
                >
                  No tag
                </button>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTagChange(t.id)}
                    className="row hover-bg"
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-s)",
                      fontSize: 12,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: t.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, textAlign: "left" }}>{t.name}</span>
                    {t.id === tagId && <Check style={{ width: 11, height: 11 }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due date */}
          {canEdit && (
            <span className="row" style={{ gap: 4, fontSize: 12, color: "var(--ink-4)" }}>
              <Calendar style={{ width: 11, height: 11 }} />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                style={{
                  border: 0,
                  background: "transparent",
                  fontSize: 12,
                  color: "var(--ink-4)",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </span>
          )}
          {!canEdit && dueDate && (
            <span className="pill">
              <Calendar style={{ width: 10, height: 10 }} />
              {dueDate}
            </span>
          )}
          {isPinned && (
            <span className="pill" data-c="accent">
              <Pin style={{ width: 10, height: 10 }} />
              Pinned
            </span>
          )}
        </div>

        <div className="row" style={{ gap: 4 }}>
          {canEdit && (
            <button
              type="button"
              onClick={handleTodoToggle}
              title={isTodo ? "Remove to-do" : "Make to-do"}
              className="btn ghost btn-icon"
              style={{ color: isTodo ? "var(--accent)" : "var(--ink-4)" }}
            >
              {isTodo ? (
                <CheckCircle2 style={{ width: 14, height: 14 }} />
              ) : (
                <Circle style={{ width: 14, height: 14 }} />
              )}
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleVisibilityToggle}
              title={visibility === "private" ? "Visible only to you" : "Shared with team"}
              className="btn ghost btn-icon"
            >
              {visibility === "shared" ? (
                <Eye style={{ width: 14, height: 14 }} />
              ) : (
                <EyeOff style={{ width: 14, height: 14 }} />
              )}
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handlePinToggle}
              title={isPinned ? "Unpin" : "Pin"}
              className="btn ghost btn-icon"
              style={{ color: isPinned ? "var(--c-amber)" : undefined }}
            >
              <Pin style={{ width: 14, height: 14 }} />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete note"
              className="btn ghost btn-icon"
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn ghost btn-icon"
            title="Close"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "22px 28px 0" }}>
        {canEdit ? (
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            style={{
              border: 0,
              padding: 0,
              fontSize: 24,
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.012em",
              background: "transparent",
              width: "100%",
              outline: "none",
              color: isCompleted ? "var(--ink-4)" : "var(--ink)",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          />
        ) : (
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.012em",
              margin: 0,
              color: isCompleted ? "var(--ink-4)" : "var(--ink)",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {title || "Untitled"}
          </h2>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {canEdit ? (
          <div className="card" style={{ overflow: "hidden" }}>
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        ) : (
          <div
            className="prose prose-sm"
            style={{ maxWidth: "none", padding: "0 12px" }}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        )}
      </div>

      {/* Footer */}
      <div
        className="row-between"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 18px",
          fontSize: 11.5,
          color: "var(--ink-4)",
        }}
      >
        <span>
          {saveStatus === "saving" ? "Saving…" : "Saved automatically"}
          {" · "}
          {visibility === "shared" ? "Visible to team" : "Visible only to you"}
        </span>
        <span className="row" style={{ gap: 6 }}>
          {authorName}
          {" · "}
          {new Date(note.updatedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ── Note list item (NoteRow) ──────────────────────────────────────────────────

function NoteRow({
  note,
  tags,
  active,
  onPick,
}: {
  note: NoteWithAuthor;
  tags: NoteTagRow[];
  active: boolean;
  onPick: () => void;
}) {
  const tag = tags.find((t) => t.id === note.tagId);

  return (
    <div
      onClick={onPick}
      style={{
        display: "grid",
        gridTemplateColumns: "22px 1fr auto",
        gap: 10,
        padding: "10px 12px",
        borderRadius: "var(--radius-s)",
        cursor: "pointer",
        border: "1px solid " + (active ? "var(--border-strong)" : "transparent"),
        background: active ? "var(--bg-elev)" : "transparent",
        boxShadow: active ? "var(--shadow-1)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          color:
            note.isCompleted
              ? "var(--c-sage)"
              : note.isTodo
                ? "var(--ink-4)"
                : "var(--ink-3)",
          paddingTop: 1,
        }}
      >
        {note.isTodo ? (
          note.isCompleted ? (
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          ) : (
            <Circle style={{ width: 16, height: 16 }} />
          )
        ) : (
          <PenLine style={{ width: 14, height: 14 }} />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          className="truncate"
          style={{
            fontSize: 13,
            fontWeight: 500,
            textDecoration: note.isCompleted ? "line-through" : "none",
            color: note.isCompleted ? "var(--ink-3)" : "var(--ink)",
          }}
        >
          {note.title || "Untitled"}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 3 }}>
          {tag && (
            <span
              className="pill"
              style={{
                fontSize: 10.5,
                height: 16,
                padding: "0 6px",
                backgroundColor: tag.color,
                color: "white",
              }}
            >
              {tag.name}
            </span>
          )}
          {note.dueDate && (
            <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{note.dueDate}</span>
          )}
        </div>
      </div>
      {note.isPinned && (
        <Pin style={{ width: 12, height: 12, color: "var(--c-amber)", marginTop: 2 }} />
      )}
    </div>
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.4)",
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 360, padding: 24 }}
      >
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Manage Tags</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn ghost btn-icon"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="row-between card"
              style={{ padding: "8px 12px" }}
            >
              <div className="row" style={{ gap: 8 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: tag.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13 }}>{tag.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="btn ghost btn-icon"
                style={{ width: 24, height: 24 }}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-4)" }}>
              No tags yet.
            </p>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <p className="h-eyebrow" style={{ marginBottom: 8 }}>Add tag</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="field"
            style={{ marginBottom: 8 }}
          />
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {TAG_COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `2px solid ${color === c ? "var(--ink-2)" : "transparent"}`,
                  backgroundColor: c,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
          {error && (
            <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 6 }}>{error}</p>
          )}
          <button type="button" onClick={handleAdd} className="btn primary" style={{ width: "100%" }}>
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
    <div
      className="anim-in"
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: 16,
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      {/* Left sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {/* Header */}
        <div className="row-between">
          <h2 className="h-section">My notes</h2>
          <div className="row" style={{ gap: 6 }}>
            {canManageTags && (
              <button
                type="button"
                onClick={() => setShowTagManager(true)}
                title="Manage tags"
                className="btn ghost btn-icon"
              >
                <Settings style={{ width: 14, height: 14 }} />
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="btn primary"
                style={{ height: 30, padding: "0 10px" }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                <span>New</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
          {(["all", "todo", "pinned", "notes", "done"] as NoteFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="btn ghost"
              data-active={filter === f ? "1" : "0"}
              style={{
                height: 26,
                padding: "0 10px",
                fontSize: 12,
                background: filter === f ? "var(--bg-sunken)" : "transparent",
                color: filter === f ? "var(--ink)" : "var(--ink-3)",
                fontWeight: filter === f ? 500 : 400,
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Pinned group */}
        {pinned.length > 0 && (
          <>
            <div className="h-eyebrow row" style={{ gap: 4, marginTop: 4 }}>
              <Pin style={{ width: 11, height: 11 }} /> Pinned
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {pinned.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  tags={tags}
                  active={selectedId === note.id}
                  onPick={() => setSelectedId(note.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* All/Items section label */}
        <div className="h-eyebrow" style={{ marginTop: 8 }}>
          {pinned.length > 0 ? "All" : "Items"}
        </div>

        {/* Note list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notes.length === 0 && (
            <div style={{ marginTop: 24, textAlign: "center", color: "var(--ink-4)" }}>
              <PenLine style={{ width: 28, height: 28, margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13 }}>No notes yet.</p>
              {canCreate && (
                <p style={{ fontSize: 12, marginTop: 4 }}>Click + New to get started.</p>
              )}
            </div>
          )}
          {unpinned.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              tags={tags}
              active={selectedId === note.id}
              onPick={() => setSelectedId(note.id)}
            />
          ))}
          {filtered.length === 0 && notes.length > 0 && (
            <p style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--ink-4)" }}>
              No notes match this filter.
            </p>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", minHeight: 540 }}
      >
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
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--ink-3)",
            }}
          >
            <PenLine style={{ width: 28, height: 28, margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13 }}>Pick a note or create a new one</div>
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="btn primary"
                style={{ marginTop: 14 }}
              >
                <Plus style={{ width: 14, height: 14 }} />
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
          onTagRemoved={(id) => setTags((prev) => prev.filter((t) => t.id !== id))}
        />
      )}
    </div>
  );
}
