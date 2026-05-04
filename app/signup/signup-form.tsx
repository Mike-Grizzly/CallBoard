"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(signup, undefined);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
    >
      {state?.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="first_name"
            className="mb-1.5 block text-sm font-medium"
          >
            First name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            placeholder="Jane"
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="mb-1.5 block text-sm font-medium"
          >
            Last name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="position"
          className="mb-1.5 block text-sm font-medium"
        >
          Position
        </label>
        <select
          id="position"
          name="position"
          defaultValue=""
          required
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        >
          <option value="" disabled>
            Select your role...
          </option>
          <option value="producer">Producer</option>
          <option value="director">Director</option>
          <option value="stage_manager">Stage Manager</option>
          <option value="cast">Cast</option>
          <option value="crew">Crew</option>
        </select>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Your admin will confirm your permissions after signup.
        </p>
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="you@example.com"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Must be at least 6 characters
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>

      <p className="mt-4 text-center text-sm text-[color:var(--muted-foreground)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
