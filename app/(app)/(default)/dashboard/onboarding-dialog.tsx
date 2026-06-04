"use client";

import { useState } from "react";
import { usePushSubscription } from "@/features/push/use-push-subscription";
import { completeOnboarding } from "@/features/notifications/actions";

/**
 * One-time prompt shown on first dashboard visit (when the user has no
 * notification_preferences row yet). Lets them pick email + phone push; in-app
 * is always on. Finishing or skipping writes the prefs row, which is what stops
 * it from showing again.
 */
export function OnboardingDialog() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const { status, error, enable } = usePushSubscription();

  if (!open) return null;

  async function finish() {
    setSaving(true);
    try {
      await completeOnboarding(email);
    } catch {
      // Best-effort — close regardless so the user is never trapped.
    }
    setOpen(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notification setup"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="card card-pad"
        style={{ width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="h-eyebrow">Welcome to Proscene</div>
        <h2 className="h-section" style={{ marginTop: 2, marginBottom: 4 }}>
          How do you want to be notified?
        </h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Pick what works for you — you can change this anytime in Settings →
          Notifications.
        </p>

        {/* In-app — always on */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 0",
            borderTop: "1px solid var(--border)",
          }}
        >
          <input type="checkbox" checked disabled readOnly style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }} />
          <span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
              In-app · Always on
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>
              You&apos;ll always see the alert banner while using Proscene.
            </span>
          </span>
        </div>

        {/* Email */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 0",
            borderTop: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={email}
            onChange={(e) => setEmail(e.target.checked)}
            style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
          />
          <span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
              Email
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>
              Get a copy in your inbox.
            </span>
          </span>
        </label>

        {/* Push */}
        <div
          style={{
            padding: "12px 0",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            marginBottom: 16,
          }}
        >
          <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
            Phone alerts (push)
          </span>
          <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
            A notification on this device the moment something happens — even
            when Proscene is closed.
          </span>

          {error && (
            <div className="auth-error" style={{ marginBottom: 8 }}>
              {error}
            </div>
          )}

          {status === "enabled" ? (
            <span style={{ color: "var(--c-sage)", fontSize: 13 }}>
              Phone alerts are on for this device.
            </span>
          ) : status === "unsupported" ? (
            <span className="muted" style={{ fontSize: 12 }}>
              Not supported here. On iPhone, add Proscene to your Home Screen and
              open it from there to enable phone alerts.
            </span>
          ) : status === "denied" ? (
            <span className="muted" style={{ fontSize: 12 }}>
              Notifications are blocked in your device settings. Allow them there
              to enable phone alerts.
            </span>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={enable}
              disabled={status === "working" || status === "loading"}
            >
              {status === "working" ? "Enabling…" : "Enable on this device"}
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button
            type="button"
            className="more-item"
            onClick={finish}
            disabled={saving}
            style={{ fontSize: 13, padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}
          >
            Skip for now
          </button>
          <button type="button" className="btn primary" onClick={finish} disabled={saving}>
            {saving ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
