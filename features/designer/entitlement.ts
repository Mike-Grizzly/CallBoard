// Designer-seat ("Proscene Studio") entitlement — the per-USER access gate, the
// designer-world analogue of features/billing/guard.ts. For an
// accessMode="designer" user, THIS governs their Focus workspace (active seat,
// which tools, how many concurrent productions) instead of the org billing plan
// (their personal workspace org is just a free container). It layers on top of
// role capabilities exactly like the org billing guard: never grants a
// capability a role lacks, never charged to or discounted from any org.

import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { profiles, productions } from "@/db/schema";
import { BILLING_ENABLED } from "@/features/billing/constants";
import {
  DESIGNER_PRODUCTION_LIMIT,
  designerToolsFor,
  isDesignerPlanId,
  isDesignerTool,
  type DesignerPlanId,
  type DesignerTool,
} from "./constants";

export type DesignerSeat = {
  /** An active seat, or a canceled one still inside its paid period. */
  hasSeat: boolean;
  plan: DesignerPlanId | null;
  /** Tools the seat unlocks — [] when there is no live seat. */
  tools: DesignerTool[];
  /** Concurrent ACTIVE personal productions; null = unlimited (Studio Pro). */
  productionLimit: number | null;
  /** Raw Stripe subscription status, for display. */
  status: string | null;
};

type DesignerRow = {
  designerPlan: string | null;
  designerTool: string | null;
  designerSubscriptionStatus: string | null;
  designerCurrentPeriodEnd: Date | null;
};

const NO_SEAT: DesignerSeat = {
  hasSeat: false,
  plan: null,
  tools: [],
  productionLimit: 0,
  status: null,
};

/** Pure: turn the stored designer subscription into a live seat state. */
export function designerSeatState(
  row: DesignerRow,
  now: number = Date.now(),
): DesignerSeat {
  const plan = isDesignerPlanId(row.designerPlan) ? row.designerPlan : null;
  const tool = isDesignerTool(row.designerTool) ? row.designerTool : null;
  const status = row.designerSubscriptionStatus;
  if (!plan) return { ...NO_SEAT, status };

  const activeish = ["active", "trialing", "past_due"].includes(status ?? "");
  const inGrace =
    status === "canceled" &&
    !!row.designerCurrentPeriodEnd &&
    row.designerCurrentPeriodEnd.getTime() > now;
  if (!activeish && !inGrace) return { ...NO_SEAT, plan, status };

  return {
    hasSeat: true,
    plan,
    tools: designerToolsFor(plan, tool),
    productionLimit: DESIGNER_PRODUCTION_LIMIT[plan],
    status,
  };
}

async function getDesignerRow(userId: string): Promise<DesignerRow | null> {
  const [row] = await db
    .select({
      designerPlan: profiles.designerPlan,
      designerTool: profiles.designerTool,
      designerSubscriptionStatus: profiles.designerSubscriptionStatus,
      designerCurrentPeriodEnd: profiles.designerCurrentPeriodEnd,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}

/** The user's live designer seat (no seat → hasSeat:false, tools:[]). */
export async function getDesignerSeat(userId: string): Promise<DesignerSeat> {
  const row = await getDesignerRow(userId);
  return row ? designerSeatState(row) : NO_SEAT;
}

const NO_SEAT_MSG =
  "Your Studio workspace is read-only. Subscribe to a Studio plan to edit " +
  "again — you can still view and download everything.";

/**
 * Designer analogue of assertCanMutate: an active seat is required to write.
 * The org billing guard delegates here for accessMode="designer" users.
 */
export async function assertDesignerCanMutate(
  userId: string,
): Promise<{ error?: string }> {
  if (!BILLING_ENABLED) return {};
  const seat = await getDesignerSeat(userId);
  return seat.hasSeat ? {} : { error: NO_SEAT_MSG };
}

/**
 * Active seat AND the seat includes the given tool. For the Single Tool tier
 * (Script OR Blocking); the bundles include both. Use at any per-tool write.
 */
export async function assertDesignerCanUseTool(
  userId: string,
  tool: DesignerTool,
): Promise<{ error?: string }> {
  if (!BILLING_ENABLED) return {};
  const seat = await getDesignerSeat(userId);
  if (!seat.hasSeat) return { error: NO_SEAT_MSG };
  if (!seat.tools.includes(tool)) {
    return {
      error: `Your Studio plan doesn't include ${
        tool === "blocking" ? "Blocking" : "Script"
      }. Upgrade to unlock it.`,
    };
  }
  return {};
}

/**
 * Designer analogue of assertCanCreateProduction: the per-tier cap on ACTIVE
 * (non-archived) personal productions. Single/Studio are swap-and-replace (1);
 * Studio Pro is unlimited.
 */
export async function assertDesignerCanCreateProduction(
  userId: string,
  orgId: string,
): Promise<{ error?: string }> {
  if (!BILLING_ENABLED) return {};
  const seat = await getDesignerSeat(userId);
  if (!seat.hasSeat) {
    return { error: "Subscribe to a Studio plan to start a production." };
  }
  const limit = seat.productionLimit;
  if (limit === null) return {}; // Studio Pro: unlimited

  const [row] = await db
    .select({ n: count() })
    .from(productions)
    .where(
      and(
        eq(productions.organizationId, orgId),
        isNull(productions.archivedAt),
        isNull(productions.deletedAt),
      ),
    );
  if ((row?.n ?? 0) < limit) return {};
  return {
    error:
      "Your Studio plan keeps one production at a time. Archive your current " +
      "one to start another, or upgrade to Studio Pro for unlimited.",
  };
}
