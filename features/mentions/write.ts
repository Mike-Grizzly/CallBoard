"use server";

import { db } from "@/db";
import { mentions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface MentionWriteContext {
  organizationId: string;
  productionId: string | null;
  mentionedById: string;
  contextType: "report" | "note" | "announcement";
  contextId: string;
  contextTitle?: string | null;
}

function extractMentionedUserIds(html: string): string[] {
  const ids: string[] = [];
  const re = /data-id="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

function extractSnippet(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export async function writeMentions(
  html: string,
  ctx: MentionWriteContext,
): Promise<void> {
  // Delete stale mentions for this context before re-writing (idempotent on save).
  await db
    .delete(mentions)
    .where(
      and(
        eq(mentions.contextType, ctx.contextType),
        eq(mentions.contextId, ctx.contextId),
      ),
    );

  const userIds = extractMentionedUserIds(html);
  if (userIds.length === 0) return;

  const snippet = extractSnippet(html);

  await db.insert(mentions).values(
    userIds.map((userId) => ({
      organizationId: ctx.organizationId,
      productionId: ctx.productionId,
      mentionedUserId: userId,
      mentionedById: ctx.mentionedById,
      contextType: ctx.contextType,
      contextId: ctx.contextId,
      contextTitle: ctx.contextTitle ?? null,
      snippet,
    })),
  );
}

interface ContextMentionMember {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface ContextMentionParams extends MentionWriteContext {
  /** Rich-text fields — mentions encoded as TipTap `data-id` attributes. */
  htmlFields: string[];
  /** Plain-text fields — mentions encoded as `@{Full Name}` tokens. */
  textFields: string[];
  /** Audience used to resolve `@{Name}` tokens back to user ids. */
  members: ContextMentionMember[];
}

/**
 * Like `writeMentions`, but for contexts (e.g. a rehearsal report) whose
 * mentions are spread across several fields of two kinds: rich-text fields that
 * carry `data-id` mentions, and plain-text fields that carry `@{Name}` tokens
 * (resolved to ids by matching `members`). Idempotent for the context: clears
 * its existing mentions then writes the combined, de-duplicated set. The author
 * is never notified of their own mention.
 */
export async function writeContextMentions(
  params: ContextMentionParams,
): Promise<void> {
  await db
    .delete(mentions)
    .where(
      and(
        eq(mentions.contextType, params.contextType),
        eq(mentions.contextId, params.contextId),
      ),
    );

  const ids = new Set<string>();
  for (const html of params.htmlFields) {
    if (!html) continue;
    for (const id of extractMentionedUserIds(html)) ids.add(id);
  }

  const hasText = params.textFields.some((t) => t && t.includes("@{"));
  if (hasText) {
    const byName = new Map<string, string>();
    for (const m of params.members) {
      const full = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
      if (full) byName.set(full.toLowerCase(), m.userId);
      if (m.email) byName.set(m.email.toLowerCase(), m.userId);
    }
    const re = /@\{([^}]+)\}/g;
    for (const text of params.textFields) {
      if (!text) continue;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const id = byName.get(m[1].trim().toLowerCase());
        if (id) ids.add(id);
      }
    }
  }

  ids.delete(params.mentionedById);
  if (ids.size === 0) return;

  const rawSnippet =
    params.htmlFields.find(Boolean) ?? params.textFields.find(Boolean) ?? "";
  const snippet = rawSnippet
    .replace(/<[^>]+>/g, " ")
    .replace(/@\{([^}]+)\}/g, "@$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  await db.insert(mentions).values(
    [...ids].map((userId) => ({
      organizationId: params.organizationId,
      productionId: params.productionId,
      mentionedUserId: userId,
      mentionedById: params.mentionedById,
      contextType: params.contextType,
      contextId: params.contextId,
      contextTitle: params.contextTitle ?? null,
      snippet,
    })),
  );
}
