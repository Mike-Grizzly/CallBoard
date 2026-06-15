import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Handles the redirect from Supabase auth links (email confirmation,
 * password reset, etc.). Exchanges the auth code for a session, then
 * redirects to the `next` param (defaults to /dashboard).
 */
/**
 * Where to send the user when an email link can't be verified. Invite and
 * password-recovery links expire or are single-use, so a failure there is a
 * routine "link's no good anymore" — route those to the forgot-password page
 * (with an explainer), which can email a fresh link that also lets an invited
 * user set a first password. Everything else (OAuth, plain confirmations) keeps
 * the generic login error.
 */
function failureRedirect(next: string, origin: string): NextResponse {
  const isEmailRecoveryLink =
    next.startsWith("/invite/accept") || next.startsWith("/reset-password");
  const target = isEmailRecoveryLink
    ? "/forgot-password?expired=1"
    : "/login?error=auth_callback";
  return NextResponse.redirect(new URL(target, origin));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createSupabaseServerClient();

  // PKCE flow — exchanging an auth code for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Implicit / magic-link flow — verifying a token hash
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "signup" | "email" | "invite",
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return failureRedirect(next, origin);
}
