import { ResendForm } from "./resend-form";
import { Mail } from "lucide-react";
import Link from "next/link";

export default async function SignupConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--muted)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--primary)]">
          <Mail className="h-7 w-7 text-[color:var(--primary-foreground)]" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>

        <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
          We sent a verification link to{" "}
          {email ? (
            <span className="font-medium text-[color:var(--foreground)]">
              {email}
            </span>
          ) : (
            "your email address"
          )}
          . Click the link in the email to verify your account.
        </p>

        <div className="mt-8 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
          <p className="mb-4 text-sm text-[color:var(--muted-foreground)]">
            Didn&apos;t receive the email? Check your spam folder, or resend it
            below.
          </p>
          <ResendForm email={email ?? ""} />
        </div>

        <p className="mt-6 text-sm text-[color:var(--muted-foreground)]">
          Already verified?{" "}
          <Link
            href="/login"
            className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
