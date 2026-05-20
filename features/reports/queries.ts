import { db } from "@/db";
import { rehearsalReports, profiles } from "@/db/schema";
import { and, eq, desc, isNull, isNotNull, count } from "drizzle-orm";

export async function getReportsByProduction(
  productionId: string,
  opts: {
    status?: "draft" | "distributed";
    limit?: number;
    offset?: number;
  } = {},
) {
  const conditions = [
    eq(rehearsalReports.productionId, productionId),
    isNull(rehearsalReports.deletedAt),
  ];
  if (opts.status) {
    conditions.push(eq(rehearsalReports.status, opts.status));
  }

  const base = db
    .select({
      id: rehearsalReports.id,
      reportNumber: rehearsalReports.reportNumber,
      reportDate: rehearsalReports.reportDate,
      status: rehearsalReports.status,
      generalNotes: rehearsalReports.generalNotes,
      createdAt: rehearsalReports.createdAt,
      distributedAt: rehearsalReports.distributedAt,
      createdById: profiles.id,
      createdByEmail: profiles.email,
      createdByFirstName: profiles.firstName,
      createdByLastName: profiles.lastName,
    })
    .from(rehearsalReports)
    .innerJoin(profiles, eq(rehearsalReports.createdBy, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(rehearsalReports.reportDate))
    .$dynamic();

  const limited = opts.limit !== undefined ? base.limit(opts.limit) : base;
  return opts.offset !== undefined ? limited.offset(opts.offset) : limited;
}

export type ReportWithAuthor = Awaited<
  ReturnType<typeof getReportsByProduction>
>[number];

/** Non-deleted report count for a production (tab badges, summaries). */
export async function getReportCountByProduction(
  productionId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(rehearsalReports)
    .where(
      and(
        eq(rehearsalReports.productionId, productionId),
        isNull(rehearsalReports.deletedAt),
      ),
    );
  return row?.value ?? 0;
}

/** Per-status counts for the reports list filter chips. */
export async function getReportStatusCounts(
  productionId: string,
): Promise<{ total: number; draft: number; distributed: number }> {
  const rows = await db
    .select({ status: rehearsalReports.status, value: count() })
    .from(rehearsalReports)
    .where(
      and(
        eq(rehearsalReports.productionId, productionId),
        isNull(rehearsalReports.deletedAt),
      ),
    )
    .groupBy(rehearsalReports.status);

  let total = 0;
  let draft = 0;
  let distributed = 0;
  for (const row of rows) {
    total += row.value;
    if (row.status === "draft") draft = row.value;
    else if (row.status === "distributed") distributed = row.value;
  }
  return { total, draft, distributed };
}

export async function getDeletedReportCountByProduction(
  productionId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(rehearsalReports)
    .where(
      and(
        eq(rehearsalReports.productionId, productionId),
        isNotNull(rehearsalReports.deletedAt),
      ),
    );
  return row?.value ?? 0;
}

export async function getReportById(reportId: string) {
  const results = await db
    .select({
      id: rehearsalReports.id,
      productionId: rehearsalReports.productionId,
      reportNumber: rehearsalReports.reportNumber,
      reportDate: rehearsalReports.reportDate,
      status: rehearsalReports.status,
      scheduledCall: rehearsalReports.scheduledCall,
      actualStart: rehearsalReports.actualStart,
      endTime: rehearsalReports.endTime,
      generalNotes: rehearsalReports.generalNotes,
      scheduleNotes: rehearsalReports.scheduleNotes,
      nextRehearsalDate: rehearsalReports.nextRehearsalDate,
      nextRehearsalTime: rehearsalReports.nextRehearsalTime,
      nextRehearsalLocation: rehearsalReports.nextRehearsalLocation,
      nextRehearsalNotes: rehearsalReports.nextRehearsalNotes,
      attendancePresent: rehearsalReports.attendancePresent,
      attendanceAbsent: rehearsalReports.attendanceAbsent,
      attendanceLate: rehearsalReports.attendanceLate,
      breaks: rehearsalReports.breaks,
      scenesWorked: rehearsalReports.scenesWorked,
      scheduleChanges: rehearsalReports.scheduleChanges,
      attendanceNotes: rehearsalReports.attendanceNotes,
      lineNotes: rehearsalReports.lineNotes,
      injuries: rehearsalReports.injuries,
      deptScenery: rehearsalReports.deptScenery,
      deptProps: rehearsalReports.deptProps,
      deptCostumes: rehearsalReports.deptCostumes,
      deptHairMakeup: rehearsalReports.deptHairMakeup,
      deptLighting: rehearsalReports.deptLighting,
      deptSound: rehearsalReports.deptSound,
      deptSoundEffects: rehearsalReports.deptSoundEffects,
      deptMusic: rehearsalReports.deptMusic,
      deptChoreography: rehearsalReports.deptChoreography,
      deptVideo: rehearsalReports.deptVideo,
      deptCrew: rehearsalReports.deptCrew,
      deptOther: rehearsalReports.deptOther,
      distributedAt: rehearsalReports.distributedAt,
      createdAt: rehearsalReports.createdAt,
      updatedAt: rehearsalReports.updatedAt,
      createdByEmail: profiles.email,
      createdByFirstName: profiles.firstName,
      createdByLastName: profiles.lastName,
    })
    .from(rehearsalReports)
    .innerJoin(profiles, eq(rehearsalReports.createdBy, profiles.id))
    .where(and(eq(rehearsalReports.id, reportId), isNull(rehearsalReports.deletedAt)))
    .limit(1);

  return results[0] ?? null;
}

export type ReportDetail = NonNullable<
  Awaited<ReturnType<typeof getReportById>>
>;

export async function getDeletedReportsByProduction(productionId: string) {
  return db
    .select({
      id: rehearsalReports.id,
      reportNumber: rehearsalReports.reportNumber,
      reportDate: rehearsalReports.reportDate,
      status: rehearsalReports.status,
      deletedAt: rehearsalReports.deletedAt,
    })
    .from(rehearsalReports)
    .where(
      and(
        eq(rehearsalReports.productionId, productionId),
        isNotNull(rehearsalReports.deletedAt),
      ),
    )
    .orderBy(desc(rehearsalReports.deletedAt));
}

export async function getLatestReportNextCall(productionId: string) {
  const results = await db
    .select({
      id: rehearsalReports.id,
      nextRehearsalDate: rehearsalReports.nextRehearsalDate,
      nextRehearsalTime: rehearsalReports.nextRehearsalTime,
      nextRehearsalLocation: rehearsalReports.nextRehearsalLocation,
    })
    .from(rehearsalReports)
    .where(
      and(
        eq(rehearsalReports.productionId, productionId),
        isNull(rehearsalReports.deletedAt),
      ),
    )
    .orderBy(desc(rehearsalReports.reportDate))
    .limit(1);
  return results[0] ?? null;
}
