"use client";

import { useActionState } from "react";
import { resendVerification, type AuthResult } from "@/app/actions/auth";

export function ResendForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(resendVerification, undefined);

  const sent = state !== undefined && !state.error;

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />

      {state?.error && <div className="auth-error">{state.error}</div>}

      {sent && (
        <div className="auth-success">
          Verification email resent. Check your inbox.
        </div>
      )}

      <button type="submit" className="btn auth-submit" disabled={pending}>
        {pending ? "Sending..." : "Resend verification email"}
      </button>
    </form>
  );
}
