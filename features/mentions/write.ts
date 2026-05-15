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
