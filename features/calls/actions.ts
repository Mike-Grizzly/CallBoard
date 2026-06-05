"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { calls, productions, callConfirmations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembership,
  getProductionMembers,
} from "@/features/members/queries";

export type CallResult = {
  error?: string;
  success?: boolean;
  slug?: string;
};

export type CallTrayMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  characterName: string | null;
  email: string;
};

export type CallTrayData = {
  error?: string;
  productionId?: string;
  cast?: CallTrayMember[];
};

/**
 * Data the slide-in call tray needs for a given production: the production id
 * (for the form's hidden field) and its cast list (for the cast selector).
 * Mirrors the access checks on the full-page new-call route.
 */
export async function getCallTrayData(slug: string): Promise<CallTrayData> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to schedule calls." };
  }
  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) return { error: "Production not found." };

  if (!can(user.role, "productions:manage")) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) return { error: "You're not on this production." };
  }

  const members = await getProductionMembers(production.id);
  const cast: CallTrayMember[] = members
    .filter((m) => m.role === "cast")
    .map((m) => ({
      id: m.userId,
      firstName: m.firstName,
      lastName: m.lastName,
      characterName: m.characterName,
      email: m.email,
    }));

  return { productionId: production.id, cast };
}

function trim(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)?.trim();
  return s || null;
}

async function getSlug(productionId: string): Promise<string | null> {
  const rows = await db
    .select({ slug: productions.slug })
    .from(productions)
    .where(eq(productions.id, productionId))
    .limit(1);
  return rows[0]?.slug ?? null;
}

export async function createCall(
  _prev: CallResult | undefined,
  formData: FormData,
): Promise<CallResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to schedule calls." };
  }

  const productionId = trim(formData.get("production_id"));
  const callDate = trim(formData.get("call_date"));
  if (!productionId || !callDate) {
    return { error: "Production and date are required." };
  }

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  await db.insert(calls).values({
    productionId,
    createdBy: user.id,
    callDate,
    callTime: trim(formData.get("call_time")),
    endTime: trim(formData.get("end_time")),
    location: trim(formData.get("location")),
    focus: trim(formData.get("focus")),
    scenes: trim(formData.get("scenes")),
    castCalled: trim(formData.get("cast_called")),
    schedule: trim(formData.get("schedule")),
    notes: trim(formData.get("notes")),
  });

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}`);
  revalidatePath(`/productions/${slug}/calls`);
  revalidatePath("/calendar");
  return { success: true, slug: slug ?? undefined };
}

export async function updateCall(
  _prev: CallResult | undefined,
  formData: FormData,
): Promise<CallResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to edit calls." };
  }

  const callId = trim(formData.get("call_id"));
  const productionId = trim(formData.get("production_id"));
  const callDate = trim(formData.get("call_date"));
  if (!callId || !productionId || !callDate) {
    return { error: "Missing required fields." };
  }

  const callRows = await db
    .select({ productionId: calls.productionId })
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);
  if (callRows.length === 0) return { error: "Call not found." };

  if (!(await userCanAccessProduction(user, callRows[0].productionId))) {
    return { error: "You don't have access to this production." };
  }

  await db
    .update(calls)
    .set({
      callDate,
      callTime: trim(formData.get("call_time")),
      endTime: trim(formData.get("end_time")),
      location: trim(formData.get("location")),
      focus: trim(formData.get("focus")),
      scenes: trim(formData.get("scenes")),
      castCalled: trim(formData.get("cast_called")),
      schedule: trim(formData.get("schedule")),
      notes: trim(formData.get("notes")),
      updatedAt: new Date(),
    })
    .where(eq(calls.id, callId));

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}`);
  revalidatePath(`/productions/${slug}/calls`);
  revalidatePath("/calendar");
  return { success: true, slug: slug ?? undefined };
}

export async function deleteCall(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) return;

  const callId = trim(formData.get("call_id"));
  const productionId = trim(formData.get("production_id"));
  if (!callId || !productionId) return;

  const callRows = await db
    .select({ productionId: calls.productionId })
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);
  if (callRows.length === 0) return;

  if (!(await userCanAccessProduction(user, callRows[0].productionId))) return;

  await db.delete(calls).where(eq(calls.id, callId));

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}`);
  revalidatePath(`/productions/${slug}/calls`);
  redirect(`/productions/${slug}/calls`);
}

/**
 * Toggle the current user's RSVP to a call. Any member of the call's
 * production (or a manager) may respond. Idempotent per (call, user):
 * confirming again clears the response, so the dashboard button doubles as
 * "Confirmed ✓ — tap to undo".
 */
export async function confirmCall(callId: string): Promise<CallResult> {
  const user = await requireCurrentUser();

  const call = await db
    .select({ id: calls.id, productionId: calls.productionId })
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);
  if (call.length === 0) return { error: "Call not found." };

  const productionId = call[0].productionId;
  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  const existing = await db
    .select({ id: callConfirmations.id })
    .from(callConfirmations)
    .where(
      and(
        eq(callConfirmations.callId, callId),
        eq(callConfirmations.userId, user.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(callConfirmations)
      .where(eq(callConfirmations.id, existing[0].id));
  } else {
    await db.insert(callConfirmations).values({
      callId,
      userId: user.id,
      status: "confirmed",
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}
