import { db } from "@/db";
import { documents, scriptAnnotations, scriptParses, profiles } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

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

export type DefaultScript = NonNullable<Awaited<ReturnType<typeof getDefaultScript>>>;
export type ScriptAnnotationRow = NonNullable<Awaited<ReturnType<typeof getScriptAnnotations>>>;
