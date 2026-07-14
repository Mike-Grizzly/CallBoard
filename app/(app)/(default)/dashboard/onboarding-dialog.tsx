"use client";

import { useState } from "react";
import { usePushSubscription } from "@/features/push/use-push-subscription";
import { completeOnboarding } from "@/features/notifications/actions";
import { Icon } from "@/components/ui/icon";

/**
 * Notification setup prompt shown once, when the user has no
 * notification_preferences row yet. Both finishing and dismissing write the
 * prefs row, which is what stops it from re-appearing.
 *
 * N8: it used to be a blocking full-screen modal for everyone without prefs —
 * including long-time users on a populated dashboard. Now:
 *   - variant="modal" is used only in the genuine first-run context (a brand
 *     new, empty workspace), where there's nothing to interrupt.
 *   - variant="card" is a dismissible inline card for established users, so it
 *     never interrupts and a "Not now" never re-prompts.
 */
export function OnboardingDialog({
  variant = "modal",
}: {
  variant?: "modal" | "card";
}) {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const { status, error, enable } = usePushSubscription();

  if (!open) return null;

  // Both "save" and "dismiss" persist the prefs row so this never re-prompts.
  async function finish() {
    setSaving(true);
    try {
      await completeOnboarding(email);
    } catch {
      // Best-effort — close regardless so the user is never trapped.
    }
    setOpen(false);
  }

  const options = (
    <>
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
    </>
  );

  const actions = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <button
        type="button"
        className="more-item"
        onClick={finish}
        disabled={saving}
        style={{ fontSize: 13, padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}
      >
        Not now
      </button>
      <button type="button" className="btn primary" onClick={finish} disabled={saving}>
        {saving ? "Saving…" : "Save & continue"}
      </button>
    </div>
  );

  // Established users: a dismissible inline card that never blocks the page.
  if (variant === "card") {
    return (
      <div className="card card-pad" style={{ position: "relative", marginBottom: 16 }}>
        <button
          type="button"
          onClick={finish}
          disabled={saving}
          aria-label="Dismiss"
          className="btn ghost btn-icon"
          style={{ position: "absolute", top: 10, right: 10 }}
        >
          <Icon name="X" size={14} aria-hidden />
        </button>
        <div className="h-eyebrow">Finish setup</div>
        <h3 className="h-section" style={{ marginTop: 2, marginBottom: 4 }}>
          How do you want to be notified?
        </h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Pick what works for you — you can change this anytime in Settings →
          Notifications.
        </p>
        {options}
        {actions}
      </div>
    );
  }

  // First-run (brand-new, empty workspace): a modal is fine — nothing to
  // interrupt yet.
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
        {options}
        {actions}
      </div>
    </div>
  );
}
