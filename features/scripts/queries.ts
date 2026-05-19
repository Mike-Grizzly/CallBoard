import { db } from "@/db";
import { documents, scriptAnnotations, profiles } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function getDefaultScript(productionId: string) {
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      contentType: documents.contentType,
      storagePath: documents.storagePath,
      scriptVersion: documents.scriptVersion,
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

export type DefaultScript = NonNullable<Awaited<ReturnType<typeof getDefaultScript>>>;
export type ScriptAnnotationRow = NonNullable<Awaited<ReturnType<typeof getScriptAnnotations>>>;
