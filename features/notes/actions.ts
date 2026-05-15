"use server";

import { db } from "@/db";
import { productionNotes, noteTags, productions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { writeMentions } from "@/features/mentions/write";
import { getOrCreateDefaultOrganization } from "@/lib/organization";

type ActionResult = { error?: string; success?: boolean; id?: string };

export async function createNote(
  productionId: string,
  productionSlug: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "notes:create")) {
    return { error: "You don't have permission to create notes." };
  }

  const today = new Date().toISOString().split("T")[0];

  const rows = await db
    .insert(productionNotes)
    .values({
      productionId,
      createdBy: user.id,
      title: "",
      content: "",
      visibility: "private",
      dueDate: today,
    })
    .returning({ id: productionNotes.id });

  revalidatePath(`/productions/${productionSlug}/notes`);
  return { success: true, id: rows[0].id };
}

export async function updateNote(
  noteId: string,
  productionSlug: string,
  fields: {
    title?: string;
    content?: string;
    isTodo?: boolean;
    isCompleted?: boolean;
    isPinned?: boolean;
    tagId?: string | null;
    dueDate?: string | null;
    visibility?: string;
  },
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "notes:create")) {
    return { error: "You don't have permission to edit notes." };
  }

  const note = await db
    .select({ createdBy: productionNotes.createdBy })
    .from(productionNotes)
    .where(eq(productionNotes.id, noteId))
    .limit(1);

  if (note.length === 0) return { error: "Note not found." };

  // Only the author or tag managers can edit
  if (
    note[0].createdBy !== user.id &&
    !can(user.role, "notes:manage_tags")
  ) {
    return { error: "You can only edit your own notes." };
  }

  await db
    .update(productionNotes)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(productionNotes.id, noteId));

  if (fields.content) {
    const org = await getOrCreateDefaultOrganization();
    const noteRow = await db
      .select({ productionId: productionNotes.productionId, title: productionNotes.title })
      .from(productionNotes)
      .where(eq(productionNotes.id, noteId))
      .limit(1);
    if (noteRow.length > 0) {
      await writeMentions(fields.content, {
        organizationId: org.id,
        productionId: noteRow[0].productionId,
        mentionedById: user.id,
        contextType: "note",
        contextId: noteId,
        contextTitle: fields.title ?? noteRow[0].title,
      });
    }
  }

  revalidatePath(`/productions/${productionSlug}/notes`);
  return { success: true };
}

export async function deleteNote(
  noteId: string,
  productionSlug: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "notes:create")) {
    return { error: "You don't have permission to delete notes." };
  }

  const note = await db
    .select({ createdBy: productionNotes.createdBy })
    .from(productionNotes)
    .where(eq(productionNotes.id, noteId))
    .limit(1);

  if (note.length === 0) return { error: "Note not found." };

  if (
    note[0].createdBy !== user.id &&
    !can(user.role, "notes:manage_tags")
  ) {
    return { error: "You can only delete your own notes." };
  }

  await db.delete(productionNotes).where(eq(productionNotes.id, noteId));

  revalidatePath(`/productions/${productionSlug}/notes`);
  return { success: true };
}

export async function createNoteTag(
  organizationId: string,
  name: string,
  color: string,
): Promise<ActionResult & { tag?: { id: string; name: string; color: string } }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "notes:manage_tags")) {
    return { error: "You don't have permission to manage tags." };
  }

  const trimmed = name.trim();
  if (!trimmed) return { error: "Tag name is required." };

  const rows = await db
    .insert(noteTags)
    .values({ organizationId, name: trimmed, color, createdBy: user.id })
    .returning();

  return { success: true, tag: rows[0] };
}

export async function deleteNoteTag(
  tagId: string,
  organizationId: string,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "notes:manage_tags")) {
    return { error: "You don't have permission to manage tags." };
  }

  await db
    .delete(noteTags)
    .where(and(eq(noteTags.id, tagId), eq(noteTags.organizationId, organizationId)));

  return { success: true };
}
