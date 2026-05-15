"use server";

import { db } from "@/db";
import { userPins } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// shouldPin: true = ensure pinned, false = ensure unpinned, undefined = toggle
export async function pinItem(
  itemType: string,
  itemId: string,
  shouldPin?: boolean,
): Promise<{ error?: string; pinned: boolean }> {
  const user = await requireCurrentUser();

  const existing = await db
    .select({ id: userPins.id })
    .from(userPins)
    .where(
      and(
        eq(userPins.userId, user.id),
        eq(userPins.itemType, itemType),
        eq(userPins.itemId, itemId),
      ),
    )
    .limit(1);

  const isCurrentlyPinned = existing.length > 0;
  const wantPinned = shouldPin ?? !isCurrentlyPinned;

  if (wantPinned && !isCurrentlyPinned) {
    await db.insert(userPins).values({ userId: user.id, itemType, itemId });
  } else if (!wantPinned && isCurrentlyPinned) {
    await db.delete(userPins).where(eq(userPins.id, existing[0].id));
  }

  revalidatePath("/dashboard");
  return { pinned: wantPinned };
}
