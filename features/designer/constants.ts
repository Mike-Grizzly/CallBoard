// Designer-seat ("Proscene Studio") plan constants — the per-USER subscription
// axis, deliberately separate from the org-level plans in
// features/billing/constants.ts. A designer seat entitles ONE individual to
// their private Focus workspace (Script and/or Blocking); it never touches an
// org's plan, its members, or "participants are always free."
//
// MUST stay out of any `"use server"` file (CLAUDE.md rule #6): exporting
// constants from a server-action module causes hydration errors.

export const DESIGNER_PLANS = {
  SINGLE_TOOL: "single_tool",
  STUDIO: "studio",
  STUDIO_PRO: "studio_pro",
} as const;

export type DesignerPlanId = (typeof DESIGNER_PLANS)[keyof typeof DESIGNER_PLANS];

export const DESIGNER_PLAN_IDS: DesignerPlanId[] = [
  DESIGNER_PLANS.SINGLE_TOOL,
  DESIGNER_PLANS.STUDIO,
  DESIGNER_PLANS.STUDIO_PRO,
];

export function isDesignerPlanId(
  value: string | null | undefined,
): value is DesignerPlanId {
  return DESIGNER_PLAN_IDS.includes(value as DesignerPlanId);
}

// The two tools a designer workspace can include. "Single Tool" picks exactly
// one at checkout (stored on profiles.designer_tool); Studio and Studio Pro
// always include both.
export const DESIGNER_TOOLS = {
  SCRIPT: "script",
  BLOCKING: "blocking",
} as const;

export type DesignerTool = (typeof DESIGNER_TOOLS)[keyof typeof DESIGNER_TOOLS];

export function isDesignerTool(
  value: string | null | undefined,
): value is DesignerTool {
  return value === DESIGNER_TOOLS.SCRIPT || value === DESIGNER_TOOLS.BLOCKING;
}

export const DESIGNER_PLAN_LABELS: Record<DesignerPlanId, string> = {
  single_tool: "Single Tool",
  studio: "Studio",
  studio_pro: "Studio Pro",
};

// Which tools a given seat unlocks. Single Tool resolves from the subscriber's
// stored choice; the bundles get both regardless of the (ignored) choice.
export function designerToolsFor(
  plan: DesignerPlanId,
  chosenTool: DesignerTool | null,
): DesignerTool[] {
  if (plan === DESIGNER_PLANS.SINGLE_TOOL) {
    return chosenTool ? [chosenTool] : [];
  }
  return [DESIGNER_TOOLS.SCRIPT, DESIGNER_TOOLS.BLOCKING];
}

// Concurrent personal productions a seat may keep active. Single/Studio are
// swap-and-replace (one at a time); Studio Pro is unlimited. `null` = unlimited.
export const DESIGNER_PRODUCTION_LIMIT: Record<DesignerPlanId, number | null> = {
  single_tool: 1,
  studio: 1,
  studio_pro: null,
};

// Flat storage ceiling for a designer workspace (scripts + ground-plan images;
// nowhere near video). Modest and uniform for v1, and — like the org
// STORAGE_LIMIT_GB — advisory only: NOT yet enforced.
export const DESIGNER_STORAGE_GB = 25;

// Display prices (USD) for in-app copy ONLY. The authoritative amount is the
// Stripe price; keep these in sync with the marketing pricing page and the
// Stripe dashboard. Annual ~= 10x monthly.
export const DESIGNER_PRICES: Record<
  DesignerPlanId,
  { monthly: number; annual: number }
> = {
  single_tool: { monthly: 5.99, annual: 59 },
  studio: { monthly: 9.99, annual: 99 },
  studio_pro: { monthly: 14.99, annual: 149 },
};
