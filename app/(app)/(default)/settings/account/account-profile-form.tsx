"use client";

import { useActionState } from "react";
import {
  updateAccountProfile,
  type AccountActionResult,
} from "@/features/account/actions";

export function AccountProfileForm({
  initial,
}: {
  initial: {
    firstName: string;
    lastName: string;
    phone: string;
    pronouns: string;
  };
}) {
  const [state, formAction, pending] = useActionState<
    AccountActionResult | undefined,
    FormData
  >(updateAccountProfile, undefined);

  return (
    <form action={formAction} className="card card-pad">
      {state?.error && <div className="auth-error">{state.error}</div>}
      {state?.success && (
        <div
          style={{
            color: "var(--c-sage)",
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          Saved.
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
            defaultValue={initial.firstName}
            autoComplete="given-name"
            className="field"
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
            defaultValue={initial.lastName}
            autoComplete="family-name"
            className="field"
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="pronouns" className="label">
          Pronouns
        </label>
        <input
          id="pronouns"
          name="pronouns"
          type="text"
          defaultValue={initial.pronouns}
          placeholder="she/her, he/him, they/them"
          className="field"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="phone" className="label">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          autoComplete="tel"
          className="field"
        />
      </div>

      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
