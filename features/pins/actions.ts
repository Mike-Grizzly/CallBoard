"use server";

import { db } from "@/db";
import { userPins } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function pinItem(
  itemType: string,
  itemId: string,
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

  if (existing.length > 0) {
    await db.delete(userPins).where(eq(userPins.id, existing[0].id));
    revalidatePath("/dashboard");
    return { pinned: false };
  } else {
    await db.insert(userPins).values({ userId: user.id, itemType, itemId });
    revalidatePath("/dashboard");
    return { pinned: true };
  }
}
