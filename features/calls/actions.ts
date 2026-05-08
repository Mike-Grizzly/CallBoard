"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { calls, productions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export type CallResult = {
  error?: string;
};

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
  redirect(`/productions/${slug}/calls`);
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
  redirect(`/productions/${slug}/calls`);
}

export async function deleteCall(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) return;

  const callId = trim(formData.get("call_id"));
  const productionId = trim(formData.get("production_id"));
  if (!callId || !productionId) return;

  await db.delete(calls).where(eq(calls.id, callId));

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}`);
  revalidatePath(`/productions/${slug}/calls`);
  redirect(`/productions/${slug}/calls`);
}
