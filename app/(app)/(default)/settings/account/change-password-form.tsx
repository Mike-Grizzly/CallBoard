"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  changePassword,
  type AccountActionResult,
} from "@/features/account/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    AccountActionResult | undefined,
    FormData
  >(changePassword, undefined);

  const formRef = useRef<HTMLFormElement>(null);

  // Clear the password fields after a successful change so they don't
  // linger in the DOM (and so the user gets a clear visual that the form
  // is back to empty / ready to use again).
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form action={formAction} className="card card-pad" ref={formRef}>
      {state?.error && <div className="auth-error">{state.error}</div>}
      {state?.success && (
        <div
          style={{
            color: "var(--c-sage)",
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          Password updated.
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="current_password" className="label">
          Current password
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="new_password" className="label">
          New password
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="field"
        />
        <p className="auth-hint">Must be at least 6 characters.</p>
      </div>

      <div className="auth-field">
        <label htmlFor="confirm_password" className="label">
          Confirm new password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="field"
        />
      </div>

      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
