"use server";

import { db } from "@/db";
import { userPins, documents, rehearsalReports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** Pinnable item types. Anything else is rejected. */
const PINNABLE_TYPES = ["document", "report"] as const;

/**
 * Verify the caller can actually see the item they're pinning. Pins are
 * per-user, but the dashboard later renders each pinned item's title and
 * production name (features/pins/queries.ts), so without this check a user
 * could pin an arbitrary UUID from another tenant and surface its metadata
 * on their own dashboard (cross-tenant info leak).
 */
async function userCanAccessPinItem(
  user: Awaited<ReturnType<typeof requireCurrentUser>>,
  itemType: string,
  itemId: string,
): Promise<boolean> {
  if (itemType === "document") {
    const [doc] = await db
      .select({ productionId: documents.productionId })
      .from(documents)
      .where(eq(documents.id, itemId))
      .limit(1);
    return doc ? userCanAccessProduction(user, doc.productionId) : false;
  }
  if (itemType === "report") {
    const [report] = await db
      .select({ productionId: rehearsalReports.productionId })
      .from(rehearsalReports)
      .where(eq(rehearsalReports.id, itemId))
      .limit(1);
    return report ? userCanAccessProduction(user, report.productionId) : false;
  }
  return false;
}

// shouldPin: true = ensure pinned, false = ensure unpinned, undefined = toggle
export async function pinItem(
  itemType: string,
  itemId: string,
  shouldPin?: boolean,
): Promise<{ error?: string; pinned: boolean }> {
  const user = await requireCurrentUser();

  if (!(PINNABLE_TYPES as readonly string[]).includes(itemType) || !itemId) {
    return { error: "That item can't be pinned.", pinned: false };
  }

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
    if (!(await userCanAccessPinItem(user, itemType, itemId))) {
      return { error: "That item can't be pinned.", pinned: false };
    }
    await db.insert(userPins).values({ userId: user.id, itemType, itemId });
  } else if (!wantPinned && isCurrentlyPinned) {
    await db.delete(userPins).where(eq(userPins.id, existing[0].id));
  }

  revalidatePath("/dashboard");
  return { pinned: wantPinned };
}
