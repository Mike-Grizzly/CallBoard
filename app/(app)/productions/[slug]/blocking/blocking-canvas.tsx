"use client";

import {
  useRef,
  useState,
  useEffect,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useIsPhone } from "@/lib/use-is-phone";

// Module-level bitmap cache — survives router.refresh() without remount.
// Keyed by stable file path (not signed URL) so re-generated tokens are instant.
const pdfBitmapCache = new Map<string, ImageBitmap>();
function pdfCacheKey(url: string, page: number) {
  try { return `${new URL(url).pathname}:${page}`; }
  catch { return `${url}:${page}`; }
}
import {
  DndContext,
  DragOverlay,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Settings, Plus, Trash2, ChevronRight, ChevronDown, RotateCcw, Aperture, Download, RotateCw, ChevronLeft, X, Maximize2, Minimize2, Route, Layers, Pencil } from "lucide-react";
import { BeatCommentSection } from "@/components/blocking/beat-comment-section";
import { BeatNotesSection } from "@/components/blocking/beat-notes-section";
import type { ProductionMember } from "@/features/members/queries";
import {
  saveBlockingPosition,
  removeBlockingPosition,
  fetchBeatPositions,
  requestCustomSetPieceUpload,
  finalizeCustomSetPieceUpload,
  deleteCustomSetPiece,
  createBeatArrow,
  deleteBeatArrow,
  fetchBeatArrows,
  type CustomSetPieceClient,
} from "@/features/blocking/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import type { BeatArrow } from "@/db/schema";
import {
  createScene,
  createBeat,
  deleteScene,
  deleteBeat,
  captureNextBeat,
  saveBeatNotes,
} from "@/features/scenes/actions";
import { SET_PIECES, ACTOR_COLORS } from "@/features/blocking/constants";
import type { StageConfiguration, BlockingPosition } from "@/db/schema";
import type { SceneWithBeats } from "@/features/scenes/queries";
import type { CastMember } from "@/features/blocking/queries";
import { loadPdfDocument } from "@/lib/pdf";

type Position = {
  xPercent: number;
  yPercent: number;
  rotation: number;
};

type PositionMap = Record<string, Position>;

type CustomArrow = Pick<BeatArrow, "id" | "fromX" | "fromY" | "toX" | "toY" | "color">;

// Unified set piece type — built-ins have svgPath, custom uploads have imageUrl
type CanvasPiece = {
  key: string;
  label: string;
  svgPath?: string;
  imageUrl?: string;
};

type Props = {
  production: { id: string; title: string; slug: string };
  stageConfig: StageConfiguration | null;
  scenesWithBeats: SceneWithBeats[];
  castMembers: CastMember[];
  productionMembers: ProductionMember[];
  pdfUrl: string | null;
  groundPlanImageUrl: string | null;
  canEdit: boolean;
  currentUserId: string;
  initialBeatId: string | null;
  initialPositions: Pick<BlockingPosition, "entityType" | "entityId" | "xPercent" | "yPercent" | "rotation">[];
  initialArrows: CustomArrow[];
  initialCustomSetPieces: CustomSetPieceClient[];
  // Rendered inside the Focus View shell: fill the parent (no app-layout
  // offsets, no fixed positioning) and drop the redundant fullscreen toggle.
  embedded?: boolean;
};

// ─── Actor Token ────────────────────────────────────────────────────

function ActorToken({
  id,
  initials,
  label,
  color,
  xPercent,
  yPercent,
  canEdit,
  isInteractive,
  isSelected,
  groupDragDelta,
  onRemove,
  onSelect,
}: {
  id: string;
  initials: string;
  label: string;
  color: string;
  xPercent: number;
  yPercent: number;
  canEdit: boolean;
  isInteractive: boolean;
  isSelected: boolean;
  groupDragDelta: { x: number; y: number } | null;
  onRemove: () => void;
  onSelect: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !canEdit || !isInteractive });

  // Apply group movement delta for non-active selected tokens
  const effectiveTransform = isDragging
    ? transform
    : groupDragDelta
      ? { x: groupDragDelta.x, y: groupDragDelta.y, scaleX: 1, scaleY: 1 }
      : transform;

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${xPercent}%`,
    top: `${yPercent}%`,
    transform: CSS.Translate.toString(effectiveTransform),
    zIndex: isDragging || groupDragDelta ? 50 : 18,
    cursor: canEdit && isInteractive ? (isDragging ? "grabbing" : "grab") : "default",
    userSelect: "none",
    touchAction: "none",
    pointerEvents: isInteractive ? undefined : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit && isInteractive ? listeners : {})}
      {...(canEdit && isInteractive ? attributes : {})}
      className="group -translate-x-1/2 -translate-y-1/2"
      data-actor-token="true"
      onClick={canEdit && isInteractive ? onSelect : undefined}
    >
      <div className="relative flex flex-col items-center">
        {canEdit && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
            style={{ zIndex: 40 }}
            title="Remove from stage"
          >
            <X size={9} strokeWidth={3} />
          </button>
        )}
        <div
          className="avatar bk-actor-circle"
          style={{
            width: 38,
            height: 38,
            fontSize: 13,
            fontWeight: 600,
            background: color,
            color: "white",
            boxShadow: isSelected
              ? `0 0 0 2px white, 0 0 0 4px ${color}, 0 2px 8px rgba(0,0,0,.25)`
              : isDragging
                ? "0 0 0 3px var(--accent), 0 4px 12px rgba(0,0,0,.18)"
                : "0 2px 6px rgba(0,0,0,.18)",
            border: "2px solid white",
            outline: isSelected ? "none" : undefined,
            transition: "box-shadow 0.1s ease",
          }}
        >
          {initials}
        </div>
        {label && (
          <div
            className="bk-actor-label"
            style={{
              marginTop: 2,
              whiteSpace: "nowrap",
              fontSize: 10.5,
              fontWeight: 500,
              color: "var(--ink)",
              background: isSelected ? `${color}22` : "rgba(255,255,255,.85)",
              backdropFilter: "blur(4px)",
              padding: "1px 6px",
              borderRadius: 3,
              maxWidth: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              border: isSelected ? `1px solid ${color}66` : "1px solid transparent",
              transition: "background 0.1s ease",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// Centers the DragOverlay ghost on the cursor rather than the drag origin
const snapCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent) {
    const { clientX, clientY } = activatorEvent as PointerEvent;
    const offsetX = clientX - draggingNodeRect.left;
    const offsetY = clientY - draggingNodeRect.top;
    return {
      ...transform,
      x: transform.x + offsetX - draggingNodeRect.width / 2,
      y: transform.y + offsetY - draggingNodeRect.height / 2,
    };
  }
  return transform;
};

// ─── Set Piece Token ────────────────────────────────────────────────

function SetPieceToken({
  id,
  label,
  svgPath,
  imageUrl,
  xPercent,
  yPercent,
  rotation,
  canEdit,
  isInteractive,
  onRemove,
  onRotateTo,
}: {
  id: string;
  label: string;
  svgPath?: string;
  imageUrl?: string;
  xPercent: number;
  yPercent: number;
  rotation: number;
  canEdit: boolean;
  isInteractive: boolean;
  onRemove: () => void;
  onRotateTo: (angle: number, save: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !canEdit || !isInteractive });
  const svgWrapRef = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${xPercent}%`,
    top: `${yPercent}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 8,
    cursor: canEdit && isInteractive ? (isDragging ? "grabbing" : "grab") : "default",
    userSelect: "none",
    touchAction: "none",
    pointerEvents: isInteractive ? undefined : "none",
  };

  function handleRotateGrab(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const el = svgWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    function rawAngle(clientX: number, clientY: number) {
      return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    }

    const startRawAngle = rawAngle(e.clientX, e.clientY);
    const startRotation = rotation;

    function onMove(ev: PointerEvent) {
      const delta = rawAngle(ev.clientX, ev.clientY) - startRawAngle;
      const next = Math.round(startRotation + delta);
      onRotateTo(((next % 360) + 360) % 360, false);
    }
    function onUp(ev: PointerEvent) {
      const delta = rawAngle(ev.clientX, ev.clientY) - startRawAngle;
      const next = Math.round(startRotation + delta);
      onRotateTo(((next % 360) + 360) % 360, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit ? listeners : {})}
      {...(canEdit ? attributes : {})}
      className="group -translate-x-1/2 -translate-y-1/2"
      data-set-piece-token="true"
    >
      <div className="relative" ref={svgWrapRef}>
        {canEdit && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
            style={{ zIndex: 40 }}
            title="Remove from stage"
          >
            <X size={9} strokeWidth={3} />
          </button>
        )}
        <div style={{ transform: `rotate(${rotation}deg)` }}>
          {imageUrl ? (
            <div
              className="rounded border border-[color:var(--border)] bg-white/90 shadow-sm bk-set-piece-token"
              style={{ width: 64, height: 48, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
            >
              <img
                src={imageUrl}
                alt={label}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
          ) : (
            <svg
              viewBox="0 0 80 60"
              width={64}
              height={48}
              className="rounded border border-[color:var(--border)] bg-white/90 shadow-sm bk-set-piece-token"
            >
              <path
                d={svgPath}
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {canEdit && (
          <div
            onPointerDown={handleRotateGrab}
            className="absolute hidden group-hover:flex"
            style={{
              bottom: -7,
              right: -7,
              width: 15,
              height: 15,
              borderRadius: "50%",
              background: "var(--bg-elev)",
              border: "2px solid var(--border-strong)",
              cursor: "crosshair",
              zIndex: 30,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-1)",
            }}
            title="Drag to rotate"
          >
            <RotateCw size={7} strokeWidth={2.5} style={{ color: "var(--ink-2)", pointerEvents: "none" }} />
          </div>
        )}
        <div
          style={{
            marginTop: 2,
            textAlign: "center",
            fontSize: 9,
            background: "rgba(255,255,255,.85)",
            backdropFilter: "blur(4px)",
            color: "var(--ink-2)",
            padding: "1px 4px",
            borderRadius: 3,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Off-stage Actor Tile (draggable) ──────────────────────────────

function OffstageActorTile({
  member,
  color,
  ini,
  isOnCanvas,
  isDisabled,
  onClickPlace,
}: {
  member: CastMember;
  color: string;
  ini: string;
  isOnCanvas: boolean;
  isDisabled: boolean;
  onClickPlace: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `offstage:${member.userId}`,
    disabled: isDisabled || isOnCanvas,
  });

  const actorName =
    member.firstName || member.lastName
      ? `${member.firstName} ${member.lastName}`.trim()
      : member.email;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={isDisabled || isOnCanvas ? undefined : onClickPlace}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 8px",
        borderRadius: 6,
        cursor: isOnCanvas || isDisabled ? "default" : isDragging ? "grabbing" : "grab",
        border: "1px dashed " + (isOnCanvas ? "var(--border)" : "var(--border-strong)"),
        background: isOnCanvas ? "transparent" : "var(--bg-muted)",
        opacity: isDisabled ? 0.4 : isOnCanvas ? 0.4 : isDragging ? 0.3 : 1,
        touchAction: "none",
        userSelect: "none",
      }}
      title={
        isOnCanvas
          ? "Already on stage"
          : isDisabled
            ? "Select a beat first"
            : "Drag onto stage or click to place at center"
      }
    >
      <div
        className="avatar"
        style={{ width: 24, height: 24, fontSize: 10, background: color, flexShrink: 0 }}
      >
        {ini}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {member.characterName ? (
          <>
            <div className="truncate" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>
              {member.characterName}
            </div>
            <div className="muted truncate" style={{ fontSize: 10.5 }}>{actorName}</div>
          </>
        ) : (
          <div className="truncate" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>
            {actorName}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Off-stage Set Piece Tile (draggable) ───────────────────────────

function OffstageSetPieceTile({
  piece,
  isOnCanvas,
  isDisabled,
  onClickPlace,
  onDelete,
  canDelete,
}: {
  piece: CanvasPiece;
  isOnCanvas: boolean;
  isDisabled: boolean;
  onClickPlace: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `offstage-piece:${piece.key}`,
    disabled: isDisabled || isOnCanvas,
  });

  return (
    <div className="group" style={{ position: "relative" }}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={isDisabled || isOnCanvas ? undefined : onClickPlace}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          borderRadius: 6,
          cursor: isOnCanvas || isDisabled ? "default" : isDragging ? "grabbing" : "grab",
          border: "1px dashed " + (isOnCanvas ? "var(--border)" : "var(--border-strong)"),
          background: isOnCanvas ? "transparent" : "var(--bg-muted)",
          opacity: isDisabled ? 0.4 : isOnCanvas ? 0.4 : isDragging ? 0.3 : 1,
          touchAction: "none",
          userSelect: "none",
        }}
        title={
          isOnCanvas
            ? "Already on stage"
            : isDisabled
              ? "Select a beat first"
              : "Drag onto stage or click to place at center"
        }
      >
        {piece.imageUrl ? (
          <div style={{ width: 28, height: 21, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <img
              src={piece.imageUrl}
              alt={piece.label}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        ) : (
          <svg viewBox="0 0 80 60" width={28} height={21} style={{ flexShrink: 0 }}>
            <path
              d={piece.svgPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="truncate" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-2)" }}>
          {piece.label}
        </span>
      </div>
      {canDelete && onDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
          style={{ zIndex: 10 }}
          title="Delete custom piece"
        >
          <X size={9} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

// ─── Number Grid Overlay ────────────────────────────────────────────

function NumberGridOverlay({
  stageConfig,
  showSLSR,
  showUSDS,
}: {
  stageConfig: StageConfiguration;
  showSLSR: boolean;
  showUSDS: boolean;
}) {
  const {
    calibrationX1,
    calibrationY1,
    calibrationX2,
    calibrationY2,
    prosceniumWidthFt,
  } = stageConfig;

  if (
    calibrationX1 == null ||
    calibrationX2 == null ||
    calibrationY1 == null ||
    calibrationY2 == null
  ) {
    return null;
  }

  const centerX = (calibrationX1 + calibrationX2) / 2;
  const centerY = (calibrationY1 + calibrationY2) / 2;
  const lineSpanX = Math.abs(calibrationX2 - calibrationX1);
  const footPercent = lineSpanX / prosceniumWidthFt;
  const step = footPercent * 2; // 2ft spacing
  const halfWidthFt = Math.ceil(prosceniumWidthFt / 2);

  // SL/SR: vertical lines + tick marks + labels on the proscenium line
  const ticks: { x: number; ft: number; isMajor: boolean }[] = [];
  for (let ft = -halfWidthFt; ft <= halfWidthFt; ft += 2) {
    const x = centerX + ft * footPercent;
    if (x >= 0 && x <= 100) ticks.push({ x, ft, isMajor: ft % 10 === 0 });
  }

  // US/DS: horizontal lines, full canvas width, both directions — no labels
  const hLines: number[] = [];
  if (showUSDS) {
    for (let y = centerY - step; y >= 0; y -= step) hLines.push(y);
    for (let y = centerY + step; y <= 100; y += step) hLines.push(y);
  }

  const minorTickH = 1.5;
  const majorTickH = 2.8;
  const labelY = centerY + 4.2;
  const gridLine = "rgba(80,80,80,0.15)";
  const centerLine = "rgba(80,80,80,0.4)";

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 2 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* SL/SR vertical grid lines */}
      {showSLSR && ticks.map(({ x }) => (
        <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={100}
          stroke={gridLine} strokeWidth="0.15" />
      ))}

      {/* US/DS horizontal grid lines — no labels */}
      {hLines.map((y) => (
        <line key={`h-${y}`} x1={0} y1={y} x2={100} y2={y}
          stroke={gridLine} strokeWidth="0.15" />
      ))}

      {/* Proscenium center line */}
      <line x1={calibrationX1!} y1={centerY} x2={calibrationX2!} y2={centerY}
        stroke={centerLine} strokeWidth="0.22" />

      {/* SL/SR tick marks and foot labels on the proscenium line */}
      {ticks.map(({ x, ft, isMajor }) => {
        const tickH = isMajor ? majorTickH : minorTickH;
        const showLabel = ft % 5 === 0;
        const label = ft === 0 ? "0" : `${Math.abs(ft)}'`;
        return (
          <g key={`tick-${x}`}>
            <line x1={x} y1={centerY} x2={x} y2={centerY - tickH}
              stroke={centerLine} strokeWidth="0.2" />
            {showLabel && (
              <text x={x} y={labelY} textAnchor="middle" fontSize="1.6"
                fill="rgba(80,80,80,0.6)"
                stroke="white" strokeWidth="2" paintOrder="stroke"
                fontWeight={isMajor ? "bold" : "normal"}
                style={{ pointerEvents: "none" }}>
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

function positionRowsToMap(
  rows: Pick<BlockingPosition, "entityType" | "entityId" | "xPercent" | "yPercent" | "rotation">[],
): PositionMap {
  const map: PositionMap = {};
  for (const row of rows) {
    map[`${row.entityType}:${row.entityId}`] = {
      xPercent: row.xPercent,
      yPercent: row.yPercent,
      rotation: row.rotation,
    };
  }
  return map;
}

export function BlockingCanvas({
  production,
  stageConfig,
  scenesWithBeats,
  castMembers,
  productionMembers,
  pdfUrl,
  groundPlanImageUrl,
  canEdit: canEditProp,
  currentUserId,
  initialBeatId,
  initialPositions,
  initialArrows,
  initialCustomSetPieces,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // The blocking canvas is drag-and-drop and mouse-built — on phones it is
  // presented view-only until touch support lands. Editors keep full edit
  // access on tablet and desktop.
  const isPhone = useIsPhone();
  const canEdit = canEditProp && !isPhone;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Phone swipe-to-change-beat state. Populated on pointerdown when
  // pointerType === "touch", consumed on pointerup. Lives outside React
  // state since a partial drag doesn't need to trigger a re-render.
  const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const [currentBeatId, setCurrentBeatId] = useState<string | null>(initialBeatId);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(
    () =>
      scenesWithBeats.find((s) =>
        s.beats.some((b) => b.id === initialBeatId),
      )?.id ??
      scenesWithBeats[0]?.id ??
      null,
  );
  const [positions, setPositions] = useState<PositionMap>(
    () => positionRowsToMap(initialPositions),
  );
  const [history, setHistory] = useState<PositionMap[]>([]);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [showSLSR, setShowSLSR] = useState(false);
  const [showUSDS, setShowUSDS] = useState(false);
  const [addingScene, setAddingScene] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [newSceneAct, setNewSceneAct] = useState("1");
  const [newSceneNum, setNewSceneNum] = useState("1");
  const [addingBeatForScene, setAddingBeatForScene] = useState<string | null>(null);
  const [newBeatLabel, setNewBeatLabel] = useState("");
  const [setPiecesOpen, setSetPiecesOpen] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [customPieces, setCustomPieces] = useState<CustomSetPieceClient[]>(initialCustomSetPieces);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showMovementArrows, setShowMovementArrows] = useState(false);
  const [nextBeatPositions, setNextBeatPositions] = useState<PositionMap | null>(null);
  const [customArrows, setCustomArrows] = useState<CustomArrow[]>(initialArrows);
  const [drawMode, setDrawMode] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [arrowPreviewEnd, setArrowPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"actors" | "set_pieces">("actors");
  const [notesOpen, setNotesOpen] = useState(true);
  const [beatNotesMap, setBeatNotesMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const scene of scenesWithBeats) {
      for (const beat of scene.beats) {
        map[beat.id] = beat.notes ?? "";
      }
    }
    return map;
  });

  // Multi-select state
  const [selectedActorIds, setSelectedActorIds] = useState<Set<string>>(new Set());
  const [activeDragDelta, setActiveDragDelta] = useState<{ x: number; y: number } | null>(null);
  // Lasso selection state (percentages relative to canvas)
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFullscreen(false);
        setSelectedActorIds(new Set());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!drawMode) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (arrowStart) {
          setArrowStart(null);
          setArrowPreviewEnd(null);
        } else {
          setDrawMode(false);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawMode, arrowStart]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const isFirstBeat = useRef(true);
  const skipNextBeatLoad = useRef(false);
  useEffect(() => {
    if (isFirstBeat.current) {
      isFirstBeat.current = false;
      return;
    }
    if (skipNextBeatLoad.current) {
      skipNextBeatLoad.current = false;
      return;
    }
    if (!currentBeatId) {
      setPositions({});
      setCustomArrows([]);
      setHistory([]);
      setSelectedActorIds(new Set());
      return;
    }
    Promise.all([
      fetchBeatPositions(currentBeatId),
      fetchBeatArrows(currentBeatId),
    ]).then(([posRows, arrowRows]) => {
      setPositions(positionRowsToMap(posRows));
      setCustomArrows(arrowRows);
      setHistory([]);
      setSelectedActorIds(new Set());
    }).catch(() => {});
  }, [currentBeatId]);

  useEffect(() => {
    if (!showMovementArrows || !currentBeatId) {
      setNextBeatPositions(null);
      return;
    }
    const allBeats = scenesWithBeats.flatMap((s) => s.beats);
    const idx = allBeats.findIndex((b) => b.id === currentBeatId);
    const nextId = idx !== -1 && idx < allBeats.length - 1 ? allBeats[idx + 1].id : null;
    if (!nextId) {
      setNextBeatPositions(null);
      return;
    }
    fetchBeatPositions(nextId).then((rows) => {
      setNextBeatPositions(positionRowsToMap(rows));
    }).catch(() => {});
  }, [showMovementArrows, currentBeatId, scenesWithBeats]);

  const groundPlanPage = stageConfig?.groundPlanPage ?? 1;
  const [currentPdfPage, setCurrentPdfPage] = useState(groundPlanPage);
  const [numPdfPages, setNumPdfPages] = useState(1);

  useEffect(() => {
    if (!pdfUrl || !pdfCanvasRef.current) return;
    // If we already have a rasterized image from the setup wizard, the
    // canvas is replaced by an <img> and pdf.js never needs to run.
    if (groundPlanImageUrl) return;
    // iPhone Safari kills the tab ("Can't open this page") when pdf.js
    // parses a real ground-plan PDF — architectural drawings are
    // vector-heavy and the parser holds the whole tree in memory before
    // we even rasterize. Lowering render scale didn't help; the OOM was
    // upstream of the canvas. On phone we skip pdf.js entirely (it's
    // dynamic-imported only inside loadPdfDocument, so this also keeps
    // pdf.js itself off the bundle for that load) and let the canvas
    // render without the floor-plan background. The blocking dots and
    // set pieces still show, and a "View floor plan" link opens the PDF
    // in the system viewer where memory isn't constrained.
    if (isPhone) return;
    let cancelled = false;
    const cacheKey = pdfCacheKey(pdfUrl, currentPdfPage);

    async function render() {
      const mainCanvas = pdfCanvasRef.current!;

      // If we already rendered this file+page, repaint instantly from cache —
      // this is what prevents the flash when router.refresh() regenerates the signed URL.
      const cached = pdfBitmapCache.get(cacheKey);
      if (cached) {
        mainCanvas.width = cached.width;
        mainCanvas.height = cached.height;
        mainCanvas.getContext("2d")?.drawImage(cached, 0, 0);
        if (!cancelled) setPdfLoaded(true);
        return;
      }

      const pdf = await loadPdfDocument(pdfUrl!);
      if (cancelled) return;
      setNumPdfPages(pdf.numPages);
      const page = await pdf.getPage(currentPdfPage);
      const viewport = page.getViewport({ scale: 1.5 });

      // Render to an offscreen canvas so the visible canvas stays intact
      // until the new frame is fully ready — no blank flash during render.
      const offscreen = document.createElement("canvas");
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      await page.render({ canvas: offscreen, viewport }).promise;
      if (cancelled) return;

      // Single synchronous copy: main canvas is never blank.
      mainCanvas.width = offscreen.width;
      mainCanvas.height = offscreen.height;
      mainCanvas.getContext("2d")?.drawImage(offscreen, 0, 0);

      // Cache the bitmap for instant repaints after router.refresh().
      try {
        const bitmap = await createImageBitmap(offscreen);
        if (!cancelled) pdfBitmapCache.set(cacheKey, bitmap);
      } catch { /* createImageBitmap unsupported — non-fatal */ }

      if (!cancelled) setPdfLoaded(true);
    }
    render().catch(() => setPdfLoaded(false));
    return () => { cancelled = true; };
  }, [pdfUrl, currentPdfPage, isPhone, groundPlanImageUrl]);

  function pushHistory(prev: PositionMap) {
    setHistory((h) => [...h.slice(-49), prev]);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPositions(prev);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setActiveDragDelta(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setActiveDragDelta(null);
  }

  function handleDragMove(event: DragMoveEvent) {
    const id = event.active.id as string;
    // Track delta so other selected actors can follow in real time
    if (selectedActorIds.has(id)) {
      setActiveDragDelta(event.delta);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setActiveDragDelta(null);
    const { active, delta, activatorEvent } = event;
    const id = active.id as string;
    const activator = activatorEvent as PointerEvent;

    // Off-stage actor dragged onto canvas
    if (id.startsWith("offstage:")) {
      if (!canEdit || !currentBeatId) return;
      const entityId = id.replace("offstage:", "");
      const container = canvasContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const cursorX = activator.clientX + delta.x;
      const cursorY = activator.clientY + delta.y;
      const xPercent = ((cursorX - containerRect.left) / containerRect.width) * 100;
      const yPercent = ((cursorY - containerRect.top) / containerRect.height) * 100;
      if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;
      const clampedX = Math.max(4, Math.min(96, xPercent));
      const clampedY = Math.max(4, Math.min(96, yPercent));
      pushHistory(positions);
      const key = `actor:${entityId}`;
      setPositions((prev) => ({ ...prev, [key]: { xPercent: clampedX, yPercent: clampedY, rotation: 0 } }));
      startTransition(async () => {
        await saveBlockingPosition({
          beatId: currentBeatId,
          entityType: "actor",
          entityId,
          xPercent: clampedX,
          yPercent: clampedY,
          rotation: 0,
        });
      });
      return;
    }

    // Off-stage set piece dragged onto canvas
    if (id.startsWith("offstage-piece:")) {
      if (!canEdit || !currentBeatId) return;
      const entityId = id.replace("offstage-piece:", "");
      const container = canvasContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const cursorX = activator.clientX + delta.x;
      const cursorY = activator.clientY + delta.y;
      const xPercent = ((cursorX - containerRect.left) / containerRect.width) * 100;
      const yPercent = ((cursorY - containerRect.top) / containerRect.height) * 100;
      if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;
      const clampedX = Math.max(4, Math.min(96, xPercent));
      const clampedY = Math.max(4, Math.min(96, yPercent));
      pushHistory(positions);
      const key = `set_piece:${entityId}`;
      setPositions((prev) => ({ ...prev, [key]: { xPercent: clampedX, yPercent: clampedY, rotation: 0 } }));
      startTransition(async () => {
        await saveBlockingPosition({
          beatId: currentBeatId,
          entityType: "set_piece",
          entityId,
          xPercent: clampedX,
          yPercent: clampedY,
          rotation: 0,
        });
      });
      return;
    }

    // Existing actor/set-piece repositioning
    if (!canEdit || !currentBeatId) return;
    if (!delta.x && !delta.y) return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const current = positions[id];
    if (!current) return;

    const dxPercent = (delta.x / rect.width) * 100;
    const dyPercent = (delta.y / rect.height) * 100;

    // Group move: if dragged actor is in the selection, move all selected actors
    const isGroupMove = id.startsWith("actor:") && selectedActorIds.has(id) && selectedActorIds.size > 1;

    pushHistory(positions);

    if (isGroupMove) {
      const updated = { ...positions };
      for (const selId of selectedActorIds) {
        const selPos = positions[selId];
        if (!selPos) continue;
        updated[selId] = {
          ...selPos,
          xPercent: Math.max(2, Math.min(98, selPos.xPercent + dxPercent)),
          yPercent: Math.max(2, Math.min(98, selPos.yPercent + dyPercent)),
        };
      }
      setPositions(updated);
      startTransition(async () => {
        await Promise.all(
          Array.from(selectedActorIds).map((selId) => {
            const newPos = updated[selId];
            if (!newPos) return Promise.resolve();
            const [entityType, entityId] = selId.split(":") as ["actor" | "set_piece", string];
            return saveBlockingPosition({
              beatId: currentBeatId!,
              entityType,
              entityId,
              xPercent: newPos.xPercent,
              yPercent: newPos.yPercent,
              rotation: newPos.rotation,
            });
          }),
        );
      });
    } else {
      const newX = Math.max(2, Math.min(98, current.xPercent + dxPercent));
      const newY = Math.max(2, Math.min(98, current.yPercent + dyPercent));
      const updated = { ...positions, [id]: { ...current, xPercent: newX, yPercent: newY } };
      setPositions(updated);
      const [entityType, entityId] = id.split(":") as ["actor" | "set_piece", string];
      startTransition(async () => {
        await saveBlockingPosition({
          beatId: currentBeatId,
          entityType,
          entityId,
          xPercent: newX,
          yPercent: newY,
          rotation: current.rotation,
        });
      });
    }
  }

  function handleRotateSetPiece(entityId: string, newRotation: number, save: boolean) {
    if (!canEdit || !currentBeatId) return;
    const key = `set_piece:${entityId}`;
    const current = positions[key];
    if (!current) return;
    setPositions((prev) => ({ ...prev, [key]: { ...prev[key], rotation: newRotation } }));
    if (save) {
      startTransition(async () => {
        await saveBlockingPosition({
          beatId: currentBeatId,
          entityType: "set_piece",
          entityId,
          xPercent: current.xPercent,
          yPercent: current.yPercent,
          rotation: newRotation,
        });
      });
    }
  }

  function canvasCoords(e: React.PointerEvent<HTMLDivElement>) {
    const container = canvasContainerRef.current!;
    const rect = container.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function snapToActorIfNear(x: number, y: number) {
    for (const member of castMembers) {
      const pos = positions[`actor:${member.userId}`];
      if (!pos) continue;
      if (Math.hypot(x - pos.xPercent, y - pos.yPercent) < 3) {
        return { x: pos.xPercent, y: pos.yPercent, color: actorColors[member.userId] };
      }
    }
    return { x, y, color: "#374151" };
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canvasContainerRef.current) return;
    // On phone we treat horizontal pointer drags across the canvas as
    // prev/next-beat swipes. canEdit is false on phone so the drag/draw
    // paths below are no-ops anyway, leaving the gesture surface free.
    if (isPhone && e.pointerType === "touch") {
      swipeStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
    const { x, y } = canvasCoords(e);

    if (drawMode) {
      if (!arrowStart) {
        const snapped = snapToActorIfNear(x, y);
        setArrowStart({ x: snapped.x, y: snapped.y });
        setArrowPreviewEnd({ x: snapped.x, y: snapped.y });
      } else {
        const snapped = snapToActorIfNear(x, y);
        const dx = snapped.x - arrowStart.x;
        const dy = snapped.y - arrowStart.y;
        if (Math.hypot(dx, dy) > 2 && currentBeatId) {
          const startSnap = snapToActorIfNear(arrowStart.x, arrowStart.y);
          createBeatArrow(currentBeatId, arrowStart.x, arrowStart.y, snapped.x, snapped.y, startSnap.color)
            .then((res) => {
              if (res.arrow) setCustomArrows((prev) => [...prev, res.arrow!]);
            });
        }
        setArrowStart(null);
        setArrowPreviewEnd(null);
      }
      return;
    }

    // Ignore if clicking on an actor/set-piece token
    if ((e.target as Element).closest("[data-actor-token]") ||
        (e.target as Element).closest("[data-set-piece-token]")) return;
    setLassoStart({ x, y });
    setLassoEnd({ x, y });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (drawMode) {
      if (arrowStart && canvasContainerRef.current) {
        setArrowPreviewEnd(canvasCoords(e));
      }
      return;
    }
    if (!lassoStart) return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLassoEnd({ x, y });
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    // Swipe-to-change-beat (phone only). Fires before the lasso path
    // returns out. ~50px horizontal, predominantly horizontal motion,
    // under ~600ms — tuned to be deliberate without competing with
    // vertical page scrolls. The canvas itself isn't scrollable.
    if (isPhone && swipeStartRef.current) {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = Date.now() - start.t;
      if (
        Math.abs(dx) > 50 &&
        Math.abs(dx) > Math.abs(dy) * 1.5 &&
        dt < 600
      ) {
        if (dx < 0) goToNextBeat();
        else goToPrevBeat();
        return;
      }
    }
    if (drawMode) return;
    if (!lassoStart || !lassoEnd) return;
    const minX = Math.min(lassoStart.x, lassoEnd.x);
    const maxX = Math.max(lassoStart.x, lassoEnd.x);
    const minY = Math.min(lassoStart.y, lassoEnd.y);
    const maxY = Math.max(lassoStart.y, lassoEnd.y);
    const isDrag = maxX - minX > 1.5 || maxY - minY > 1.5;
    if (isDrag) {
      // Select all actors whose center falls inside the lasso rectangle
      const inLasso = new Set<string>();
      for (const [key, pos] of Object.entries(positions)) {
        if (!key.startsWith("actor:")) continue;
        if (pos.xPercent >= minX && pos.xPercent <= maxX &&
            pos.yPercent >= minY && pos.yPercent <= maxY) {
          inLasso.add(key);
        }
      }
      setSelectedActorIds(inLasso);
    } else {
      // Plain click on empty canvas — deselect all
      if (!e.shiftKey) setSelectedActorIds(new Set());
    }
    setLassoStart(null);
    setLassoEnd(null);
  }

  function handleExportPng() {
    const pdfCanvas = pdfCanvasRef.current;
    const container = canvasContainerRef.current;
    if (!container) return;

    const w = pdfCanvas ? pdfCanvas.width : container.clientWidth;
    const h = pdfCanvas ? pdfCanvas.height : container.clientHeight;
    const scaleX = w / container.clientWidth;
    const scaleY = h / container.clientHeight;

    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext("2d")!;

    if (pdfCanvas) {
      ctx.drawImage(pdfCanvas, 0, 0);
    } else {
      ctx.fillStyle = "#f5f0e8";
      ctx.fillRect(0, 0, w, h);
    }

    for (const member of castMembers) {
      const key = `actor:${member.userId}`;
      const pos = positions[key];
      if (!pos) continue;
      const x = (pos.xPercent / 100) * w;
      const y = (pos.yPercent / 100) * h;
      const r = 20 * Math.min(scaleX, scaleY);
      const color = actorColors[member.userId];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      const ini =
        ((member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? ""))
          .toUpperCase() || member.email[0]?.toUpperCase() || "?";
      ctx.fillStyle = "white";
      ctx.font = `bold ${r}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ini, x, y);

      const lbl = member.characterName ?? "";
      if (lbl) {
        const fs = r * 0.75;
        ctx.font = `${fs}px sans-serif`;
        const tw = ctx.measureText(lbl).width;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(x - tw / 2 - 4, y + r + 2, tw + 8, fs + 4);
        ctx.fillStyle = "#333";
        ctx.textBaseline = "top";
        ctx.fillText(lbl, x, y + r + 4);
      }
    }

    for (const piece of SET_PIECES) {
      const key = `set_piece:${piece.key}`;
      const pos = positions[key];
      if (!pos) continue;
      const x = (pos.xPercent / 100) * w;
      const y = (pos.yPercent / 100) * h;
      const tokenW = 64 * Math.min(scaleX, scaleY);
      const tokenH = 48 * Math.min(scaleX, scaleY);

      ctx.save();
      ctx.translate(x, y);
      if (pos.rotation) ctx.rotate((pos.rotation * Math.PI) / 180);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(-tokenW / 2, -tokenH / 2, tokenW, tokenH);
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-tokenW / 2, -tokenH / 2, tokenW, tokenH);
      ctx.scale(tokenW / 80, tokenH / 60);
      ctx.translate(-40, -30);
      const path = new Path2D(piece.svgPath);
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      ctx.stroke(path);
      ctx.restore();
    }

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blocking-${production.title.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function placeOnCanvas(entityType: "actor" | "set_piece", entityId: string) {
    if (!canEdit || !currentBeatId) return;
    const key = `${entityType}:${entityId}`;
    if (positions[key]) return;
    pushHistory(positions);
    const pos = { xPercent: 50, yPercent: 50, rotation: 0 };
    setPositions((prev) => ({ ...prev, [key]: pos }));
    startTransition(async () => {
      await saveBlockingPosition({
        beatId: currentBeatId,
        entityType,
        entityId,
        xPercent: 50,
        yPercent: 50,
        rotation: 0,
      });
    });
  }

  function removeFromCanvas(entityType: string, entityId: string) {
    if (!canEdit || !currentBeatId) return;
    const key = `${entityType}:${entityId}`;
    pushHistory(positions);
    setPositions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    startTransition(async () => {
      await removeBlockingPosition(currentBeatId, entityType, entityId);
    });
  }

  async function handleCreateScene() {
    if (!newSceneTitle.trim()) return;
    const fd = new FormData();
    fd.set("production_id", production.id);
    fd.set("title", newSceneTitle);
    fd.set("act_number", newSceneAct);
    fd.set("scene_number", newSceneNum);
    fd.set("order_index", String(scenesWithBeats.length));
    await createScene(undefined, fd);
    setAddingScene(false);
    setNewSceneTitle("");
    router.refresh();
  }

  async function handleDeleteScene(sceneId: string) {
    const fd = new FormData();
    fd.set("scene_id", sceneId);
    await deleteScene(undefined, fd);
    router.refresh();
  }

  async function handleCreateBeat(sceneId: string) {
    if (!newBeatLabel.trim()) return;
    const scene = scenesWithBeats.find((s) => s.id === sceneId);
    const fd = new FormData();
    fd.set("scene_id", sceneId);
    fd.set("label", newBeatLabel);
    fd.set("order_index", String(scene?.beats.length ?? 0));
    await createBeat(undefined, fd);
    setAddingBeatForScene(null);
    setNewBeatLabel("");
    router.refresh();
  }

  async function handleDeleteBeat(beatId: string) {
    if (currentBeatId === beatId) setCurrentBeatId(null);
    const fd = new FormData();
    fd.set("beat_id", beatId);
    await deleteBeat(undefined, fd);
    router.refresh();
  }

  async function handleCaptureBeat() {
    const sceneId = currentSceneId;
    if (!sceneId) return;
    const scene = scenesWithBeats.find((s) => s.id === sceneId);
    if (!scene) return;

    const nextIndex = scene.beats.length;
    const nextLabel = `Beat ${nextIndex + 1}`;

    let sourceBeatId = currentBeatId;
    if (!sourceBeatId) {
      const sceneIndex = scenesWithBeats.findIndex((s) => s.id === sceneId);
      if (sceneIndex > 0) {
        const prevScene = scenesWithBeats[sceneIndex - 1];
        sourceBeatId = prevScene.beats[prevScene.beats.length - 1]?.id ?? null;
      }
    }

    const result = await captureNextBeat(sceneId, nextLabel, nextIndex, sourceBeatId);
    if (result.beatId) {
      setHistory([]);
      skipNextBeatLoad.current = true;
      setCurrentBeatId(result.beatId);
      router.refresh();
    }
  }

  function handleDeleteArrow(arrowId: string) {
    setCustomArrows((prev) => prev.filter((a) => a.id !== arrowId));
    setHoveredArrowId(null);
    deleteBeatArrow(arrowId);
  }

  async function handleSaveBeatNotes(beatId: string, html: string) {
    setBeatNotesMap((prev) => ({ ...prev, [beatId]: html }));
    await saveBeatNotes(beatId, html);
  }

  // Flat list of every beat with its parent scene — backs the mobile
  // prev/next beat navigation and swipe gestures. Beats are already
  // ordered by scene.orderIndex then beat.orderIndex in scenesWithBeats.
  const allBeatsFlat = scenesWithBeats.flatMap((s) =>
    s.beats.map((b) => ({ beat: b, scene: s })),
  );
  const currentBeatIdx = currentBeatId
    ? allBeatsFlat.findIndex((x) => x.beat.id === currentBeatId)
    : -1;
  const hasPrevBeat = currentBeatIdx > 0;
  const hasNextBeat =
    currentBeatIdx >= 0 && currentBeatIdx < allBeatsFlat.length - 1;

  function goToPrevBeat() {
    if (!hasPrevBeat) return;
    const target = allBeatsFlat[currentBeatIdx - 1];
    setCurrentSceneId(target.scene.id);
    setCurrentBeatId(target.beat.id);
  }
  function goToNextBeat() {
    if (!hasNextBeat) return;
    const target = allBeatsFlat[currentBeatIdx + 1];
    setCurrentSceneId(target.scene.id);
    setCurrentBeatId(target.beat.id);
  }

  const actorColors: Record<string, string> = {};
  castMembers.forEach((m, i) => {
    actorColors[m.userId] = ACTOR_COLORS[i % ACTOR_COLORS.length];
  });

  const allPieces: CanvasPiece[] = [
    ...SET_PIECES.map((p) => ({ key: p.key, label: p.label, svgPath: p.svgPath })),
    ...customPieces.map((p) => ({ key: p.id, label: p.name, imageUrl: p.imageUrl })),
  ];

  async function handleUploadPiece(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const finish = () => {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const signed = await requestCustomSetPieceUpload(
      production.id,
      file.name,
      file.type,
      file.size,
    );
    if (signed.error || !signed.path || !signed.token) {
      setUploadError(signed.error ?? "Could not start upload.");
      finish();
      return;
    }

    const uploaded = await uploadFileToSignedUrl(
      signed.path,
      signed.token,
      file,
    );
    if (uploaded.error) {
      setUploadError(uploaded.error);
      finish();
      return;
    }

    const result = await finalizeCustomSetPieceUpload({
      productionId: production.id,
      storagePath: signed.path,
      fileName: file.name,
    });
    if (result.error) {
      setUploadError(result.error);
    } else if (result.piece) {
      setCustomPieces((prev) => [...prev, result.piece!]);
    }
    finish();
  }

  async function handleDeleteCustomPiece(pieceId: string) {
    const result = await deleteCustomSetPiece(pieceId);
    if (!result.error) {
      setCustomPieces((prev) => prev.filter((p) => p.id !== pieceId));
      // Also remove from canvas positions if placed
      const key = `set_piece:${pieceId}`;
      setPositions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const currentScene = scenesWithBeats.find((s) =>
    s.beats.some((b) => b.id === currentBeatId),
  );
  const currentBeat = currentScene?.beats.find((b) => b.id === currentBeatId);

  const offStageCount = castMembers.filter(
    (m) => !positions[`actor:${m.userId}`],
  ).length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div
      className="anim-in bk-shell"
      style={
        embedded
          ? {
              // Fill the Focus View stage (a flex child with a definite height).
              height: "100%",
              display: "grid",
              gridTemplateColumns: "240px 1fr 260px",
              overflow: "hidden",
              background: "var(--bg)",
            }
          : fullscreen
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              height: "100vh",
              display: "grid",
              gridTemplateColumns: "240px 1fr 260px",
              overflow: "hidden",
              background: "var(--bg)",
            }
          : {
              margin: "-24px calc(-1 * var(--pad-x))",
              height: "calc(100vh - 133px)",
              display: "grid",
              gridTemplateColumns: "220px 1fr 240px",
              overflow: "hidden",
            }
      }
    >

      {/* ─── Left panel: Scenes & Off-stage Cast ────────────── */}
      <div
        className="bk-side-left"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
          padding: "14px 12px",
          gap: 12,
        }}
      >

        {/* Scenes section */}
        <div style={{ flex: "0 0 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>Scenes</div>

          {addingScene && (
            <div
              className="mb-3 rounded border border-[color:var(--border)] p-2.5"
              style={{ background: "var(--bg-elev)", display: "flex", flexDirection: "column", gap: 6 }}
            >
              <input
                autoFocus
                placeholder="Scene title"
                value={newSceneTitle}
                onChange={(e) => setNewSceneTitle(e.target.value)}
                className="field"
                style={{ fontSize: 12, height: 32 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  placeholder="Act"
                  value={newSceneAct}
                  onChange={(e) => setNewSceneAct(e.target.value)}
                  className="field"
                  style={{ width: 56, fontSize: 12, height: 32 }}
                />
                <input
                  placeholder="Scene"
                  value={newSceneNum}
                  onChange={(e) => setNewSceneNum(e.target.value)}
                  className="field"
                  style={{ width: 56, fontSize: 12, height: 32 }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleCreateScene}
                  className="btn primary"
                  style={{ height: 28, padding: "0 12px", fontSize: 12 }}
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingScene(false)}
                  className="btn ghost"
                  style={{ height: 28, padding: "0 12px", fontSize: 12 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {scenesWithBeats.length === 0 ? (
            <p className="muted" style={{ fontSize: 12, padding: "4px 0 8px" }}>
              No scenes yet.
            </p>
          ) : (
            <div
              className="scroll"
              style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 260, overflowY: "auto" }}
            >
              {scenesWithBeats.map((scene) => (
                <div key={scene.id}>
                  {/* Scene card */}
                  <div
                    className="group"
                    onClick={() => { setCurrentSceneId(scene.id); setCurrentBeatId(null); }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: currentSceneId === scene.id ? "var(--bg-elev)" : "transparent",
                      boxShadow: currentSceneId === scene.id ? "var(--shadow-1)" : "none",
                      border: "1px solid " + (currentSceneId === scene.id ? "var(--border-strong)" : "transparent"),
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          className="truncate"
                          style={{
                            fontSize: 13,
                            fontWeight: currentSceneId === scene.id ? 500 : 400,
                            color: currentSceneId === scene.id ? "var(--ink)" : "var(--ink-2)",
                          }}
                        >
                          {scene.title}
                        </div>
                        <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                          Act {scene.actNumber} · Sc {scene.sceneNumber}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="hidden gap-1 group-hover:flex" style={{ flexShrink: 0 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddingBeatForScene(scene.id); }}
                            className="rounded p-1 hover:bg-[color:var(--bg-muted)]"
                            title="Add beat"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }}
                            className="rounded p-1 hover:bg-[color:var(--bg-muted)]"
                            title="Delete scene"
                          >
                            <Trash2 className="h-3 w-3" style={{ color: "var(--accent)" }} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add beat inline form */}
                  {addingBeatForScene === scene.id && (
                    <div
                      style={{
                        marginLeft: 12,
                        marginTop: 6,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--bg-elev)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <input
                        autoFocus
                        placeholder="Beat label"
                        value={newBeatLabel}
                        onChange={(e) => setNewBeatLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateBeat(scene.id);
                          if (e.key === "Escape") setAddingBeatForScene(null);
                        }}
                        className="field"
                        style={{ fontSize: 12, height: 30 }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleCreateBeat(scene.id)}
                          className="btn primary"
                          style={{ height: 28, padding: "0 12px", fontSize: 12 }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingBeatForScene(null)}
                          className="btn ghost"
                          style={{ height: 28, padding: "0 12px", fontSize: 12 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Beat list */}
                  <div style={{ marginLeft: 12, marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                    {scene.beats.map((beat) => (
                      <div
                        key={beat.id}
                        className="group"
                        onClick={() => { setCurrentSceneId(scene.id); setCurrentBeatId(beat.id); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "5px 10px",
                          borderRadius: 5,
                          fontSize: 12,
                          cursor: "pointer",
                          background: currentBeatId === beat.id ? "var(--accent-soft)" : "transparent",
                          color: currentBeatId === beat.id ? "var(--accent-ink)" : "var(--ink-3)",
                          fontWeight: currentBeatId === beat.id ? 500 : 400,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                          {beat.label}
                        </div>
                        {canEdit && currentBeatId !== beat.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBeat(beat.id); }}
                            className="hidden group-hover:flex rounded p-1 hover:bg-[color:var(--bg-muted)]"
                          >
                            <Trash2 className="h-3 w-3" style={{ color: "var(--accent)" }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {canEdit && !addingScene && (
            <button
              onClick={() => setAddingScene(true)}
              className="btn ghost"
              style={{ marginTop: 6, height: 28, padding: "0 10px", fontSize: 12, justifyContent: "flex-start", width: "100%" }}
            >
              <Plus className="h-3 w-3" /><span>Add scene</span>
            </button>
          )}
        </div>

        {/* Off-stage cast section — hidden on phone (view-only there) */}
        <div className="bk-mobile-hide" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div className="row-between" style={{ marginBottom: 8, flexShrink: 0 }}>
            <div className="h-eyebrow">Off stage · {offStageCount}</div>
            <span className="muted" style={{ fontSize: 10.5 }}>click to place</span>
          </div>
          <div
            className="scroll"
            style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto", minHeight: 0 }}
          >
            {castMembers.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>No cast assigned.</p>
            ) : (
              castMembers.map((member) => {
                const key = `actor:${member.userId}`;
                const isOnCanvas = !!positions[key];
                const color = actorColors[member.userId];
                const ini =
                  (
                    (member.firstName?.[0] ?? "") +
                    (member.lastName?.[0] ?? "")
                  ).toUpperCase() ||
                  member.email[0]?.toUpperCase() ||
                  "?";

                return (
                  <OffstageActorTile
                    key={member.userId}
                    member={member}
                    color={color}
                    ini={ini}
                    isOnCanvas={isOnCanvas}
                    isDisabled={!canEdit || !currentBeatId}
                    onClickPlace={() => placeOnCanvas("actor", member.userId)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Center: Canvas ─────────────────────────────────── */}
      <div
        className="bk-center"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          padding: "14px 16px",
          gap: 10,
          minWidth: 0,
        }}
      >

        {/* Compact prev/next beat nav — phone-only. Lets the view-only
            mobile user move through beats with a tap (or a swipe on the
            canvas). Hidden on tablet+. */}
        <div className="bk-mobile-only bk-beat-nav">
          <button
            onClick={goToPrevBeat}
            disabled={!hasPrevBeat}
            className="btn ghost"
            style={{
              height: 36,
              padding: "0 10px",
              opacity: hasPrevBeat ? 1 : 0.35,
              cursor: hasPrevBeat ? "pointer" : "default",
            }}
            aria-label="Previous beat"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            {currentScene && currentBeat ? (
              <>
                <div className="muted truncate" style={{ fontSize: 11 }}>
                  {currentScene.title}
                </div>
                <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  {currentBeat.label}
                  {allBeatsFlat.length > 0 && currentBeatIdx >= 0 && (
                    <span className="muted" style={{ fontWeight: 400, fontSize: 11.5, marginLeft: 6 }}>
                      {currentBeatIdx + 1} / {allBeatsFlat.length}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="muted" style={{ fontSize: 12.5 }}>
                {scenesWithBeats.length === 0
                  ? "No scenes yet"
                  : "Select a beat"}
              </div>
            )}
          </div>
          <button
            onClick={goToNextBeat}
            disabled={!hasNextBeat}
            className="btn ghost"
            style={{
              height: 36,
              padding: "0 10px",
              opacity: hasNextBeat ? 1 : 0.35,
              cursor: hasNextBeat ? "pointer" : "default",
            }}
            aria-label="Next beat"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar above canvas — title + edit controls. Hidden on
            phone; the mobile beat nav above replaces the title block
            and edit controls aren't relevant to view-only users. */}
        <div className="row-between bk-mobile-hide">
          {/* min-width: 0 + truncate keeps the subtitle on a single line
              even when the scene/beat text gets long. Without this, a
              long subtitle wraps to 2 lines, the title block grows
              taller, and `align-items: center` shifts the right-side
              button row down — the "padding shift on new beat" the
              user was seeing. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              Stage Blocking
            </div>
            <div className="muted truncate" style={{ fontSize: 12.5, marginTop: 2 }}>
              {currentScene && currentBeat
                ? `${currentScene.title} · ${currentBeat.label} — drag actors to set positions`
                : scenesWithBeats.length === 0
                  ? "Add a scene to begin"
                  : "Select a beat to start blocking"}
            </div>
          </div>
          <div className="row" style={{ gap: 6, flexShrink: 0 }}>
            {selectedActorIds.size > 1 && (
              <div style={{ fontSize: 11.5, color: "var(--accent)", fontWeight: 600, padding: "0 8px", height: 28, display: "flex", alignItems: "center", background: "var(--bg-sunken)", borderRadius: 6, border: "1px solid var(--accent-muted, color-mix(in oklch, var(--accent), transparent 60%))" }}>
                {selectedActorIds.size} actors selected
              </div>
            )}
            {stageConfig?.calibrationX1 != null && (
              <>
                <button
                  onClick={() => setShowSLSR((v) => !v)}
                  className="btn ghost"
                  style={{ height: 28, padding: "0 10px", fontSize: 12, background: showSLSR ? "var(--bg-sunken)" : undefined }}
                  title="Toggle stage left/right grid lines"
                >
                  <span>SL/SR</span>
                </button>
                <button
                  onClick={() => setShowUSDS((v) => !v)}
                  className="btn ghost"
                  style={{ height: 28, padding: "0 10px", fontSize: 12, background: showUSDS ? "var(--bg-sunken)" : undefined }}
                  title="Toggle upstage/downstage grid lines"
                >
                  <span>US/DS</span>
                </button>
              </>
            )}
            <div
              style={{ display: "flex", alignItems: "center", gap: 4 }}
              title="Active layer — only tokens on this layer can be moved"
            >
              <Layers className="h-3.5 w-3.5" style={{ color: "var(--ink-3)", flexShrink: 0 }} />
              <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                <button
                  onClick={() => setActiveLayer("set_pieces")}
                  className="btn ghost"
                  style={{ height: 28, padding: "0 10px", fontSize: 12, borderRadius: 0, borderRight: "1px solid var(--border)", background: activeLayer === "set_pieces" ? "var(--bg-sunken)" : undefined }}
                  title="Set pieces layer — move furniture and props"
                >
                  Set Pieces
                </button>
                <button
                  onClick={() => setActiveLayer("actors")}
                  className="btn ghost"
                  style={{ height: 28, padding: "0 10px", fontSize: 12, borderRadius: 0, background: activeLayer === "actors" ? "var(--bg-sunken)" : undefined }}
                  title="Actors layer — move cast"
                >
                  Actors
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowMovementArrows((v) => !v)}
              className="btn ghost"
              style={{ height: 28, padding: "0 10px", fontSize: 12, background: showMovementArrows ? "var(--bg-sunken)" : undefined }}
              title="Show movement arrows to the next beat"
            >
              <Route className="h-3.5 w-3.5" /><span>Movement</span>
            </button>
            {canEdit && currentBeatId && (
              <button
                onClick={() => {
                  setDrawMode((v) => {
                    if (v) { setArrowStart(null); setArrowPreviewEnd(null); }
                    return !v;
                  });
                }}
                className="btn ghost"
                style={{
                  height: 28, padding: "0 10px", fontSize: 12,
                  background: drawMode ? "var(--accent-soft)" : undefined,
                  color: drawMode ? "var(--accent-ink)" : undefined,
                }}
                title={drawMode
                  ? (arrowStart ? "Click to finish arrow · Esc to cancel" : "Click to start an arrow · Esc to exit")
                  : "Draw custom blocking arrows"}
              >
                <Pencil className="h-3.5 w-3.5" /><span>{drawMode ? (arrowStart ? "Finish…" : "Drawing") : "Draw Arrow"}</span>
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn ghost"
                style={{
                  height: 28,
                  padding: "0 10px",
                  fontSize: 12,
                  opacity: history.length === 0 ? 0.4 : 1,
                  cursor: history.length === 0 ? "default" : "pointer",
                }}
                title={history.length === 0 ? "Nothing to undo" : "Undo last move"}
              >
                <RotateCcw className="h-3.5 w-3.5" /><span>Undo</span>
              </button>
            )}
            {canEdit && currentSceneId && (
              <button
                onClick={handleCaptureBeat}
                className="btn primary"
                style={{
                  height: 28,
                  padding: "0 14px",
                  fontSize: 12,
                  gap: 8,
                }}
                title="Save current positions as a beat and advance to the next one"
              >
                <Aperture className="h-3.5 w-3.5" /><span>Capture Beat</span>
              </button>
            )}
            <button
              onClick={handleExportPng}
              className="btn ghost"
              style={{ height: 28, padding: "0 10px", fontSize: 12 }}
              title="Export current beat as PNG"
            >
              <Download className="h-3.5 w-3.5" /><span>Export</span>
            </button>
            {canEdit && (
              <button
                onClick={() =>
                  router.push(
                    embedded
                      ? `/focus/${production.slug}?mode=blocking&view=setup`
                      : `/productions/${production.slug}/blocking/setup`,
                  )
                }
                className="btn ghost"
                style={{ height: 28, padding: "0 10px", fontSize: 12 }}
              >
                <Settings className="h-3.5 w-3.5" /><span>Stage Setup</span>
              </button>
            )}
            {!embedded && (
              <button
                onClick={() => setFullscreen((v) => !v)}
                className="btn ghost"
                style={{ height: 28, padding: "0 10px", fontSize: 12 }}
                title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
              >
                {fullscreen
                  ? <Minimize2 className="h-3.5 w-3.5" />
                  : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Canvas card */}
          <div
            className="card"
            style={{
              flex: 1,
              minHeight: 0,
              padding: 0,
              position: "relative",
              overflow: "hidden",
              background: (pdfUrl || groundPlanImageUrl) ? "rgb(23,23,23)" : undefined,
            }}
          >
            <div
              ref={canvasContainerRef}
              className="absolute inset-0"
              style={drawMode ? { cursor: "crosshair" } : undefined}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
            >
              {groundPlanImageUrl ? (
                // Rasterized at setup — works on phone, no pdf.js needed.
                // Stretch to fill the container exactly the way the canvas
                // did; the position dots are percent-of-container, so any
                // letterboxing would offset them from the floor plan.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={groundPlanImageUrl}
                  alt="Ground plan"
                  className="absolute inset-0 h-full w-full"
                  style={{
                    zIndex: 1,
                    objectFit: "fill",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                  draggable={false}
                />
              ) : pdfUrl ? (
                <canvas
                  ref={pdfCanvasRef}
                  className="absolute inset-0 h-full w-full"
                  style={{ zIndex: 1 }}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, oklch(0.96 0.015 60) 0%, oklch(0.94 0.02 60) 100%)",
                  }}
                >
                  <svg
                    viewBox="0 0 800 500"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                  >
                    <defs>
                      <pattern id="stage-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.85 0.01 60)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="800" height="500" fill="url(#stage-grid)" />
                    <rect x="20" y="20" width="760" height="440" fill="none" stroke="oklch(0.55 0.16 25)" strokeWidth="2" strokeDasharray="4 6" rx="4" />
                    <line x1="400" y1="20" x2="400" y2="460" stroke="oklch(0.78 0.01 60)" strokeWidth="1" strokeDasharray="2 4" />
                    <path d="M 60 460 Q 400 510 740 460" fill="oklch(0.92 0.018 60)" stroke="oklch(0.7 0.01 60)" strokeWidth="1" />
                  </svg>
                  <div style={{ position: "absolute", top: 6, left: 8, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase" }}>Upstage</div>
                  <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase" }}>Downstage / Audience</div>
                  <div style={{ position: "absolute", top: "50%", left: 6, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Stage Right</div>
                  <div style={{ position: "absolute", top: "50%", right: 6, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase", writingMode: "vertical-rl" }}>Stage Left</div>
                </div>
              )}

              {pdfUrl && !pdfLoaded && !isPhone && !groundPlanImageUrl && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    zIndex: 30,
                    pointerEvents: "none",
                    color: "white",
                  }}
                >
                  <div className="pdf-spinner" aria-hidden />
                </div>
              )}

              {pdfUrl && isPhone && !groundPlanImageUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 30,
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "var(--bg-elev)",
                    border: "1px solid var(--border)",
                    color: "var(--ink-2)",
                    fontSize: 11.5,
                    fontWeight: 500,
                    textDecoration: "none",
                    boxShadow: "var(--shadow-1)",
                  }}
                >
                  View floor plan
                </a>
              )}

              {stageConfig && (
                <NumberGridOverlay
                  stageConfig={stageConfig}
                  showSLSR={showSLSR}
                  showUSDS={showUSDS}
                />
              )}

              {/* Lasso selection rectangle */}
              {lassoStart && lassoEnd && (Math.abs(lassoEnd.x - lassoStart.x) > 0.5 || Math.abs(lassoEnd.y - lassoStart.y) > 0.5) && (
                <div
                  style={{
                    position: "absolute",
                    left: `${Math.min(lassoStart.x, lassoEnd.x)}%`,
                    top: `${Math.min(lassoStart.y, lassoEnd.y)}%`,
                    width: `${Math.abs(lassoEnd.x - lassoStart.x)}%`,
                    height: `${Math.abs(lassoEnd.y - lassoStart.y)}%`,
                    border: "1.5px dashed var(--accent)",
                    background: "oklch(0.6 0.18 270 / 0.07)",
                    pointerEvents: "none",
                    zIndex: 25,
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Auto movement arrows — straight lines, circle edge → circle edge */}
              {(() => {
                const RADIUS = 2.2;
                const showAuto = showMovementArrows && nextBeatPositions && currentBeatId;
                const showCustom = currentBeatId && (customArrows.length > 0 || (drawMode && arrowStart));
                if (!showAuto && !showCustom) return null;
                return (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 15,
                      overflow: "visible",
                    }}
                  >
                    <defs>
                      {/* Per-actor markers for auto-arrows */}
                      {showAuto && castMembers.map((member) => {
                        const color = actorColors[member.userId];
                        return (
                          <marker
                            key={`auto-${member.userId}`}
                            id={`auto-arrow-${member.userId}`}
                            markerWidth="3.5"
                            markerHeight="3.5"
                            refX="3"
                            refY="1.75"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                          >
                            <path d="M0,0 L0,3.5 L3.5,1.75 z" fill={color} opacity="0.85" />
                          </marker>
                        );
                      })}
                      {/* Shared marker for custom arrows — per unique color */}
                      {[...new Set(customArrows.map((a) => a.color))].map((color) => (
                        <marker
                          key={`custom-${color}`}
                          id={`custom-arrow-${color.replace("#", "")}`}
                          markerWidth="4"
                          markerHeight="4"
                          refX="3.5"
                          refY="2"
                          orient="auto"
                          markerUnits="userSpaceOnUse"
                        >
                          <path d="M0,0 L0,4 L4,2 z" fill={color} />
                        </marker>
                      ))}
                      {/* Preview marker */}
                      {drawMode && arrowStart && (
                        <marker id="preview-arrow" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto" markerUnits="userSpaceOnUse">
                          <path d="M0,0 L0,4 L4,2 z" fill="#374151" opacity="0.5" />
                        </marker>
                      )}
                    </defs>

                    {/* Auto arrows */}
                    {showAuto && castMembers.map((member) => {
                      const key = `actor:${member.userId}`;
                      const from = positions[key];
                      const to = nextBeatPositions![key];
                      if (!from || !to) return null;
                      const dx = to.xPercent - from.xPercent;
                      const dy = to.yPercent - from.yPercent;
                      const len = Math.hypot(dx, dy);
                      if (len < 3) return null;
                      const color = actorColors[member.userId];
                      const nx = dx / len;
                      const ny = dy / len;
                      const startX = from.xPercent + nx * RADIUS;
                      const startY = from.yPercent + ny * RADIUS;
                      const endX = to.xPercent - nx * (RADIUS + 0.8);
                      const endY = to.yPercent - ny * (RADIUS + 0.8);
                      return (
                        <path
                          key={member.userId}
                          d={`M ${startX} ${startY} L ${endX} ${endY}`}
                          stroke={color}
                          strokeWidth="0.35"
                          fill="none"
                          opacity="0.75"
                          markerEnd={`url(#auto-arrow-${member.userId})`}
                        />
                      );
                    })}

                    {/* Custom arrows */}
                    {customArrows.map((arrow) => {
                      const dx = arrow.toX - arrow.fromX;
                      const dy = arrow.toY - arrow.fromY;
                      const len = Math.hypot(dx, dy);
                      if (len < 1) return null;
                      const nx = dx / len;
                      const ny = dy / len;
                      const startX = arrow.fromX + nx * RADIUS;
                      const startY = arrow.fromY + ny * RADIUS;
                      const endX = arrow.toX - nx * (RADIUS + 0.8);
                      const endY = arrow.toY - ny * (RADIUS + 0.8);
                      const midX = (startX + endX) / 2;
                      const midY = (startY + endY) / 2;
                      const isHovered = hoveredArrowId === arrow.id;
                      return (
                        <g key={arrow.id}>
                          {/* Wide invisible hit area */}
                          <path
                            d={`M ${startX} ${startY} L ${endX} ${endY}`}
                            stroke="transparent"
                            strokeWidth="2.5"
                            fill="none"
                            style={{ cursor: canEdit ? "pointer" : "default", pointerEvents: "auto" }}
                            onMouseEnter={() => setHoveredArrowId(arrow.id)}
                            onMouseLeave={() => setHoveredArrowId(null)}
                          />
                          {/* Visible arrow */}
                          <path
                            d={`M ${startX} ${startY} L ${endX} ${endY}`}
                            stroke={arrow.color}
                            strokeWidth="0.45"
                            fill="none"
                            opacity={isHovered ? 1 : 0.88}
                            markerEnd={`url(#custom-arrow-${arrow.color.replace("#", "")})`}
                          />
                          {/* Delete button at midpoint (editor only, on hover) */}
                          {canEdit && isHovered && (
                            <g
                              transform={`translate(${midX},${midY})`}
                              style={{ cursor: "pointer", pointerEvents: "auto" }}
                              onClick={() => handleDeleteArrow(arrow.id)}
                              onMouseEnter={() => setHoveredArrowId(arrow.id)}
                              onMouseLeave={() => setHoveredArrowId(null)}
                            >
                              <circle r="1.6" fill="#ef4444" />
                              <line x1="-0.8" y1="-0.8" x2="0.8" y2="0.8" stroke="white" strokeWidth="0.5" />
                              <line x1="0.8" y1="-0.8" x2="-0.8" y2="0.8" stroke="white" strokeWidth="0.5" />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Draw preview */}
                    {drawMode && arrowStart && arrowPreviewEnd && (() => {
                      const dx = arrowPreviewEnd.x - arrowStart.x;
                      const dy = arrowPreviewEnd.y - arrowStart.y;
                      const len = Math.hypot(dx, dy);
                      return (
                        <>
                          <circle cx={arrowStart.x} cy={arrowStart.y} r="1.2" fill="#374151" opacity="0.5" />
                          {len > 1 && (
                            <path
                              d={`M ${arrowStart.x} ${arrowStart.y} L ${arrowPreviewEnd.x} ${arrowPreviewEnd.y}`}
                              stroke="#374151"
                              strokeWidth="0.4"
                              fill="none"
                              opacity="0.45"
                              strokeDasharray="1.5 1"
                              markerEnd="url(#preview-arrow)"
                            />
                          )}
                        </>
                      );
                    })()}
                  </svg>
                );
              })()}

              {/* Actor tokens */}
              {currentBeatId &&
                castMembers.map((member) => {
                  const key = `actor:${member.userId}`;
                  const pos = positions[key];
                  if (!pos) return null;
                  const ini =
                    (
                      (member.firstName?.[0] ?? "") +
                      (member.lastName?.[0] ?? "")
                    ).toUpperCase() ||
                    member.email[0]?.toUpperCase() ||
                    "?";
                  const lbl =
                    member.characterName ??
                    (member.firstName || member.lastName
                      ? `${member.firstName} ${member.lastName}`.trim()
                      : member.email);
                  const isSelected = selectedActorIds.has(key);
                  const isGroupFollower = isSelected && activeId !== null && activeId !== key && selectedActorIds.has(activeId);
                  return (
                    <ActorToken
                      key={key}
                      id={key}
                      initials={ini}
                      label={lbl}
                      color={actorColors[member.userId]}
                      xPercent={pos.xPercent}
                      yPercent={pos.yPercent}
                      canEdit={canEdit}
                      isInteractive={!drawMode && activeLayer === "actors"}
                      isSelected={isSelected}
                      groupDragDelta={isGroupFollower ? activeDragDelta : null}
                      onRemove={() => removeFromCanvas("actor", member.userId)}
                      onSelect={(e) => {
                        if (!canEdit) return;
                        e.stopPropagation();
                        setSelectedActorIds((prev) => {
                          if (e.shiftKey) {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          }
                          return new Set([key]);
                        });
                      }}
                    />
                  );
                })}

              {/* Set piece tokens (built-in + custom) */}
              {currentBeatId &&
                allPieces.map((piece) => {
                  const key = `set_piece:${piece.key}`;
                  const pos = positions[key];
                  if (!pos) return null;
                  return (
                    <SetPieceToken
                      key={key}
                      id={key}
                      label={piece.label}
                      svgPath={piece.svgPath}
                      imageUrl={piece.imageUrl}
                      xPercent={pos.xPercent}
                      yPercent={pos.yPercent}
                      rotation={pos.rotation}
                      canEdit={canEdit}
                      isInteractive={!drawMode && activeLayer === "set_pieces"}
                      onRemove={() => removeFromCanvas("set_piece", piece.key)}
                      onRotateTo={(angle, save) => handleRotateSetPiece(piece.key, angle, save)}
                    />
                  );
                })}

              {!currentBeatId && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--ink-4)",
                    fontSize: 13,
                    pointerEvents: "none",
                  }}
                >
                  {scenesWithBeats.length === 0
                    ? "Add a scene and beat to begin"
                    : "Select a beat to start blocking"}
                </div>
              )}
            </div>
          </div>
        {/* PDF multi-page controls (live PDF render path only — the
            rasterized image is a single chosen page) */}
        {pdfUrl && !groundPlanImageUrl && numPdfPages > 1 && (
          <div className="row justify-center" style={{ gap: 8, fontSize: 12, color: "var(--ink-2)" }}>
            <button
              onClick={() => setCurrentPdfPage((p) => Math.max(1, p - 1))}
              disabled={currentPdfPage <= 1}
              className="btn ghost"
              style={{ height: 28, padding: "0 8px" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>Page {currentPdfPage} of {numPdfPages}</span>
            <button
              onClick={() => setCurrentPdfPage((p) => Math.min(numPdfPages, p + 1))}
              disabled={currentPdfPage >= numPdfPages}
              className="btn ghost"
              style={{ height: 28, padding: "0 8px" }}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="row" style={{ gap: 14, fontSize: 11.5, color: "var(--ink-3)", padding: "0 4px" }}>
          <span className="row" style={{ gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--c-clay)", display: "inline-block" }} />
            Actor
          </span>
          <span className="row" style={{ gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.9)", border: "1px solid #374151", display: "inline-block" }} />
            Set piece
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11 }}>
            Click a tile to place · drag to reposition
          </span>
        </div>
      </div>

      {/* ─── Right panel: Set Pieces & Beat Comments ─────────── */}
      <div
        className="bk-side-right"
        style={{
          height: "100%",
          padding: "14px 12px 14px 0",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Set Pieces — collapsible; hidden on phone (view-only there) */}
        <div className="bk-mobile-hide" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setSetPiecesOpen((v) => !v)}
            className="row-between"
            style={{
              width: "100%",
              padding: "13px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <div className="h-card">Set Pieces</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>click to place on stage</div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: "var(--ink-3)",
                flexShrink: 0,
                transform: setPiecesOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.15s",
              }}
            />
          </button>
          {setPiecesOpen && (
            <div className="scroll overflow-y-auto" style={{ padding: "0 12px 10px", maxHeight: 260 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SET_PIECES.map((piece) => {
                  const key = `set_piece:${piece.key}`;
                  const isOnCanvas = !!positions[key];
                  return (
                    <OffstageSetPieceTile
                      key={piece.key}
                      piece={piece}
                      isOnCanvas={isOnCanvas}
                      isDisabled={!canEdit || !currentBeatId}
                      onClickPlace={() => placeOnCanvas("set_piece", piece.key)}
                    />
                  );
                })}

                {/* Custom uploaded pieces */}
                {customPieces.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 6 }}>
                    <div className="h-eyebrow" style={{ marginBottom: 6, paddingLeft: 2 }}>Custom</div>
                    {customPieces.map((piece) => {
                      const key = `set_piece:${piece.id}`;
                      const isOnCanvas = !!positions[key];
                      return (
                        <OffstageSetPieceTile
                          key={piece.id}
                          piece={{ key: piece.id, label: piece.name, imageUrl: piece.imageUrl }}
                          isOnCanvas={isOnCanvas}
                          isDisabled={!canEdit || !currentBeatId}
                          onClickPlace={() => placeOnCanvas("set_piece", piece.id)}
                          canDelete={canEdit}
                          onDelete={() => handleDeleteCustomPiece(piece.id)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Upload button */}
                {canEdit && (
                  <div style={{ marginTop: customPieces.length > 0 ? 4 : 6 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                      style={{ display: "none" }}
                      onChange={handleUploadPiece}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn ghost"
                      style={{ width: "100%", height: 28, fontSize: 12, justifyContent: "flex-start" }}
                    >
                      <Plus className="h-3 w-3" />
                      <span>{uploading ? "Uploading…" : "Upload custom piece"}</span>
                    </button>
                    {uploadError && (
                      <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, padding: "0 2px" }}>
                        {uploadError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Beat Notes — collapsible */}
        <div style={{ borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", flexDirection: "column", minHeight: notesOpen ? 120 : 0, maxHeight: notesOpen ? 280 : undefined }}>
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className="row-between"
            style={{
              width: "100%",
              padding: "13px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              flexShrink: 0,
            }}
          >
            <div>
              <div className="h-card">Beat Notes</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>notes for this beat</div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: "var(--ink-3)",
                flexShrink: 0,
                transform: notesOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.15s",
              }}
            />
          </button>
          {notesOpen && (
            currentBeatId ? (
              <BeatNotesSection
                key={currentBeatId}
                beatId={currentBeatId}
                initialContent={beatNotesMap[currentBeatId] ?? ""}
                canEdit={canEdit}
                onSave={handleSaveBeatNotes}
              />
            ) : (
              <p className="muted" style={{ fontSize: 12, padding: "0 16px 12px" }}>
                Select a beat to see notes.
              </p>
            )
          )}
        </div>

        {/* Beat Comments — collapsible */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setCommentsOpen((v) => !v)}
            className="row-between"
            style={{
              width: "100%",
              padding: "13px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <div className="h-card">Beat Comments</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>comments for this beat</div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: "var(--ink-3)",
                flexShrink: 0,
                transform: commentsOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.15s",
              }}
            />
          </button>
        </div>
        {commentsOpen && (
          <BeatCommentSection
            beatId={currentBeatId}
            currentUserId={currentUserId}
            productionMembers={productionMembers}
            canModerate={canEdit}
          />
        )}
      </div>
      </div>
    </div>

    {/* Drag ghost — centered on cursor, minimal avatar/icon only */}
    <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
      {(() => {
        if (!activeId) return null;

        if (activeId.startsWith("offstage:")) {
          const userId = activeId.replace("offstage:", "");
          const member = castMembers.find((m) => m.userId === userId);
          if (!member) return null;
          const color = actorColors[member.userId];
          const ini =
            ((member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "")).toUpperCase() ||
            member.email[0]?.toUpperCase() || "?";
          return (
            <div
              className="avatar"
              style={{
                width: 38,
                height: 38,
                fontSize: 13,
                background: color,
                outline: "2px solid var(--accent)",
                outlineOffset: 2,
                pointerEvents: "none",
                opacity: 0.9,
              }}
            >
              {ini}
            </div>
          );
        }

        if (activeId.startsWith("offstage-piece:")) {
          const key = activeId.replace("offstage-piece:", "");
          const piece = allPieces.find((p) => p.key === key);
          if (!piece) return null;
          return (
            <div
              style={{
                width: 56,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: "var(--bg-elev)",
                outline: "2px solid var(--accent)",
                outlineOffset: 2,
                boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                pointerEvents: "none",
                opacity: 0.9,
              }}
            >
              {piece.imageUrl ? (
                <img src={piece.imageUrl} alt={piece.label} style={{ maxWidth: 40, maxHeight: 32, objectFit: "contain" }} />
              ) : (
                <svg viewBox="0 0 80 60" width={36} height={27}>
                  <path
                    d={piece.svgPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          );
        }

        return null;
      })()}
    </DragOverlay>
    </DndContext>
  );
}
