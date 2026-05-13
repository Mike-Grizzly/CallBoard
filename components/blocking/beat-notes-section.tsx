"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List } from "lucide-react";

function MinimalToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: "4px 8px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elev)",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        title="Bold"
        style={{
          padding: "2px 5px",
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
          background: editor.isActive("bold") ? "var(--bg-sunken)" : "transparent",
          color: editor.isActive("bold") ? "var(--ink)" : "var(--ink-3)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Bold size={12} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        title="Italic"
        style={{
          padding: "2px 5px",
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
          background: editor.isActive("italic") ? "var(--bg-sunken)" : "transparent",
          color: editor.isActive("italic") ? "var(--ink)" : "var(--ink-3)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Italic size={12} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        title="Bullet list"
        style={{
          padding: "2px 5px",
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
          background: editor.isActive("bulletList") ? "var(--bg-sunken)" : "transparent",
          color: editor.isActive("bulletList") ? "var(--ink)" : "var(--ink-3)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <List size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function BeatNotesSection({
  beatId,
  initialContent,
  canEdit,
  onSave,
}: {
  beatId: string;
  initialContent: string;
  canEdit: boolean;
  onSave: (beatId: string, html: string) => Promise<void>;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Add blocking notes for this beat…" }),
    ],
    content: initialContent || "",
    editable: canEdit,
    onUpdate: ({ editor: e }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onSave(beatId, e.getHTML());
      }, 1000);
    },
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flex: 1,
        minHeight: 0,
      }}
    >
      {canEdit && <MinimalToolbar editor={editor} />}
      <div
        className="scroll"
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
        <EditorContent
          editor={editor}
          style={{
            fontSize: 12.5,
            color: "var(--ink)",
            padding: "8px 12px",
          }}
        />
        {!canEdit && (!initialContent || initialContent === "<p></p>") && (
          <p className="muted" style={{ fontSize: 12, padding: "8px 12px" }}>
            No notes for this beat.
          </p>
        )}
      </div>
    </div>
  );
}
