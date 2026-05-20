"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthResult } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(requestPasswordReset, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}

      <div className="auth-field">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        className="btn primary auth-submit"
        disabled={pending}
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
