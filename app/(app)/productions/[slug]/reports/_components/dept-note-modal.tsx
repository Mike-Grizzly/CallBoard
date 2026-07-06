"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon";
import type { MentionMember } from "@/components/ui/mention-textarea";

export function DeptNoteModal({
  open,
  title,
  icon,
  accentColor,
  value,
  members,
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  icon: IconName;
  accentColor: string;
  value: string;
  members?: MentionMember[];
  onSave: (html: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    // Intentional: reset the editor draft to the saved value each time the
    // modal opens (or the source value changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Portal to the body so the backdrop escapes the report/nav stacking context
  // and covers the whole viewport (the sticky production nav otherwise sat above
  // an in-tree backdrop). High z-index matches the app's other overlays.
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 12, 10, 0.55)",
        backdropFilter: "blur(2px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card anim-in"
        style={{
          width: "min(720px, 100%)",
          maxHeight: "min(80vh, 720px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="row-between"
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="row" style={{ gap: 10 }}>
            <div
              className="notif-ico"
              data-c={accentColor}
              style={{ width: 28, height: 28 }}
            >
              <Icon name={icon} size={14} aria-hidden />
            </div>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 2 }}>
                Department note
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn ghost btn-icon"
            aria-label="Close"
          >
            <Icon name="X" size={14} aria-hidden />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
          <RichTextEditor
            content={draft}
            onChange={setDraft}
            placeholder={`Write notes for ${title.toLowerCase()}…`}
            minHeight="260px"
            members={members}
          />
        </div>

        <div
          className="row"
          style={{
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button type="button" onClick={onClose} className="btn">
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="btn primary"
          >
            <Icon name="Check" size={14} aria-hidden />
            <span>Save note</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
