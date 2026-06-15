import Link from "next/link";
import { LoginForm } from "./login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "We couldn't sign you in with that provider. Please try again.",
  auth_callback: "That sign-in link is invalid or has expired. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signed_out?: string; deleted?: string }>;
}) {
  const { error, signed_out, deleted } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  // signOutEverywhere / deleteOwnAccount redirect here with these flags.
  const noticeMessage = deleted
    ? "Your account has been deleted. Sorry to see you go."
    : signed_out
      ? "You've been signed out on all your devices."
      : undefined;

  return (
    <div className="auth-screen">
      <div className="auth-card-wrap">
        <div className="auth-head">
          <div className="auth-brand">
            <span className="auth-mark">
              <img className="brand-badge is-light" src="/brand-ink.svg" alt="" width={30} height={30} />
              <img className="brand-badge is-dark" src="/brand-paper.svg" alt="" width={30} height={30} />
            </span>
            <span className="auth-wordmark">
              Pro<em>scene</em>
            </span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your production workspace.</p>
        </div>
        {errorMessage && <div className="auth-error">{errorMessage}</div>}
        {noticeMessage && (
          <div
            className="card card-pad"
            style={{ fontSize: 13, color: "var(--ink-2)", textAlign: "center" }}
          >
            {noticeMessage}
          </div>
        )}
        <LoginForm />
        <OAuthButtons />
        <p className="auth-foot">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
