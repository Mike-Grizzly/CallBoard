"use server";

import { db } from "@/db";
import { documents, scriptAnnotations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetDefaultScriptResult = { error?: string; success?: boolean };

export async function setDefaultScript(
  formData: FormData,
): Promise<SetDefaultScriptResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to set the default script." };
  }

  const documentId = formData.get("document_id") as string;
  const productionId = formData.get("production_id") as string;

  if (!documentId || !productionId) {
    return { error: "Missing required fields." };
  }

  // Unset any existing default for this production
  await db
    .update(documents)
    .set({ isDefaultScript: false })
    .where(
      and(
        eq(documents.productionId, productionId),
        eq(documents.isDefaultScript, true),
      ),
    );

  // Get current version to increment
  const current = await db
    .select({ scriptVersion: documents.scriptVersion })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  const nextVersion = (current[0]?.scriptVersion ?? 0) + 1;

  await db
    .update(documents)
    .set({ isDefaultScript: true, scriptVersion: nextVersion })
    .where(eq(documents.id, documentId));

  // Mark all existing annotations for this production as stale
  await db
    .update(scriptAnnotations)
    .set({ hasStalePages: true })
    .where(eq(scriptAnnotations.productionId, productionId));

  revalidatePath("/productions");
  return { success: true };
}

export type SaveAnnotationsResult = { error?: string; success?: boolean };

export async function saveAnnotations(
  formData: FormData,
): Promise<SaveAnnotationsResult> {
  const user = await requireCurrentUser();

  const scriptId = formData.get("script_id") as string;
  const productionId = formData.get("production_id") as string;
  const annotationsJson = formData.get("annotations") as string;
  const bookmarksJson = formData.get("bookmarks") as string;
  const pageOverridesJson = formData.get("page_overrides") as string;

  if (!scriptId || !productionId) {
    return { error: "Missing required fields." };
  }

  const annotations = JSON.parse(annotationsJson || "[]");
  const bookmarks = JSON.parse(bookmarksJson || "[]");
  const pageOverrides = JSON.parse(pageOverridesJson || "{}");

  const existing = await db
    .select({ id: scriptAnnotations.id })
    .from(scriptAnnotations)
    .where(
      and(
        eq(scriptAnnotations.scriptId, scriptId),
        eq(scriptAnnotations.userId, user.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(scriptAnnotations)
      .set({ annotations, bookmarks, pageOverrides, updatedAt: new Date() })
      .where(
        and(
          eq(scriptAnnotations.scriptId, scriptId),
          eq(scriptAnnotations.userId, user.id),
        ),
      );
  } else {
    await db.insert(scriptAnnotations).values({
      scriptId,
      userId: user.id,
      productionId,
      annotations,
      bookmarks,
      pageOverrides,
    });
  }

  return { success: true };
}

export async function dismissStaleBanner(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireCurrentUser();

  const scriptId = formData.get("script_id") as string;
  if (!scriptId) return { error: "Missing script ID." };

  await db
    .update(scriptAnnotations)
    .set({ hasStalePages: false })
    .where(
      and(
        eq(scriptAnnotations.scriptId, scriptId),
        eq(scriptAnnotations.userId, user.id),
      ),
    );

  return { success: true };
}

export async function getScriptUrl(storagePath: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? "";
}
