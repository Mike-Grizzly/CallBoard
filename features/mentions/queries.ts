import { db } from "@/db";
import { mentions, profiles, productions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getMentionsForUser(userId: string) {
  const mentionedBy = db
    .$with("mentioned_by")
    .as(db.select().from(profiles));

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
    })
    .from(mentions)
    .innerJoin(profiles, eq(mentions.mentionedById, profiles.id))
    .leftJoin(productions, eq(mentions.productionId, productions.id))
    .where(eq(mentions.mentionedUserId, userId))
    .orderBy(desc(mentions.createdAt))
    .limit(30);
}

export type MentionRow = Awaited<ReturnType<typeof getMentionsForUser>>[number];
