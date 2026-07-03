"use client";

import { useState, useTransition } from "react";
import { upgradeToFullApp } from "@/features/designer/actions";

/**
 * The one-click designer → full-app conversion button. Free (starts the 60-day
 * org trial; no charge), so no payment-consent step — but the page around it
 * spells out exactly what happens, including the Studio seat winding down.
 * Hard-navigates to the dashboard on success so the app shell re-resolves the
 * account's new mode from scratch.
 */
export function FullAppCta() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const go = () =>
    startTransition(async () => {
      setError(null);
      const res = await upgradeToFullApp();
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
      setError(res.error ?? "Something went wrong — try again.");
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        type="button"
        className="btn primary"
        onClick={go}
        disabled={pending}
        style={{ fontSize: 15, padding: "12px 22px", alignSelf: "flex-start" }}
      >
        {pending ? "Opening your dashboard…" : "Switch to the full app — free for 60 days"}
      </button>
      {error && (
        <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
