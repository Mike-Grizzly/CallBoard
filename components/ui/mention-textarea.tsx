"use client";

import { useRef, useState } from "react";

export interface MentionMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role?: string | null;
}

export function memberFullName(m: MentionMember): string {
  return `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  members: MentionMember[];
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}

interface MentionState {
  query: string;
  start: number;
}

export function MentionTextarea({
  value,
  onChange,
  onSubmit,
  members,
  placeholder,
  rows = 2,
  disabled,
  style,
}: Props) {
  const [mention, setMention] = useState<MentionState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = mention
    ? members.filter((m) =>
        memberFullName(m).toLowerCase().includes(mention.query),
      )
    : [];

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMention({ query: match[1].toLowerCase(), start: cursor - match[0].length });
    } else {
      setMention(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      setMention(null);
    } else if (e.key === "Enter" && !e.shiftKey && !mention) {
      if (onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    }
  }

  function insertMention(member: MentionMember) {
    if (!mention) return;
    const full = memberFullName(member);
    const token = `@{${full}} `;
    const before = value.slice(0, mention.start);
    const after = value.slice(textareaRef.current?.selectionStart ?? value.length);
    onChange(before + token + after);
    setMention(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + token.length;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
        textareaRef.current.focus();
      }
    }, 0);
  }

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {mention && filteredMembers.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
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
          {filteredMembers.map((m) => (
            <button
              key={m.id}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: 13,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--ink)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-muted)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              {memberFullName(m)}
              {m.role && (
                <span
                  style={{ color: "var(--ink-4)", fontSize: 11, marginLeft: 6 }}
                >
                  {m.role}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          width: "100%",
          resize: "none",
          fontSize: 13,
          padding: "8px 10px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-s)",
          background: "var(--bg-sunken)",
          color: "var(--ink)",
          outline: "none",
          lineHeight: 1.5,
          ...style,
        }}
      />
    </div>
  );
}
