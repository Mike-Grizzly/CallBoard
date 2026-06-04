import { db } from "@/db";
import { mentions, profiles, productions, beatComments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getMentionsForUser(userId: string) {
  return db
    .select({
      id: mentions.id,
      productionId: mentions.productionId,
      contextType: mentions.contextType,
      contextId: mentions.contextId,
      contextTitle: mentions.contextTitle,
      snippet: mentions.snippet,
      readAt: mentions.readAt,
      createdAt: mentions.createdAt,
      fromFirstName: profiles.firstName,
      fromLastName: profiles.lastName,
      fromEmail: profiles.email,
      productionTitle: productions.title,
      productionSlug: productions.slug,
      // For blocking mentions, contextId is a beat-comment id; resolve the beat
      // so the dashboard can deep-link to it. Null for other context types.
      beatId: beatComments.beatId,
    })
    .from(mentions)
    .innerJoin(profiles, eq(mentions.mentionedById, profiles.id))
    .leftJoin(productions, eq(mentions.productionId, productions.id))
    .leftJoin(beatComments, eq(mentions.contextId, beatComments.id))
    .where(eq(mentions.mentionedUserId, userId))
    .orderBy(desc(mentions.createdAt))
    .limit(30);
}

export type MentionRow = Awaited<ReturnType<typeof getMentionsForUser>>[number];
