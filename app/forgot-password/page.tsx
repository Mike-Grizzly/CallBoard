import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  const isExpired = expired === "1";

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
          <h1 className="auth-title">
            {isExpired ? "Get a new link" : "Reset your password"}
          </h1>
          <p className="auth-sub">
            {isExpired
              ? "That link has expired or was already used. Enter your email and we'll send a fresh one — it works whether you're resetting a password or setting one up for the first time after an invite."
              : "Enter your email and we'll send you a link to reset your password. Were you invited? This also sets your first password."}
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="auth-foot">
          Remember your password? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
