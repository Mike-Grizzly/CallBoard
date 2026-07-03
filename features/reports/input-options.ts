import { getScenesByProduction } from "@/features/scenes/queries";
import { getProductionRoles } from "@/features/productions/queries";

/**
 * Real-data autofill options for the rehearsal-report inputs, so scenes-worked
 * and line-note characters can be picked from the show instead of retyped. The
 * report still stores plain strings, so these are suggestions only — free text
 * is always allowed (guests, understudies, ensemble). Server-only.
 */
export async function getReportAutofillOptions(productionId: string): Promise<{
  sceneOptions: string[];
  characterOptions: string[];
}> {
  const [scenes, roles] = await Promise.all([
    getScenesByProduction(productionId),
    getProductionRoles(productionId),
  ]);
  return {
    sceneOptions: scenes.map(
      (s) => `Act ${s.actNumber}, Sc. ${s.sceneNumber} — ${s.title}`,
    ),
    characterOptions: roles.map((r) => r.name.trim()).filter(Boolean),
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
