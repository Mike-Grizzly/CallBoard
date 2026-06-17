import type { Role } from "@/types/roles";

/**
 * Per-role display metadata for the People directory.
 * `c` is a color token consumed by `data-c` attributes in globals.css.
 * `category` groups roles for the stat-card filters.
 * `tier` is the human-readable access level shown in the Permission column —
 * Proscene permissions are role-derived, so this is purely descriptive.
 */
export const ROLE_META: Record<
  Role,
  { label: string; c: string; category: string; tier: string }
> = {
  admin: { label: "Admin", c: "accent", category: "Admin", tier: "Admin" },
  producer: { label: "Producer", c: "clay", category: "Admin", tier: "Admin" },
  director: { label: "Director", c: "plum", category: "Creative", tier: "Editor" },
  choreographer: {
    label: "Choreographer",
    c: "dusk",
    category: "Creative",
    tier: "Editor",
  },
  creative: {
    label: "Creative",
    c: "plum",
    category: "Creative",
    tier: "Editor",
  },
  stage_manager: {
    label: "Stage Manager",
    c: "sage",
    category: "Stage Mgmt",
    tier: "Editor",
  },
  cast: { label: "Cast", c: "amber", category: "Cast", tier: "Viewer" },
  crew: { label: "Crew", c: "sand", category: "Crew", tier: "Viewer" },
};

export const PEOPLE_CATEGORIES = [
  "All",
  "Cast",
  "Creative",
  "Stage Mgmt",
  "Admin",
  "Crew",
] as const;

export const MEMBER_STATUSES = ["active", "invited", "inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const STATUS_META: Record<MemberStatus, { label: string }> = {
  active: { label: "Active" },
  invited: { label: "Invite pending" },
  inactive: { label: "Inactive" },
};

export const PRONOUN_OPTIONS = [
  "",
  "she/her",
  "he/him",
  "they/them",
  "she/they",
  "he/they",
];

/** Fields the CSV importer can map columns onto. */
export const CSV_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "role", label: "Role", required: false },
  { key: "pronouns", label: "Pronouns", required: false },
  { key: "production", label: "Production", required: false },
] as const;

export type CsvFieldKey = (typeof CSV_FIELDS)[number]["key"];

export const SAMPLE_CSV = `Name,Email,Phone,Role,Pronouns,Production
Theo Marsh,theo.marsh@example.com,(617) 555-0455,Cast,he/him,Pirates of Penzance
Priya Anand,priya@example.com,(617) 555-0512,Cast,she/her,Pirates of Penzance
Helena Voss,helena.voss@example.com,(617) 555-0193,Director,she/her,Pirates of Penzance
Sasha Petrov,sasha.petr@example.com,(617) 555-1199,Stage Manager,she/her,The Mikado
Quinn Adler,quinn.adler@example.com,(617) 555-1021,Choreographer,they/them,Pirates of Penzance
Eli Hartman,eli.hartman@example.com,(617) 555-1108,Crew,he/him,Pirates of Penzance`;
