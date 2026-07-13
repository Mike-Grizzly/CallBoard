"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactResult } from "./actions";

const REASONS = [
  { value: "general", label: "General question" },
  { value: "demo", label: "Book a demo" },
  { value: "school", label: "School / non-profit pricing" },
];

export function ContactForm({ reason }: { reason: string }) {
  const [state, action, pending] = useActionState<ContactResult | undefined, FormData>(
    submitContactForm,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="card card-pad cf-done" role="status">
        <div className="cf-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="subtitle">Thanks, message sent.</h3>
        <p className="lede" style={{ marginTop: 10 }}>
          We&apos;re former stage managers and we answer fast. You&apos;ll hear back at the email
          you gave us.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card card-pad cf-form">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="cf-hp"
      />

      <div className="cf-row">
        <label className="cf-field">
          <span>Your name</span>
          <input name="name" type="text" required placeholder="Alex Stage" />
        </label>
        <label className="cf-field">
          <span>Email</span>
          <input name="email" type="email" required placeholder="you@theatre.com" />
        </label>
      </div>

      <label className="cf-field">
        <span>What&apos;s this about?</span>
        <select name="reason" defaultValue={reason}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="cf-field">
        <span>Message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us about your production, or ask us anything…"
        />
      </label>

      {state?.error && <p className="cf-error">{state.error}</p>}

      <button className="btn primary lg" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
