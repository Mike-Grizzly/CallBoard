"use client";

import { useActionState } from "react";
import {
  updateNotificationPreferences,
  type PreferencesResult,
} from "@/features/notifications/actions";
import type { NotificationChannels } from "@/features/notifications/preferences";

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderTop: "1px solid var(--border)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
      />
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>
          {hint}
        </span>
      </span>
    </label>
  );
}

export function NotificationPreferencesForm({
  initial,
}: {
  initial: NotificationChannels;
}) {
  const [state, formAction, pending] = useActionState<
    PreferencesResult | undefined,
    FormData
  >(updateNotificationPreferences, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}
      {state?.success && (
        <div style={{ color: "var(--c-sage)", fontSize: 13, marginBottom: 10 }}>
          Saved.
        </div>
      )}

      <div className="h-eyebrow">Preferences</div>
      <h2 className="h-section" style={{ marginTop: 2, marginBottom: 4 }}>
        How you get alerts
      </h2>
      <p className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
        Choose how we reach you when an announcement is posted to your company
        or a show you&apos;re in.
      </p>

      <Toggle
        name="in_app"
        label="In-app"
        hint="Show in the notification bell."
        defaultChecked={initial.inApp}
      />
      <Toggle
        name="email"
        label="Email"
        hint="Send a copy to your email address."
        defaultChecked={initial.email}
      />
      <Toggle
        name="push"
        label="Push (coming soon)"
        hint="Phone push isn't available yet — this turns on automatically once it ships."
        defaultChecked={initial.push}
        disabled
      />

      <button
        type="submit"
        className="btn primary"
        disabled={pending}
        style={{ marginTop: 16 }}
      >
        {pending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
