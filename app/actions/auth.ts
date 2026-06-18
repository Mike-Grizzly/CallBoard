"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkAuthRateLimit } from "@/lib/rate-limit";

export type AuthResult = {
  error?: string;
  // Lets a form react to a specific failure beyond the message text — e.g.
  // signup detecting an existing account so it can offer sign-in / reset /
  // invite next steps instead of a dead-end sentence.
  code?: "account_exists";
};

// Providers we offer one-click sign-in for. Kept as a local const (not
// exported) so this "use server" file only exports async actions. Apple is
// held off for now (needs a paid Apple Developer membership) — add "apple"
// here and a button in components/auth/oauth-buttons.tsx to enable it.
const OAUTH_PROVIDERS = ["google"] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

async function requestIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * The origin of the site the user is actually on (localhost, a Vercel preview,
 * or production). We use this for the OAuth `redirectTo` instead of a fixed
 * NEXT_PUBLIC_SITE_URL so the provider sends the user back to the SAME domain
 * they started on — otherwise the PKCE code-verifier cookie (set on this
 * domain) won't be present when the callback runs on a different one, and the
 * session exchange fails. Falls back to the configured site URL.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

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
 * dashboard (Authentication → Providers), and the `<origin>/auth/callback`
 * URL to be allow-listed under Authentication → URL Configuration → Redirect
 * URLs (Supabase falls back to the Site URL — i.e. the homepage — for any
 * redirect target that isn't allow-listed).
 */
export async function signInWithOAuth(formData: FormData): Promise<void> {
  const provider = formData.get("provider") as string;
  if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    redirect("/login?error=oauth");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: {
      redirectTo: `${origin}/auth/callback?next=/setup`,
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

  const rl = await checkAuthRateLimit(await requestIp());
  if (rl.limited) return { error: rl.error };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/setup");
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

  const rl = await checkAuthRateLimit(await requestIp());
  if (rl.limited) return { error: rl.error };

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
      code: "account_exists",
      error: "An account with this email already exists.",
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

  const rl = await checkAuthRateLimit(await requestIp());
  if (rl.limited) return { error: rl.error };

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

  redirect("/setup");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
