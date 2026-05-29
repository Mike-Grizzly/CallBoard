"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountActionResult = {
  error?: string;
  success?: boolean;
};

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
    return { error: error.message };
  }

  return { success: true };
}
