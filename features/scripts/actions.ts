"use server";

import { db } from "@/db";
import {
  documents,
  scriptAnnotations,
  scriptParses,
  productionRoles,
  productionScenes,
  productionMemberships,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { assertCanMutate } from "@/features/billing/guard";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PARSE_ROLE_TYPES,
  type Bookmark,
  type ScriptParseResult,
} from "./constants";

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

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  // Verify the document belongs to this production
  const [doc] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.productionId, productionId),
      ),
    )
    .limit(1);

  if (!doc) {
    return { error: "Document not found for this production." };
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

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

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

// ----- AI script analysis -----

export type StartScriptParseResult = { error?: string; parseId?: string };

/**
 * Stage an AI analysis of a script document. Inserts a `script_parses` row in
 * `processing` state and returns its id; the caller then kicks
 * `POST /api/scripts/[parseId]/run`, which does the slow work off the request
 * path and flips the row to `ready`/`failed`. AI output never touches the
 * production's real tables until `applyScriptParse`.
 */
export async function startScriptParse(
  formData: FormData,
): Promise<StartScriptParseResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to analyse scripts." };
  }

  const documentId = formData.get("document_id") as string;
  const productionId = formData.get("production_id") as string;
  if (!documentId || !productionId) return { error: "Missing required fields." };

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  const [doc] = await db
    .select({ id: documents.id, contentType: documents.contentType })
    .from(documents)
    .where(
      and(eq(documents.id, documentId), eq(documents.productionId, productionId)),
    )
    .limit(1);
  if (!doc) return { error: "Script not found for this production." };
  if (doc.contentType !== "application/pdf") {
    return { error: "AI analysis supports PDF scripts only." };
  }

  const [parse] = await db
    .insert(scriptParses)
    .values({ productionId, documentId, requestedBy: user.id, status: "processing" })
    .returning({ id: scriptParses.id });

  await db
    .update(documents)
    .set({ processingStatus: "processing" })
    .where(eq(documents.id, documentId));

  return { parseId: parse.id };
}

export type ApplyScriptParseResult = { error?: string; success?: boolean };

/**
 * Write a reviewed (possibly hand-edited) analysis into the production: cast
 * roles, the act/scene breakdown, and a shared set of script bookmarks seeded
 * onto every production member's per-user annotations. Idempotent on bookmarks
 * (stable `ai-*` ids are skipped if already present) so re-applying is safe.
 */
export async function applyScriptParse(
  parseId: string,
  result: ScriptParseResult,
): Promise<ApplyScriptParseResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to apply analyses." };
  }
  if (!parseId || !result) return { error: "Missing analysis." };

  const [parse] = await db
    .select({
      id: scriptParses.id,
      productionId: scriptParses.productionId,
      documentId: scriptParses.documentId,
      status: scriptParses.status,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!parse) return { error: "Analysis not found." };
  if (!(await userCanAccessProduction(user, parse.productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  // Roles — only named rows, type clamped to the known set.
  const roles = result.roles
    .map((r, i) => ({
      name: (r.name ?? "").trim(),
      type: (PARSE_ROLE_TYPES as readonly string[]).includes(r.type)
        ? r.type
        : "Principal",
      sortOrder: i,
    }))
    .filter((r) => r.name.length > 0);
  if (roles.length > 0) {
    await db
      .insert(productionRoles)
      .values(roles.map((r) => ({ productionId: parse.productionId, ...r })));
  }

  // Scenes — in reading order.
  const scenes = result.scenes
    .map((s, i) => ({
      actNumber: Math.max(1, Math.trunc(s.actNumber) || 1),
      sceneNumber: Math.max(1, Math.trunc(s.sceneNumber) || 1),
      title: (s.title ?? "").trim() || `Scene ${i + 1}`,
      orderIndex: i,
    }))
    .filter((s) => s.title.length > 0);
  if (scenes.length > 0) {
    await db
      .insert(productionScenes)
      .values(scenes.map((s) => ({ productionId: parse.productionId, ...s })));
  }

  // Bookmarks — seed the shared set onto every member's annotations for this
  // script, so cast members open the script already bookmarked.
  await seedSharedBookmarks(parse.productionId, parse.documentId, result, user.id);

  await db
    .update(scriptParses)
    .set({ status: "applied", updatedAt: new Date() })
    .where(eq(scriptParses.id, parseId));
  await db
    .update(documents)
    .set({ processingStatus: "applied" })
    .where(eq(documents.id, parse.documentId));

  revalidatePath("/productions");
  return { success: true };
}

async function seedSharedBookmarks(
  productionId: string,
  scriptId: string,
  result: ScriptParseResult,
  requesterId: string,
) {
  const now = new Date().toISOString();
  const shared: Bookmark[] = result.bookmarks
    .filter((b) => Number.isFinite(b.page) && b.page >= 1)
    .map((b, i) => ({
      id: `ai-${b.page}-${i}`,
      page: Math.trunc(b.page),
      title: (b.title ?? "").trim() || `Page ${Math.trunc(b.page)}`,
      createdAt: now,
    }));
  if (shared.length === 0) return;

  const members = await db
    .select({ userId: productionMemberships.userId })
    .from(productionMemberships)
    .where(eq(productionMemberships.productionId, productionId));
  const userIds = new Set<string>([requesterId, ...members.map((m) => m.userId)]);

  const existingRows = await db
    .select({
      userId: scriptAnnotations.userId,
      bookmarks: scriptAnnotations.bookmarks,
    })
    .from(scriptAnnotations)
    .where(eq(scriptAnnotations.scriptId, scriptId));
  const byUser = new Map(existingRows.map((r) => [r.userId, r.bookmarks as Bookmark[]]));

  for (const userId of userIds) {
    const current = byUser.get(userId);
    if (current === undefined) {
      await db.insert(scriptAnnotations).values({
        scriptId,
        userId,
        productionId,
        bookmarks: shared,
      });
    } else {
      const have = new Set(current.map((b) => b.id));
      const merged = [...current, ...shared.filter((b) => !have.has(b.id))];
      if (merged.length !== current.length) {
        await db
          .update(scriptAnnotations)
          .set({ bookmarks: merged, updatedAt: new Date() })
          .where(
            and(
              eq(scriptAnnotations.scriptId, scriptId),
              eq(scriptAnnotations.userId, userId),
            ),
          );
      }
    }
  }
}

/** Poll target for the review page while a parse is processing. */
export async function fetchLatestScriptParse(productionId: string) {
  const user = await requireCurrentUser();
  if (!(await userCanAccessProduction(user, productionId))) return null;
  const { getLatestScriptParse } = await import("./queries");
  return getLatestScriptParse(productionId);
}

export async function discardScriptParse(
  parseId: string,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to do that." };
  }
  const [parse] = await db
    .select({
      productionId: scriptParses.productionId,
      documentId: scriptParses.documentId,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!parse) return { success: true };
  if (!(await userCanAccessProduction(user, parse.productionId))) {
    return { error: "You don't have access to that production." };
  }

  await db.delete(scriptParses).where(eq(scriptParses.id, parseId));
  await db
    .update(documents)
    .set({ processingStatus: "none" })
    .where(eq(documents.id, parse.documentId));
  return { success: true };
}

export async function getScriptUrl(storagePath: string): Promise<string> {
  const user = await requireCurrentUser();

  if (!storagePath) return "";

  // Resolve the owning production via the document that holds this storagePath,
  // then gate access (org-scoped) before minting a signed URL.
  const [doc] = await db
    .select({ productionId: documents.productionId })
    .from(documents)
    .where(eq(documents.storagePath, storagePath))
    .limit(1);

  if (!doc || !(await userCanAccessProduction(user, doc.productionId))) {
    return "";
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? "";
}
