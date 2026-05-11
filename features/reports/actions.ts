"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { rehearsalReports, productions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  validateReportForm,
  type ReportFormErrors,
} from "./validation";

export type ReportActionResult = {
  errors?: ReportFormErrors;
  error?: string;
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

  await db.insert(rehearsalReports).values({
    productionId,
    createdBy: user.id,
    reportNumber: Number(next),
    reportDate: data!.reportDate,
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
  });

  redirect(`/productions/${production[0].slug}/reports`);
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

  await db
    .update(rehearsalReports)
    .set({
      reportDate: data!.reportDate,
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
      updatedAt: new Date(),
    })
    .where(eq(rehearsalReports.id, reportId));

  redirect(`/productions/${production[0].slug}/reports/${reportId}`);
}
