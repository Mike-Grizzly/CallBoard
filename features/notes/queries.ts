import { db } from "@/db";
import { productionNotes, noteTags, profiles } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { DEFAULT_NOTE_TAGS } from "./constants";

export async function getNotesByProduction(productionId: string) {
  return db
    .select({
      id: productionNotes.id,
      productionId: productionNotes.productionId,
      createdBy: productionNotes.createdBy,
      title: productionNotes.title,
      content: productionNotes.content,
      isTodo: productionNotes.isTodo,
      isCompleted: productionNotes.isCompleted,
      isPinned: productionNotes.isPinned,
      tagId: productionNotes.tagId,
      dueDate: productionNotes.dueDate,
      visibility: productionNotes.visibility,
      createdAt: productionNotes.createdAt,
      updatedAt: productionNotes.updatedAt,
      createdByFirstName: profiles.firstName,
      createdByLastName: profiles.lastName,
      createdByEmail: profiles.email,
    })
    .from(productionNotes)
    .innerJoin(profiles, eq(productionNotes.createdBy, profiles.id))
    .where(eq(productionNotes.productionId, productionId))
    .orderBy(desc(productionNotes.isPinned), desc(productionNotes.updatedAt));
}

export async function getNoteTagsByOrg(
  organizationId: string,
  seedUserId: string,
) {
  const existing = await db
    .select()
    .from(noteTags)
    .where(eq(noteTags.organizationId, organizationId))
    .orderBy(asc(noteTags.createdAt));

  if (existing.length > 0) return existing;

  // Seed default tags on first access
  const seeds = DEFAULT_NOTE_TAGS.map((t) => ({
    organizationId,
    name: t.name,
    color: t.color,
    createdBy: seedUserId,
  }));

  return db.insert(noteTags).values(seeds).returning();
}

export type NoteWithAuthor = Awaited<
  ReturnType<typeof getNotesByProduction>
>[number];
export type NoteTagRow = Awaited<ReturnType<typeof getNoteTagsByOrg>>[number];
