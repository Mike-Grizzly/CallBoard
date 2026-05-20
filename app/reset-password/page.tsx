import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="auth-screen">
      <div className="auth-card-wrap">
        <div className="auth-head">
          <div className="auth-brand">
            <span className="auth-mark">C</span>
            <span className="auth-wordmark">
              Call<em>Board</em>
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
