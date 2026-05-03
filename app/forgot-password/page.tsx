import { ForgotPasswordForm } from "./forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--muted)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-[color:var(--muted-foreground)]">
          Remember your password?{" "}
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
