import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
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
          <h1 className="auth-title">Create your workspace</h1>
          <p className="auth-sub">
            Set up a new Proscene workspace for your theatre company or
            production team. You&apos;ll be the admin.
          </p>
        </div>
        <SignupForm />
        <p className="auth-foot">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <p className="auth-foot" style={{ marginTop: 6, opacity: 0.75 }}>
          Been invited to an existing workspace? Use the link in your invite
          email instead of signing up here.
        </p>
      </div>
    </div>
  );
}
