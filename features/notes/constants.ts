export const DEFAULT_NOTE_TAGS = [
  { name: "Follow-up", color: "#c0392b" },
  { name: "Blocking",  color: "#8b5cf6" },
  { name: "Props",     color: "#d97706" },
  { name: "Costumes",  color: "#db2777" },
  { name: "Technical", color: "#2563eb" },
  { name: "Safety",    color: "#16a34a" },
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
