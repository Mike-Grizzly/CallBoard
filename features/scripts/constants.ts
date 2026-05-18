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

export type Annotation = HighlightAnnotation | NoteAnnotation | CueAnnotation;
export type PageOverrides = Record<string, string>;
