"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { memberFullName, type MentionMember } from "./mention-textarea";

export interface MentionItem {
  id: string;
  label: string;
}

export interface MentionSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface Props {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export const MentionSuggestionList = forwardRef<MentionSuggestionListRef, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i > 0 ? i - 1 : items.length - 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i < items.length - 1 ? i + 1 : 0));
          return true;
        }
        if (event.key === "Enter") {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) return null;

    return (
      <div
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-s)",
          boxShadow: "var(--shadow-2)",
          overflow: "hidden",
          minWidth: 180,
          maxWidth: 260,
        }}
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              command(item);
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "7px 12px",
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              background: i === selectedIndex ? "var(--bg-muted)" : "transparent",
              color: "var(--ink)",
            }}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  },
);

MentionSuggestionList.displayName = "MentionSuggestionList";
