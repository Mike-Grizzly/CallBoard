"use server";

import { db } from "@/db";
import { documents, scriptOcr, scriptAnnotations } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { assertCanMutate } from "@/features/billing/guard";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { OcrPage, ScriptOcrStatus } from "./constants";

/**
 * OCR for scanned scripts is produced in the browser (tesseract.js) but the
 * RESULT is shared across the production — keyed by the file's storage path +
 * script version — so it runs once, not per viewer. These actions load, claim,
 * and persist that shared result.
 */

/** Resolve the production that owns a script file, then gate org access. */
async function gateStoragePath(
  storagePath: string,
): Promise<{ productionId: string } | null> {
  const user = await requireCurrentUser();
  if (!storagePath) return null;
  const [doc] = await db
    .select({ productionId: documents.productionId })
    .from(documents)
    .where(eq(documents.storagePath, storagePath))
    .limit(1);
  if (!doc?.productionId) return null;
  if (!(await userCanAccessProduction(user, doc.productionId))) return null;
  return { productionId: doc.productionId };
}

export type GetScriptOcrResult = {
  status: ScriptOcrStatus;
  pages: OcrPage[];
} | null;

/** Existing OCR for a script file, or null if none has been run. */
export async function getScriptOcr(
  storagePath: string,
  scriptVersion: number,
): Promise<GetScriptOcrResult> {
  if (!(await gateStoragePath(storagePath))) return null;

  const [row] = await db
    .select({ status: scriptOcr.status, pages: scriptOcr.pages })
    .from(scriptOcr)
    .where(
      and(
        eq(scriptOcr.storagePath, storagePath),
        eq(scriptOcr.scriptVersion, scriptVersion),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    status: row.status as ScriptOcrStatus,
    pages: (row.pages as OcrPage[] | null) ?? [],
  };
}

export type StartScriptOcrInput = {
  storagePath: string;
  scriptVersion: number;
  documentId: string;
};

export type StartScriptOcrResult = {
  error?: string;
  ocrId?: string;
  status?: ScriptOcrStatus;
};

/**
 * Claim (or reuse) the OCR row for a script file. Returns `ready` if someone
 * already OCR'd this exact file, so the viewer can just load it instead of
 * re-running the work.
 */
export async function startScriptOcr(
  input: StartScriptOcrInput,
): Promise<StartScriptOcrResult> {
  const user = await requireCurrentUser();
  const gate = await gateStoragePath(input.storagePath);
  if (!gate) return { error: "You don't have access to that script." };

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  const [existing] = await db
    .select({ id: scriptOcr.id, status: scriptOcr.status })
    .from(scriptOcr)
    .where(
      and(
        eq(scriptOcr.storagePath, input.storagePath),
        eq(scriptOcr.scriptVersion, input.scriptVersion),
      ),
    )
    .limit(1);

  if (existing) {
    return { ocrId: existing.id, status: existing.status as ScriptOcrStatus };
  }

  const [row] = await db
    .insert(scriptOcr)
    .values({
      productionId: gate.productionId,
      documentId: input.documentId || null,
      storagePath: input.storagePath,
      scriptVersion: input.scriptVersion,
      status: "processing",
      pages: [],
      createdBy: user.id,
    })
    .returning({ id: scriptOcr.id });

  return { ocrId: row.id, status: "processing" };
}

export type SaveScriptOcrPagesInput = {
  ocrId: string;
  pages: OcrPage[];
  pageCount: number;
  done: boolean;
};

export type SaveScriptOcrPagesResult = { error?: string; success?: boolean };

/**
 * Append a batch of OCR'd pages to the shared row, merged by page number, and
 * flip the row to `ready` once the document is fully processed.
 */
export async function saveScriptOcrPages(
  input: SaveScriptOcrPagesInput,
): Promise<SaveScriptOcrPagesResult> {
  const user = await requireCurrentUser();

  const [row] = await db
    .select({
      storagePath: scriptOcr.storagePath,
      pages: scriptOcr.pages,
    })
    .from(scriptOcr)
    .where(eq(scriptOcr.id, input.ocrId))
    .limit(1);
  if (!row) return { error: "OCR job not found." };

  if (!(await gateStoragePath(row.storagePath))) {
    return { error: "You don't have access to that script." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  // Merge incoming pages over what's stored (idempotent per page number).
  const byPage = new Map<number, OcrPage>();
  for (const p of (row.pages as OcrPage[] | null) ?? []) byPage.set(p.page, p);
  for (const p of input.pages) byPage.set(p.page, p);
  const merged = [...byPage.values()].sort((a, b) => a.page - b.page);

  await db
    .update(scriptOcr)
    .set({
      pages: merged,
      pageCount: input.pageCount,
      status: input.done ? "ready" : "processing",
      updatedAt: new Date(),
    })
    .where(eq(scriptOcr.id, input.ocrId));

  return { success: true };
}

/** Mark an OCR job failed so the viewer can offer a retry. */
export async function failScriptOcr(ocrId: string): Promise<void> {
  const [row] = await db
    .select({ storagePath: scriptOcr.storagePath })
    .from(scriptOcr)
    .where(eq(scriptOcr.id, ocrId))
    .limit(1);
  if (!row) return;
  if (!(await gateStoragePath(row.storagePath))) return;
  await db
    .update(scriptOcr)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(scriptOcr.id, ocrId));
}

// ── Searchable-PDF rebuild (PDFium + OCR, assembled in the browser) ──────────
// A scan pdfjs can't render is rebuilt client-side into a searchable PDF
// (lib/pdf-ocr-rebuild.ts). The browser uploads the result straight to storage
// via a signed URL, then finalizes it as the production's new default script.

export type CreateRebuiltScriptUrlResult = {
  error?: string;
  path?: string;
  token?: string;
};

export async function createRebuiltScriptUploadUrl(input: {
  productionId: string;
  fileName: string;
}): Promise<CreateRebuiltScriptUrlResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to replace the script." };
  }
  if (!(await userCanAccessProduction(user, input.productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  const safeName = (input.fileName || "script.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `documents/${input.productionId}/${Date.now()}-${safeName}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(storagePath);
  if (error || !data) {
    return { error: `Could not start upload: ${error?.message ?? "unknown error"}` };
  }
  return { path: data.path, token: data.token };
}

export type FinalizeRebuiltScriptResult = { error?: string; success?: boolean };

export async function finalizeRebuiltScript(input: {
  productionId: string;
  storagePath: string;
  title: string;
  fileName: string;
  fileSize: number;
}): Promise<FinalizeRebuiltScriptResult> {
  const user = await requireCurrentUser();
  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to replace the script." };
  }
  if (!(await userCanAccessProduction(user, input.productionId))) {
    return { error: "You don't have access to that production." };
  }
  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  // The path was minted server-side under this production's prefix; reject
  // anything else so a caller can't attach an arbitrary stored object.
  if (!input.storagePath.startsWith(`documents/${input.productionId}/`)) {
    return { error: "Upload could not be verified." };
  }

  // New default script version = one past the highest in the production.
  const [top] = await db
    .select({ scriptVersion: documents.scriptVersion })
    .from(documents)
    .where(eq(documents.productionId, input.productionId))
    .orderBy(desc(documents.scriptVersion))
    .limit(1);
  const nextVersion = (top?.scriptVersion ?? 0) + 1;

  // Demote the current default(s); the original upload stays in the list.
  await db
    .update(documents)
    .set({ isDefaultScript: false })
    .where(
      and(
        eq(documents.productionId, input.productionId),
        eq(documents.isDefaultScript, true),
      ),
    );

  await db.insert(documents).values({
    productionId: input.productionId,
    uploadedBy: user.id,
    title: input.title?.trim() || "Script (searchable)",
    fileName: input.fileName,
    fileSize: input.fileSize,
    contentType: "application/pdf",
    storagePath: input.storagePath,
    documentType: "script",
    isDefaultScript: true,
    scriptVersion: nextVersion,
    processingStatus: "ready",
  });

  // Existing per-user annotations were anchored to the old (blank) render;
  // flag them stale so the viewer shows its "script updated" banner.
  await db
    .update(scriptAnnotations)
    .set({ hasStalePages: true })
    .where(eq(scriptAnnotations.productionId, input.productionId));

  revalidatePath("/productions");
  return { success: true };
}
