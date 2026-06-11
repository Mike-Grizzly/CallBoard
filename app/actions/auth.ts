"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthResult = {
  error?: string;
};

// Providers we offer one-click sign-in for. Kept as a local const (not
// exported) so this "use server" file only exports async actions. Apple is
// held off for now (needs a paid Apple Developer membership) — add "apple"
// here and a button in components/auth/oauth-buttons.tsx to enable it.
const OAUTH_PROVIDERS = ["google"] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/**
 * Starts an OAuth sign-in/sign-up. Submitted from a plain <form> on the
 * login/signup pages with the chosen provider as a hidden field.
 *
 * Flow: we ask Supabase for the provider's authorization URL and redirect
 * the browser to it. The provider sends the user back to `/auth/callback`,
 * which already exchanges the PKCE code for a session (the code-verifier
 * cookie is written here, by the server client, during this call). First-time
 * users get a profile + org created by `getCurrentUser()` in `lib/auth.ts`,
 * exactly like an email/password signup.
 *
 * Requires the Google/Apple providers to be enabled in the Supabase
 * dashboard (Authentication → Providers).
 */
export async function signInWithOAuth(formData: FormData): Promise<void> {
  const provider = formData.get("provider") as string;
  if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    redirect("/login?error=oauth");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data?.url) {
    redirect("/login?error=oauth");
  }

  // Hand the browser off to the provider's consent screen.
  redirect(data.url);
}

export async function login(
  _prevState: AuthResult | undefined,
  formData: FormData,
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthResult | undefined,
  formData: FormData,
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const accountType =
    (formData.get("account_type") as string) === "individual"
      ? "individual"
      : "organization";
  const organizationName = (
    (formData.get("organization_name") as string) || ""
  ).trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Only people setting up a company workspace name it; participants get a
  // personal workspace (named for them in lib/auth.ts) and join the shows
  // they're invited to.
  if (accountType === "organization" && !organizationName) {
    return { error: "Workspace name is required." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName || "",
        last_name: lastName || "",
        account_type: accountType,
        organization_name:
          accountType === "organization" ? organizationName : "",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase's anti-enumeration behavior: when an email is already
  // registered, signUp returns success but with an empty `identities`
  // array and never sends a confirmation email. Detect that and surface
  // a real error instead of stranding the user on the "check your email"
  // screen waiting for mail that will never arrive.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      error:
        "An account with this email already exists. Sign in, or use Forgot password if you've lost access.",
    };
  }

  // Encode the email so the confirm page can display it
  const params = new URLSearchParams({ email });
  redirect(`/signup/confirm?${params.toString()}`);
}

export async function resendVerification(
  _prevState: AuthResult | undefined,
  formData: FormData,
): Promise<AuthResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: undefined };
}

export async function requestPasswordReset(
  _prevState: AuthResult | undefined,
  formData: FormData,
): Promise<AuthResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createSupabaseServerClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  const params = new URLSearchParams({ email });
  redirect(`/forgot-password/confirm?${params.toString()}`);
}

export async function updatePassword(
  _prevState: AuthResult | undefined,
  formData: FormData,
): Promise<AuthResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!password) {
    return { error: "Password is required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
