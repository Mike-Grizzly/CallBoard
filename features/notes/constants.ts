export const DEFAULT_NOTE_TAGS = [
  { name: "Calls", color: "#ef4444" },
  { name: "Props", color: "#f97316" },
  { name: "Admin", color: "#eab308" },
  { name: "Music", color: "#22c55e" },
  { name: "Safety", color: "#3b82f6" },
  { name: "Blocking", color: "#8b5cf6" },
  { name: "Reports", color: "#ec4899" },
] as const;

export const TAG_COLOR_OPTIONS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
] as const;

export type NoteVisibility = "private" | "shared";

export const NOTE_FILTERS = ["all", "todo", "pinned", "notes", "done"] as const;
export type NoteFilter = (typeof NOTE_FILTERS)[number];
