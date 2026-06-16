"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";

/**
 * One-time "Want a quick tour?" prompt on the first dashboard visit. Lets the
 * user opt into the guided walkthroughs or choose to explore on their own
 * (which suppresses the auto-popping tours — still replayable from Settings).
 */
export function WelcomeModal({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  // Escape = "I'll explore" (the non-committal choice).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDecline();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDecline]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="confirm-modal" style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            margin: "0 auto 12px",
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "color-mix(in oklch, var(--accent) 14%, transparent)",
            color: "var(--accent)",
          }}
        >
          <Icon name="Sparkles" size={22} aria-hidden />
        </div>
        <h2 className="confirm-title" style={{ textAlign: "center" }}>
          Welcome to Proscene
        </h2>
        <p className="confirm-body">
          Want a quick guided tour? We&apos;ll point out the key parts of each
          screen as you go. It only takes a minute — or you can dive in and
          explore on your own.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 18,
          }}
        >
          <button type="button" className="btn primary" onClick={onAccept}>
            <Icon name="Sparkles" className="ico" aria-hidden />
            <span>Show me around</span>
          </button>
          <button type="button" className="btn ghost" onClick={onDecline}>
            I&apos;ll explore on my own
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          You can replay these tours anytime from Settings.
        </p>
      </div>
    </div>,
    document.body,
  );
}
