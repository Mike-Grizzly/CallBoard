import { ROLES, type Role } from "@/types/roles";

export const DOCUMENT_TYPES = [
  { value: "script", label: "Script" },
  { value: "schedule", label: "Schedule" },
  { value: "design", label: "Design / Tech" },
  { value: "music", label: "Music / Score" },
  { value: "reference", label: "Reference" },
  { value: "general", label: "General" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export const DEFAULT_FOLDERS = [
  "Director",
  "Stage Management",
  "Music",
  "Choreography",
  "Costumes",
  "Props",
  "Lighting",
  "Sound",
] as const;

/** Folder visibility values stored in `document_folders.visibility`. */
export type FolderVisibility = "everyone" | "restricted";

/** Display labels for roles, used by the folder-restriction picker. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admins",
  producer: "Producers",
  director: "Directors",
  choreographer: "Choreographers",
  stage_manager: "Stage Management",
  cast: "Cast",
  crew: "Crew",
};

/** The roles a manager can grant access to, in display order. */
export const RESTRICTABLE_ROLES: readonly Role[] = ROLES;

/**
 * Whether a viewer may see a folder (and the documents inside it). Pure so it
 * can run on the server (query filtering) and client (UI gating) alike.
 * Managers always see every folder; a restricted folder is otherwise visible
 * only to the roles in `allowedRoles`. Unknown/legacy visibility = everyone.
 */
export function canViewFolder(
  folder: { visibility: string | null; allowedRoles: string[] | null },
  viewerRole: string | null,
  canManage: boolean,
): boolean {
  if (canManage) return true;
  if (folder.visibility !== "restricted") return true;
  if (!viewerRole) return false;
  return (folder.allowedRoles ?? []).includes(viewerRole);
}

