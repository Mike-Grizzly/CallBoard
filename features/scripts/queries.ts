import { db } from "@/db";
import { documents, scriptAnnotations, scriptParses, profiles } from "@/db/schema";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import {
  PARSE_LIMIT_PER_PRODUCTION,
  PARSE_WINDOW_DAYS,
} from "./constants";

export async function getDefaultScript(productionId: string) {
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      contentType: documents.contentType,
      storagePath: documents.storagePath,
      scriptVersion: documents.scriptVersion,
      processingStatus: documents.processingStatus,
      uploadedByFirstName: profiles.firstName,
      uploadedByLastName: profiles.lastName,
    })
    .from(documents)
    .innerJoin(profiles, eq(documents.uploadedBy, profiles.id))
    .where(
      and(
        eq(documents.productionId, productionId),
        eq(documents.isDefaultScript, true),
        isNull(documents.deletedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getScriptAnnotations(scriptId: string, userId: string) {
  const rows = await db
    .select()
    .from(scriptAnnotations)
    .where(
      and(
        eq(scriptAnnotations.scriptId, scriptId),
        eq(scriptAnnotations.userId, userId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

/** Most recent AI analysis for a production (any status), for the review page. */
export async function getLatestScriptParse(productionId: string) {
  const rows = await db
    .select({
      id: scriptParses.id,
      documentId: scriptParses.documentId,
      status: scriptParses.status,
      result: scriptParses.result,
      error: scriptParses.error,
      inputTokens: scriptParses.inputTokens,
      outputTokens: scriptParses.outputTokens,
      createdAt: scriptParses.createdAt,
      documentTitle: documents.title,
    })
    .from(scriptParses)
    .innerJoin(documents, eq(scriptParses.documentId, documents.id))
    .where(eq(scriptParses.productionId, productionId))
    .orderBy(desc(scriptParses.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

export type LatestScriptParse = NonNullable<
  Awaited<ReturnType<typeof getLatestScriptParse>>
>;

/**
 * AI-analysis quota for a production: how many parses have been used in the
 * rolling window and how many remain. Mirrors the cap enforced in
 * `startScriptParse` (failed-before-the-model rows are free, so excluded).
 */
export async function getProductionParseUsage(productionId: string) {
  const since = new Date(Date.now() - PARSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ status: scriptParses.status })
    .from(scriptParses)
    .where(
      and(
        eq(scriptParses.productionId, productionId),
        gte(scriptParses.createdAt, since),
      ),
    );
  const used = recent.filter((r) => r.status !== "failed").length;
  return {
    used,
    limit: PARSE_LIMIT_PER_PRODUCTION,
    remaining: Math.max(0, PARSE_LIMIT_PER_PRODUCTION - used),
    windowDays: PARSE_WINDOW_DAYS,
  };
}

export type DefaultScript = NonNullable<Awaited<ReturnType<typeof getDefaultScript>>>;
export type ScriptAnnotationRow = NonNullable<Awaited<ReturnType<typeof getScriptAnnotations>>>;
