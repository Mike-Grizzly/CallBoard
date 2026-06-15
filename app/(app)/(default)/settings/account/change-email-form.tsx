"use client";

import { useActionState } from "react";
import { changeEmail, type AccountActionResult } from "@/features/account/actions";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState<
    AccountActionResult | undefined,
    FormData
  >(changeEmail, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}
      {state?.success && (
        <div style={{ color: "var(--c-sage)", fontSize: 13, marginBottom: 10 }}>
          {state.message ?? "Saved."}
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="current_email" className="label">
          Current email
        </label>
        <input
          id="current_email"
          type="email"
          value={currentEmail}
          disabled
          className="field"
          style={{ opacity: 0.7 }}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="email" className="label">
          New email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="field"
        />
        <p className="auth-hint">
          We&apos;ll email a confirmation link to the new address. Your current
          email keeps working until you confirm.
        </p>
      </div>

      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "Sending..." : "Update email"}
      </button>
    </form>
  );
}
