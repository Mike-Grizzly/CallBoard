"use client";

import { useActionState } from "react";
import { signup, type AuthResult } from "@/app/actions/auth";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(signup, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}

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

      <div className="auth-field">
        <label htmlFor="organization_name" className="label">
          Organization name
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
          The name of your theatre company or production team. You can rename
          this later.
        </p>
      </div>

      <div className="auth-field">
        <label htmlFor="position" className="label">
          Position
        </label>
        <select
          id="position"
          name="position"
          defaultValue=""
          required
          className="field"
        >
          <option value="" disabled>
            Select your role...
          </option>
          <option value="producer">Producer</option>
          <option value="director">Director</option>
          <option value="stage_manager">Stage Manager</option>
          <option value="cast">Cast</option>
          <option value="crew">Crew</option>
        </select>
        <p className="auth-hint">
          Your admin will confirm your permissions after signup.
        </p>
      </div>

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
