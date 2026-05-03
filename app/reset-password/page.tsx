import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--muted)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
