"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { rehearsalReports, productions } from "@/db/schema";
import { eq, sql, and, isNotNull, desc } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  validateReportForm,
  type ReportFormErrors,
  type ReportFormData,
} from "./validation";
import { writeContextMentions } from "@/features/mentions/write";
import { getOrganizationMembers } from "@/features/members/queries";

/** Gather the report's mention-bearing fields: rich-text (data-id) + plain (@{Name}). */
function reportMentionSources(d: ReportFormData): {
  htmlFields: string[];
  textFields: string[];
} {
  const htmlFields = [d.generalNotes, ...Object.values(d.departments)].filter(
    (s): s is string => !!s,
  );
  const textFields = [
    ...d.scheduleChanges.flatMap((s) => [s.what, s.c ?? ""]),
    ...d.attendanceNotes.map((a) => a.note),
    ...d.lineNotes.flatMap((l) => [l.issue, l.line]),
    ...d.injuries.map((i) => i.text),
  ].filter(Boolean);
  return { htmlFields, textFields };
}

export type ReportActionResult = {
  errors?: ReportFormErrors;
  error?: string;
  // On success, the client uses these to (1) upload staged attachments to
  // the new/updated report and (2) navigate to the detail page. The server
  // can't redirect on its own because that runs before the client has a
  // chance to upload the files.
  reportId?: string;
  slug?: string;
  justDistributed?: boolean;
};

export type CreateReportResult = ReportActionResult;
export type UpdateReportResult = ReportActionResult;

export async function createReport(
  _prevState: ReportActionResult | undefined,
  formData: FormData,
): Promise<ReportActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to create reports." };
  }

  const productionId = formData.get("production_id") as string;

  if (!productionId) {
    return { error: "Missing production." };
  }

  const production = await db
    .select({ slug: productions.slug })
    .from(productions)
    .where(eq(productions.id, productionId))
    .limit(1);

  if (production.length === 0) {
    return { error: "Production not found." };
  }

  const { data, errors } = validateReportForm(formData);

  if (errors) {
    return { errors };
  }

  const [{ next }] = await db
    .select({
      next: sql<number>`COALESCE(MAX(${rehearsalReports.reportNumber}), 0) + 1`,
    })
    .from(rehearsalReports)
    .where(eq(rehearsalReports.productionId, productionId));

  const inserted = await db
    .insert(rehearsalReports)
    .values({
      productionId,
      createdBy: user.id,
      reportNumber: Number(next),
      reportDate: data!.reportDate,
      status: data!.status,
      generalNotes: data!.generalNotes,
      scheduledCall: data!.scheduledCall,
      actualStart: data!.actualStart,
      endTime: data!.endTime,
      nextRehearsalDate: data!.nextRehearsalDate,
      nextRehearsalTime: data!.nextRehearsalTime,
      nextRehearsalLocation: data!.nextRehearsalLocation,
      nextRehearsalNotes: data!.nextRehearsalNotes,
      deptScenery: data!.departments.deptScenery,
      deptProps: data!.departments.deptProps,
      deptCostumes: data!.departments.deptCostumes,
      deptHairMakeup: data!.departments.deptHairMakeup,
      deptLighting: data!.departments.deptLighting,
      deptSound: data!.departments.deptSound,
      deptSoundEffects: data!.departments.deptSoundEffects,
      deptMusic: data!.departments.deptMusic,
      deptChoreography: data!.departments.deptChoreography,
      deptVideo: data!.departments.deptVideo,
      deptCrew: data!.departments.deptCrew,
      deptOther: data!.departments.deptOther,
      attendancePresent: data!.attendancePresent,
      attendanceAbsent: data!.attendanceAbsent,
      attendanceLate: data!.attendanceLate,
      breaks: data!.breaks,
      scenesWorked: data!.scenesWorked,
      scheduleChanges: data!.scheduleChanges,
      attendanceNotes: data!.attendanceNotes,
      lineNotes: data!.lineNotes,
      injuries: data!.injuries,
      distributedAt: data!.status === "distributed" ? new Date() : null,
    })
    .returning({ id: rehearsalReports.id });

  {
    const { htmlFields, textFields } = reportMentionSources(data!);
    await writeContextMentions({
      organizationId: user.organizationId,
      productionId,
      mentionedById: user.id,
      contextType: "report",
      contextId: inserted[0].id,
      contextTitle: `Report ${data!.reportDate}`,
      htmlFields,
      textFields,
      members: await getOrganizationMembers(user.organizationId),
    });
  }

  return {
    reportId: inserted[0].id,
    slug: production[0].slug,
    justDistributed: data!.status === "distributed",
  };
}

export async function updateReport(
  _prevState: ReportActionResult | undefined,
  formData: FormData,
): Promise<ReportActionResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to edit reports." };
  }

  const reportId = formData.get("report_id") as string;
  const productionId = formData.get("production_id") as string;

  if (!reportId || !productionId) {
    return { error: "Missing report or production." };
  }

  const existing = await db
    .select({
      id: rehearsalReports.id,
      productionId: rehearsalReports.productionId,
      status: rehearsalReports.status,
      distributedAt: rehearsalReports.distributedAt,
    })
    .from(rehearsalReports)
    .where(eq(rehearsalReports.id, reportId))
    .limit(1);

  if (existing.length === 0 || existing[0].productionId !== productionId) {
    return { error: "Report not found." };
  }

  const production = await db
    .select({ slug: productions.slug })
    .from(productions)
    .where(eq(productions.id, productionId))
    .limit(1);

  if (production.length === 0) {
    return { error: "Production not found." };
  }

  const { data, errors } = validateReportForm(formData);

  if (errors) {
    return { errors };
  }

  // Once distributed, a report cannot be reverted to draft (spec 11
  // decision: edit-after-distribute is allowed but there is no
  // "revert to draft" step). Coerce to keep the rule enforced server-side.
  const previousStatus = existing[0].status;
  const nextStatus =
    previousStatus === "distributed" ? "distributed" : data!.status;
  const distributedAt =
    nextStatus === "distributed" && previousStatus === "draft"
      ? new Date()
      : existing[0].distributedAt;

  await db
    .update(rehearsalReports)
    .set({
      reportDate: data!.reportDate,
      status: nextStatus,
      distributedAt,
      generalNotes: data!.generalNotes,
      scheduledCall: data!.scheduledCall,
      actualStart: data!.actualStart,
      endTime: data!.endTime,
      nextRehearsalDate: data!.nextRehearsalDate,
      nextRehearsalTime: data!.nextRehearsalTime,
      nextRehearsalLocation: data!.nextRehearsalLocation,
      nextRehearsalNotes: data!.nextRehearsalNotes,
      deptScenery: data!.departments.deptScenery,
      deptProps: data!.departments.deptProps,
      deptCostumes: data!.departments.deptCostumes,
      deptHairMakeup: data!.departments.deptHairMakeup,
      deptLighting: data!.departments.deptLighting,
      deptSound: data!.departments.deptSound,
      deptSoundEffects: data!.departments.deptSoundEffects,
      deptMusic: data!.departments.deptMusic,
      deptChoreography: data!.departments.deptChoreography,
      deptVideo: data!.departments.deptVideo,
      deptCrew: data!.departments.deptCrew,
      deptOther: data!.departments.deptOther,
      attendancePresent: data!.attendancePresent,
      attendanceAbsent: data!.attendanceAbsent,
      attendanceLate: data!.attendanceLate,
      breaks: data!.breaks,
      scenesWorked: data!.scenesWorked,
      scheduleChanges: data!.scheduleChanges,
      attendanceNotes: data!.attendanceNotes,
      lineNotes: data!.lineNotes,
      injuries: data!.injuries,
      updatedAt: new Date(),
    })
    .where(eq(rehearsalReports.id, reportId));

  {
    const { htmlFields, textFields } = reportMentionSources(data!);
    await writeContextMentions({
      organizationId: user.organizationId,
      productionId,
      mentionedById: user.id,
      contextType: "report",
      contextId: reportId,
      contextTitle: `Report ${data!.reportDate}`,
      htmlFields,
      textFields,
      members: await getOrganizationMembers(user.organizationId),
    });
  }

  // Open the email picker after the report transitions draft → distributed
  // so the user can send it in one flow. Re-saves of an already-distributed
  // report don't re-prompt.
  const justDistributed =
    nextStatus === "distributed" && previousStatus === "draft";
  return {
    reportId,
    slug: production[0].slug,
    justDistributed,
  };
}

export type DeleteReportResult = { error?: string; success?: boolean };

export async function deleteReport(
  formData: FormData,
): Promise<DeleteReportResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to delete reports." };
  }

  const reportId = formData.get("report_id") as string;
  if (!reportId) return { error: "Missing report ID." };

  await db
    .update(rehearsalReports)
    .set({ deletedAt: new Date() })
    .where(eq(rehearsalReports.id, reportId));

  revalidatePath("/productions");
  return { success: true };
}

export async function restoreReport(
  formData: FormData,
): Promise<DeleteReportResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to restore reports." };
  }

  const reportId = formData.get("report_id") as string;
  if (!reportId) return { error: "Missing report ID." };

  await db
    .update(rehearsalReports)
    .set({ deletedAt: null })
    .where(eq(rehearsalReports.id, reportId));

  revalidatePath("/productions");
  return { success: true };
}

export async function permanentlyDeleteReport(
  formData: FormData,
): Promise<DeleteReportResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to permanently delete reports." };
  }

  const reportId = formData.get("report_id") as string;
  if (!reportId) return { error: "Missing report ID." };

  await db.delete(rehearsalReports).where(eq(rehearsalReports.id, reportId));

  revalidatePath("/productions");
  return { success: true };
}

export async function fetchDeletedReportsByProduction(productionId: string) {
  await requireCurrentUser();
  return db
    .select({
      id: rehearsalReports.id,
      reportNumber: rehearsalReports.reportNumber,
      reportDate: rehearsalReports.reportDate,
      status: rehearsalReports.status,
      deletedAt: rehearsalReports.deletedAt,
    })
    .from(rehearsalReports)
    .where(and(eq(rehearsalReports.productionId, productionId), isNotNull(rehearsalReports.deletedAt)))
    .orderBy(desc(rehearsalReports.deletedAt));
}
