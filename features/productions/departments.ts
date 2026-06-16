import type { IconName } from "@/components/ui/icon";
import type { Role } from "@/types/roles";

/**
 * Canonical production-department model — the single source of truth shared by
 * rehearsal reports (which sections appear), the Cast & Crew board (team
 * buckets), the setup wizard, and the production Settings tab.
 *
 * A production's departments live in `production_departments` (key + label +
 * sortOrder). The 12 STANDARD departments map 1:1 onto the existing
 * `rehearsal_reports` columns (so no data migration); CUSTOM departments
 * (`custom: true`) store their per-report notes in `rehearsal_reports.dept_notes`
 * (key → HTML). Read-time fallback to the legacy columns means existing reports
 * keep working unchanged.
 *
 * Plain module (NOT "use server") so both the client UI and server actions can
 * import it.
 */

export type CatalogDepartment = {
  /** Stable id. For standard departments this is the catalog key. */
  key: string;
  label: string;
  icon: IconName;
  /** Color token (matches `--c-{c}`); "" → neutral. */
  c: string;
  /** Form input name. Standard → the report column field; custom → deptnote_<key>. */
  field: string;
  /** Property on the report row for standard departments; null for custom. */
  columnKey: string | null;
  /** How the department maps onto a Cast & Crew board team bucket. */
  boardRole: Role;
  boardPosition: string | null;
  custom: boolean;
};

export type ResolvedDepartment = CatalogDepartment;

// The 12 standard departments — keys/labels/icons/colors mirror the report's
// fixed columns (features/reports/constants.ts), plus a board mapping.
const CATALOG: CatalogDepartment[] = [
  { key: "scenery", label: "Scenery / Set", icon: "Layout", c: "sage", field: "dept_scenery", columnKey: "deptScenery", boardRole: "crew", boardPosition: "Scenic", custom: false },
  { key: "props", label: "Props", icon: "Layers", c: "sand", field: "dept_props", columnKey: "deptProps", boardRole: "crew", boardPosition: "Props", custom: false },
  { key: "costumes", label: "Costumes", icon: "Tag", c: "clay", field: "dept_costumes", columnKey: "deptCostumes", boardRole: "crew", boardPosition: "Wardrobe", custom: false },
  { key: "hair_makeup", label: "Hair & Makeup", icon: "Scissors", c: "plum", field: "dept_hair_makeup", columnKey: "deptHairMakeup", boardRole: "crew", boardPosition: "Hair & Makeup", custom: false },
  { key: "lighting", label: "Lighting", icon: "Lightbulb", c: "amber", field: "dept_lighting", columnKey: "deptLighting", boardRole: "crew", boardPosition: "Lighting", custom: false },
  { key: "sound", label: "Sound", icon: "Volume2", c: "dusk", field: "dept_sound", columnKey: "deptSound", boardRole: "crew", boardPosition: "Sound", custom: false },
  { key: "sound_effects", label: "Sound Effects", icon: "Volume2", c: "dusk", field: "dept_sound_effects", columnKey: "deptSoundEffects", boardRole: "crew", boardPosition: "Sound FX", custom: false },
  { key: "music", label: "Music", icon: "Music", c: "plum", field: "dept_music", columnKey: "deptMusic", boardRole: "crew", boardPosition: "Music", custom: false },
  { key: "choreography", label: "Choreography", icon: "Footprints", c: "sage", field: "dept_choreography", columnKey: "deptChoreography", boardRole: "choreographer", boardPosition: null, custom: false },
  { key: "video", label: "Video / Projection", icon: "Video", c: "dusk", field: "dept_video", columnKey: "deptVideo", boardRole: "crew", boardPosition: "Video", custom: false },
  { key: "crew", label: "Crew", icon: "Users", c: "sand", field: "dept_crew", columnKey: "deptCrew", boardRole: "crew", boardPosition: null, custom: false },
  { key: "other", label: "Other", icon: "FileText", c: "", field: "dept_other", columnKey: "deptOther", boardRole: "crew", boardPosition: "Other", custom: false },
];

const CATALOG_BY_KEY = new Map(CATALOG.map((d) => [d.key, d]));

/** Catalog departments offered in the Settings picker. */
export const DEPARTMENT_CATALOG: readonly CatalogDepartment[] = CATALOG;

/** Shown when a production has no departments on file (preserves "show all"). */
const DEFAULT_DEPARTMENTS: ResolvedDepartment[] = CATALOG;
export const DEFAULT_DEPARTMENT_KEYS = CATALOG.map((d) => d.key);

// Legacy wizard department keys (ALL_DEPTS) → canonical catalog keys, for
// productions created before this model. Team-area keys with no report section
// (director/stage/casting/intimacy/dramaturgy) resolve to nothing.
const LEGACY_MAP: Record<string, string> = {
  set: "scenery",
  scenic: "scenery",
  choreo: "choreography",
  music: "music",
  costumes: "costumes",
  props: "props",
  lighting: "lighting",
  sound: "sound",
};
// Legacy/leadership wizard keys that are NOT report departments: they surface
// as the always-on leadership board buckets (Director / Stage Manager /
// Producer) instead. Everything else the wizard offers (incl. Intimacy/Fight,
// Dramaturgy) becomes a real department — a board bucket + a report section.
const LEGACY_NONREPORT = new Set(["director", "stage", "casting"]);

// Nicer labels for wizard departments that have no catalog entry (they resolve
// as custom-style departments, notes stored in rehearsal_reports.dept_notes).
const WIZARD_EXTRA_LABELS: Record<string, string> = {
  intimacy: "Intimacy / Fight",
  dramaturgy: "Dramaturgy",
};

export function humanizeDeptKey(key: string): string {
  return key
    .replace(/^custom[_-]/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Make a stable custom-department key from a label. */
export function customDeptKey(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `custom_${slug || Math.random().toString(36).slice(2, 8)}`;
}

export type DepartmentRow = { key: string; label: string; sortOrder: number };

/**
 * Resolve a production's stored department rows into ordered, display-ready
 * departments. Falls back to the full standard catalog when none are on file.
 */
export function resolveDepartments(rows: DepartmentRow[]): ResolvedDepartment[] {
  if (rows.length === 0) return DEFAULT_DEPARTMENTS;

  const seen = new Set<string>();
  const out: ResolvedDepartment[] = [];
  const ordered = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const row of ordered) {
    const catKey = CATALOG_BY_KEY.has(row.key) ? row.key : LEGACY_MAP[row.key];
    if (catKey) {
      if (seen.has(catKey)) continue;
      seen.add(catKey);
      const cat = CATALOG_BY_KEY.get(catKey)!;
      out.push({ ...cat, label: row.label.trim() || cat.label });
    } else if (LEGACY_NONREPORT.has(row.key)) {
      continue;
    } else {
      if (seen.has(row.key)) continue;
      seen.add(row.key);
      const label = row.label.trim() || humanizeDeptKey(row.key);
      out.push({
        key: row.key,
        label,
        icon: "Tag",
        c: "",
        field: `deptnote_${row.key}`,
        columnKey: null,
        boardRole: "crew",
        boardPosition: label,
        custom: true,
      });
    }
  }

  return out.length ? out : DEFAULT_DEPARTMENTS;
}

/** Read a department's notes HTML off a report row (column or deptNotes map). */
export function reportDeptHtml(
  dept: ResolvedDepartment,
  report: Record<string, unknown> & { deptNotes?: Record<string, string> | null },
): string {
  if (dept.columnKey) {
    return (report[dept.columnKey] as string | null) ?? "";
  }
  return report.deptNotes?.[dept.key] ?? "";
}

// ─── Cast & Crew board team buckets ───────────────────────────────────

export type ProductionTeamBucket = {
  id: string;
  label: string;
  role: Role;
  position: string | null;
  sub: string;
};

/**
 * Build the board's team buckets: always-on leadership (Director / Stage
 * Manager / Producer) plus one bucket per department, ending with a generic
 * Crew catch-all when no department already provides one.
 */
export function buildTeamBuckets(
  departments: ResolvedDepartment[],
): ProductionTeamBucket[] {
  const buckets: ProductionTeamBucket[] = [
    { id: "_director", label: "Director", role: "director", position: null, sub: "Leads the show" },
    { id: "_stage_manager", label: "Stage Manager", role: "stage_manager", position: null, sub: "Runs rehearsals" },
    { id: "_producer", label: "Producer", role: "producer", position: null, sub: "Produces the show" },
  ];

  let hasGenericCrew = false;
  for (const d of departments) {
    if (d.boardRole === "crew" && d.boardPosition === null) hasGenericCrew = true;
    buckets.push({
      id: `dept_${d.key}`,
      label: d.label,
      role: d.boardRole,
      position: d.boardPosition,
      sub: d.custom ? "Department" : d.label,
    });
  }
  if (!hasGenericCrew) {
    buckets.push({ id: "_crew", label: "Crew", role: "crew", position: null, sub: "Backstage" });
  }
  return buckets;
}

/**
 * Map enabled wizard department keys → rows to seed `production_departments`.
 * Leadership keys (director/stage/casting) are skipped — they're always-on
 * board buckets, not departments. Catalog-mappable keys use their canonical key
 * + label; anything else (Intimacy/Fight, Dramaturgy) is kept as a custom-style
 * department so its toggle still produces a board bucket + report section.
 */
export function wizardDeptRows(
  enabledKeys: string[],
): { key: string; label: string; sortOrder: number }[] {
  const seen = new Set<string>();
  const rows: { key: string; label: string; sortOrder: number }[] = [];
  for (const key of enabledKeys) {
    if (LEGACY_NONREPORT.has(key)) continue;
    const catKey = CATALOG_BY_KEY.has(key) ? key : LEGACY_MAP[key];
    if (catKey) {
      if (seen.has(catKey)) continue;
      seen.add(catKey);
      const cat = CATALOG_BY_KEY.get(catKey)!;
      rows.push({ key: catKey, label: cat.label, sortOrder: rows.length });
    } else {
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        key,
        label: WIZARD_EXTRA_LABELS[key] ?? humanizeDeptKey(key),
        sortOrder: rows.length,
      });
    }
  }
  return rows;
}
