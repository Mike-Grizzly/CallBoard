"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Marks a coachmark walkthrough as seen for the current user so it won't
 * auto-start again. Idempotent: appends the key only if it isn't already
 * present (Postgres array_append guarded by a NOT-contains check), so finishing
 * the same tour twice never duplicates. Best-effort from the UI's side — a
 * failure here should never trap the user in a tour, so callers fire-and-forget.
 */
export async function markTourSeen(key: string): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(profiles)
    .set({
      toursSeen: sql`array_append(${profiles.toursSeen}, ${key})`,
      updatedAt: new Date(),
    })
    .where(
      sql`${profiles.id} = ${user.id} AND NOT (${profiles.toursSeen} @> ARRAY[${key}]::text[])`,
    );
}

/**
 * Clears every seen-tour flag for the current user, so all first-run
 * walkthroughs surface again as they revisit each screen. Backs the
 * "Replay walkthroughs" control in Settings.
 */
export async function resetAllTours(): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(profiles)
    .set({ toursSeen: [], updatedAt: new Date() })
    .where(eq(profiles.id, user.id));
  revalidatePath("/dashboard");
  revalidatePath("/productions");
}
