import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--muted)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Show Portal</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Create a new account
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
