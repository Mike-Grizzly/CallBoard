import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
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
          <h1 className="auth-title">Set a new password</h1>
          <p className="auth-sub">Enter your new password below.</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
