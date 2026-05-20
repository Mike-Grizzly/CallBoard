import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ResendForm } from "./resend-form";

export default async function SignupConfirmPage({
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
            We sent a verification link to{" "}
            {email ? <strong>{email}</strong> : "your email address"}. Click the
            link in the email to verify your account.
          </p>
        </div>

        <div className="card card-pad">
          <p className="auth-note" style={{ marginBottom: 12 }}>
            Didn&apos;t receive the email? Check your spam folder, or resend it
            below.
          </p>
          <ResendForm email={email ?? ""} />
        </div>

        <p className="auth-foot">
          Already verified? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
