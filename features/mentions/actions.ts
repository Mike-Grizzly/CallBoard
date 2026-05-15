"use server";

import { db } from "@/db";
import { mentions } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markMentionRead(mentionId: string): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(mentions)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(mentions.id, mentionId),
        eq(mentions.mentionedUserId, user.id),
        isNull(mentions.readAt),
      ),
    );
  revalidatePath("/dashboard");
}

export async function markMentionUnread(mentionId: string): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(mentions)
    .set({ readAt: null })
    .where(
      and(
        eq(mentions.id, mentionId),
        eq(mentions.mentionedUserId, user.id),
      ),
    );
  revalidatePath("/dashboard");
}

export async function markAllMentionsRead(): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(mentions)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(mentions.mentionedUserId, user.id),
        isNull(mentions.readAt),
      ),
    );
  revalidatePath("/dashboard");
}
