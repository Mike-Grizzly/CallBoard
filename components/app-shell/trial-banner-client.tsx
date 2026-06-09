"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type TrialTone = "info" | "warn" | "lock";

const TONE_STYLE: Record<TrialTone, { bg: string; fg: string; border: string }> = {
  info: { bg: "var(--bg-muted, #f4f1ec)", fg: "var(--ink, #222)", border: "var(--border, #e3ddd2)" },
  warn: { bg: "#fff7e6", fg: "#7a4e00", border: "#f1d9a8" },
  lock: { bg: "#fdecec", fg: "#8a1f1f", border: "#f1c2c2" },
};

export function TrialBannerClient({
  phase,
  tone,
  message,
  dismissible,
  isAdmin,
}: {
  phase: string;
  tone: TrialTone;
  message: string;
  dismissible: boolean;
  isAdmin: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const key = `trial-banner-dismissed:${phase}`;

  useEffect(() => {
    if (dismissible && sessionStorage.getItem(key) === "1") setDismissed(true);
  }, [dismissible, key]);

  if (dismissed) return null;

  const s = TONE_STYLE[tone];

  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        padding: "10px 14px",
        margin: "0 0 14px",
        fontSize: 13.5,
        lineHeight: 1.45,
      }}
    >
      <span style={{ flex: "1 1 280px" }}>{message}</span>
      <span style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        {isAdmin ? (
          <Link
            href="/settings/billing"
            className="btn primary"
            style={{ fontSize: 13, padding: "6px 12px", textDecoration: "none" }}
          >
            Subscribe
          </Link>
        ) : (
          <span style={{ opacity: 0.8 }}>Ask an admin to subscribe.</span>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(key, "1");
              setDismissed(true);
            }}
            aria-label="Dismiss"
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              opacity: 0.6,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}
