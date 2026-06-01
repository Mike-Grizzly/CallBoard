"use client";

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code,
} from "lucide-react";
import {
  SlashCommandList,
  type SlashCommandListRef,
  type SlashItem,
} from "./slash-command-list";

// The block menu. Each item deletes the typed "/query" range, then applies
// its block. StarterKit covers every node used here — no extra extensions.
const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Text",
    hint: "Plain paragraph",
    Icon: Type,
    keywords: ["text", "paragraph", "plain", "p", "body"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    hint: "Big section heading",
    Icon: Heading1,
    keywords: ["h1", "title", "heading", "header", "large"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    hint: "Medium heading",
    Icon: Heading2,
    keywords: ["h2", "subtitle", "heading", "header", "medium"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    hint: "Small heading",
    Icon: Heading3,
    keywords: ["h3", "heading", "header", "small"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bulleted list",
    hint: "Simple bullet points",
    Icon: List,
    keywords: ["bullet", "ul", "unordered", "list", "bul"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    hint: "Ordered steps",
    Icon: ListOrdered,
    keywords: ["numbered", "ol", "ordered", "list", "number"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Quote",
    hint: "Callout / blockquote",
    Icon: Quote,
    keywords: ["quote", "blockquote", "callout"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Divider",
    hint: "Horizontal rule",
    Icon: Minus,
    keywords: ["divider", "hr", "rule", "line", "separator"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Code",
    hint: "Code block",
    Icon: Code,
    keywords: ["code", "codeblock", "snippet", "pre"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        // Only trigger at the start of an empty block or after whitespace —
        // mirrors Notion and avoids hijacking "/" mid-word (e.g. URLs).
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const before = $from.nodeBefore;
          const textBefore = before?.isText ? before.text ?? "" : "";
          return textBefore.length === 0 || /\s$/.test(textBefore);
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        items: ({ query }) => {
          const q = query.toLowerCase().trim();
          if (!q) return SLASH_ITEMS;
          return SLASH_ITEMS.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.hint.toLowerCase().includes(q) ||
              (i.keywords ?? []).some((k) => k.includes(q)),
          );
        },
        render: () => {
          let renderer: ReactRenderer<SlashCommandListRef> | null = null;
          let popupEl: HTMLDivElement | null = null;

          function position(rect: DOMRect | null) {
            if (!popupEl || !rect) return;
            const gap = 6;
            const menuH = popupEl.offsetHeight || 320;
            // Flip above the caret when there isn't room below.
            const below = rect.bottom + gap + menuH < window.innerHeight;
            const top = below
              ? rect.bottom + gap + window.scrollY
              : rect.top - gap - menuH + window.scrollY;
            const left = Math.min(
              rect.left + window.scrollX,
              window.innerWidth - (popupEl.offsetWidth || 280) - 12,
            );
            popupEl.style.top = `${Math.max(8, top)}px`;
            popupEl.style.left = `${Math.max(8, left)}px`;
          }

          return {
            onStart(props) {
              popupEl = document.createElement("div");
              popupEl.style.position = "absolute";
              popupEl.style.zIndex = "9999";
              document.body.appendChild(popupEl);

              renderer = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });
              popupEl.appendChild(renderer.element);
              position(props.clientRect?.() ?? null);
            },
            onUpdate(props) {
              renderer?.updateProps(props);
              position(props.clientRect?.() ?? null);
            },
            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popupEl?.remove();
                renderer?.destroy();
                return true;
              }
              return renderer?.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
              popupEl?.remove();
              renderer?.destroy();
              popupEl = null;
              renderer = null;
            },
          };
        },
      }),
    ];
  },
});
