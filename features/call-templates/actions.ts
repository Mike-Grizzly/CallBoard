"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { calls, callTemplates, productions } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { assertCanOperate } from "@/features/billing/guard";
import { can } from "@/lib/permissions";

export type TemplateResult = {
  error?: string;
  success?: boolean;
  slug?: string;
};

export type GenerateResult = {
  error?: string;
  success?: boolean;
  count?: number;
  slug?: string;
};

/** Guard against runaway generation (e.g. a typo'd 10-year range). */
const MAX_GENERATED_CALLS = 200;

function trim(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)?.trim();
  return s || null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function getSlug(productionId: string): Promise<string | null> {
  const rows = await db
    .select({ slug: productions.slug })
    .from(productions)
    .where(eq(productions.id, productionId))
    .limit(1);
  return rows[0]?.slug ?? null;
}

/** Shared template-field reader used by create + update. */
function readTemplateFields(formData: FormData) {
  return {
    name: trim(formData.get("name")),
    callTime: trim(formData.get("call_time")),
    endTime: trim(formData.get("end_time")),
    location: trim(formData.get("location")),
    focus: trim(formData.get("focus")),
    scenes: trim(formData.get("scenes")),
    castCalled: trim(formData.get("cast_called")),
    schedule: trim(formData.get("schedule")),
    notes: trim(formData.get("notes")),
  };
}

export async function createTemplate(
  _prev: TemplateResult | undefined,
  formData: FormData,
): Promise<TemplateResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to manage templates." };
  }

  const productionId = trim(formData.get("production_id"));
  const fields = readTemplateFields(formData);
  if (!productionId || !fields.name) {
    return { error: "Template name is required." };
  }

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  await db.insert(callTemplates).values({
    productionId,
    createdBy: user.id,
    ...fields,
    name: fields.name,
  });

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}/calls/templates`);
  return { success: true, slug: slug ?? undefined };
}

export async function updateTemplate(
  _prev: TemplateResult | undefined,
  formData: FormData,
): Promise<TemplateResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to manage templates." };
  }

  const templateId = trim(formData.get("template_id"));
  const productionId = trim(formData.get("production_id"));
  const fields = readTemplateFields(formData);
  if (!templateId || !productionId || !fields.name) {
    return { error: "Template name is required." };
  }

  const rows = await db
    .select({ productionId: callTemplates.productionId })
    .from(callTemplates)
    .where(eq(callTemplates.id, templateId))
    .limit(1);
  if (rows.length === 0) return { error: "Template not found." };

  if (!(await userCanAccessProduction(user, rows[0].productionId))) {
    return { error: "You don't have access to this production." };
  }

  await db
    .update(callTemplates)
    .set({ ...fields, name: fields.name, updatedAt: new Date() })
    .where(eq(callTemplates.id, templateId));

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}/calls/templates`);
  return { success: true, slug: slug ?? undefined };
}

export async function deleteTemplate(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) return;

  const templateId = trim(formData.get("template_id"));
  const productionId = trim(formData.get("production_id"));
  if (!templateId || !productionId) return;

  const rows = await db
    .select({ productionId: callTemplates.productionId })
    .from(callTemplates)
    .where(eq(callTemplates.id, templateId))
    .limit(1);
  if (rows.length === 0) return;

  if (!(await userCanAccessProduction(user, rows[0].productionId))) return;

  await db.delete(callTemplates).where(eq(callTemplates.id, templateId));

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}/calls/templates`);
  redirect(`/productions/${slug}/calls/templates`);
}

/** Inclusive list of "YYYY-MM-DD" dates from start to end, iterated in UTC so
 *  the local timezone can't shift which calendar day a date lands on. */
function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/**
 * Project a set of default call fields across a date range, creating one call
 * for every matching weekday. The submitted form values are the source of
 * truth (the chosen template only seeds the form client-side), so this mirrors
 * `createCall` per generated date.
 */
export async function generateCalls(
  _prev: GenerateResult | undefined,
  formData: FormData,
): Promise<GenerateResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to schedule calls." };
  }

  const productionId = trim(formData.get("production_id"));
  const startDate = trim(formData.get("start_date"));
  const endDate = trim(formData.get("end_date"));
  if (!productionId || !startDate || !endDate) {
    return { error: "Production and a start and end date are required." };
  }
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { error: "Dates must be valid." };
  }
  if (endDate < startDate) {
    return { error: "The end date must be on or after the start date." };
  }

  const weekdays = new Set(
    formData
      .getAll("weekdays")
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
  );
  if (weekdays.size === 0) {
    return { error: "Pick at least one day of the week." };
  }

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  const lock = await assertCanOperate(user.organizationId);
  if (lock.error) return { error: lock.error };

  let targetDates = datesInRange(startDate, endDate).filter((d) =>
    weekdays.has(weekdayOf(d)),
  );

  const skipExisting = formData.get("skip_existing") != null;
  if (skipExisting) {
    const existing = await db
      .select({ callDate: calls.callDate })
      .from(calls)
      .where(
        and(
          eq(calls.productionId, productionId),
          gte(calls.callDate, startDate),
          lte(calls.callDate, endDate),
        ),
      );
    const taken = new Set(existing.map((r) => r.callDate));
    targetDates = targetDates.filter((d) => !taken.has(d));
  }

  if (targetDates.length === 0) {
    return {
      error: skipExisting
        ? "Every matching day in that range already has a call."
        : "No days in that range match the selected weekdays.",
    };
  }
  if (targetDates.length > MAX_GENERATED_CALLS) {
    return {
      error: `That would create ${targetDates.length} calls (max ${MAX_GENERATED_CALLS}). Narrow the date range or weekdays.`,
    };
  }

  const shared = {
    productionId,
    createdBy: user.id,
    callTime: trim(formData.get("call_time")),
    endTime: trim(formData.get("end_time")),
    location: trim(formData.get("location")),
    focus: trim(formData.get("focus")),
    scenes: trim(formData.get("scenes")),
    castCalled: trim(formData.get("cast_called")),
    schedule: trim(formData.get("schedule")),
    notes: trim(formData.get("notes")),
  };

  await db
    .insert(calls)
    .values(targetDates.map((callDate) => ({ ...shared, callDate })));

  const slug = await getSlug(productionId);
  revalidatePath(`/productions/${slug}`);
  revalidatePath(`/productions/${slug}/calls`);
  revalidatePath("/calendar");
  return { success: true, count: targetDates.length, slug: slug ?? undefined };
}
