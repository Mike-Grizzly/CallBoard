"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireCurrentUser } from "@/lib/auth";
import { ALL_TOUR_KEYS, INTRO_KEY } from "./steps";
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
 * Clears the screen-tour flags so every first-run walkthrough surfaces again
 * as the user revisits each screen. Backs the "Replay walkthroughs" control in
 * Settings. The intro key is kept marked-seen so the one-time "Want a tour?"
 * welcome modal does NOT reappear on a deliberate replay.
 */
export async function resetAllTours(): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(profiles)
    .set({ toursSeen: [INTRO_KEY], updatedAt: new Date() })
    .where(eq(profiles.id, user.id));
  revalidatePath("/dashboard");
  revalidatePath("/productions");
}

/**
 * Marks the intro AND every screen tour as seen in one shot — the
 * "I'll explore on my own" choice from the first-login welcome modal, so no
 * tour auto-pops anywhere. They can still replay from Settings.
 */
export async function dismissAllTours(): Promise<void> {
  const user = await requireCurrentUser();
  await db
    .update(profiles)
    .set({ toursSeen: [INTRO_KEY, ...ALL_TOUR_KEYS], updatedAt: new Date() })
    .where(eq(profiles.id, user.id));
}
