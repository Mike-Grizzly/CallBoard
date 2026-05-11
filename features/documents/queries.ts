import { db } from "@/db";
import { documents, documentFolders, documentComments, profiles } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function getFoldersByProduction(productionId: string) {
  return db
    .select({
      id: documentFolders.id,
      name: documentFolders.name,
      sortOrder: documentFolders.sortOrder,
    })
    .from(documentFolders)
    .where(eq(documentFolders.productionId, productionId))
    .orderBy(asc(documentFolders.sortOrder), asc(documentFolders.name));
}

export async function getDocumentsByProduction(productionId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      contentType: documents.contentType,
      storagePath: documents.storagePath,
      folderId: documents.folderId,
      folderName: documentFolders.name,
      processingStatus: documents.processingStatus,
      createdAt: documents.createdAt,
      uploadedByFirstName: profiles.firstName,
      uploadedByLastName: profiles.lastName,
      uploadedByEmail: profiles.email,
    })
    .from(documents)
    .innerJoin(profiles, eq(documents.uploadedBy, profiles.id))
    .leftJoin(documentFolders, eq(documents.folderId, documentFolders.id))
    .where(eq(documents.productionId, productionId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(documentId: string) {
  const rows = await db
    .select({
      id: documents.id,
      productionId: documents.productionId,
      title: documents.title,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      contentType: documents.contentType,
      storagePath: documents.storagePath,
      folderId: documents.folderId,
      folderName: documentFolders.name,
      processingStatus: documents.processingStatus,
      createdAt: documents.createdAt,
      uploadedByFirstName: profiles.firstName,
      uploadedByLastName: profiles.lastName,
      uploadedByEmail: profiles.email,
    })
    .from(documents)
    .innerJoin(profiles, eq(documents.uploadedBy, profiles.id))
    .leftJoin(documentFolders, eq(documents.folderId, documentFolders.id))
    .where(eq(documents.id, documentId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getDocumentComments(documentId: string) {
  return db
    .select({
      id: documentComments.id,
      body: documentComments.body,
      createdAt: documentComments.createdAt,
      authorId: documentComments.authorId,
      authorFirstName: profiles.firstName,
      authorLastName: profiles.lastName,
      authorEmail: profiles.email,
    })
    .from(documentComments)
    .innerJoin(profiles, eq(documentComments.authorId, profiles.id))
    .where(eq(documentComments.documentId, documentId))
    .orderBy(asc(documentComments.createdAt));
}

export type DocumentFolder = Awaited<
  ReturnType<typeof getFoldersByProduction>
>[number];

export type DocumentWithUploader = Awaited<
  ReturnType<typeof getDocumentsByProduction>
>[number];

export type DocumentCommentRow = Awaited<
  ReturnType<typeof getDocumentComments>
>[number];
