import { db } from "@/db";
import { scriptParses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getScenesByProduction } from "@/features/scenes/queries";
import { getProductionRoles } from "@/features/productions/queries";
import type { ScriptParseResult } from "@/features/scripts/constants";

/**
 * Real-data autofill options for the rehearsal-report inputs, so scenes-worked
 * and line-note characters can be picked from the show instead of retyped. The
 * report still stores plain strings, so these are suggestions only — free text
 * is always allowed (guests, understudies, ensemble). Server-only.
 */
export async function getReportAutofillOptions(productionId: string): Promise<{
  sceneOptions: string[];
  characterOptions: string[];
  /** Scene label → script page, so picking a scene can prefill the Pages box. */
  scenePageByLabel: Record<string, string>;
}> {
  const [scenes, roles, pageByTitle] = await Promise.all([
    getScenesByProduction(productionId),
    getProductionRoles(productionId),
    getScenePageMap(productionId),
  ]);

  const sceneOptions: string[] = [];
  const scenePageByLabel: Record<string, string> = {};
  for (const s of scenes) {
    const label = `Act ${s.actNumber}, Sc. ${s.sceneNumber} — ${s.title}`;
    sceneOptions.push(label);
    const page = pageByTitle.get(normalizeSceneTitle(s.title));
    if (page != null) scenePageByLabel[label] = String(page);
  }

  return {
    sceneOptions,
    characterOptions: roles.map((r) => r.name.trim()).filter(Boolean),
    scenePageByLabel,
  };
}

/** Display-name option list for incident-person autofill. */
export function personOptionsFromMembers(
  members: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }[],
): string[] {
  return members.map(
    (m) => `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email,
  );
}

function normalizeSceneTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Title → page-number map for the show's scenes, sourced from the AI script
 * parse's scene bookmarks (the only place page numbers live — `production_scenes`
 * has no page column). Scenes and their bookmarks come from the same parse, so
 * matching on the scene title bridges them. Best-effort: unmatched scenes just
 * don't autofill. Uses the most recent parse that carries scene bookmarks.
 */
async function getScenePageMap(
  productionId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ result: scriptParses.result })
    .from(scriptParses)
    .where(eq(scriptParses.productionId, productionId))
    .orderBy(desc(scriptParses.createdAt));

  const map = new Map<string, number>();
  for (const row of rows) {
    const result = row.result as ScriptParseResult | null;
    const bookmarks = result?.bookmarks;
    if (!Array.isArray(bookmarks)) continue;
    for (const b of bookmarks) {
      if (b.kind !== "scene") continue;
      if (!Number.isFinite(b.page) || b.page < 1) continue;
      const key = normalizeSceneTitle(b.title);
      // First (earliest-page) bookmark wins for a repeated title.
      if (key && !map.has(key)) map.set(key, Math.trunc(b.page));
    }
    // Use the newest parse that actually had scene bookmarks, then stop.
    if (map.size > 0) break;
  }
  return map;
}
