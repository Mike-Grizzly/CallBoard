"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import type { LucideIcon } from "lucide-react";

export interface SlashItem {
  title: string;
  hint: string;
  Icon: LucideIcon;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (editor: any, range: any) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface Props {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

export const SlashCommandList = forwardRef<SlashCommandListRef, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Clamp so a shrinking filtered list never points past the end (avoids a
    // reset effect, which the lint rules disallow).
    const active = items.length ? Math.min(selectedIndex, items.length - 1) : 0;

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => {
            const cur = Math.min(i, items.length - 1);
            return cur > 0 ? cur - 1 : items.length - 1;
          });
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => {
            const cur = Math.min(i, items.length - 1);
            return cur < items.length - 1 ? cur + 1 : 0;
          });
          return true;
        }
        if (event.key === "Enter") {
          const item = items[active];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) return null;

    return (
      <div className="slash-menu">
        <div className="slash-menu-head">Blocks</div>
        {items.map((item, i) => (
          <button
            key={item.title}
            type="button"
            className="slash-item"
            data-active={i === active ? "1" : "0"}
            onMouseDown={(e) => {
              e.preventDefault();
              command(item);
            }}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <span className="slash-item-ico">
              <item.Icon size={15} aria-hidden />
            </span>
            <span className="slash-item-text">
              <span className="slash-item-title">{item.title}</span>
              <span className="slash-item-hint">{item.hint}</span>
            </span>
          </button>
        ))}
      </div>
    );
  },
);

SlashCommandList.displayName = "SlashCommandList";
