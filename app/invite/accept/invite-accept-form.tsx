"use client";

import { useActionState } from "react";
import { updatePassword, type AuthResult } from "@/app/actions/auth";

export function InviteAcceptForm() {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(updatePassword, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}

      <div className="auth-field">
        <label htmlFor="password" className="label">
          Choose a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="field"
          placeholder="••••••••"
        />
        <p className="auth-hint">Must be at least 6 characters</p>
      </div>

      <div className="auth-field">
        <label htmlFor="confirm_password" className="label">
          Confirm password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="field"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="btn primary auth-submit"
        disabled={pending}
      >
        {pending ? "Creating account..." : "Create account & sign in"}
      </button>
    </form>
  );
}
