import Link from "next/link";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { AccountProfileForm } from "./account-profile-form";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountSettingsPage() {
  const user = await requireCurrentUser();

  const rows = await db
    .select({
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      phone: profiles.phone,
      pronouns: profiles.pronouns,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const profile = rows[0]!;

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Link
        href="/settings"
        className="muted"
        style={{ fontSize: 13, textDecoration: "none" }}
      >
        <Icon name="ChevronLeft" size={14} aria-hidden /> Settings
      </Link>

      <div>
        <div className="h-eyebrow">Account</div>
        <h1 className="h-section">Your profile</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Update how you appear to your team. Email is read-only for now.
        </p>
      </div>

      <AccountProfileForm
        initial={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? "",
          pronouns: profile.pronouns ?? "",
          email: profile.email,
        }}
      />

      <div style={{ marginTop: 12 }}>
        <div className="h-eyebrow">Security</div>
        <h2 className="h-section">Change password</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Enter your current password to confirm, then choose a new one.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
