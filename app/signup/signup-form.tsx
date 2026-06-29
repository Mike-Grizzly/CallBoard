"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signup, type AuthResult } from "@/app/actions/auth";

type AccountType = "individual" | "organization" | "designer";

export function SignupForm() {
  const params = useSearchParams();
  const designerSignup = params.get("account") === "designer";

  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(signup, undefined);

  const [accountType, setAccountType] = useState<AccountType>(
    designerSignup ? "designer" : "organization",
  );

  return (
    <form action={formAction} className="card card-pad">
      {state?.code === "account_exists" ? (
        <div className="auth-error" style={{ textAlign: "left" }}>
          <strong>{state.error}</strong>
          <p style={{ margin: "8px 0 0", fontWeight: 400 }}>
            Were you invited? Check your email for the invite link to set your
            password. Otherwise:
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Link href="/login" className="auth-link">
              Sign in
            </Link>
            <Link href="/forgot-password" className="auth-link">
              Set / reset password
            </Link>
          </div>
        </div>
      ) : (
        state?.error && <div className="auth-error">{state.error}</div>
      )}

      {designerSignup && (
        <input type="hidden" name="account_type" value="designer" />
      )}

      {!designerSignup && (
      <div className="auth-field">
        <span className="label">How will you use Proscene?</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
          <label
            className="field"
            data-selected={accountType === "organization"}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
              borderColor: accountType === "organization" ? "var(--accent)" : undefined,
            }}
          >
            <input
              type="radio"
              name="account_type"
              value="organization"
              checked={accountType === "organization"}
              onChange={() => setAccountType("organization")}
              style={{ marginTop: 3 }}
            />
            <span>
              <b style={{ display: "block", fontSize: 14 }}>I run productions</b>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Set up a workspace for your company or school.
              </span>
            </span>
          </label>

          <label
            className="field"
            data-selected={accountType === "individual"}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
              borderColor: accountType === "individual" ? "var(--accent)" : undefined,
            }}
          >
            <input
              type="radio"
              name="account_type"
              value="individual"
              checked={accountType === "individual"}
              onChange={() => setAccountType("individual")}
              style={{ marginTop: 3 }}
            />
            <span>
              <b style={{ display: "block", fontSize: 14 }}>I&apos;m a participant</b>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Acting, crew, or design on someone else&apos;s show.
              </span>
            </span>
          </label>
        </div>
      </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <label htmlFor="first_name" className="label">
            First name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            className="field"
            placeholder="Jane"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="label">
            Last name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            className="field"
            placeholder="Doe"
          />
        </div>
      </div>

      {accountType === "organization" ? (
        <div className="auth-field">
          <label htmlFor="organization_name" className="label">
            Workspace name
          </label>
          <input
            id="organization_name"
            name="organization_name"
            type="text"
            required
            autoComplete="organization"
            className="field"
            placeholder="Your theatre company"
          />
          <p className="auth-hint">
            The name your collaborators will see — usually your theatre company
            or production team. You can rename it later.
          </p>
        </div>
      ) : designerSignup ? (
        <p className="auth-hint" style={{ marginBottom: 14 }}>
          This is your private Studio workspace — just your Script and Blocking.
          You&apos;ll choose a plan right after you confirm your email.
        </p>
      ) : (
        <p className="auth-hint" style={{ marginBottom: 14 }}>
          You&apos;ll join the productions you&apos;re invited to — no company to set up.
          You can create your own workspace any time later if you decide to run
          your own shows.
        </p>
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
        <label htmlFor="password" className="label">
          Password
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

      <button
        type="submit"
        className="btn primary auth-submit"
        disabled={pending}
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
