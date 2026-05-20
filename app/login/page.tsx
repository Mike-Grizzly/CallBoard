import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your production workspace.</p>
        </div>
        <LoginForm />
        <p className="auth-foot">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
