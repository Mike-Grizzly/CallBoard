import type { IconName } from "@/components/ui/icon";
import type { Role } from "@/types/roles";

/**
 * Shared metadata + payload types for the "New production" setup wizard.
 * Plain module (NOT "use server") so it can be imported by both the client
 * wizard and the server action without tripping the constants-in-server-file
 * hydration issue noted in CLAUDE.md.
 */

export const SEASONS = [
  "Spring 2026",
  "Summer 2026",
  "Fall 2026",
  "Winter 2026",
  "2026–2027 Mainstage",
  "One-off",
] as const;

export const ROLE_TYPES = [
  "Principal",
  "Supporting",
  "Ensemble",
  "Dance Core",
  "Swing/Cover",
] as const;

export type WizardDepartment = {
  key: string;
  label: string;
  hint: string;
  /** Categorical color token (matches --c-{c}); "" → neutral, "accent" → crimson. */
  c: string;
  /** Icon name in components/ui/icon. */
  icon: IconName;
  /** Required departments can't be toggled off. */
  required?: boolean;
};

export const ALL_DEPTS: WizardDepartment[] = [
  { key: "director", label: "Director / Production", hint: "Always on", c: "accent", icon: "Star", required: true },
  { key: "stage", label: "Stage Management", hint: "You & your team", c: "", icon: "Clipboard", required: true },
  { key: "music", label: "Music", hint: "MD, accompanist, orchestra", c: "plum", icon: "Music" },
  { key: "costumes", label: "Costumes / Wardrobe", hint: "Designer, dresser, build", c: "clay", icon: "Tag" },
  { key: "props", label: "Props", hint: "Master, build, run crew", c: "sand", icon: "Layers" },
  { key: "set", label: "Set / Scenic", hint: "Designer, build, paint", c: "sage", icon: "Layout" },
  { key: "lighting", label: "Lighting", hint: "Designer, board op", c: "amber", icon: "Lightbulb" },
  { key: "sound", label: "Sound", hint: "Designer, engineer, A2", c: "dusk", icon: "Volume2" },
  { key: "choreo", label: "Choreography", hint: "Choreographer, dance captain", c: "plum", icon: "Move" },
  { key: "intimacy", label: "Intimacy / Fight", hint: "Direction & captain", c: "clay", icon: "Users" },
  { key: "dramaturgy", label: "Dramaturgy", hint: "Research, program notes", c: "sand", icon: "PenLine" },
  { key: "casting", label: "Casting / Producing", hint: "Producer, GM, casting", c: "dusk", icon: "Users" },
];

export const DEPT_KEYS = ALL_DEPTS.map((d) => d.key);
export const REQUIRED_DEPT_KEYS = ALL_DEPTS.filter((d) => d.required).map((d) => d.key);

export type WizardTeamRole = {
  label: string;
  dept: string;
  c: string;
  /** How this wizard label maps onto the fixed org/production role set. */
  appRole: Role;
};

export const TEAM_ROLES: WizardTeamRole[] = [
  { label: "Director", dept: "director", c: "accent", appRole: "director" },
  { label: "Assoc. Director", dept: "director", c: "accent", appRole: "director" },
  { label: "Stage Manager", dept: "stage", c: "", appRole: "stage_manager" },
  { label: "Asst. Stage Manager", dept: "stage", c: "", appRole: "stage_manager" },
  { label: "Production Assistant", dept: "stage", c: "", appRole: "crew" },
  { label: "Producer", dept: "casting", c: "dusk", appRole: "producer" },
  { label: "Music Director", dept: "music", c: "plum", appRole: "crew" },
  { label: "Conductor", dept: "music", c: "plum", appRole: "crew" },
  { label: "Choreographer", dept: "choreo", c: "plum", appRole: "choreographer" },
  { label: "Costume Designer", dept: "costumes", c: "clay", appRole: "crew" },
  { label: "Lighting Designer", dept: "lighting", c: "amber", appRole: "crew" },
  { label: "Sound Designer", dept: "sound", c: "dusk", appRole: "crew" },
  { label: "Set Designer", dept: "set", c: "sage", appRole: "crew" },
  { label: "Props Master", dept: "props", c: "sand", appRole: "crew" },
  { label: "Cast — Principal", dept: "cast", c: "clay", appRole: "cast" },
  { label: "Cast — Ensemble", dept: "cast", c: "plum", appRole: "cast" },
];

const TEAM_ROLE_BY_LABEL = new Map(TEAM_ROLES.map((r) => [r.label, r]));

/** Map a wizard team-role label to the fixed app Role; defaults to crew. */
export function appRoleForTeamLabel(label: string): Role {
  return TEAM_ROLE_BY_LABEL.get(label)?.appRole ?? "crew";
}

// ─── Wizard payload shapes (client → server action) ───────────────────

export type WizardRoleInput = {
  name: string;
  actor: string;
  type: string;
};

export type WizardTeamMemberInput = {
  name: string;
  email: string;
  role: string; // wizard label, e.g. "Stage Manager"
  dept: string;
};

export type FullProductionInput = {
  title: string;
  venue: string;
  season: string;
  firstRehearsal: string;
  techStart: string;
  opening: string;
  closing: string;
  rehearsalDays: Record<string, boolean>;
  rehearsalStart: string;
  rehearsalEnd: string;
  depts: Record<string, boolean>;
  roles: WizardRoleInput[];
  team: WizardTeamMemberInput[];
  status?: "draft" | "active";
};

export type QuickProductionInput = {
  title: string;
  opening: string;
};

/** Org member shape passed to the wizard for the actor autocomplete. */
export type WizardOrgUser = {
  name: string;
  email: string;
};
