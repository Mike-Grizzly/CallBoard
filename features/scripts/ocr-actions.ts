"use server";

import { db } from "@/db";
import { documents, scriptOcr } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { assertCanMutate } from "@/features/billing/guard";
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
