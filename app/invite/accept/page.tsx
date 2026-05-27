import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteAcceptForm } from "./invite-accept-form";

export default async function InviteAcceptPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata ?? {};
  const firstName = (meta.first_name as string) || "";
  const invitedByName = (meta.invited_by_name as string) || "";
  const organizationName = (meta.organization_name as string) || "";

  const greeting = firstName ? `Welcome, ${firstName}` : "Welcome to Proscene";

  return (
    <div className="auth-screen">
      <div className="auth-card-wrap">
        <div className="auth-head">
          <div className="auth-brand">
            <span className="auth-mark">P</span>
            <span className="auth-wordmark">
              Pro<em>scene</em>
            </span>
          </div>
          <h1 className="auth-title">{greeting}</h1>
          <p className="auth-sub">
            {invitedByName && organizationName ? (
              <>
                <strong>{invitedByName}</strong> invited you to{" "}
                <strong>{organizationName}</strong> on Proscene. Set a password
                to finish creating your account.
              </>
            ) : organizationName ? (
              <>
                You&apos;ve been invited to <strong>{organizationName}</strong>{" "}
                on Proscene. Set a password to finish creating your account.
              </>
            ) : (
              <>
                Set a password to finish creating your Proscene account.
              </>
            )}
          </p>
        </div>
        <InviteAcceptForm />
      </div>
    </div>
  );
}
