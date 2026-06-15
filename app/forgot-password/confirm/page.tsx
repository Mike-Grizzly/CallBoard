import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default async function ForgotPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="auth-screen">
      <div className="auth-card-wrap">
        <div className="auth-head">
          <div className="auth-badge">
            <Icon name="Mail" size={24} />
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub">
            We sent a password reset link to{" "}
            {email ? <strong>{email}</strong> : "your email address"}. Click the
            link in the email to choose a new password.
          </p>
        </div>

        <div className="card card-pad">
          <p className="auth-note">
            Were you invited and never set a password? This same link lets you
            choose one and sign in.
          </p>
          <p className="auth-note">
            Didn&apos;t receive the email? Check your spam folder, or go back and
            try again.
          </p>
        </div>

        <p className="auth-foot">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
