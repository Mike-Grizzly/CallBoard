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
