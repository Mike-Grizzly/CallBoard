import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">
            Join your company&apos;s production workspace.
          </p>
        </div>
        <SignupForm />
        <p className="auth-foot">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
