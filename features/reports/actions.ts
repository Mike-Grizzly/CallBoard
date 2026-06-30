"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { rehearsalReports, productions } from "@/db/schema";
import { eq, sql, and, isNotNull, desc } from "drizzle-orm";
import {
  requireCurrentUser,
  userCanAccessProduction,
  type CurrentUser,
} from "@/lib/auth";
import { can } from "@/lib/permissions";
import { assertCanOperate } from "@/features/billing/guard";
import {
  validateReportForm,
  type ReportFormErrors,
  type ReportFormData,
} from "./validation";
import {
  writeContextMentions,
  type ContextMentionSource,
} from "@/features/mentions/write";
import { getOrganizationMembers } from "@/features/members/queries";
import { humanizeDeptKey } from "@/features/productions/departments";
import { DEPARTMENTS } from "./constants";

/**
 * The report's mention-bearing sections, each notified separately: General
 * Notes, every department note (rich text), and the structured note groups
 * (schedule changes, attendance, line notes, injuries — plain `@{Name}` text).
 */
function reportMentionSources(d: ReportFormData): ContextMentionSource[] {
  const sources: ContextMentionSource[] = [];
  if (d.generalNotes)
    sources.push({ html: d.generalNotes, label: "General notes" });
  for (const dept of DEPARTMENTS) {
    const html = d.departments[dept.key];
    if (html) sources.push({ html, label: dept.label });
  }
  for (const [key, html] of Object.entries(d.customDeptNotes)) {
    if (html) sources.push({ html, label: humanizeDeptKey(key) });
  }
  const sched = d.scheduleChanges.flatMap((s) => [s.what, s.c ?? ""]).join("\n");
  if (sched.includes("@{"))
    sources.push({ text: sched, label: "Schedule changes" });
  const attendance = d.attendanceNotes.map((a) => a.note).join("\n");
  if (attendance.includes("@{"))
    sources.push({ text: attendance, label: "Attendance" });
  const lines = d.lineNotes.flatMap((l) => [l.issue, l.line]).join("\n");
  if (lines.includes("@{")) sources.push({ text: lines, label: "Line notes" });
  const injuries = d.injuries.map((i) => i.text).join("\n");
  if (injuries.includes("@{"))
    sources.push({ text: injuries, label: "Injuries" });
  return sources;
}

/** Drop null/empty custom-department notes into a clean jsonb map. */
function cleanDeptNotes(
  map: Record<string, string | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) if (v) out[k] = v;
  return out;
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

// Whether the caller may act on a report, by tenant + production access.
async function userCanAccessReport(
  user: CurrentUser,
  reportId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ productionId: rehearsalReports.productionId })
    .from(rehearsalReports)
    .where(eq(rehearsalReports.id, reportId))
    .limit(1);
  if (!row) return false;
  return userCanAccessProduction(user, row.productionId);
}

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

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  const lock = await assertCanOperate(user.organizationId);
  if (lock.error) return { error: lock.error };

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

  // Assign the next per-production report number and insert it atomically. A
  // per-production advisory lock serializes concurrent creates so two reports
  // can't read the same MAX and both claim the same number; it releases when
  // the transaction commits. (A unique (production_id, report_number) DB
  // constraint is the belt-and-suspenders follow-up — see decision log.)
  const inserted = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${productionId}))`,
    );

    const [{ next }] = await tx
      .select({
        next: sql<number>`COALESCE(MAX(${rehearsalReports.reportNumber}), 0) + 1`,
      })
      .from(rehearsalReports)
      .where(eq(rehearsalReports.productionId, productionId));

    return tx
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
        deptNotes: cleanDeptNotes(data!.customDeptNotes),
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
  });

  {
    await writeContextMentions({
      organizationId: user.organizationId,
      productionId,
      mentionedById: user.id,
      contextType: "report",
      contextId: inserted[0].id,
      contextTitle: `Report ${data!.reportDate}`,
      sources: reportMentionSources(data!),
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
      deptNotes: rehearsalReports.deptNotes,
    })
    .from(rehearsalReports)
    .where(eq(rehearsalReports.id, reportId))
    .limit(1);

  if (existing.length === 0 || existing[0].productionId !== productionId) {
    return { error: "Report not found." };
  }

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  const lock = await assertCanOperate(user.organizationId);
  if (lock.error) return { error: lock.error };

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

  // Merge custom-dept notes onto the existing map: submitted keys overwrite (or
  // clear when emptied), keys not in the form are preserved — so removing a
  // department from the production never wipes a past report's notes.
  const mergedDeptNotes: Record<string, string> = { ...(existing[0].deptNotes ?? {}) };
  for (const [k, v] of Object.entries(data!.customDeptNotes)) {
    if (v) mergedDeptNotes[k] = v;
    else delete mergedDeptNotes[k];
  }

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
      deptNotes: mergedDeptNotes,
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
    await writeContextMentions({
      organizationId: user.organizationId,
      productionId,
      mentionedById: user.id,
      contextType: "report",
      contextId: reportId,
      contextTitle: `Report ${data!.reportDate}`,
      sources: reportMentionSources(data!),
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

  const billingCheck = await assertCanOperate(user.organizationId);
  if (billingCheck.error) return { error: billingCheck.error };

  const reportId = formData.get("report_id") as string;
  if (!reportId) return { error: "Missing report ID." };

  if (!(await userCanAccessReport(user, reportId))) {
    return { error: "Report not found." };
  }

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

  const billingCheck = await assertCanOperate(user.organizationId);
  if (billingCheck.error) return { error: billingCheck.error };

  const reportId = formData.get("report_id") as string;
  if (!reportId) return { error: "Missing report ID." };

  if (!(await userCanAccessReport(user, reportId))) {
    return { error: "Report not found." };
  }

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

  if (!can(user.role, "reports:delete")) {
    return { error: "You don't have permission to permanently delete reports." };
  }

  const reportId = formData.get("report_id") as string;
  if (!reportId) return { error: "Missing report ID." };

  if (!(await userCanAccessReport(user, reportId))) {
    return { error: "Report not found." };
  }

  await db.delete(rehearsalReports).where(eq(rehearsalReports.id, reportId));

  revalidatePath("/productions");
  return { success: true };
}

export async function fetchDeletedReportsByProduction(productionId: string) {
  const user = await requireCurrentUser();
  if (!(await userCanAccessProduction(user, productionId))) {
    return [];
  }
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
