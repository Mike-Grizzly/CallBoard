"use server";

import { db } from "@/db";
import {
  documents,
  scriptAnnotations,
  scriptParses,
  scriptCache,
  productionRoles,
  productionScenes,
  sceneBeats,
  productionMemberships,
  productions,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  requireCurrentUser,
  userCanAccessProduction,
  isDesignerOnly,
} from "@/lib/auth";
import { assertCanMutate } from "@/features/billing/guard";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyUploadMagicBytes } from "@/lib/upload-security";
import {
  PARSE_ROLE_TYPES,
  PARSE_LIMIT_PER_PRODUCTION,
  PARSE_WINDOW_DAYS,
  DESIGNER_PARSE_LIMIT_PER_PRODUCTION,
  DESIGNER_PARSE_LIMIT_PER_USER,
  ORG_PARSE_LIMIT_PER_MONTH,
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

  // The script must belong to this production. Without this, a user with access
  // to production A could write annotation rows referencing a document from
  // production B by passing its ID — a cross-tenant integrity hole. Mirrors the
  // document-ownership check in startScriptParse.
  const [scriptDoc] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(eq(documents.id, scriptId), eq(documents.productionId, productionId)),
    )
    .limit(1);
  if (!scriptDoc) {
    return { error: "Script not found." };
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

// The async run worker can die without ever flipping the row off "processing"
// (Vercel reclaims the function, or the work exceeds maxDuration=300s). Such a
// row would otherwise spin the review page forever AND block every future parse
// via the concurrency lock. Anything still "processing" past this deadline is
// treated as dead. 8 min = maxDuration plus generous headroom.
const STALE_PARSE_MS = 8 * 60 * 1000;
const STALE_PARSE_ERROR =
  "The analysis timed out. Long scripts can take a couple of minutes — please try again.";

function isStaleProcessing(row: { status: string; createdAt: Date }): boolean {
  return (
    row.status === "processing" &&
    Date.now() - new Date(row.createdAt).getTime() > STALE_PARSE_MS
  );
}

/** True if a parse is genuinely still running (processing and not past the deadline). */
function hasLiveProcessing(rows: { status: string; createdAt: Date }[]): boolean {
  return rows.some((r) => r.status === "processing" && !isStaleProcessing(r));
}

/**
 * If a parse has been stuck in "processing" past the deadline, flip it (and its
 * document) to "failed" so the UI stops spinning. Guarded by a status match so
 * it can't clobber a parse that finished in the same instant. Returns whether it
 * acted. Called from the poll paths so the user sees the failure immediately.
 */
async function failIfStale(row: {
  id: string;
  status: string;
  createdAt: Date;
  documentId: string | null;
}): Promise<boolean> {
  if (!isStaleProcessing(row)) return false;
  await db
    .update(scriptParses)
    .set({ status: "failed", error: STALE_PARSE_ERROR, updatedAt: new Date() })
    .where(
      and(eq(scriptParses.id, row.id), eq(scriptParses.status, "processing")),
    );
  if (row.documentId) {
    await db
      .update(documents)
      .set({ processingStatus: "failed" })
      .where(eq(documents.id, row.documentId));
  }
  return true;
}

export type StartScriptParseResult = { error?: string; parseId?: string };

/**
 * Org-wide denial-of-wallet backstop. The per-production and per-designer caps
 * don't bound total spend, since creating a new production hands out fresh
 * per-production quota. This counts every non-failed parse attributed to a
 * production in this org since the start of the current calendar month, and
 * returns the org's monthly limit message once the ceiling is hit (else null).
 */
async function orgParseBudgetError(
  organizationId: string,
): Promise<string | null> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({ id: scriptParses.id })
    .from(scriptParses)
    .innerJoin(productions, eq(scriptParses.productionId, productions.id))
    .where(
      and(
        eq(productions.organizationId, organizationId),
        gte(scriptParses.createdAt, monthStart),
        ne(scriptParses.status, "failed"),
      ),
    );

  return rows.length >= ORG_PARSE_LIMIT_PER_MONTH
    ? `Your organization has reached its limit of ${ORG_PARSE_LIMIT_PER_MONTH} AI analyses this month. It resets at the start of next month.`
    : null;
}

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
    .select({ status: scriptParses.status, createdAt: scriptParses.createdAt })
    .from(scriptParses)
    .where(
      and(
        eq(scriptParses.productionId, productionId),
        gte(scriptParses.createdAt, since),
      ),
    );
  // A dead-but-still-"processing" row (worker died) must not lock out new parses.
  if (hasLiveProcessing(recent)) {
    return { error: "An analysis is already running for this production — give it a minute." };
  }
  // Count only parses that actually ran (failed-before-the-model rows are free
  // and shouldn't burn quota).
  const designer = isDesignerOnly(user);
  const perProductionLimit = designer
    ? DESIGNER_PARSE_LIMIT_PER_PRODUCTION
    : PARSE_LIMIT_PER_PRODUCTION;
  const used = recent.filter((r) => r.status !== "failed").length;
  if (used >= perProductionLimit) {
    return {
      error: designer
        ? `Your plan includes ${DESIGNER_PARSE_LIMIT_PER_PRODUCTION} AI analysis per project. You've used it for this show.`
        : `You've reached the limit of ${PARSE_LIMIT_PER_PRODUCTION} AI analyses for this production in ${PARSE_WINDOW_DAYS} days.`,
    };
  }

  // Designers also have an account-wide cap across all their projects.
  if (designer) {
    const acrossProjects = await db
      .select({ id: scriptParses.id })
      .from(scriptParses)
      .where(
        and(
          eq(scriptParses.requestedBy, user.id),
          gte(scriptParses.createdAt, since),
          ne(scriptParses.status, "failed"),
        ),
      );
    if (acrossProjects.length >= DESIGNER_PARSE_LIMIT_PER_USER) {
      return {
        error: `Your plan includes ${DESIGNER_PARSE_LIMIT_PER_USER} AI analyses per ${PARSE_WINDOW_DAYS} days across your projects. You've reached it — try again later.`,
      };
    }
  }

  const orgBudgetError = await orgParseBudgetError(user.organizationId);
  if (orgBudgetError) return { error: orgBudgetError };

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
    .select({ status: scriptParses.status, createdAt: scriptParses.createdAt })
    .from(scriptParses)
    .where(
      and(
        eq(scriptParses.productionId, productionId),
        gte(scriptParses.createdAt, since),
      ),
    );
  if (hasLiveProcessing(recent)) {
    return { error: "An analysis is already running for this production — give it a minute." };
  }
  const designer = isDesignerOnly(user);
  const perProductionLimit = designer
    ? DESIGNER_PARSE_LIMIT_PER_PRODUCTION
    : PARSE_LIMIT_PER_PRODUCTION;
  if (recent.filter((r) => r.status !== "failed").length >= perProductionLimit) {
    return {
      error: designer
        ? `Your plan includes ${DESIGNER_PARSE_LIMIT_PER_PRODUCTION} AI analysis per project. You've used it for this show.`
        : `You've reached the limit of ${PARSE_LIMIT_PER_PRODUCTION} AI analyses for this production in ${PARSE_WINDOW_DAYS} days.`,
    };
  }
  if (designer) {
    const acrossProjects = await db
      .select({ id: scriptParses.id })
      .from(scriptParses)
      .where(
        and(
          eq(scriptParses.requestedBy, user.id),
          gte(scriptParses.createdAt, since),
          ne(scriptParses.status, "failed"),
        ),
      );
    if (acrossProjects.length >= DESIGNER_PARSE_LIMIT_PER_USER) {
      return {
        error: `Your plan includes ${DESIGNER_PARSE_LIMIT_PER_USER} AI analyses per ${PARSE_WINDOW_DAYS} days across your projects. You've reached it — try again later.`,
      };
    }
  }

  const orgBudgetError = await orgParseBudgetError(user.organizationId);
  if (orgBudgetError) return { error: orgBudgetError };

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
 * onto every production member's per-user annotations. Safe to re-apply:
 * re-applying the same parse is a no-op (status guard), and roles/scenes are
 * de-duplicated against what the production already has, while bookmarks replace
 * the prior AI-seeded set (stable `ai-*` ids).
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
      modelResult: scriptParses.result,
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

  // Idempotent: re-applying an already-applied parse (double-click, retry) is a
  // no-op rather than a second insert of the same roles/scenes.
  if (parse.status === "applied") return { success: true };

  // Re-parse semantics: a parse OWNS the rows it created (source = "ai") and
  // replaces them wholesale on the next parse, so re-analysing the same script
  // never stacks duplicates. Hand-added / wizard rows (source = "manual") and
  // any blocking work are always preserved.
  await db.transaction(async (tx) => {
    // ── Characters ──────────────────────────────────────────────────────
    // Capture the casting assignments on the outgoing AI roles so we can
    // re-link them by character name onto the fresh rows (re-parsing must not
    // un-cast actors). Production access lives in production_memberships and is
    // untouched here.
    const prevAiRoles = await tx
      .select({
        name: productionRoles.name,
        assignedUserId: productionRoles.assignedUserId,
        actor: productionRoles.actor,
      })
      .from(productionRoles)
      .where(
        and(
          eq(productionRoles.productionId, productionId),
          eq(productionRoles.source, "ai"),
        ),
      );
    const assignmentByName = new Map(
      prevAiRoles
        .filter((r) => r.assignedUserId)
        .map((r) => [
          r.name.trim().toLowerCase(),
          { assignedUserId: r.assignedUserId, actor: r.actor },
        ]),
    );

    await tx
      .delete(productionRoles)
      .where(
        and(
          eq(productionRoles.productionId, productionId),
          eq(productionRoles.source, "ai"),
        ),
      );

    // Manual roles that remain — don't create an AI row that collides by name.
    const manualRoles = await tx
      .select({ name: productionRoles.name })
      .from(productionRoles)
      .where(eq(productionRoles.productionId, productionId));
    const haveRole = new Set(manualRoles.map((r) => r.name.trim().toLowerCase()));

    const roles = result.roles
      .map((r, i) => ({
        name: (r.name ?? "").trim(),
        type: (PARSE_ROLE_TYPES as readonly string[]).includes(r.type)
          ? r.type
          : "Principal",
        sortOrder: i,
      }))
      .filter((r) => r.name.length > 0 && !haveRole.has(r.name.toLowerCase()));
    if (roles.length > 0) {
      await tx.insert(productionRoles).values(
        roles.map((r) => {
          const prior = assignmentByName.get(r.name.toLowerCase());
          return {
            productionId,
            source: "ai",
            ...r,
            assignedUserId: prior?.assignedUserId ?? null,
            actor: prior?.actor ?? null,
          };
        }),
      );
    }

    // ── Scenes ──────────────────────────────────────────────────────────
    // Scenes are shared with the blocking tool (scene_beats cascade-delete on
    // scene removal). Replace only AI scenes with NO beats; an AI scene that's
    // been blocked is preserved even if this parse drops it.
    const aiScenes = await tx
      .select({ id: productionScenes.id })
      .from(productionScenes)
      .where(
        and(
          eq(productionScenes.productionId, productionId),
          eq(productionScenes.source, "ai"),
        ),
      );
    const aiSceneIds = aiScenes.map((s) => s.id);
    const blocked =
      aiSceneIds.length > 0
        ? await tx
            .selectDistinct({ sceneId: sceneBeats.sceneId })
            .from(sceneBeats)
            .where(inArray(sceneBeats.sceneId, aiSceneIds))
        : [];
    const blockedIds = new Set(blocked.map((b) => b.sceneId));
    const removableIds = aiSceneIds.filter((id) => !blockedIds.has(id));
    if (removableIds.length > 0) {
      await tx
        .delete(productionScenes)
        .where(inArray(productionScenes.id, removableIds));
    }

    // Remaining scenes (manual + AI-with-blocking) — don't duplicate act/scene.
    const remainingScenes = await tx
      .select({
        actNumber: productionScenes.actNumber,
        sceneNumber: productionScenes.sceneNumber,
      })
      .from(productionScenes)
      .where(eq(productionScenes.productionId, productionId));
    const haveScene = new Set(
      remainingScenes.map((s) => `${s.actNumber}-${s.sceneNumber}`),
    );

    const scenes = result.scenes
      .map((s, i) => ({
        actNumber: Math.max(1, Math.trunc(s.actNumber) || 1),
        sceneNumber: Math.max(1, Math.trunc(s.sceneNumber) || 1),
        title: (s.title ?? "").trim() || `Scene ${i + 1}`,
        orderIndex: i,
      }))
      .filter(
        (s) =>
          s.title.length > 0 && !haveScene.has(`${s.actNumber}-${s.sceneNumber}`),
      );
    if (scenes.length > 0) {
      await tx
        .insert(productionScenes)
        .values(scenes.map((s) => ({ productionId, source: "ai", ...s })));
    }
  });

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

  // Populate this organization's cache so the next production in the SAME org
  // that uploads the identical file reuses this breakdown. Cache the
  // SERVER-STORED model result (what runScriptParse wrote on the row), not the
  // client-supplied `result` payload — the apply payload is trusted only for
  // this caller's own production. The cache is scoped per org (a script can
  // carry prompt-injection), so it is never propagated to other orgs. Stores
  // ONLY the structural breakdown (title/roles/scenes/bookmarks) — never
  // annotations, casting, or production data.
  const cacheResult = parse.modelResult as ScriptParseResult | null;
  if (
    parse.fingerprint &&
    cacheResult &&
    ((cacheResult.roles?.length ?? 0) > 0 || (cacheResult.scenes?.length ?? 0) > 0)
  ) {
    await db
      .insert(scriptCache)
      .values({
        organizationId: user.organizationId,
        fingerprint: parse.fingerprint,
        title: (cacheResult.title ?? "").trim() || null,
        result: cacheResult,
      })
      .onConflictDoUpdate({
        target: [scriptCache.organizationId, scriptCache.fingerprint],
        set: {
          title: (cacheResult.title ?? "").trim() || null,
          result: cacheResult,
          updatedAt: new Date(),
        },
      });
  }

  revalidatePath("/productions");
  return { success: true };
}

/** The shared, AI-seeded bookmark set derived from a parse result (stable `ai-*` ids). */
function aiBookmarksFromResult(result: ScriptParseResult): Bookmark[] {
  const now = new Date().toISOString();
  return result.bookmarks
    .filter((b) => Number.isFinite(b.page) && b.page >= 1)
    .map((b, i) => ({
      id: `ai-${b.page}-${i}`,
      page: Math.trunc(b.page),
      title: (b.title ?? "").trim() || `Page ${Math.trunc(b.page)}`,
      kind: b.kind === "song" ? ("song" as const) : ("scene" as const),
      createdAt: now,
    }));
}

async function seedSharedBookmarks(
  productionId: string,
  scriptId: string,
  result: ScriptParseResult,
  requesterId: string,
) {
  const shared = aiBookmarksFromResult(result);
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

/**
 * Lazily seed a member with the production's AI bookmark set when they open the
 * script. `seedSharedBookmarks` only seeds the members present at apply time, so
 * anyone who joins later (invite, bulk-assign, wizard) would otherwise see no
 * bookmarks. This is the single chokepoint — every viewer hits the Script tab —
 * and follows the codebase's lazy-write convention (auto-profile creation).
 *
 * Self-securing (callable as a server action): the user is the session user, and
 * production access is gated. Returns the merged bookmark set if it seeded (so
 * the page can show it this render), or null if there was nothing to do.
 */
export async function ensureMemberBookmarks(
  scriptId: string,
  productionId: string,
): Promise<Bookmark[] | null> {
  const user = await requireCurrentUser();
  if (!(await userCanAccessProduction(user, productionId))) return null;

  // The script must belong to this production (see saveAnnotations) — don't
  // seed bookmarks against a document from another production.
  const [scriptDoc] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(eq(documents.id, scriptId), eq(documents.productionId, productionId)),
    )
    .limit(1);
  if (!scriptDoc) return null;

  // The applied parse is the canonical AI breakdown for this document.
  const [applied] = await db
    .select({ result: scriptParses.result })
    .from(scriptParses)
    .where(
      and(
        eq(scriptParses.documentId, scriptId),
        eq(scriptParses.status, "applied"),
      ),
    )
    .orderBy(desc(scriptParses.updatedAt))
    .limit(1);
  const result = applied?.result as ScriptParseResult | undefined;
  if (!result) return null;
  const ai = aiBookmarksFromResult(result);
  if (ai.length === 0) return null;

  const [row] = await db
    .select({ bookmarks: scriptAnnotations.bookmarks })
    .from(scriptAnnotations)
    .where(
      and(
        eq(scriptAnnotations.scriptId, scriptId),
        eq(scriptAnnotations.userId, user.id),
      ),
    )
    .limit(1);
  const current = (row?.bookmarks as Bookmark[] | undefined) ?? [];
  // Already seeded (the caller usually pre-checks this, but be safe).
  if (current.some((b) => b.id?.startsWith("ai-"))) return null;

  const merged = [...current.filter((b) => !b.id?.startsWith("ai-")), ...ai];
  if (row) {
    await db
      .update(scriptAnnotations)
      .set({ bookmarks: merged, updatedAt: new Date() })
      .where(
        and(
          eq(scriptAnnotations.scriptId, scriptId),
          eq(scriptAnnotations.userId, user.id),
        ),
      );
  } else {
    await db
      .insert(scriptAnnotations)
      .values({ scriptId, userId: user.id, productionId, bookmarks: merged });
  }
  return merged;
}

/** Poll target for the review page while a parse is processing. */
export async function fetchLatestScriptParse(productionId: string) {
  const user = await requireCurrentUser();
  if (!(await userCanAccessProduction(user, productionId))) return null;
  const { getLatestScriptParse } = await import("./queries");
  const parse = await getLatestScriptParse(productionId);
  // Watchdog: if the worker died and left this spinning, fail it now so the
  // review page stops polling forever.
  if (parse && (await failIfStale(parse))) {
    return { ...parse, status: "failed", error: STALE_PARSE_ERROR };
  }
  return parse;
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
  if (fileSize > 64 * 1024 * 1024) return { error: "File must be under 64MB." };

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

  const supabase = createSupabaseAdminClient();
  const bytesOk = await verifyUploadMagicBytes(supabase, storagePath, "application/pdf");
  if (!bytesOk) {
    await supabase.storage.from("attachments").remove([storagePath]);
    return { error: "File content does not match the declared type." };
  }

  // Per-user cost cap (there's no production to cap against yet).
  const since = new Date(
    Date.now() - WIZARD_PARSE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const recent = await db
    .select({ status: scriptParses.status, createdAt: scriptParses.createdAt })
    .from(scriptParses)
    .where(
      and(
        eq(scriptParses.requestedBy, user.id),
        isNull(scriptParses.productionId),
        gte(scriptParses.createdAt, since),
      ),
    );
  if (hasLiveProcessing(recent)) {
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
      documentId: scriptParses.documentId,
      requestedBy: scriptParses.requestedBy,
      status: scriptParses.status,
      result: scriptParses.result,
      error: scriptParses.error,
      createdAt: scriptParses.createdAt,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);
  if (!parse) return null;

  const authorized = parse.productionId
    ? await userCanAccessProduction(user, parse.productionId)
    : parse.requestedBy === user.id;
  if (!authorized) return null;

  // Watchdog: a parse whose worker died stops spinning the poller here too.
  if (await failIfStale(parse)) {
    return { status: "failed", result: parse.result, error: STALE_PARSE_ERROR };
  }
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
