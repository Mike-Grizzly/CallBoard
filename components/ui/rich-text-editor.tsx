"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import type { MentionMember } from "./mention-textarea";
import { buildMentionSuggestion } from "./mention-suggestion";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Highlighter,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1.5 hover:bg-[color:var(--muted)]",
        active && "bg-[color:var(--muted)] text-[color:var(--primary)]",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[color:var(--border)] p-2">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-[color:var(--border)]" />

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-[color:var(--border)]" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-[color:var(--border)]" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-[color:var(--border)]" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        title="Highlight"
      >
        <Highlighter className="h-4 w-4" />
      </ToolbarButton>

      <input
        type="color"
        onChange={(e) =>
          editor.chain().focus().setColor(e.target.value).run()
        }
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        title="Text color"
      />

      <div className="mx-1 h-5 w-px bg-[color:var(--border)]" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = "200px",
  members,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  members?: MentionMember[];
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      ...(members && members.length > 0
        ? [
            Mention.configure({
              HTMLAttributes: { class: "mention-inline" },
              suggestion: buildMentionSuggestion(members),
            }),
          ]
        : []),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none px-4 py-3 focus:outline-none`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  if (!editor) {
    return (
      <div
        className="overflow-hidden rounded-md border border-[color:var(--border)]"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--border)]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
