"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  profiles,
  organizationMemberships,
  organizations,
  productionMemberships,
  productions,
} from "@/db/schema";
import { eq, and, ne, inArray, isNull } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AccountActionResult = {
  error?: string;
  success?: boolean;
  // Optional success detail (e.g. "Confirmation sent to …") shown in place of
  // the generic "Saved." message.
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME_LENGTH = 60;
const MAX_PRONOUNS_LENGTH = 30;
const MAX_PHONE_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 6;

export async function updateAccountProfile(
  _prevState: AccountActionResult | undefined,
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireCurrentUser();

  const firstName = ((formData.get("first_name") as string) || "").trim();
  const lastName = ((formData.get("last_name") as string) || "").trim();
  const phone = ((formData.get("phone") as string) || "").trim();
  const pronouns = ((formData.get("pronouns") as string) || "").trim();

  if (firstName.length > MAX_NAME_LENGTH) {
    return { error: `First name must be ${MAX_NAME_LENGTH} chars or fewer.` };
  }
  if (lastName.length > MAX_NAME_LENGTH) {
    return { error: `Last name must be ${MAX_NAME_LENGTH} chars or fewer.` };
  }
  if (phone.length > MAX_PHONE_LENGTH) {
    return { error: `Phone must be ${MAX_PHONE_LENGTH} chars or fewer.` };
  }
  if (pronouns.length > MAX_PRONOUNS_LENGTH) {
    return { error: `Pronouns must be ${MAX_PRONOUNS_LENGTH} chars or fewer.` };
  }

  await db
    .update(profiles)
    .set({
      firstName,
      lastName,
      phone: phone || null,
      pronouns: pronouns || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));

  // Keep the Supabase auth user_metadata in sync so any code path that
  // reads first/last name from `auth.users` (signup confirmation emails,
  // future SSO flows) sees the latest values.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Change password while signed in. Requires the current password, both as
 * a real security check and to keep this flow distinct from
 * `/forgot-password` (which uses an email-link OTP).
 */
export async function changePassword(
  _prevState: AccountActionResult | undefined,
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireCurrentUser();

  const currentPassword = (formData.get("current_password") as string) || "";
  const newPassword = (formData.get("new_password") as string) || "";
  const confirmPassword = (formData.get("confirm_password") as string) || "";

  if (!currentPassword) {
    return { error: "Enter your current password." };
  }
  if (!newPassword) {
    return { error: "Enter a new password." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }
  if (newPassword === currentPassword) {
    return { error: "New password must be different from current." };
  }

  const supabase = await createSupabaseServerClient();

  // Verify current password by attempting a sign-in. Supabase doesn't
  // expose a "validate password" endpoint, so this is the standard pattern.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("changePassword failed:", error.message);
    return { error: "Could not update password. Try again." };
  }

  // Revoke sessions on all OTHER devices so any stolen session cookies stop
  // working. The current device stays signed in so the user isn't jarred.
  await supabase.auth.signOut({ scope: "others" });

  return { success: true };
}

/**
 * Change the account email. Supabase sends a confirmation link to the new
 * address (and, with "Secure email change" on, the old one too); the auth
 * email only flips once confirmed. We don't touch `profiles.email` here —
 * `getCurrentUser` reconciles it from the verified auth email on the next
 * request after confirmation (keyed on auth UID, so it's safe).
 */
export async function changeEmail(
  _prevState: AccountActionResult | undefined,
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireCurrentUser();

  const newEmail = ((formData.get("email") as string) || "").trim().toLowerCase();

  if (!newEmail) {
    return { error: "Enter a new email address." };
  }
  if (!EMAIL_RE.test(newEmail)) {
    return { error: "Enter a valid email address." };
  }
  if (newEmail === user.email.toLowerCase()) {
    return { error: "That's already your email address." };
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${siteUrl}/auth/callback?next=/settings/account` },
  );

  if (error) {
    console.error("changeEmail failed:", error.message);
    return { error: "Could not update email address. Try again." };
  }

  return {
    success: true,
    message: `Check ${newEmail} for a confirmation link to finish the change. Your current email stays active until you confirm.`,
  };
}

/**
 * Sign out of every session on every device (revokes all refresh tokens),
 * including the current one, then send the user to sign in again.
 */
export async function signOutEverywhere(): Promise<void> {
  await requireCurrentUser();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?signed_out=1");
}

/**
 * Permanently delete the signed-in user's own account: their memberships in
 * every organization, their production memberships, the global profile (which
 * cascades their authored content), and the Supabase auth user.
 *
 * Guard: refuse if they're the sole admin of an org that still has other
 * members — that would lock everyone else out of its settings. They must hand
 * off admin or delete that workspace first. Orgs left with no members at all
 * (solo workspaces) are soft-deleted so they don't linger.
 *
 * Requires typing the account email to confirm (re-checked here, not just in
 * the UI).
 */
export async function deleteOwnAccount(
  _prevState: AccountActionResult | undefined,
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireCurrentUser();

  const confirm = ((formData.get("confirm") as string) || "").trim();
  if (confirm.toLowerCase() !== user.email.toLowerCase()) {
    return { error: "Type your email address exactly to confirm." };
  }

  // Block if they're the last admin of an org that still has other members.
  const adminOrgs = await db
    .select({
      organizationId: organizationMemberships.organizationId,
      name: organizations.name,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMemberships.organizationId),
    )
    .where(
      and(
        eq(organizationMemberships.userId, user.id),
        eq(organizationMemberships.role, "admin"),
        isNull(organizations.deletedAt),
      ),
    );

  for (const org of adminOrgs) {
    const others = await db
      .select({ role: organizationMemberships.role })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, org.organizationId),
          ne(organizationMemberships.userId, user.id),
        ),
      );
    if (others.length > 0 && !others.some((m) => m.role === "admin")) {
      return {
        error: `You're the only admin of "${org.name}". Make someone else an admin, or delete that workspace, before deleting your account.`,
      };
    }
  }

  const myOrgs = await db
    .select({ organizationId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, user.id));
  const orgIds = myOrgs.map((m) => m.organizationId);

  try {
    if (orgIds.length > 0) {
      const prods = await db
        .select({ id: productions.id })
        .from(productions)
        .where(inArray(productions.organizationId, orgIds));
      const prodIds = prods.map((p) => p.id);
      if (prodIds.length > 0) {
        await db
          .delete(productionMemberships)
          .where(
            and(
              eq(productionMemberships.userId, user.id),
              inArray(productionMemberships.productionId, prodIds),
            ),
          );
      }
    }

    await db
      .delete(organizationMemberships)
      .where(eq(organizationMemberships.userId, user.id));

    // Soft-delete any org left with no members (was solely this user's).
    for (const id of orgIds) {
      const remaining = await db
        .select({ id: organizationMemberships.id })
        .from(organizationMemberships)
        .where(eq(organizationMemberships.organizationId, id))
        .limit(1);
      if (remaining.length === 0) {
        await db
          .update(organizations)
          .set({ deletedAt: new Date() })
          .where(eq(organizations.id, id));
      }
    }

    await db.delete(profiles).where(eq(profiles.id, user.id));

    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error && !/not\s*found/i.test(error.message)) {
      console.error("deleteOwnAccount auth delete failed:", error.message);
      return { error: "Could not delete your account. Please contact support." };
    }
  } catch (err) {
    console.error("deleteOwnAccount failed:", err);
    return { error: "Could not delete your account. Please contact support." };
  }

  // Clear the (now-orphaned) session cookie and send them off.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
