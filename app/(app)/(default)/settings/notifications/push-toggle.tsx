"use client";

import { usePushSubscription } from "@/features/push/use-push-subscription";

export function PushToggle() {
  const { status, error, enable, disable } = usePushSubscription();

  return (
    <div className="card card-pad">
      <div className="h-eyebrow">This device</div>
      <h2 className="h-section" style={{ marginTop: 2, marginBottom: 4 }}>
        Push notifications
      </h2>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Get an alert on this device the moment an announcement is posted — even
        when Proscene is closed. You can enable this on each device separately.
      </p>

      {error && (
        <div className="auth-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {status === "loading" && (
        <p className="muted" style={{ fontSize: 13 }}>
          Checking…
        </p>
      )}

      {status === "unsupported" && (
        <p className="muted" style={{ fontSize: 13 }}>
          This browser doesn&apos;t support push notifications. On iPhone, add
          Proscene to your Home Screen first, then open it from there.
        </p>
      )}

      {status === "denied" && (
        <p className="muted" style={{ fontSize: 13 }}>
          Notifications are blocked for Proscene in your device settings. Allow
          them there, then reload this page to enable push.
        </p>
      )}

      {status === "enabled" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--c-sage)", fontSize: 13 }}>
            Push is on for this device.
          </span>
          <button type="button" className="btn" onClick={disable}>
            Turn off
          </button>
        </div>
      )}

      {status === "disabled" && (
        <button type="button" className="btn primary" onClick={enable}>
          Enable on this device
        </button>
      )}

      {status === "working" && (
        <button type="button" className="btn primary" disabled>
          Working…
        </button>
      )}
    </div>
  );
}
