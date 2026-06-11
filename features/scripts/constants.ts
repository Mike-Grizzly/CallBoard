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
  // Overall bounding box (selection outline / hit area / back-compat).
  rect: AnnotationRect;
  // Per-line boxes for a text selection, so a multi-line highlight hugs each
  // line instead of filling one big block. Absent on drawn-box highlights and
  // on highlights made before this existed — those just use `rect`.
  rects?: AnnotationRect[];
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
  // Per-cue colour (e.g. red for lights, blue for sound). Absent on cues made
  // before colour was added — they fall back to CUE_STROKE.
  color?: string;
  // Script text captured from under the cue's box at draw time (the "line" the
  // cue is called on). Absent on cues made before this was added.
  line?: string;
  // How the cue is anchored on the page: a drawn "box" around words/lines
  // (default) or a "pipe" — a single vertical line dropped between words / at a
  // line end. For pipes, `rect` is zero-width at the pipe's x over its line,
  // and `line` carries the surrounding words with "*" marking the pipe.
  marker?: "box" | "pipe";
};

/**
 * Cue colours — saturated so leader lines / labels read clearly over the
 * script. The first (red) is the legacy default (`CUE_STROKE`). The viewer
 * remembers the last colour picked and applies it to new cues until changed.
 */
export const CUE_COLORS = [
  { label: "Black", value: "#111111" },
  { label: "Red", value: "#EF4444" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#22C55E" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Pink", value: "#EC4899" },
] as const;

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

// ── Scanned-script OCR (in-browser, tesseract.js — see lib/ocr.ts) ──────────
// A single OCR'd word with a box normalized to 0..1 of the page width/height,
// so it maps to any render scale in the viewer's transparent text layer.
export type OcrWord = {
  t: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type OcrPage = {
  page: number;
  words: OcrWord[];
};

export type ScriptOcrStatus = "processing" | "ready" | "failed";
