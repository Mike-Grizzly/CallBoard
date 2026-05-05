import { db } from "@/db";
import { documents, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDocumentsByProduction(productionId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      contentType: documents.contentType,
      storagePath: documents.storagePath,
      documentType: documents.documentType,
      processingStatus: documents.processingStatus,
      createdAt: documents.createdAt,
      uploadedByFirstName: profiles.firstName,
      uploadedByLastName: profiles.lastName,
      uploadedByEmail: profiles.email,
    })
    .from(documents)
    .innerJoin(profiles, eq(documents.uploadedBy, profiles.id))
    .where(eq(documents.productionId, productionId))
    .orderBy(desc(documents.createdAt));
}

export type DocumentWithUploader = Awaited<
  ReturnType<typeof getDocumentsByProduction>
>[number];
