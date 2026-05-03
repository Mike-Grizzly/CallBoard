"use client";

import { useActionState } from "react";
import { updatePassword, type AuthResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(updatePassword, undefined);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
    >
      {state?.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Must be at least 6 characters
        </p>
      </div>

      <div className="mb-6">
        <label
          htmlFor="confirm_password"
          className="mb-1.5 block text-sm font-medium"
        >
          Confirm new password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
