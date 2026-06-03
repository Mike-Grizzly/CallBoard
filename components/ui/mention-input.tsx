"use client";

import { useEffect, useRef, useState } from "react";
import { memberFullName, type MentionMember } from "./mention-textarea";

interface Props {
  value: string;
  onChange: (value: string) => void;
  members: MentionMember[];
  placeholder?: string;
  /** Block Enter from inserting newlines (for one-line note fields). */
  singleLine?: boolean;
  style?: React.CSSProperties;
}

const TOKEN_RE = /(@\{[^}]+\})/g;

/** Build the DOM nodes for a stored value: text nodes + atomic mention chips. */
function tokensToNodes(value: string): Node[] {
  const nodes: Node[] = [];
  for (const part of value.split(TOKEN_RE)) {
    if (!part) continue;
    const m = /^@\{([^}]+)\}$/.exec(part);
    nodes.push(m ? makeChip(m[1]) : document.createTextNode(part));
  }
  return nodes;
}

function makeChip(name: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "mention-inline";
  span.dataset.mentionName = name;
  span.contentEditable = "false";
  span.textContent = `@${name}`;
  return span;
}

/** Serialize the editable DOM back to the stored `@{Name}` token format. */
function serialize(root: HTMLElement): string {
  let out = "";
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mentionName) out += `@{${node.dataset.mentionName}}`;
      else if (node.tagName === "BR") out += "\n";
      else out += node.textContent ?? "";
    }
  });
  return out;
}

/**
 * Inline mention editor: a contenteditable field that renders `@{Name}` tokens
 * as highlighted chips while typing (matching the rich-text editor), with an @
 * picker. Stores the same plain `@{Name}` token string as before, so display
 * and server-side mention extraction are unchanged.
 */
export function MentionInput({
  value,
  onChange,
  members,
  placeholder,
  singleLine = false,
  style,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>("");
  // Where the in-progress "@query" sits, so we can replace it on selection.
  const anchor = useRef<{ node: Node; start: number; end: number } | null>(null);
  const [query, setQuery] = useState<string | null>(null);

  const filtered =
    query !== null
      ? members.filter((m) => memberFullName(m).toLowerCase().includes(query))
      : [];

  // Initialize / re-sync DOM only when the value changes from the outside
  // (not from our own edits, which would reset the caret).
  useEffect(() => {
    if (rootRef.current && value !== lastEmitted.current) {
      rootRef.current.replaceChildren(...tokensToNodes(value));
      lastEmitted.current = value;
    }
  }, [value]);

  function emit() {
    if (!rootRef.current) return;
    const v = serialize(rootRef.current);
    lastEmitted.current = v;
    onChange(v);
  }

  function detect() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
      setQuery(null);
      return;
    }
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      setQuery(null);
      return;
    }
    const offset = sel.anchorOffset;
    const before = (node.textContent ?? "").slice(0, offset);
    const m = before.match(/@(\w*)$/);
    if (m) {
      anchor.current = { node, start: offset - m[0].length, end: offset };
      setQuery(m[1].toLowerCase());
    } else {
      anchor.current = null;
      setQuery(null);
    }
  }

  function insertMention(member: MentionMember) {
    const a = anchor.current;
    const sel = window.getSelection();
    if (!a || !sel) return;
    const range = document.createRange();
    range.setStart(a.node, a.start);
    range.setEnd(a.node, a.end);
    range.deleteContents();

    const chip = makeChip(memberFullName(member));
    const space = document.createTextNode(" ");
    const frag = document.createDocumentFragment();
    frag.appendChild(chip);
    frag.appendChild(space);
    range.insertNode(frag);

    const after = document.createRange();
    after.setStartAfter(space);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);

    setQuery(null);
    anchor.current = null;
    emit();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (query !== null && filtered.length > 0 && (e.key === "Tab" || e.key === "Enter")) {
      e.preventDefault();
      insertMention(filtered[0]);
      return;
    }
    if (e.key === "Escape") setQuery(null);
    if (singleLine && e.key === "Enter") e.preventDefault();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\n/g, singleLine ? " " : "\n");
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    sel.getRangeAt(0).deleteContents();
    sel.getRangeAt(0).insertNode(document.createTextNode(text));
    sel.collapseToEnd();
    emit();
  }

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <div
        ref={rootRef}
        role="textbox"
        aria-multiline={!singleLine}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          emit();
          detect();
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        style={{
          width: "100%",
          minHeight: singleLine ? undefined : 60,
          fontSize: 13,
          padding: "8px 10px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-s)",
          background: "var(--bg-sunken)",
          color: "var(--ink)",
          outline: "none",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          ...style,
        }}
      />
      {!value && placeholder && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 8,
            left: 10,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--ink-4)",
            pointerEvents: "none",
          }}
        >
          {placeholder}
        </span>
      )}
      {query !== null && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-s)",
            boxShadow: "var(--shadow-1)",
            zIndex: 50,
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {filtered.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: 13,
                border: "none",
                background: i === 0 ? "var(--bg-muted)" : "transparent",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <span>
                {memberFullName(m)}
                {m.role && (
                  <span style={{ color: "var(--ink-4)", fontSize: 11, marginLeft: 6 }}>
                    {m.role}
                  </span>
                )}
              </span>
              {i === 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--ink-4)",
                    background: "var(--bg-sunken)",
                    border: "1px solid var(--border)",
                    borderRadius: 3,
                    padding: "1px 5px",
                    fontFamily: "monospace",
                    flexShrink: 0,
                  }}
                >
                  Tab
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
