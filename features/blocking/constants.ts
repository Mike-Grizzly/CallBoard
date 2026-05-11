export type SetPieceDefinition = {
  key: string;
  label: string;
  // Default dimensions as percent of a reference 800x600 canvas
  defaultWidthPx: number;
  defaultHeightPx: number;
  svgPath: string;
};

// SVG paths use a 60x40 viewBox for consistency
export const SET_PIECES: SetPieceDefinition[] = [
  {
    key: "chair",
    label: "Chair",
    defaultWidthPx: 40,
    defaultHeightPx: 40,
    svgPath:
      "M10 8 h20 v16 h-20 z M14 24 v8 M26 24 v8 M8 14 h4 M48 14 h4",
  },
  {
    key: "armchair",
    label: "Arm Chair",
    defaultWidthPx: 52,
    defaultHeightPx: 44,
    svgPath:
      "M8 12 h34 v18 h-34 z M4 12 v18 h6 M42 12 v18 h6 M12 30 v8 M36 30 v8",
  },
  {
    key: "couch",
    label: "Couch",
    defaultWidthPx: 80,
    defaultHeightPx: 40,
    svgPath:
      "M6 10 h68 v20 h-68 z M4 10 v20 h6 M70 10 v20 h6 M10 30 v8 M50 30 v8",
  },
  {
    key: "loveseat",
    label: "Love Seat",
    defaultWidthPx: 60,
    defaultHeightPx: 40,
    svgPath:
      "M6 10 h48 v20 h-48 z M4 10 v20 h6 M54 10 v20 h6 M10 30 v8 M46 30 v8",
  },
  {
    key: "bed_single",
    label: "Bed (Single)",
    defaultWidthPx: 48,
    defaultHeightPx: 72,
    svgPath:
      "M4 4 h42 v72 h-42 z M4 4 h42 v16 h-42 z M8 76 v6 M42 76 v6 M8 4 v-6 M42 4 v-6",
  },
  {
    key: "bed_double",
    label: "Bed (Double)",
    defaultWidthPx: 64,
    defaultHeightPx: 72,
    svgPath:
      "M4 4 h58 v72 h-58 z M4 4 h58 v16 h-58 z M8 76 v6 M58 76 v6 M8 4 v-6 M58 4 v-6",
  },
  {
    key: "table_round",
    label: "Table (Round)",
    defaultWidthPx: 52,
    defaultHeightPx: 52,
    svgPath: "M26 26 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0",
  },
  {
    key: "table_rect",
    label: "Table (Rect)",
    defaultWidthPx: 72,
    defaultHeightPx: 40,
    svgPath:
      "M4 4 h64 v32 h-64 z M4 4 v-4 M68 4 v-4 M4 36 v4 M68 36 v4",
  },
  {
    key: "desk",
    label: "Desk",
    defaultWidthPx: 64,
    defaultHeightPx: 32,
    svgPath:
      "M2 2 h60 v28 h-60 z M8 30 v6 M56 30 v6",
  },
  {
    key: "stairs",
    label: "Stairs",
    defaultWidthPx: 56,
    defaultHeightPx: 48,
    svgPath:
      "M2 42 h10 v-10 h10 v-10 h10 v-10 h10 v-10 h10 v40 h-50 z",
  },
  {
    key: "door",
    label: "Door",
    defaultWidthPx: 40,
    defaultHeightPx: 40,
    svgPath:
      "M4 4 h12 v36 h-12 z M16 4 a28 28 0 0 1 28 28 h-28 z",
  },
  {
    key: "window",
    label: "Window",
    defaultWidthPx: 48,
    defaultHeightPx: 12,
    svgPath:
      "M2 2 h44 v8 h-44 z M2 6 h44 M24 2 v8",
  },
  {
    key: "piano_grand",
    label: "Grand Piano",
    defaultWidthPx: 72,
    defaultHeightPx: 56,
    svgPath:
      "M8 4 h50 q14 0 14 20 q0 24 -20 28 h-44 z M8 4 v48",
  },
  {
    key: "podium",
    label: "Podium",
    defaultWidthPx: 32,
    defaultHeightPx: 36,
    svgPath:
      "M10 4 h20 v12 h6 v20 h-32 v-20 h6 z",
  },
  {
    key: "platform",
    label: "Platform",
    defaultWidthPx: 80,
    defaultHeightPx: 48,
    svgPath:
      "M2 2 h76 v44 h-76 z M2 2 l76 44 M78 2 l-76 44",
  },
];

export const SET_PIECE_MAP = Object.fromEntries(
  SET_PIECES.map((p) => [p.key, p]),
) as Record<string, SetPieceDefinition>;

// Actor token color palette — assigned round-robin by index
export const ACTOR_COLORS = [
  "#E57373", // red
  "#81C784", // green
  "#64B5F6", // blue
  "#FFD54F", // amber
  "#BA68C8", // purple
  "#4DB6AC", // teal
  "#FF8A65", // deep orange
  "#A1887F", // brown
  "#90A4AE", // blue-grey
  "#F06292", // pink
  "#AED581", // light green
  "#4FC3F7", // light blue
];
