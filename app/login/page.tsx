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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="auth-screen">
      <div className="auth-card-wrap">
        <div className="auth-head">
          <div className="auth-brand">
            <span className="auth-mark">P</span>
            <span className="auth-wordmark">
              Pro<em>scene</em>
            </span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your production workspace.</p>
        </div>
        {errorMessage && <div className="auth-error">{errorMessage}</div>}
        <LoginForm />
        <OAuthButtons />
        <p className="auth-foot">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
