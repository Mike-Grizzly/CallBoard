"use client";

import { useState, useRef, useCallback, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pin,
  Trash2,
  Plus,
  Circle,
  CheckCircle2,
  PenLine,
  FileText,
  Tag,
  Calendar,
  Settings,
  X,
  Check,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  ChevronLeft,
  Lock,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { SlashCommand } from "@/components/ui/slash-command";
import type { MentionMember } from "@/components/ui/mention-textarea";
import { buildMentionSuggestion } from "@/components/ui/mention-suggestion";
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
import { pinItem } from "@/features/pins/actions";
import { sanitizeHtml } from "@/lib/sanitize";

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

// Shared formatting buttons — rendered inside the selection BubbleMenu on
// desktop and the keyboard accessory bar on mobile.
function FormatButtons({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const div = (
    <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 3px" }} />
  );
  return (
    <>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        title="Highlight"
      >
        <Highlighter style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link URL", prev ?? "https://");
          if (url === null) return;
          if (url.trim() === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url.trim() })
            .run();
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      {div}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading"
      >
        <Heading2 style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered style={{ width: 14, height: 14 }} />
      </ToolbarBtn>
    </>
  );
}

// ── Note editor (right panel) ─────────────────────────────────────────────────

function NoteEditor({
  note,
  tags,
  members,
  currentUserId,
  canManageTags,
  productionSlug,
  onClose,
  onNoteUpdated,
}: {
  note: NoteWithAuthor;
  tags: NoteTagRow[];
  members?: MentionMember[];
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
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [, startTransition] = useTransition();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthor = note.createdBy === currentUserId;
  const canEdit = isAuthor || canManageTags;

  // On phones the editor is a full-screen overlay; track the visual viewport
  // so the bottom formatting bar rides above the on-screen keyboard (iOS
  // overlays the keyboard without resizing the layout viewport). Ref mutation
  // only — no React state, so no re-render churn.
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const el = rootRef.current;
      if (!el) return;
      if (window.innerWidth > 720) {
        el.style.removeProperty("height");
      } else {
        el.style.height = `${vv.height}px`;
      }
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  // Focus the title of a freshly created (empty) note so the user can type
  // immediately, like Notion's "New page".
  useEffect(() => {
    if (canEdit && !note.title && !note.content) {
      titleRef.current?.focus();
    }
    // Run once on mount per note.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "note-link", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: "Write something, or press '/' for blocks…",
      }),
      SlashCommand,
      ...(members && members.length > 0
        ? [
            Mention.configure({
              HTMLAttributes: { class: "mention-inline" },
              suggestion: buildMentionSuggestion(members),
            }),
          ]
        : []),
    ],
    content: note.content,
    onUpdate: ({ editor: e }) => {
      scheduleSave({ content: e.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none note-prose focus:outline-none",
        style: "min-height:320px",
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
      await Promise.all([
        updateNote(note.id, productionSlug, { isPinned: next }),
        pinItem("note", note.id, next),
      ]);
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

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    setConfirmingDelete(false);
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
    <div
      ref={rootRef}
      className="note-editor"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Document — spacious, centered column (Notion-style) */}
      <div className="note-doc-scroll">
        <div
          className="note-doc"
          onMouseDown={(e) => {
            // Clicking the empty padding (not the title or body) drops the
            // cursor at the end of the document.
            if (canEdit && e.target === e.currentTarget) {
              e.preventDefault();
              editor?.commands.focus("end");
            }
          }}
        >
          {canEdit ? (
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editor?.commands.focus("start");
                }
              }}
              placeholder="Untitled"
              className="note-title-input"
              data-done={isCompleted ? "1" : "0"}
            />
          ) : (
            <h2 className="note-title-input" data-done={isCompleted ? "1" : "0"}>
              {title || "Untitled"}
            </h2>
          )}

          {/* Quiet properties row, under the title */}
          <div className="note-props">
            {isTodo && canEdit && (
              <button
                type="button"
                className="note-prop note-prop-todo"
                data-done={isCompleted ? "1" : "0"}
                onClick={handleCompleteToggle}
                title={isCompleted ? "Mark incomplete" : "Mark complete"}
              >
                {isCompleted ? (
                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                ) : (
                  <Circle style={{ width: 14, height: 14 }} />
                )}
                <span>{isCompleted ? "Completed" : "To-do"}</span>
              </button>
            )}

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="note-prop"
                onClick={() => canEdit && setShowTagPicker((p) => !p)}
                title={canEdit ? "Change tag" : undefined}
                style={{ cursor: canEdit ? "pointer" : "default" }}
              >
                {selectedTag ? (
                  <>
                    <span
                      className="note-prop-dot"
                      style={{ background: selectedTag.color }}
                    />
                    {selectedTag.name}
                  </>
                ) : (
                  <>
                    <Tag style={{ width: 12, height: 12 }} />
                    Add tag
                  </>
                )}
              </button>
              {showTagPicker && (
                <div className="card note-tag-pop">
                  <button
                    type="button"
                    className="note-tag-opt"
                    onClick={() => handleTagChange(null)}
                  >
                    No tag
                  </button>
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="note-tag-opt"
                      onClick={() => handleTagChange(t.id)}
                    >
                      <span
                        className="note-prop-dot"
                        style={{ background: t.color }}
                      />
                      <span style={{ flex: 1, textAlign: "left" }}>{t.name}</span>
                      {t.id === tagId && <Check style={{ width: 11, height: 11 }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {canEdit ? (
              <label className="note-prop">
                <Calendar style={{ width: 12, height: 12 }} />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="note-prop-date"
                />
              </label>
            ) : (
              dueDate && (
                <span className="note-prop">
                  <Calendar style={{ width: 12, height: 12 }} />
                  {dueDate}
                </span>
              )
            )}

            <div className="note-props-spacer" />

            {canEdit && (
              <button
                type="button"
                className="note-prop-ico"
                data-on={isTodo ? "1" : "0"}
                onClick={handleTodoToggle}
                title={isTodo ? "Remove to-do" : "Make to-do"}
              >
                {isTodo ? (
                  <CheckCircle2 style={{ width: 15, height: 15 }} />
                ) : (
                  <Circle style={{ width: 15, height: 15 }} />
                )}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="note-prop-ico"
                data-on={isPinned ? "amber" : "0"}
                onClick={handlePinToggle}
                title={isPinned ? "Unpin" : "Pin"}
              >
                <Pin style={{ width: 15, height: 15 }} />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="note-prop-ico"
                onClick={() => setConfirmingDelete(true)}
                title="Delete note"
              >
                <Trash2 style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

          {canEdit ? (
            <>
              {editor && (
                <BubbleMenu
                  editor={editor}
                  className="note-bubble"
                  options={{ placement: "top" }}
                >
                  <FormatButtons editor={editor} />
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
            </>
          ) : (
            <div
              className="prose note-prose"
              style={{ maxWidth: "none" }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
            />
          )}
        </div>
      </div>

      {/* Mobile keyboard accessory bar (phone only) */}
      {canEdit && editor && (
        <div className="note-accessory">
          <FormatButtons editor={editor} />
        </div>
      )}

      {/* Footer */}
      <div
        className="row-between note-editor-footer"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 18px",
          fontSize: 11.5,
          color: "var(--ink-4)",
        }}
      >
        <span>
          {saveStatus === "saving" ? "Saving…" : "Saved automatically"}
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

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete note?"
        message="This note will be deleted for everyone on the production."
        confirmLabel="Delete note"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

// ── Note list item (NoteRow) ──────────────────────────────────────────────────

function NoteRow({
  note,
  tags,
  active,
  visuallyDone,
  onPick,
  onToggleComplete,
}: {
  note: NoteWithAuthor;
  tags: NoteTagRow[];
  active: boolean;
  visuallyDone: boolean;
  onPick: () => void;
  onToggleComplete?: () => void;
}) {
  const tag = tags.find((t) => t.id === note.tagId);
  const done = visuallyDone;

  return (
    <div className="note-row" data-active={active ? "1" : "0"} onClick={onPick}>
      {/* Icon / check button */}
      {note.isTodo && onToggleComplete ? (
        <button
          type="button"
          className="note-row-check"
          data-done={done ? "1" : "0"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          title={done ? "Mark incomplete" : "Mark complete"}
        >
          {done ? (
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          ) : (
            <Circle style={{ width: 16, height: 16 }} />
          )}
        </button>
      ) : (
        <span className="note-row-ico">
          <FileText style={{ width: 15, height: 15 }} />
        </span>
      )}

      <div className="note-row-body">
        {/* Animated title */}
        <div className={`note-row-title truncate${done ? " done" : ""}`}>
          {note.title || "Untitled"}
          <span className={`note-row-strike${done ? " done" : ""}`} />
        </div>
        {(tag || note.dueDate) && (
          <div className="note-row-meta">
            {tag && (
              <span
                className="note-row-tagdot"
                style={{ background: tag.color }}
              />
            )}
            {tag && <span className="note-row-tagname">{tag.name}</span>}
            {note.dueDate && <span className="note-row-due">{note.dueDate}</span>}
          </div>
        )}
      </div>
      {note.isPinned && (
        <Pin className="note-row-pin" style={{ width: 12, height: 12 }} />
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
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[0]);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [confirmTag, setConfirmTag] = useState<{ id: string; name: string } | null>(null);
  const [, startTransition] = useTransition();

  // Standard mount flag so the portal only renders client-side (avoids an
  // SSR/hydration mismatch).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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
    setConfirmTag(null);
    startTransition(async () => {
      await deleteNoteTag(tagId, organizationId);
      onTagRemoved(tagId);
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(20,15,10,.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 380,
          margin: "0 16px",
          padding: 24,
          boxShadow: "var(--shadow-3)",
        }}
      >
        <div className="row-between" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Manage Tags</h2>
          <button type="button" onClick={onClose} className="btn ghost btn-icon">
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="row-between"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-s)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: tag.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13 }}>{tag.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTag({ id: tag.id, name: tag.name })}
                className="btn ghost btn-icon"
                style={{ width: 24, height: 24, color: "var(--ink-4)" }}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-4)", padding: "8px 0" }}>
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
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Tag name"
            className="field"
            style={{ marginBottom: 10 }}
          />
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
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
                  outline: color === c ? "2px solid var(--border)" : "none",
                  outlineOffset: 1,
                  backgroundColor: c,
                  cursor: "pointer",
                  padding: 0,
                  transition: "outline 0.1s",
                }}
              />
            ))}
          </div>
          {error && (
            <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{error}</p>
          )}
          <button type="button" onClick={handleAdd} className="btn primary" style={{ width: "100%" }}>
            Add Tag
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmTag !== null}
        title="Delete tag?"
        message={
          confirmTag
            ? `"${confirmTag.name}" will be removed from every note that uses it, across all productions in this workspace.`
            : ""
        }
        confirmLabel="Delete tag"
        danger
        onConfirm={() => confirmTag && handleRemove(confirmTag.id)}
        onCancel={() => setConfirmTag(null)}
      />
    </div>,
    document.body,
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

const VISIBLE_FILTERS = ["all", "todo", "pinned", "notes"] as const;

export function NotesPanel({
  notes: initialNotes,
  tags: initialTags,
  members,
  productionId,
  productionSlug,
  currentUserId,
  canCreate,
  canManageTags,
  organizationId,
  initialSelectedId,
}: {
  notes: NoteWithAuthor[];
  tags: NoteTagRow[];
  members?: MentionMember[];
  productionId: string;
  productionSlug: string;
  currentUserId: string;
  canCreate: boolean;
  canManageTags: boolean;
  organizationId: string;
  initialSelectedId?: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState(initialTags);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialSelectedId && initialNotes.some((n) => n.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return initialNotes[0]?.id ?? null;
  });
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [showTagManager, setShowTagManager] = useState(false);
  const [pendingComplete, setPendingComplete] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const filtered = notes.filter((n) => {
    if (filter === "todo") return n.isTodo;
    if (filter === "pinned") return n.isPinned;
    if (filter === "notes") return !n.isTodo;
    return true;
  });

  // In the to-do view, completed items sink to the bottom.
  // Items still animating (pendingComplete) stay in place until the
  // strikethrough animation finishes before re-sorting.
  const sortedFiltered =
    filter === "todo"
      ? [
          ...filtered.filter((n) => !n.isCompleted || pendingComplete.has(n.id)),
          ...filtered.filter((n) => n.isCompleted && !pendingComplete.has(n.id)),
        ]
      : filtered;

  const pinned = sortedFiltered.filter((n) => n.isPinned);
  const unpinned = sortedFiltered.filter((n) => !n.isPinned);

  function handleCreate() {
    startTransition(async () => {
      const result = await createNote(productionId, productionSlug);
      if (result.id) {
        const today = new Date().toISOString().split("T")[0];
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
          dueDate: today,
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

  function handleToggleComplete(noteId: string, currentCompleted: boolean) {
    const next = !currentCompleted;

    if (next) {
      // Mark as visually done immediately so the animation plays in place,
      // then commit the sort-affecting state update after the animation finishes.
      setPendingComplete((prev) => new Set([...prev, noteId]));
      setTimeout(() => {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, isCompleted: true } : n)),
        );
        setPendingComplete((prev) => {
          const s = new Set(prev);
          s.delete(noteId);
          return s;
        });
      }, 420);
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isCompleted: false } : n)),
      );
      setPendingComplete((prev) => {
        const s = new Set(prev);
        s.delete(noteId);
        return s;
      });
    }

    startTransition(async () => {
      await updateNote(noteId, productionSlug, { isCompleted: next });
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
      className="notes-panel anim-in"
      data-editor-open={selectedNote ? "1" : "0"}
    >
      {/* Left sidebar */}
      <div
        className="notes-list-col"
        style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}
      >
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
          {(VISIBLE_FILTERS as unknown as NoteFilter[]).map((f) => (
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
                  visuallyDone={note.isCompleted || pendingComplete.has(note.id)}
                  onPick={() => setSelectedId(note.id)}
                  onToggleComplete={() => handleToggleComplete(note.id, note.isCompleted)}
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
            <EmptyState
              variant="bare"
              icon="PenLine"
              iconSize={20}
              title="No notes yet."
              hint={canCreate ? "Click + New to get started." : undefined}
            />
          )}
          {unpinned.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              tags={tags}
              active={selectedId === note.id}
              visuallyDone={note.isCompleted || pendingComplete.has(note.id)}
              onPick={() => setSelectedId(note.id)}
              onToggleComplete={() => handleToggleComplete(note.id, note.isCompleted)}
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
        className="card notes-editor-col"
        style={{ display: "flex", flexDirection: "column", minHeight: 540 }}
      >
        {selectedNote ? (
          <>
            <div className="note-mobile-topbar">
              <button
                type="button"
                className="mn-back-btn"
                onClick={() => setSelectedId(null)}
                aria-label="Back to notes list"
              >
                <ChevronLeft style={{ width: 16, height: 16 }} />
                <span>Notes</span>
              </button>
              <span className="note-priv-pill">
                <Lock style={{ width: 11, height: 11 }} />
                Private
              </span>
              <span aria-hidden className="note-topbar-spacer" />
            </div>
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              tags={tags}
              members={members}
              currentUserId={currentUserId}
              canManageTags={canManageTags}
              productionSlug={productionSlug}
              onClose={() => setSelectedId(null)}
              onNoteUpdated={handleNoteUpdated}
            />
          </>
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
