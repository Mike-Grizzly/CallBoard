import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OtpType = "invite" | "recovery" | "signup" | "email";

const VALID_TYPES: OtpType[] = ["invite", "recovery", "signup", "email"];

const NEXT_LABEL: Record<OtpType, { title: string; sub: string; cta: string }> =
  {
    invite: {
      title: "Accept your invitation",
      sub: "Click below to continue and set up your account.",
      cta: "Accept invitation",
    },
    recovery: {
      title: "Reset your password",
      sub: "Click below to continue and choose a new password.",
      cta: "Continue",
    },
    signup: {
      title: "Confirm your email",
      sub: "Click below to verify your email and finish signing in.",
      cta: "Verify email",
    },
    email: {
      title: "Confirm your email change",
      sub: "Click below to confirm the new email on your account.",
      cta: "Confirm",
    },
  };

/**
 * Two-step OTP confirm. The email link lands here on GET, which is safe to
 * pre-fetch (link scanners, Gmail safe browsing, etc. don't burn the
 * single-use token). The token is only consumed when the user clicks the
 * button and the form POSTs back into the server action below.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const tokenHash = params.token_hash;
  const rawType = params.type;
  const next = params.next ?? "/dashboard";

  const type =
    rawType && (VALID_TYPES as string[]).includes(rawType)
      ? (rawType as OtpType)
      : null;

  if (!tokenHash || !type) {
    redirect("/login?error=auth_callback");
  }

  async function confirm() {
    "use server";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as OtpType,
      token_hash: tokenHash as string,
    });
    if (error) {
      redirect("/login?error=auth_callback");
    }
    redirect(next);
  }

  const copy = NEXT_LABEL[type];

  return (
    <div className="auth-screen">
      <div className="auth-card-wrap">
        <div className="auth-head">
          <div className="auth-brand">
            <span className="auth-mark">
              <img className="brand-badge is-light" src="/brand-paper.svg" alt="" width={30} height={30} />
              <img className="brand-badge is-dark" src="/brand-ink.svg" alt="" width={30} height={30} />
            </span>
            <span className="auth-wordmark">
              Pro<em>scene</em>
            </span>
          </div>
          <h1 className="auth-title">{copy.title}</h1>
          <p className="auth-sub">{copy.sub}</p>
        </div>
        <form action={confirm} className="card card-pad">
          <button type="submit" className="btn primary auth-submit">
            {copy.cta}
          </button>
        </form>
      </div>
    </div>
  );
}
