"use client";

import { useFormStatus } from "react-dom";
import { signInWithOAuth } from "@/app/actions/auth";

/**
 * Google + Apple one-click sign-in. Rendered on both /login and /signup —
 * Supabase resolves an existing user to a sign-in and a new one to a signup,
 * so the same buttons serve both pages.
 *
 * Each provider is its own <form> posting to the `signInWithOAuth` server
 * action (a hidden `provider` field carries the choice). Kept outside the
 * email/password <form> on the page since forms can't nest.
 */
export function OAuthButtons() {
  return (
    <div className="auth-oauth">
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <div className="auth-oauth-grid">
        <ProviderForm provider="google" label="Google" icon={<GoogleIcon />} />
        <ProviderForm provider="apple" label="Apple" icon={<AppleIcon />} />
      </div>
    </div>
  );
}

function ProviderForm({
  provider,
  label,
  icon,
}: {
  provider: "google" | "apple";
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <form action={signInWithOAuth}>
      <input type="hidden" name="provider" value={provider} />
      <ProviderButton label={label} icon={icon} />
    </form>
  );
}

function ProviderButton({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  // useFormStatus reflects the pending state of the nearest parent <form>,
  // so each provider button shows its own spinner during the redirect.
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn auth-oauth-btn" disabled={pending}>
      {icon}
      <span>{pending ? "Redirecting…" : label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.18 8.49c-.02-1.7 1.39-2.52 1.45-2.56-.79-1.16-2.02-1.32-2.46-1.34-1.05-.1-2.04.61-2.57.61-.53 0-1.35-.6-2.22-.58-1.14.02-2.19.66-2.78 1.68-1.18 2.06-.3 5.1.85 6.77.56.82 1.23 1.73 2.1 1.7.84-.03 1.16-.54 2.18-.54 1.01 0 1.3.54 2.19.53.9-.02 1.48-.83 2.03-1.65.64-.95.9-1.86.92-1.91-.02-.01-1.76-.68-1.78-2.7zM9.5 3.39c.47-.57.78-1.36.7-2.14-.67.03-1.49.45-1.97 1.01-.43.5-.81 1.3-.71 2.07.75.06 1.51-.38 1.98-.94z"
      />
    </svg>
  );
}
