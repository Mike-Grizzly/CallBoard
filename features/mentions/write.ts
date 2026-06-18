// NOT a "use server" module. These helpers trust caller-supplied org/user
// ids and do no authorization of their own, so they must never be exposed as
// server-action RPC endpoints — they are internal functions invoked only by
// already-authorized server actions (reports, announcements, notes). The
// `@/db` import also keeps this module off the client bundle.

import { db } from "@/db";
import { mentions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { pushMentionNotifications } from "./notify";

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

  const label =
    ctx.contextTitle ||
    (ctx.contextType === "announcement"
      ? "an announcement"
      : ctx.contextType === "note"
        ? "a note"
        : "a post");
  await pushMentionNotifications({
    mentionedById: ctx.mentionedById,
    countsByUser: Object.fromEntries(userIds.map((id) => [id, 1])),
    contextLabel: label,
  });
}

interface ContextMentionMember {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

/**
 * One mention-bearing section of a context (e.g. a report's General Notes or
 * one department's notes). Mentions are encoded either as `data-id` (rich text)
 * or `@{Full Name}` tokens (plain text). `label` distinguishes this section in
 * the resulting notification.
 */
export interface ContextMentionSource {
  html?: string;
  text?: string;
  label?: string;
}

interface ContextMentionParams extends MentionWriteContext {
  /** Each section is notified separately, so a person mentioned in several
   *  sections gets a notification for each. */
  sources: ContextMentionSource[];
  /** Audience used to resolve `@{Name}` tokens back to user ids. */
  members: ContextMentionMember[];
}

/**
 * Like `writeMentions`, but for contexts (e.g. a rehearsal report) whose
 * mentions are spread across several sections. Writes ONE notification per
 * (user, section) — de-duplicated within a section, separate across sections —
 * so a person mentioned in both General Notes and a department note gets two
 * notifications. Idempotent for the context: clears its existing mentions then
 * rewrites them. The author is never notified of their own mention.
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

  const byName = new Map<string, string>();
  for (const m of params.members) {
    const full = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
    if (full) byName.set(full.toLowerCase(), m.userId);
    if (m.email) byName.set(m.email.toLowerCase(), m.userId);
  }

  const rows: (typeof mentions.$inferInsert)[] = [];
  const countsByUser: Record<string, number> = {};
  for (const source of params.sources) {
    const ids = new Set<string>();
    if (source.html) {
      for (const id of extractMentionedUserIds(source.html)) ids.add(id);
    }
    if (source.text && source.text.includes("@{")) {
      const re = /@\{([^}]+)\}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(source.text)) !== null) {
        const id = byName.get(m[1].trim().toLowerCase());
        if (id) ids.add(id);
      }
    }
    ids.delete(params.mentionedById);
    if (ids.size === 0) continue;

    const snippet = (source.html ?? source.text ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/@\{([^}]+)\}/g, "@$1")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
    const title = source.label
      ? `${params.contextTitle ?? ""} · ${source.label}`.replace(/^ · /, "")
      : (params.contextTitle ?? null);

    for (const userId of ids) {
      countsByUser[userId] = (countsByUser[userId] ?? 0) + 1;
      rows.push({
        organizationId: params.organizationId,
        productionId: params.productionId,
        mentionedUserId: userId,
        mentionedById: params.mentionedById,
        contextType: params.contextType,
        contextId: params.contextId,
        contextTitle: title,
        snippet,
      });
    }
  }

  if (rows.length > 0) await db.insert(mentions).values(rows);

  // One push per mentioned user — batched to "N new mentions" when they were
  // tagged in several sections of this same context (e.g. a rehearsal report).
  await pushMentionNotifications({
    mentionedById: params.mentionedById,
    countsByUser,
    contextLabel: params.contextTitle ?? "a rehearsal report",
  });
}
