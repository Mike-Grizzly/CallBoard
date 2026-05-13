"use client";

import {
  useRef,
  useState,
  useEffect,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Settings, Plus, Trash2, ChevronRight, ChevronDown, RotateCcw, Aperture, Download, RotateCw, ChevronLeft, MessageSquare, X } from "lucide-react";
import { BeatCommentSection } from "@/components/blocking/beat-comment-section";
import type { ProductionMember } from "@/features/members/queries";
import {
  saveBlockingPosition,
  removeBlockingPosition,
  fetchBeatPositions,
} from "@/features/blocking/actions";
import {
  createScene,
  createBeat,
  deleteScene,
  deleteBeat,
  captureNextBeat,
} from "@/features/scenes/actions";
import { SET_PIECES, ACTOR_COLORS } from "@/features/blocking/constants";
import type { StageConfiguration, BlockingPosition } from "@/db/schema";
import type { SceneWithBeats } from "@/features/scenes/queries";
import type { CastMember } from "@/features/blocking/queries";

type Position = {
  xPercent: number;
  yPercent: number;
  rotation: number;
};

type PositionMap = Record<string, Position>;

type Props = {
  production: { id: string; title: string; slug: string };
  stageConfig: StageConfiguration | null;
  scenesWithBeats: SceneWithBeats[];
  castMembers: CastMember[];
  productionMembers: ProductionMember[];
  pdfUrl: string | null;
  canEdit: boolean;
  currentUserId: string;
  initialBeatId: string | null;
  initialPositions: Pick<BlockingPosition, "entityType" | "entityId" | "xPercent" | "yPercent" | "rotation">[];
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
  onRemove,
}: {
  id: string;
  initials: string;
  label: string;
  color: string;
  xPercent: number;
  yPercent: number;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !canEdit });

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${xPercent}%`,
    top: `${yPercent}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 20,
    cursor: canEdit ? (isDragging ? "grabbing" : "grab") : "default",
    userSelect: "none",
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit ? listeners : {})}
      {...(canEdit ? attributes : {})}
      className="group -translate-x-1/2 -translate-y-1/2"
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
          className="avatar"
          style={{
            width: 38,
            height: 38,
            fontSize: 13,
            fontWeight: 600,
            background: color,
            color: "white",
            boxShadow: isDragging
              ? "0 0 0 3px var(--accent), 0 4px 12px rgba(0,0,0,.18)"
              : "0 2px 6px rgba(0,0,0,.18)",
            border: "2px solid white",
          }}
        >
          {initials}
        </div>
        {label && (
          <div
            style={{
              marginTop: 2,
              whiteSpace: "nowrap",
              fontSize: 10.5,
              fontWeight: 500,
              color: "var(--ink)",
              background: "rgba(255,255,255,.85)",
              backdropFilter: "blur(4px)",
              padding: "1px 6px",
              borderRadius: 3,
              maxWidth: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
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
  xPercent,
  yPercent,
  rotation,
  canEdit,
  onRemove,
  onRotateTo,
}: {
  id: string;
  label: string;
  svgPath: string;
  xPercent: number;
  yPercent: number;
  rotation: number;
  canEdit: boolean;
  onRemove: () => void;
  onRotateTo: (angle: number, save: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !canEdit });
  const svgWrapRef = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${xPercent}%`,
    top: `${yPercent}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 20,
    cursor: canEdit ? (isDragging ? "grabbing" : "grab") : "default",
    userSelect: "none",
    touchAction: "none",
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
          <svg
            viewBox="0 0 80 60"
            width={64}
            height={48}
            className="rounded border border-[color:var(--border)] bg-white/90 shadow-sm"
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
}: {
  piece: { key: string; label: string; svgPath: string };
  isOnCanvas: boolean;
  isDisabled: boolean;
  onClickPlace: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `offstage-piece:${piece.key}`,
    disabled: isDisabled || isOnCanvas,
  });

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
      <span className="truncate" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-2)" }}>
        {piece.label}
      </span>
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
    stageDepthFt,
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
  const halfWidthFt = Math.ceil(prosceniumWidthFt / 2);
  const depthLines = Math.floor(stageDepthFt / 2);

  const ticks: { x: number; ft: number; isMajor: boolean }[] = [];
  for (let ft = -halfWidthFt; ft <= halfWidthFt; ft += 2) {
    const x = centerX + ft * footPercent;
    if (x >= 0 && x <= 100) {
      ticks.push({ x, ft, isMajor: ft % 10 === 0 });
    }
  }

  const depthTicks: { y: number; ft: number }[] = [];
  for (let i = 1; i <= depthLines; i++) {
    const y = centerY - i * 2 * footPercent;
    if (y >= 0 && y <= 100) {
      depthTicks.push({ y, ft: i * 2 });
    }
  }

  const minorTickH = 1.5;
  const majorTickH = 2.8;
  const labelY = centerY + 4.2;
  const gridColor = "rgba(30,64,175,0.45)";
  const gridShadow = "rgba(255,255,255,0.55)";

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 2 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {showSLSR && ticks.map(({ x }) => (
        <g key={`slsr-${x}`}>
          <line x1={x} y1={0} x2={x} y2={100} stroke={gridShadow} strokeWidth="0.4" strokeDasharray="3 3" />
          <line x1={x} y1={0} x2={x} y2={100} stroke={gridColor} strokeWidth="0.25" strokeDasharray="3 3" />
        </g>
      ))}

      {showUSDS && depthTicks.map(({ y, ft }) => (
        <g key={`usds-${y}`}>
          <line x1={calibrationX1!} y1={y} x2={calibrationX2!} y2={y} stroke={gridShadow} strokeWidth="0.4" strokeDasharray="3 3" />
          <line x1={calibrationX1!} y1={y} x2={calibrationX2!} y2={y} stroke={gridColor} strokeWidth="0.25" strokeDasharray="3 3" />
          <text
            x={calibrationX1! - 2.5} y={y + 0.8}
            textAnchor="end" fontSize="1.8" fill="rgba(30,64,175,0.9)"
            stroke="white" strokeWidth="2.5" paintOrder="stroke"
            style={{ pointerEvents: "none" }}>
            {ft}&apos;
          </text>
        </g>
      ))}

      <line x1={calibrationX1!} y1={centerY} x2={calibrationX2!} y2={centerY}
        stroke="rgba(255,255,255,0.7)" strokeWidth="0.6" />
      <line x1={calibrationX1!} y1={centerY} x2={calibrationX2!} y2={centerY}
        stroke="rgba(30,64,175,0.8)" strokeWidth="0.35" />

      {ticks.map(({ x, ft, isMajor }) => {
        const tickH = isMajor ? majorTickH : minorTickH;
        const showLabel = ft % 5 === 0;
        const label = ft === 0 ? "0" : `${Math.abs(ft)}'`;
        return (
          <g key={`tick-${x}`}>
            <line x1={x} y1={centerY} x2={x} y2={centerY - tickH}
              stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
            <line x1={x} y1={centerY} x2={x} y2={centerY - tickH}
              stroke="rgba(30,64,175,0.85)" strokeWidth="0.3" />
            {showLabel && (
              <text x={x} y={labelY} textAnchor="middle" fontSize="1.8"
                fill="rgba(30,64,175,0.9)"
                stroke="white" strokeWidth="2.5" paintOrder="stroke"
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
  canEdit,
  currentUserId,
  initialBeatId,
  initialPositions,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

  const [currentBeatId, setCurrentBeatId] = useState<string | null>(initialBeatId);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(
    scenesWithBeats[0]?.id ?? null,
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
      setHistory([]);
      return;
    }
    fetchBeatPositions(currentBeatId).then((rows) => {
      setPositions(positionRowsToMap(rows));
      setHistory([]);
    });
  }, [currentBeatId]);

  const groundPlanPage = stageConfig?.groundPlanPage ?? 1;
  const [currentPdfPage, setCurrentPdfPage] = useState(groundPlanPage);
  const [numPdfPages, setNumPdfPages] = useState(1);

  useEffect(() => {
    if (!pdfUrl || !pdfCanvasRef.current) return;
    let cancelled = false;
    async function render() {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const pdf = await pdfjsLib.getDocument(pdfUrl!).promise;
      if (cancelled) return;
      setNumPdfPages(pdf.numPages);
      const page = await pdf.getPage(currentPdfPage);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = pdfCanvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      if (!cancelled) setPdfLoaded(true);
    }
    render().catch(() => setPdfLoaded(false));
    return () => { cancelled = true; };
  }, [pdfUrl, currentPdfPage]);

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
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, delta } = event;
    const id = active.id as string;

    // Off-stage actor dragged onto canvas
    if (id.startsWith("offstage:")) {
      if (!canEdit || !currentBeatId) return;
      const entityId = id.replace("offstage:", "");
      const container = canvasContainerRef.current;
      if (!container) return;
      const translated = active.rect.current.translated;
      if (!translated) return;
      const containerRect = container.getBoundingClientRect();
      const centerX = translated.left + translated.width / 2;
      const centerY = translated.top + translated.height / 2;
      const xPercent = ((centerX - containerRect.left) / containerRect.width) * 100;
      const yPercent = ((centerY - containerRect.top) / containerRect.height) * 100;
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
      const translated = active.rect.current.translated;
      if (!translated) return;
      const containerRect = container.getBoundingClientRect();
      const centerX = translated.left + translated.width / 2;
      const centerY = translated.top + translated.height / 2;
      const xPercent = ((centerX - containerRect.left) / containerRect.width) * 100;
      const yPercent = ((centerY - containerRect.top) / containerRect.height) * 100;
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

    const newX = Math.max(
      2,
      Math.min(98, current.xPercent + (delta.x / rect.width) * 100),
    );
    const newY = Math.max(
      2,
      Math.min(98, current.yPercent + (delta.y / rect.height) * 100),
    );

    pushHistory(positions);
    const updated = {
      ...positions,
      [id]: { ...current, xPercent: newX, yPercent: newY },
    };
    setPositions(updated);

    const [entityType, entityId] = id.split(":") as [
      "actor" | "set_piece",
      string,
    ];
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

  const actorColors: Record<string, string> = {};
  castMembers.forEach((m, i) => {
    actorColors[m.userId] = ACTOR_COLORS[i % ACTOR_COLORS.length];
  });

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
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div
      className="anim-in"
      style={{ display: "grid", gridTemplateColumns: "248px 1fr 264px", gap: 16, maxWidth: 1400, margin: "0 auto" }}
    >

      {/* ─── Left panel: Scenes & Off-stage Cast ────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Scenes section */}
        <div>
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
              style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 380, overflowY: "auto" }}
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

        {/* Off-stage cast section */}
        <div>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <div className="h-eyebrow">Off stage · {offStageCount}</div>
            <span className="muted" style={{ fontSize: 10.5 }}>click to place</span>
          </div>
          <div
            className="scroll"
            style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

        {/* Toolbar above canvas */}
        <div className="row-between">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              Stage Blocking
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {currentScene && currentBeat
                ? `${currentScene.title} · ${currentBeat.label} — drag actors to set positions`
                : scenesWithBeats.length === 0
                  ? "Add a scene to begin"
                  : "Select a beat to start blocking"}
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
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
            {canEdit && history.length > 0 && (
              <button
                onClick={handleUndo}
                className="btn ghost"
                style={{ height: 28, padding: "0 10px", fontSize: 12 }}
                title="Undo last move"
              >
                <RotateCcw className="h-3.5 w-3.5" /><span>Undo</span>
              </button>
            )}
            {canEdit && currentSceneId && (
              <button
                onClick={handleCaptureBeat}
                className="btn primary"
                style={{ height: 28, padding: "0 12px", fontSize: 12 }}
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
                onClick={() => router.push(`/productions/${production.slug}/blocking/setup`)}
                className="btn ghost"
                style={{ height: 28, padding: "0 10px", fontSize: 12 }}
              >
                <Settings className="h-3.5 w-3.5" /><span>Stage Setup</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas card */}
          <div
            className="card"
            style={{
              padding: 0,
              position: "relative",
              overflow: "hidden",
              aspectRatio: "4 / 3",
              background: pdfUrl ? "rgb(23,23,23)" : undefined,
            }}
          >
            <div ref={canvasContainerRef} className="absolute inset-0">
              {pdfUrl ? (
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

              {stageConfig && (
                <NumberGridOverlay
                  stageConfig={stageConfig}
                  showSLSR={showSLSR}
                  showUSDS={showUSDS}
                />
              )}

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
                      onRemove={() => removeFromCanvas("actor", member.userId)}
                    />
                  );
                })}

              {/* Set piece tokens */}
              {currentBeatId &&
                SET_PIECES.map((piece) => {
                  const key = `set_piece:${piece.key}`;
                  const pos = positions[key];
                  if (!pos) return null;
                  return (
                    <SetPieceToken
                      key={key}
                      id={key}
                      label={piece.label}
                      svgPath={piece.svgPath}
                      xPercent={pos.xPercent}
                      yPercent={pos.yPercent}
                      rotation={pos.rotation}
                      canEdit={canEdit}
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
        {/* PDF multi-page controls */}
        {pdfUrl && numPdfPages > 1 && (
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
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "sticky",
          top: 16,
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        {/* Set Pieces — collapsible */}
        <div style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
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
            <div className="scroll overflow-y-auto" style={{ padding: "0 12px 10px", maxHeight: 220 }}>
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
              </div>
            </div>
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
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div className="h-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare className="h-3 w-3" style={{ color: "var(--ink-3)" }} />
              Beat Comments
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
          const piece = SET_PIECES.find((p) => p.key === key);
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
            </div>
          );
        }

        return null;
      })()}
    </DragOverlay>
    </DndContext>
  );
}
