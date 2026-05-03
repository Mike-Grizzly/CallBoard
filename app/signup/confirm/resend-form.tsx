"use client";

import { useActionState } from "react";
import { resendVerification, type AuthResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function ResendForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(resendVerification, undefined);

  const sent = state !== undefined && !state.error;

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />

      {state?.error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {sent && (
        <div className="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
          Verification email resent. Check your inbox.
        </div>
      )}

      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
