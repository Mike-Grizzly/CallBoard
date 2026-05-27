import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
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
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-sub">
            Enter your email and we&apos;ll send you a link to reset your
            password.
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
