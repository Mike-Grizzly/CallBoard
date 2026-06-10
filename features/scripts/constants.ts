export const ANNOTATION_COLORS = [
  { label: "Yellow", value: "#FDE68A" },
  { label: "Green", value: "#A7F3D0" },
  { label: "Blue", value: "#BFDBFE" },
  { label: "Pink", value: "#FBCFE8" },
  { label: "Coral", value: "#FCA5A5" },
] as const;

export const DEFAULT_ANNOTATION_COLOR = "#FDE68A";
export const CUE_STROKE = "#EF4444";

export type Tool = "pointer" | "highlight-box" | "highlight-text" | "note" | "cue";

export type AnnotationRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HighlightAnnotation = {
  id: string;
  page: number;
  type: "highlight";
  rect: AnnotationRect;
  color: string;
};

export type NoteAnnotation = {
  id: string;
  page: number;
  type: "note";
  rect: AnnotationRect;
  text: string;
  color: string;
};

export type CueAnnotation = {
  id: string;
  page: number;
  type: "cue";
  rect: AnnotationRect;
  cueNumber: string;
  cueDescription: string;
  leaderSide: "left" | "right";
};

/** Point on a page, normalized 0–1 against page width/height. */
export type InkPoint = { x: number; y: number };

/** Freehand stroke (mobile reader). Drawn with a highlighter or pen. */
export type InkAnnotation = {
  id: string;
  page: number;
  type: "ink";
  tool: "highlighter" | "pen";
  color: string;
  /** Stroke width as a fraction of page width (scales across devices/zoom). */
  size: number;
  points: InkPoint[];
};

// Ink stroke presets (size = fraction of page width).
export const INK_SIZES = { highlighter: 0.022, pen: 0.005 } as const;
export const INK_OPACITY = { highlighter: 0.42, pen: 1 } as const;

/** Build an SVG path `d` from normalized points scaled to a w×h box. */
export function inkPathD(points: InkPoint[], w: number, h: number): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i ? "L" : "M"}${(p.x * w).toFixed(2)} ${(p.y * h).toFixed(2)}`)
    .join(" ");
}

export type Annotation =
  | HighlightAnnotation
  | NoteAnnotation
  | CueAnnotation
  | InkAnnotation;
export type PageOverrides = Record<string, string>;

export type Bookmark = {
  id: string;
  page: number;
  title: string;
  createdAt: string;
  // Set for AI-seeded bookmarks so the reader can tag/colour them. Absent on
  // bookmarks a user adds by hand.
  kind?: "scene" | "song";
};

// Cost guardrails for AI analysis. Each parse is a real per-token Anthropic
// charge, so cap how often the feature can run for one production. The window
// is generous enough for legitimate re-uploads but kills runaway loops.
export const PARSE_LIMIT_PER_PRODUCTION = 5;
export const PARSE_WINDOW_DAYS = 30;

// ----- AI script analysis (the model's proposal, pre-review) -----

/** Character/role types the analyser may assign. Mirrors the wizard's set. */
export const PARSE_ROLE_TYPES = ["Principal", "Supporting", "Ensemble"] as const;

export type ParsedRole = {
  name: string;
  type: string;
};

export type ParsedScene = {
  actNumber: number;
  sceneNumber: number;
  title: string;
};

export type ParsedBookmark = {
  page: number;
  title: string;
  kind: "scene" | "song";
};

export type ScriptParseResult = {
  title: string;
  roles: ParsedRole[];
  scenes: ParsedScene[];
  bookmarks: ParsedBookmark[];
};

export type ScriptParseStatus = "processing" | "ready" | "applied" | "failed";
