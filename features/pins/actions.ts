"use server";

import { db } from "@/db";
import { userPins, documents, documentFolders, rehearsalReports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { canViewFolder } from "@/features/documents/constants";
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
      .select({
        productionId: documents.productionId,
        folderVisibility: documentFolders.visibility,
        folderAllowedRoles: documentFolders.allowedRoles,
      })
      .from(documents)
      .leftJoin(documentFolders, eq(documents.folderId, documentFolders.id))
      .where(eq(documents.id, itemId))
      .limit(1);
    if (!doc) return false;
    if (!(await userCanAccessProduction(user, doc.productionId))) return false;
    const canManage = can(user.role, "productions:manage");
    return canViewFolder(
      { visibility: doc.folderVisibility, allowedRoles: doc.folderAllowedRoles },
      user.role,
      canManage,
    );
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

  if (!itemId) {
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
    if (!(PINNABLE_TYPES as readonly string[]).includes(itemType)) {
      return { error: "That item can't be pinned.", pinned: false };
    }
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
