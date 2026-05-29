"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Clear all fields after a successful change so they don't linger in
  // the DOM and the form visibly resets.
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [state?.success]);

  // Only warn after the user has typed something in confirm — otherwise
  // we'd flash a "doesn't match" error before they've had a chance to
  // type anything.
  const mismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

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
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={mismatch}
          aria-describedby={mismatch ? "confirm_password_error" : undefined}
        />
        {mismatch && (
          <p
            id="confirm_password_error"
            style={{
              color: "var(--c-clay)",
              fontSize: 12.5,
              marginTop: 4,
            }}
          >
            Passwords don&apos;t match.
          </p>
        )}
      </div>

      <button
        type="submit"
        className="btn primary"
        disabled={pending || mismatch || !newPassword || !confirmPassword}
      >
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
