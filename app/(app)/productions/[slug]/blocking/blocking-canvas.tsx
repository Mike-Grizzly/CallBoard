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
  useDraggable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Settings, Plus, Trash2, ChevronRight, RotateCcw, Aperture, Download, RotateCw, ChevronLeft, MessageSquare } from "lucide-react";
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
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
            style={{ fontSize: 10 }}
          >
            ×
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
  onRotate,
}: {
  id: string;
  label: string;
  svgPath: string;
  xPercent: number;
  yPercent: number;
  rotation: number;
  canEdit: boolean;
  onRemove: () => void;
  onRotate: (delta: number) => void;
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
      <div className="relative">
        {canEdit && (
          <>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
              style={{ fontSize: 10 }}
            >
              ×
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRotate(-15);
              }}
              className="absolute -left-5 top-1/2 -translate-y-1/2 hidden h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-white group-hover:flex"
              title="Rotate -15°"
            >
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRotate(15);
              }}
              className="absolute -right-5 top-1/2 -translate-y-1/2 hidden h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-white group-hover:flex"
              title="Rotate +15°"
            >
              <RotateCw className="h-2.5 w-2.5" />
            </button>
          </>
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

  function handleDragEnd(event: DragEndEvent) {
    if (!canEdit || !currentBeatId) return;
    const { active, delta } = event;
    if (!delta.x && !delta.y) return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const id = active.id as string;
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

  function handleRotateSetPiece(entityId: string, delta: number) {
    if (!canEdit || !currentBeatId) return;
    const key = `set_piece:${entityId}`;
    const current = positions[key];
    if (!current) return;
    const newRotation = (current.rotation + delta + 360) % 360;
    pushHistory(positions);
    const updated = { ...positions, [key]: { ...current, rotation: newRotation } };
    setPositions(updated);
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
    <div className="anim-in -m-6 md:-m-8 flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ─── Left panel: Scenes & Beats ─────────────────────── */}
      <div
        className="flex flex-col border-r border-[color:var(--border)]"
        style={{ width: 260, background: "var(--bg)", flexShrink: 0 }}
      >
        <div className="row-between border-b border-[color:var(--border)] px-3 py-2.5">
          <div className="h-eyebrow">Scenes</div>
          {canEdit && (
            <button
              onClick={() => setAddingScene(true)}
              className="btn ghost"
              style={{ height: 24, padding: "0 8px", fontSize: 11 }}
              title="Add scene"
            >
              <Plus className="h-3 w-3" /><span>Add</span>
            </button>
          )}
        </div>

        <div className="scroll flex-1 overflow-y-auto p-2">
          {addingScene && (
            <div
              className="mb-2 space-y-1 rounded border border-[color:var(--border)] p-2"
              style={{ background: "var(--bg-elev)" }}
            >
              <input
                autoFocus
                placeholder="Scene title"
                value={newSceneTitle}
                onChange={(e) => setNewSceneTitle(e.target.value)}
                className="field"
                style={{ fontSize: 12, height: 30 }}
              />
              <div className="flex gap-1">
                <input
                  placeholder="Act"
                  value={newSceneAct}
                  onChange={(e) => setNewSceneAct(e.target.value)}
                  className="field"
                  style={{ width: 52, fontSize: 12, height: 30 }}
                />
                <input
                  placeholder="Scene"
                  value={newSceneNum}
                  onChange={(e) => setNewSceneNum(e.target.value)}
                  className="field"
                  style={{ width: 52, fontSize: 12, height: 30 }}
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleCreateScene}
                  className="btn primary"
                  style={{ height: 26, padding: "0 10px", fontSize: 12 }}
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingScene(false)}
                  className="btn ghost"
                  style={{ height: 26, padding: "0 10px", fontSize: 12 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {scenesWithBeats.length === 0 ? (
            <p className="muted px-2 py-3" style={{ fontSize: 12 }}>
              No scenes yet.{canEdit && " Click Add to create one."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                    <div className="flex items-center justify-between gap-1">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          className="truncate"
                          style={{
                            fontSize: 12.5,
                            fontWeight: currentSceneId === scene.id ? 500 : 400,
                            color: currentSceneId === scene.id ? "var(--ink)" : "var(--ink-2)",
                          }}
                        >
                          {scene.title}
                        </div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>
                          Act {scene.actNumber} · Sc {scene.sceneNumber}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="hidden gap-0.5 group-hover:flex flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddingBeatForScene(scene.id); }}
                            className="rounded p-0.5 hover:bg-[color:var(--bg-muted)]"
                            title="Add beat"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }}
                            className="rounded p-0.5 hover:bg-[color:var(--bg-muted)]"
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
                      className="ml-3 mt-1 space-y-1 rounded border border-[color:var(--border)] p-1.5"
                      style={{ background: "var(--bg-elev)" }}
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
                        style={{ fontSize: 12, height: 28 }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCreateBeat(scene.id)}
                          className="btn primary"
                          style={{ height: 24, padding: "0 8px", fontSize: 11 }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingBeatForScene(null)}
                          className="btn ghost"
                          style={{ height: 24, padding: "0 8px", fontSize: 11 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Beat list */}
                  <div style={{ marginLeft: 12, marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                    {scene.beats.map((beat) => (
                      <div
                        key={beat.id}
                        className="group flex cursor-pointer items-center justify-between"
                        onClick={() => { setCurrentSceneId(scene.id); setCurrentBeatId(beat.id); }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 5,
                          fontSize: 12,
                          background: currentBeatId === beat.id ? "var(--accent-soft)" : "transparent",
                          color: currentBeatId === beat.id ? "var(--accent-ink)" : "var(--ink-3)",
                          fontWeight: currentBeatId === beat.id ? 500 : 400,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                          {beat.label}
                        </div>
                        {canEdit && currentBeatId !== beat.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBeat(beat.id); }}
                            className="hidden group-hover:block"
                          >
                            <Trash2 className="h-2.5 w-2.5" style={{ color: "var(--accent)" }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Center: Canvas ─────────────────────────────────── */}
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ background: pdfUrl ? "rgb(23,23,23)" : "var(--bg)" }}
      >
        {/* Toolbar */}
        <div
          className="row-between border-b border-[color:var(--border)] px-3 py-2"
          style={{ background: "var(--bg-elev)", boxShadow: "var(--shadow-1)", flexShrink: 0 }}
        >
          <div style={{ fontSize: 13, color: "var(--ink)" }}>
            {currentScene && currentBeat ? (
              <span>
                {currentScene.title}{" "}
                <span style={{ color: "var(--ink-3)" }}>· {currentBeat.label}</span>
              </span>
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>
                {scenesWithBeats.length === 0
                  ? "Add a scene to begin"
                  : "Select a beat to start blocking"}
              </span>
            )}
          </div>
          <div className="row" style={{ gap: 6 }}>
            {stageConfig?.calibrationX1 != null && (
              <>
                <button
                  onClick={() => setShowSLSR((v) => !v)}
                  className="btn ghost"
                  style={{
                    height: 28,
                    padding: "0 10px",
                    fontSize: 12,
                    background: showSLSR ? "var(--bg-sunken)" : undefined,
                  }}
                  title="Toggle stage left/right grid lines"
                >
                  <span>SL/SR</span>
                </button>
                <button
                  onClick={() => setShowUSDS((v) => !v)}
                  className="btn ghost"
                  style={{
                    height: 28,
                    padding: "0 10px",
                    fontSize: 12,
                    background: showUSDS ? "var(--bg-sunken)" : undefined,
                  }}
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

        {/* Multi-page controls */}
        {pdfUrl && numPdfPages > 1 && (
          <div
            className="row border-b border-[color:var(--border)] py-1 justify-center gap-2"
            style={{ background: "var(--bg-elev)", fontSize: 12, color: "var(--ink-2)", flexShrink: 0 }}
          >
            <button
              onClick={() => setCurrentPdfPage((p) => Math.max(1, p - 1))}
              disabled={currentPdfPage <= 1}
              className="btn ghost"
              style={{ height: 24, padding: "0 6px" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>Page {currentPdfPage} of {numPdfPages}</span>
            <button
              onClick={() => setCurrentPdfPage((p) => Math.min(numPdfPages, p + 1))}
              disabled={currentPdfPage >= numPdfPages}
              className="btn ghost"
              style={{ height: 24, padding: "0 6px" }}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Canvas area */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            ref={canvasContainerRef}
            className="relative flex-1 overflow-hidden"
          >
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
                {/* Proscenium SVG overlay */}
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
                {/* Stage direction labels */}
                <div style={{ position: "absolute", top: 8, left: 10, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase" }}>Upstage</div>
                <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase" }}>Downstage · Audience</div>
                <div style={{ position: "absolute", top: "50%", left: 6, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase", writingMode: "vertical-rl", transform: "rotate(180deg) translateY(50%)" }}>Stage Right</div>
                <div style={{ position: "absolute", top: "50%", right: 6, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-4)", textTransform: "uppercase", writingMode: "vertical-rl", transform: "translateY(-50%)" }}>Stage Left</div>
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
                    onRotate={(delta) => handleRotateSetPiece(piece.key, delta)}
                  />
                );
              })}

            {/* Empty-state hint */}
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
        </DndContext>
      </div>

      {/* ─── Right panel: Off-stage Cast & Set Pieces ────────── */}
      <div
        className="flex flex-col border-l border-[color:var(--border)]"
        style={{ width: 220, background: "var(--bg)", flexShrink: 0 }}
      >
        {/* Off-stage cast */}
        <div className="row-between border-b border-[color:var(--border)] px-3 py-2.5">
          <div className="h-eyebrow">Off stage · {offStageCount}</div>
          <span className="muted" style={{ fontSize: 10.5 }}>click to place</span>
        </div>
        <div className="scroll overflow-y-auto p-2" style={{ maxHeight: 220 }}>
          {castMembers.length === 0 ? (
            <p className="muted px-1 py-2" style={{ fontSize: 12 }}>No cast assigned.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {castMembers.map((member) => {
                const key = `actor:${member.userId}`;
                const isOnCanvas = !!positions[key];
                const actorName =
                  member.firstName || member.lastName
                    ? `${member.firstName} ${member.lastName}`.trim()
                    : member.email;
                const color = actorColors[member.userId];
                const ini =
                  (
                    (member.firstName?.[0] ?? "") +
                    (member.lastName?.[0] ?? "")
                  ).toUpperCase() ||
                  member.email[0]?.toUpperCase() ||
                  "?";

                return (
                  <button
                    key={member.userId}
                    disabled={!canEdit || !currentBeatId || isOnCanvas}
                    onClick={() => placeOnCanvas("actor", member.userId)}
                    className="w-full text-left"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: isOnCanvas || !currentBeatId ? "default" : "pointer",
                      border: "1px dashed " + (isOnCanvas ? "var(--border)" : "var(--border-strong)"),
                      background: isOnCanvas ? "transparent" : "var(--bg-muted)",
                      opacity: (!canEdit || !currentBeatId) ? 0.4 : isOnCanvas ? 0.45 : 1,
                    }}
                    title={
                      isOnCanvas
                        ? "Already on stage"
                        : !currentBeatId
                          ? "Select a beat first"
                          : "Click to place on stage"
                    }
                  >
                    <div
                      className="avatar flex-shrink-0"
                      style={{ width: 24, height: 24, fontSize: 10, background: color }}
                    >
                      {ini}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {member.characterName ? (
                        <>
                          <div
                            className="truncate"
                            style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}
                          >
                            {member.characterName}
                          </div>
                          <div className="muted truncate" style={{ fontSize: 10.5 }}>
                            {actorName}
                          </div>
                        </>
                      ) : (
                        <div
                          className="truncate"
                          style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}
                        >
                          {actorName}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Set pieces */}
        <div className="row-between border-b border-t border-[color:var(--border)] px-3 py-2.5">
          <div className="h-eyebrow">Set Pieces</div>
          <span className="muted" style={{ fontSize: 10.5 }}>click to place</span>
        </div>
        <div className="scroll overflow-y-auto p-2" style={{ maxHeight: 180 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SET_PIECES.map((piece) => {
              const key = `set_piece:${piece.key}`;
              const isOnCanvas = !!positions[key];
              return (
                <button
                  key={piece.key}
                  disabled={!canEdit || !currentBeatId || isOnCanvas}
                  onClick={() => placeOnCanvas("set_piece", piece.key)}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 6,
                    cursor: isOnCanvas || !currentBeatId ? "default" : "pointer",
                    border: "1px dashed " + (isOnCanvas ? "var(--border)" : "var(--border-strong)"),
                    background: isOnCanvas ? "transparent" : "var(--bg-muted)",
                    opacity: (!canEdit || !currentBeatId) ? 0.4 : isOnCanvas ? 0.45 : 1,
                  }}
                  title={
                    isOnCanvas
                      ? "Already on stage"
                      : !currentBeatId
                        ? "Select a beat first"
                        : "Click to place on stage"
                  }
                >
                  <svg
                    viewBox="0 0 80 60"
                    width={28}
                    height={21}
                    className="flex-shrink-0"
                  >
                    <path
                      d={piece.svgPath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="truncate"
                    style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)" }}
                  >
                    {piece.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Beat comments */}
        <div className="row-between border-b border-t border-[color:var(--border)] px-3 py-2.5">
          <div className="h-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MessageSquare className="h-3 w-3" style={{ color: "var(--ink-3)" }} />
            Beat Comments
          </div>
        </div>
        <BeatCommentSection
          beatId={currentBeatId}
          currentUserId={currentUserId}
          productionMembers={productionMembers}
          canModerate={canEdit}
        />
      </div>
    </div>
  );
}
