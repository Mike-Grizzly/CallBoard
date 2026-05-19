"use client";

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import {
  MentionSuggestionList,
  type MentionSuggestionListRef,
  type MentionItem,
} from "./mention-suggestion-list";
import { memberFullName, type MentionMember } from "./mention-textarea";

export function buildMentionSuggestion(
  members: MentionMember[],
): Omit<SuggestionOptions<MentionItem>, "editor"> {
  return {
    items({ query }) {
      const q = query.toLowerCase();
      return members
        .filter((m) => memberFullName(m).toLowerCase().includes(q))
        .slice(0, 8)
        .map((m) => ({ id: m.id, label: memberFullName(m) }));
    },

    render() {
      let renderer: ReactRenderer<MentionSuggestionListRef> | null = null;
      let popupEl: HTMLDivElement | null = null;

      function position(rect: DOMRect | null) {
        if (!popupEl || !rect) return;
        const gap = 6;
        const top = rect.bottom + gap + window.scrollY;
        const left = Math.min(
          rect.left + window.scrollX,
          window.innerWidth - (popupEl.offsetWidth || 260) - 12,
        );
        popupEl.style.top = `${top}px`;
        popupEl.style.left = `${Math.max(8, left)}px`;
      }

      return {
        onStart(props) {
          popupEl = document.createElement("div");
          popupEl.style.position = "absolute";
          popupEl.style.zIndex = "9999";
          document.body.appendChild(popupEl);

          renderer = new ReactRenderer(MentionSuggestionList, {
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
  };
}
