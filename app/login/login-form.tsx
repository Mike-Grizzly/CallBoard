"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthResult } from "@/app/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(login, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && (
        <div className="auth-error" style={{ textAlign: "left" }}>
          {state.error}
          <p style={{ margin: "6px 0 0", fontWeight: 400, fontSize: 13 }}>
            Were you invited, or never set a password?{" "}
            <Link href="/forgot-password" className="auth-link">
              Set / reset it here
            </Link>
            .
          </p>
        </div>
      )}

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

      <div className="auth-field">
        <div className="auth-field-row">
          <label htmlFor="password" className="label" style={{ marginBottom: 0 }}>
            Password
          </label>
          <Link href="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="btn primary auth-submit"
        disabled={pending}
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
