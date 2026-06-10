"use server";

import { db } from "@/db";
import {
  documents,
  scriptAnnotations,
  scriptParses,
  scriptCache,
  productionRoles,
  productionScenes,
  productionMemberships,
  productions,
} from "@/db/schema";
import { and, eq, gte, isNull } from "drizzle-orm";
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

// Cost guardrails. Each parse is a real per-token Anthropic charge, so cap how
// often the feature can run for one production. The window is generous enough
// for legitimate re-uploads but kills runaway loops.
const PARSE_LIMIT_PER_PRODUCTION = 5;
const PARSE_WINDOW_DAYS = 30;

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

  // Cost guardrails: one parse at a time per production, and a rolling cap.
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
  if (recent.some((r) => r.status === "processing")) {
    return { error: "An analysis is already running for this production — give it a minute." };
  }
  // Count only parses that actually ran (failed-before-the-model rows are free
  // and shouldn't burn quota).
  const used = recent.filter((r) => r.status !== "failed").length;
  if (used >= PARSE_LIMIT_PER_PRODUCTION) {
    return {
      error: `You've reached the limit of ${PARSE_LIMIT_PER_PRODUCTION} AI analyses for this production in ${PARSE_WINDOW_DAYS} days.`,
    };
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

/**
 * Re-run the analysis for a production's script with the director's free-text
 * corrections, so the model fixes specific problems (e.g. "songs are misnumbered
 * after p.30 — use the printed labels"). Stages a fresh parse carrying the notes;
 * `runScriptParse` feeds them + the previous result back to the model.
 */
export async function reparseWithNotes(
  parseId: string,
  notes: string,
): Promise<StartScriptParseResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to analyse scripts." };
  }
  const trimmed = (notes ?? "").trim();
  if (!trimmed) return { error: "Add a note describing what to fix." };
  if (trimmed.length > 2000) return { error: "Keep corrections under 2000 characters." };

  const [prev] = await db
    .select({
      productionId: scriptParses.productionId,
      documentId: scriptParses.documentId,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!prev || !prev.productionId || !prev.documentId) {
    return { error: "Re-analysis is available once the script is on a production." };
  }
  const productionId = prev.productionId;
  const documentId = prev.documentId;

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

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
  if (recent.some((r) => r.status === "processing")) {
    return { error: "An analysis is already running for this production — give it a minute." };
  }
  if (recent.filter((r) => r.status !== "failed").length >= PARSE_LIMIT_PER_PRODUCTION) {
    return {
      error: `You've reached the limit of ${PARSE_LIMIT_PER_PRODUCTION} AI analyses for this production in ${PARSE_WINDOW_DAYS} days.`,
    };
  }

  const [row] = await db
    .insert(scriptParses)
    .values({
      productionId,
      documentId,
      requestedBy: user.id,
      status: "processing",
      notes: trimmed,
    })
    .returning({ id: scriptParses.id });

  await db
    .update(documents)
    .set({ processingStatus: "processing" })
    .where(eq(documents.id, documentId));

  return { parseId: row.id };
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
      fingerprint: scriptParses.fingerprint,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!parse) return { error: "Analysis not found." };
  // A reviewable parse is always linked to a production + document by now
  // (wizard parses get linked on launch via attachWizardScript).
  if (!parse.productionId || !parse.documentId) {
    return { error: "This analysis isn't linked to a production yet." };
  }
  const productionId = parse.productionId;
  const documentId = parse.documentId;
  if (!(await userCanAccessProduction(user, productionId))) {
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
      .values(roles.map((r) => ({ productionId, ...r })));
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
      .values(scenes.map((s) => ({ productionId, ...s })));
  }

  // Bookmarks — seed the shared set onto every member's annotations for this
  // script, so cast members open the script already bookmarked.
  await seedSharedBookmarks(productionId, documentId, result, user.id);

  await db
    .update(scriptParses)
    .set({ status: "applied", updatedAt: new Date() })
    .where(eq(scriptParses.id, parseId));
  await db
    .update(documents)
    .set({ processingStatus: "applied" })
    .where(eq(documents.id, documentId));

  // Populate the global cache with this human-verified breakdown so the next
  // production that uploads the identical file reuses it. Stores ONLY the
  // structural result (title/roles/scenes/bookmarks) — never annotations,
  // casting, or production data.
  if (parse.fingerprint && (result.roles.length > 0 || result.scenes.length > 0)) {
    await db
      .insert(scriptCache)
      .values({
        fingerprint: parse.fingerprint,
        title: (result.title ?? "").trim() || null,
        result,
      })
      .onConflictDoUpdate({
        target: scriptCache.fingerprint,
        set: {
          title: (result.title ?? "").trim() || null,
          result,
          updatedAt: new Date(),
        },
      });
  }

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
      // Replace the previous AI-seeded set (ids prefixed "ai-") with the new
      // one, but preserve any bookmarks the user added themselves. This means a
      // re-parse re-bookmarks from scratch instead of piling onto stale markers.
      const userOwned = current.filter((b) => !b.id.startsWith("ai-"));
      const merged = [...userOwned, ...shared];
      const changed =
        merged.length !== current.length ||
        merged.some((b, i) => current[i]?.id !== b.id);
      if (changed) {
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
      requestedBy: scriptParses.requestedBy,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!parse) return { success: true };
  const authorized = parse.productionId
    ? await userCanAccessProduction(user, parse.productionId)
    : parse.requestedBy === user.id;
  if (!authorized) return { error: "You don't have access to that analysis." };

  await db.delete(scriptParses).where(eq(scriptParses.id, parseId));
  if (parse.documentId) {
    await db
      .update(documents)
      .set({ processingStatus: "none" })
      .where(eq(documents.id, parse.documentId));
  }
  return { success: true };
}

// ----- Wizard AI cast auto-fill (parse a script before the production exists) -----

const WIZARD_PARSE_LIMIT = 5; // per user, per window
const WIZARD_PARSE_WINDOW_DAYS = 30;

/** Signed upload URL for a script uploaded during the new-production wizard. */
export async function requestWizardScriptUpload(
  fileName: string,
  fileSize: number,
  contentType: string,
): Promise<{ error?: string; path?: string; token?: string }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to do that." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) {
    return { error: "AI script setup is available on paid plans and during your free trial." };
  }
  if (contentType !== "application/pdf") {
    return { error: "Upload a PDF script." };
  }
  if (!fileName || fileSize <= 0) return { error: "Please choose a file." };
  if (fileSize > 25 * 1024 * 1024) return { error: "File must be under 25MB." };

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `wizard-scripts/${user.id}/${Date.now()}-${safeName}`;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(storagePath);
  if (error || !data) {
    return { error: `Could not start upload: ${error?.message ?? "unknown error"}` };
  }
  return { path: data.path, token: data.token };
}

/** Stage a pre-production ("wizard") parse and return its id to kick the run route. */
export async function startWizardScriptParse(
  storagePath: string,
): Promise<StartScriptParseResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to do that." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) {
    return { error: "AI script setup is available on paid plans and during your free trial." };
  }
  if (!storagePath.startsWith(`wizard-scripts/${user.id}/`)) {
    return { error: "Upload could not be verified." };
  }

  // Per-user cost cap (there's no production to cap against yet).
  const since = new Date(
    Date.now() - WIZARD_PARSE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const recent = await db
    .select({ status: scriptParses.status })
    .from(scriptParses)
    .where(
      and(
        eq(scriptParses.requestedBy, user.id),
        isNull(scriptParses.productionId),
        gte(scriptParses.createdAt, since),
      ),
    );
  if (recent.some((r) => r.status === "processing")) {
    return { error: "An analysis is already running — give it a moment." };
  }
  if (recent.filter((r) => r.status !== "failed").length >= WIZARD_PARSE_LIMIT) {
    return {
      error: `You've reached the limit of ${WIZARD_PARSE_LIMIT} AI script analyses in ${WIZARD_PARSE_WINDOW_DAYS} days.`,
    };
  }

  const [parse] = await db
    .insert(scriptParses)
    .values({ requestedBy: user.id, storagePath, status: "processing" })
    .returning({ id: scriptParses.id });
  return { parseId: parse.id };
}

/** Poll target keyed by parse id (works for both wizard and production parses). */
export async function fetchScriptParseById(parseId: string) {
  const user = await requireCurrentUser();
  const [parse] = await db
    .select({
      id: scriptParses.id,
      productionId: scriptParses.productionId,
      requestedBy: scriptParses.requestedBy,
      status: scriptParses.status,
      result: scriptParses.result,
      error: scriptParses.error,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!parse) return null;

  const authorized = parse.productionId
    ? await userCanAccessProduction(user, parse.productionId)
    : parse.requestedBy === user.id;
  if (!authorized) return null;

  return { status: parse.status, result: parse.result, error: parse.error };
}

/**
 * After the wizard launches a production, carry the uploaded script over as the
 * production's default script document (so the user doesn't re-upload, and the
 * full Script-tab AI is ready to run later). Idempotent + owner-gated.
 */
export async function attachWizardScript(input: {
  parseId: string;
  slug: string;
  fileName: string;
  fileSize: number;
}): Promise<{ error?: string; success?: boolean }> {
  const user = await requireCurrentUser();
  if (!can(user.role, "productions:manage")) {
    return { error: "You don't have permission to do that." };
  }

  const [parse] = await db
    .select({
      requestedBy: scriptParses.requestedBy,
      storagePath: scriptParses.storagePath,
      documentId: scriptParses.documentId,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, input.parseId))
    .limit(1);
  if (!parse || parse.requestedBy !== user.id) return { success: true };
  if (parse.documentId) return { success: true }; // already attached
  if (!parse.storagePath) return { success: true };

  const [prod] = await db
    .select({ id: productions.id })
    .from(productions)
    .where(
      and(
        eq(productions.slug, input.slug),
        eq(productions.organizationId, user.organizationId),
      ),
    )
    .limit(1);
  if (!prod) return { error: "Production not found." };

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const newPath = `documents/${prod.id}/${Date.now()}-${safeName}`;
  const supabase = createSupabaseAdminClient();
  const { error: moveError } = await supabase.storage
    .from("attachments")
    .move(parse.storagePath, newPath);
  if (moveError) return { error: "Could not attach the script file." };

  const title = input.fileName.replace(/\.[^.]+$/, "") || "Script";
  const [doc] = await db
    .insert(documents)
    .values({
      productionId: prod.id,
      uploadedBy: user.id,
      title,
      fileName: input.fileName,
      fileSize: input.fileSize,
      contentType: "application/pdf",
      storagePath: newPath,
      documentType: "script",
      isDefaultScript: true,
      processingStatus: "ready",
    })
    .returning({ id: documents.id });

  await db
    .update(scriptParses)
    .set({ productionId: prod.id, documentId: doc.id, storagePath: null })
    .where(eq(scriptParses.id, input.parseId));

  revalidatePath("/productions");
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
