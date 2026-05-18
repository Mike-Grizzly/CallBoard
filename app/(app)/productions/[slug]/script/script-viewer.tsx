"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from "react";
import {
  MousePointer2,
  Highlighter,
  StickyNote,
  Zap,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Type,
  AlignLeft,
  AlignRight,
  Bookmark as BookmarkIcon,
  Plus,
  Check,
  Download,
  LayoutList,
} from "lucide-react";
import { saveAnnotations, dismissStaleBanner } from "@/features/scripts/actions";
import {
  ANNOTATION_COLORS,
  DEFAULT_ANNOTATION_COLOR,
  CUE_STROKE,
  type Tool,
  type Annotation,
  type AnnotationRect,
  type Bookmark,
  type PageOverrides,
} from "@/features/scripts/constants";
import type { DefaultScript } from "@/features/scripts/queries";

// Module-level cache so re-renders don't re-decode the same page
const pdfBitmapCache = new Map<string, ImageBitmap>();
const pdfThumbnailCache = new Map<string, string>(); // "url::page" -> jpeg dataURL

interface Props {
  script: DefaultScript;
  productionId: string;
  pdfUrl: string;
  initialAnnotations: Annotation[];
  initialBookmarks: Bookmark[];
  initialPageOverrides: PageOverrides;
  initialHasStalePages: boolean;
}

type PendingAnnotation =
  | { type: "note"; rect: AnnotationRect; page: number }
  | { type: "cue"; rect: AnnotationRect; page: number };

export function ScriptViewer({
  script,
  productionId,
  pdfUrl,
  initialAnnotations,
  initialBookmarks,
  initialPageOverrides,
  initialHasStalePages,
}: Props) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs hold the latest values so the debounced save always reads current state
  const latestAnnotationsRef = useRef<Annotation[]>(initialAnnotations);
  const latestBookmarksRef = useRef<Bookmark[]>(initialBookmarks);

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [pageOverrides] = useState<PageOverrides>(initialPageOverrides);
  const [hasStalePages, setHasStalePages] = useState(initialHasStalePages);

  const [showThumbnails, setShowThumbnails] = useState(false);

  const [activeTool, setActiveTool] = useState<Tool>("pointer");
  const [activeColor, setActiveColor] = useState(DEFAULT_ANNOTATION_COLOR);
  const [preferredLeaderSide, setPreferredLeaderSide] = useState<"left" | "right">("right");

  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [pendingCueNumber, setPendingCueNumber] = useState("");
  const [pendingCueDesc, setPendingCueDesc] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [, startTransition] = useTransition();

  // ── PDF rendering ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    const cacheKey = `${pdfUrl}::${currentPage}`;

    async function render() {
      const mainCanvas = pdfCanvasRef.current;
      if (!mainCanvas) return;

      const cached = pdfBitmapCache.get(cacheKey);
      if (cached) {
        mainCanvas.width = cached.width;
        mainCanvas.height = cached.height;
        mainCanvas.getContext("2d")?.drawImage(cached, 0, 0);
        if (!cancelled) {
          setCanvasSize({ w: cached.width, h: cached.height });
          setPdfLoaded(true);
        }
        return;
      }

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      if (cancelled) return;
      if (!cancelled) setTotalPages(pdf.numPages);

      const page = await pdf.getPage(currentPage);
      if (cancelled) return;

      const SCALE = 1.8;
      const viewport = page.getViewport({ scale: SCALE });

      const offscreen = document.createElement("canvas");
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      await page.render({ canvas: offscreen, viewport }).promise;
      if (cancelled) return;

      mainCanvas.width = offscreen.width;
      mainCanvas.height = offscreen.height;
      mainCanvas.getContext("2d")?.drawImage(offscreen, 0, 0);

      if (!cancelled) {
        setCanvasSize({ w: offscreen.width, h: offscreen.height });
        setPdfLoaded(true);
      }

      try {
        const bitmap = await createImageBitmap(offscreen);
        if (!cancelled) pdfBitmapCache.set(cacheKey, bitmap);
      } catch {
        /* non-fatal */
      }

      // Render text layer for text-select highlighting
      if (!cancelled && textLayerRef.current) {
        const textLayerEl = textLayerRef.current;
        textLayerEl.innerHTML = "";
        try {
          const textContent = await page.getTextContent();
          const vt = viewport.transform; // [sx, shy, shx, sy, tx, ty]
          for (const item of textContent.items) {
            if (!("str" in item) || !item.str) continue;
            const span = document.createElement("span");
            span.textContent = item.str;
            const tx = item.transform;
            const screenX = vt[0] * tx[4] + vt[2] * tx[5] + vt[4];
            const screenY = vt[1] * tx[4] + vt[3] * tx[5] + vt[5];
            const fontSize = Math.sqrt(
              (vt[0] * tx[0] + vt[2] * tx[1]) ** 2 +
                (vt[1] * tx[0] + vt[3] * tx[1]) ** 2,
            );
            const angle = Math.atan2(
              vt[1] * tx[0] + vt[3] * tx[1],
              vt[0] * tx[0] + vt[2] * tx[1],
            );
            Object.assign(span.style, {
              position: "absolute",
              left: `${screenX}px`,
              top: `${screenY - fontSize}px`,
              fontSize: `${fontSize}px`,
              color: "transparent",
              whiteSpace: "pre",
              transformOrigin: "0 0",
              transform: angle !== 0 ? `rotate(${angle}rad)` : "",
              cursor: "text",
              userSelect: "text",
            });
            textLayerEl.appendChild(span);
          }
        } catch {
          /* text layer is best-effort */
        }
      }
    }

    setPdfLoaded(false);
    render().catch(() => setPdfLoaded(false));
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, currentPage]);

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const triggerSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setIsSaving(true);
      const formData = new FormData();
      formData.set("script_id", script.id);
      formData.set("production_id", productionId);
      formData.set("annotations", JSON.stringify(latestAnnotationsRef.current));
      formData.set("bookmarks", JSON.stringify(latestBookmarksRef.current));
      formData.set("page_overrides", JSON.stringify(pageOverrides));
      startTransition(async () => {
        await saveAnnotations(formData);
        setIsSaving(false);
      });
    }, 1500);
  }, [script.id, productionId, pageOverrides]);

  // ── Coordinate helpers ─────────────────────────────────────────────────────

  function getSVGCoords(e: React.MouseEvent): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return {
      x: svgPt.x / canvasSize.w,
      y: svgPt.y / canvasSize.h,
    };
  }

  // ── Annotation CRUD ────────────────────────────────────────────────────────

  function addAnnotation(ann: Annotation) {
    const next = [...latestAnnotationsRef.current, ann];
    latestAnnotationsRef.current = next;
    setAnnotations(next);
    triggerSave();
  }

  function deleteAnnotation(id: string) {
    const next = latestAnnotationsRef.current.filter((a) => a.id !== id);
    latestAnnotationsRef.current = next;
    setAnnotations(next);
    setSelectedId(null);
    triggerSave();
  }

  function addBookmark() {
    const title = newBookmarkTitle.trim();
    if (!title) return;
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      page: currentPage,
      title,
      createdAt: new Date().toISOString(),
    };
    const next = [...latestBookmarksRef.current, bookmark];
    latestBookmarksRef.current = next;
    setBookmarks(next);
    setNewBookmarkTitle("");
    setShowAddBookmark(false);
    triggerSave();
  }

  function deleteBookmark(id: string) {
    const next = latestBookmarksRef.current.filter((b) => b.id !== id);
    latestBookmarksRef.current = next;
    setBookmarks(next);
    triggerSave();
  }

  // ── Drawing handlers ───────────────────────────────────────────────────────

  function handleSVGMouseDown(e: React.MouseEvent) {
    if (activeTool === "pointer" || activeTool === "highlight-text") return;
    e.preventDefault();
    setSelectedId(null);
    const coords = getSVGCoords(e);
    setDrawStart(coords);
    setDrawCurrent(coords);
  }

  function handleSVGMouseMove(e: React.MouseEvent) {
    if (!drawStart) return;
    setDrawCurrent(getSVGCoords(e));
  }

  function handleSVGMouseUp(e: React.MouseEvent) {
    if (!drawStart || !drawCurrent) return;

    const rect: AnnotationRect = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      width: Math.abs(drawCurrent.x - drawStart.x),
      height: Math.abs(drawCurrent.y - drawStart.y),
    };

    setDrawStart(null);
    setDrawCurrent(null);

    // Ignore tiny accidental drags
    if (rect.width < 0.005 || rect.height < 0.003) return;

    if (activeTool === "highlight-box") {
      addAnnotation({
        id: crypto.randomUUID(),
        page: currentPage,
        type: "highlight",
        rect,
        color: activeColor,
      });
    } else if (activeTool === "note") {
      setPendingAnnotation({ type: "note", rect, page: currentPage });
      setPendingText("");
    } else if (activeTool === "cue") {
      setPendingAnnotation({ type: "cue", rect, page: currentPage });
      setPendingCueNumber("");
      setPendingCueDesc("");
    }
  }

  function handleTextLayerMouseUp() {
    if (activeTool !== "highlight-text") return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !pdfCanvasRef.current) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const canvasRect = pdfCanvasRef.current.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rects) {
      minX = Math.min(minX, r.left - canvasRect.left);
      minY = Math.min(minY, r.top - canvasRect.top);
      maxX = Math.max(maxX, r.right - canvasRect.left);
      maxY = Math.max(maxY, r.bottom - canvasRect.top);
    }

    if (maxX <= minX || maxY <= minY) return;

    const w = canvasRect.width;
    const h = canvasRect.height;
    addAnnotation({
      id: crypto.randomUUID(),
      page: currentPage,
      type: "highlight",
      rect: {
        x: minX / w,
        y: minY / h,
        width: (maxX - minX) / w,
        height: (maxY - minY) / h,
      },
      color: activeColor,
    });

    selection.removeAllRanges();
  }

  // ── Pending annotation confirmation ────────────────────────────────────────

  function confirmPending() {
    if (!pendingAnnotation) return;

    if (pendingAnnotation.type === "note") {
      if (!pendingText.trim()) {
        setPendingAnnotation(null);
        return;
      }
      addAnnotation({
        id: crypto.randomUUID(),
        page: pendingAnnotation.page,
        type: "note",
        rect: pendingAnnotation.rect,
        text: pendingText.trim(),
        color: activeColor,
      });
    } else if (pendingAnnotation.type === "cue") {
      if (!pendingCueNumber.trim()) {
        setPendingAnnotation(null);
        return;
      }
      const rect = pendingAnnotation.rect;
      addAnnotation({
        id: crypto.randomUUID(),
        page: pendingAnnotation.page,
        type: "cue",
        rect,
        cueNumber: pendingCueNumber.trim(),
        cueDescription: pendingCueDesc.trim(),
        leaderSide: preferredLeaderSide,
      });
    }

    setPendingAnnotation(null);
  }

  async function downloadAnnotatedPdf() {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      const { jsPDF } = await import("jspdf");

      const pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
      const numPages = pdfDoc.numPages;
      let doc: InstanceType<typeof jsPDF> | null = null;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setDownloadProgress({ current: pageNum, total: numPages });

        const page = await pdfDoc.getPage(pageNum);
        const PRINT_SCALE = 2;
        const viewport = page.getViewport({ scale: PRINT_SCALE });
        const nativeViewport = page.getViewport({ scale: 1 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvas, viewport }).promise;

        // Draw annotations for this page
        const pageAnns = latestAnnotationsRef.current.filter((a) => a.page === pageNum);
        for (const ann of pageAnns) {
          drawAnnotationOnCanvas(ctx, ann, viewport.width, viewport.height);
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.93);
        // Convert PDF points to mm (1 pt = 25.4/72 mm)
        const widthMm = nativeViewport.width * (25.4 / 72);
        const heightMm = nativeViewport.height * (25.4 / 72);
        const orientation = widthMm > heightMm ? "landscape" : "portrait";

        if (!doc) {
          doc = new jsPDF({ orientation, unit: "mm", format: [widthMm, heightMm] });
        } else {
          doc.addPage([widthMm, heightMm], orientation);
        }
        doc.addImage(imgData, "JPEG", 0, 0, widthMm, heightMm);
      }

      doc?.save(`${script.title} - annotated.pdf`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }

  function handleDismissStale() {
    const formData = new FormData();
    formData.set("script_id", script.id);
    startTransition(async () => {
      await dismissStaleBanner(formData);
      setHasStalePages(false);
    });
  }

  // ── Page annotations (current page only) ──────────────────────────────────

  const pageAnnotations = annotations.filter((a) => a.page === currentPage);

  // ── SVG cursor style ───────────────────────────────────────────────────────

  const svgCursor =
    activeTool === "pointer"
      ? "default"
      : activeTool === "highlight-text"
        ? "text"
        : "crosshair";

  const svgPointerEvents =
    activeTool === "highlight-text" ? "none" : "all";

  const textLayerPointerEvents =
    activeTool === "highlight-text" ? "auto" : "none";

  // ── Pending popover position ───────────────────────────────────────────────

  function pendingPopoverStyle(): React.CSSProperties {
    if (!pendingAnnotation) return {};
    const { rect } = pendingAnnotation;
    const pct = (n: number) => `${n * 100}%`;
    const bottom = rect.y + rect.height;
    const isNearBottom = bottom > 0.75;
    return {
      position: "absolute",
      left: `${Math.min(rect.x * 100, 60)}%`,
      ...(isNearBottom
        ? { bottom: `${(1 - rect.y) * 100 + 2}%` }
        : { top: `${bottom * 100 + 1}%` }),
      zIndex: 200,
      background: "var(--bg-elev)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: 12,
      minWidth: 220,
      maxWidth: 300,
      boxShadow: "0 8px 24px rgba(0,0,0,.18)",
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="anim-in"
      style={{ display: "flex", gap: 0, minHeight: 0, maxWidth: 1440, margin: "0 auto" }}
    >
      {/* ── Tool sidebar ── */}
      <div
        style={{
          width: 52,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          paddingTop: 4,
          paddingRight: 8,
        }}
      >
        <ToolButton
          icon={<LayoutList size={16} />}
          label="Page thumbnails"
          active={showThumbnails}
          onClick={() => setShowThumbnails((s) => !s)}
        />
        <div style={{ width: 28, height: 1, background: "var(--border)", margin: "2px 0" }} />
        <ToolButton
          icon={<MousePointer2 size={16} />}
          label="Select"
          active={activeTool === "pointer"}
          onClick={() => setActiveTool("pointer")}
        />
        <ToolButton
          icon={<Highlighter size={16} />}
          label="Highlight (draw)"
          active={activeTool === "highlight-box"}
          onClick={() => setActiveTool("highlight-box")}
        />
        <ToolButton
          icon={<Type size={16} />}
          label="Highlight (text select)"
          active={activeTool === "highlight-text"}
          onClick={() => setActiveTool("highlight-text")}
        />
        <ToolButton
          icon={<StickyNote size={16} />}
          label="Note"
          active={activeTool === "note"}
          onClick={() => setActiveTool("note")}
        />
        <ToolButton
          icon={<Zap size={16} />}
          label="Cue"
          active={activeTool === "cue"}
          onClick={() => setActiveTool("cue")}
        />

        {activeTool === "cue" && (
          <div
            style={{
              marginTop: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: ".05em", textTransform: "uppercase" }}>
              Margin
            </span>
            <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
              <button
                title="Leader to left margin"
                onClick={() => setPreferredLeaderSide("left")}
                style={{
                  width: 26,
                  height: 24,
                  display: "grid",
                  placeItems: "center",
                  border: "none",
                  background: preferredLeaderSide === "left" ? "var(--accent)" : "transparent",
                  color: preferredLeaderSide === "left" ? "white" : "var(--ink-3)",
                  cursor: "pointer",
                }}
              >
                <AlignLeft size={12} />
              </button>
              <button
                title="Leader to right margin"
                onClick={() => setPreferredLeaderSide("right")}
                style={{
                  width: 26,
                  height: 24,
                  display: "grid",
                  placeItems: "center",
                  border: "none",
                  borderLeft: "1px solid var(--border)",
                  background: preferredLeaderSide === "right" ? "var(--accent)" : "transparent",
                  color: preferredLeaderSide === "right" ? "white" : "var(--ink-3)",
                  cursor: "pointer",
                }}
              >
                <AlignRight size={12} />
              </button>
            </div>
          </div>
        )}

        {(activeTool === "highlight-box" ||
          activeTool === "highlight-text" ||
          activeTool === "note") && (
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignItems: "center",
            }}
          >
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => setActiveColor(c.value)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border:
                    activeColor === c.value
                      ? "2px solid var(--ink)"
                      : "2px solid transparent",
                  background: c.value,
                  cursor: "pointer",
                  padding: 0,
                  outline: "none",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail sidebar ── */}
      {showThumbnails && (
        <ThumbnailPanel
          pdfUrl={pdfUrl}
          totalPages={totalPages}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Stale banner */}
        {hasStalePages && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: "color-mix(in oklch, var(--c-amber) 12%, transparent)",
              border: "1px solid color-mix(in oklch, var(--c-amber) 30%, transparent)",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--ink-2)",
              gap: 8,
            }}
          >
            <span>
              The default script has been updated. Some annotations may no longer match the
              current page content.
            </span>
            <button
              className="btn ghost"
              onClick={handleDismissStale}
              style={{ fontSize: 12, height: 26, flexShrink: 0 }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page navigation + save status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              className="btn ghost btn-icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ width: 30, height: 30 }}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, color: "var(--ink-3)", minWidth: 70, textAlign: "center" }}>
              {totalPages > 0 ? `${currentPage} / ${totalPages}` : "—"}
            </span>
            <button
              className="btn ghost btn-icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{ width: 30, height: 30 }}
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn ghost"
              onClick={() => {
                setShowAddBookmark((s) => !s);
                setNewBookmarkTitle("");
              }}
              style={{ fontSize: 12, height: 28, gap: 5 }}
              title="Bookmark this page"
            >
              <BookmarkIcon size={13} />
              <span>Bookmark</span>
            </button>
            <button
              className="btn ghost"
              onClick={downloadAnnotatedPdf}
              disabled={isDownloading || !pdfLoaded}
              style={{ fontSize: 12, height: 28, gap: 5 }}
              title="Download annotated PDF"
            >
              <Download size={13} />
              <span>
                {downloadProgress
                  ? `Preparing ${downloadProgress.current} / ${downloadProgress.total}…`
                  : "Download PDF"}
              </span>
            </button>
            <span
              style={{
                fontSize: 11.5,
                color: "var(--ink-4)",
                transition: "opacity .3s",
                opacity: isSaving ? 1 : 0,
              }}
            >
              Saving…
            </span>
          </div>
        </div>

        {/* Add-bookmark inline form */}
        {showAddBookmark && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              background: "var(--bg-sunken)",
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          >
            <BookmarkIcon size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input
              autoFocus
              value={newBookmarkTitle}
              onChange={(e) => setNewBookmarkTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addBookmark();
                if (e.key === "Escape") setShowAddBookmark(false);
              }}
              placeholder={`Label for page ${currentPage}…`}
              style={{
                flex: 1,
                fontSize: 13,
                border: "none",
                background: "transparent",
                outline: "none",
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--ink-4)", flexShrink: 0 }}>
              p.{currentPage}
            </span>
            <button
              className="btn-icon"
              onClick={addBookmark}
              disabled={!newBookmarkTitle.trim()}
              title="Save bookmark"
              style={{
                width: 24, height: 24, border: "none", background: "none",
                cursor: "pointer", color: "var(--accent)", display: "grid",
                placeItems: "center", flexShrink: 0,
              }}
            >
              <Check size={13} />
            </button>
            <button
              className="btn-icon"
              onClick={() => setShowAddBookmark(false)}
              title="Cancel"
              style={{
                width: 24, height: 24, border: "none", background: "none",
                cursor: "pointer", color: "var(--ink-4)", display: "grid",
                placeItems: "center", flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* PDF + annotation layer */}
        <div
          style={{
            background: "var(--bg-sunken)",
            borderRadius: 8,
            padding: "28px 32px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
        <div
          ref={containerRef}
          style={{
            position: "relative",
            display: "inline-block",
            maxWidth: "100%",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 4px 32px rgba(0,0,0,.28), 0 1px 4px rgba(0,0,0,.12)",
            opacity: pdfLoaded ? 1 : 0.4,
            transition: "opacity .2s",
            userSelect: activeTool === "highlight-text" ? "auto" : "none",
          }}
        >
          {/* PDF canvas */}
          <canvas
            ref={pdfCanvasRef}
            style={{ display: "block", maxWidth: "100%" }}
          />

          {/* Text layer — transparent text for selection */}
          <div
            ref={textLayerRef}
            onMouseUp={handleTextLayerMouseUp}
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: textLayerPointerEvents,
              userSelect: activeTool === "highlight-text" ? "text" : "none",
            }}
          />

          {/* SVG annotation overlay */}
          {canvasSize.w > 0 && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                cursor: svgCursor,
                pointerEvents: svgPointerEvents,
              }}
              onMouseDown={handleSVGMouseDown}
              onMouseMove={handleSVGMouseMove}
              onMouseUp={handleSVGMouseUp}
              onMouseLeave={() => {
                if (drawStart) {
                  setDrawStart(null);
                  setDrawCurrent(null);
                }
              }}
            >
              {/* Existing annotations for this page */}
              {pageAnnotations.map((ann) => (
                <AnnotationShape
                  key={ann.id}
                  annotation={ann}
                  canvasW={canvasSize.w}
                  canvasH={canvasSize.h}
                  selected={selectedId === ann.id}
                  onClick={() =>
                    setSelectedId(selectedId === ann.id ? null : ann.id)
                  }
                />
              ))}

              {/* In-progress rectangle */}
              {drawStart && drawCurrent && (
                <rect
                  x={Math.min(drawStart.x, drawCurrent.x) * canvasSize.w}
                  y={Math.min(drawStart.y, drawCurrent.y) * canvasSize.h}
                  width={
                    Math.abs(drawCurrent.x - drawStart.x) * canvasSize.w
                  }
                  height={
                    Math.abs(drawCurrent.y - drawStart.y) * canvasSize.h
                  }
                  fill={
                    activeTool === "cue"
                      ? "rgba(239,68,68,0.1)"
                      : `${activeColor}55`
                  }
                  stroke={activeTool === "cue" ? CUE_STROKE : activeColor}
                  strokeWidth="1.5"
                  strokeDasharray="5,3"
                  pointerEvents="none"
                />
              )}
            </svg>
          )}

          {/* Delete button for selected annotation */}
          {selectedId && (() => {
            const ann = pageAnnotations.find((a) => a.id === selectedId);
            if (!ann) return null;
            const screenLeft = ann.rect.x * 100;
            const screenTop = (ann.rect.y + ann.rect.height) * 100 + 1;
            return (
              <div
                style={{
                  position: "absolute",
                  left: `${Math.min(screenLeft, 80)}%`,
                  top: `${screenTop}%`,
                  zIndex: 200,
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                  padding: "4px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {ann.type === "note" && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink-2)",
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ann.text}
                  </span>
                )}
                {ann.type === "cue" && (
                  <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                    {ann.cueNumber}
                    {ann.cueDescription ? ` — ${ann.cueDescription}` : ""}
                  </span>
                )}
                <button
                  className="btn-icon"
                  onClick={() => deleteAnnotation(selectedId)}
                  title="Delete annotation"
                  style={{
                    width: 24,
                    height: 24,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--c-clay)",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 4,
                  }}
                >
                  <Trash2 size={13} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => setSelectedId(null)}
                  title="Dismiss"
                  style={{
                    width: 24,
                    height: 24,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--ink-4)",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 4,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })()}

          {/* Pending annotation popover */}
          {pendingAnnotation && (
            <div style={pendingPopoverStyle()}>
              {pendingAnnotation.type === "note" ? (
                <>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: "var(--ink-4)",
                      marginBottom: 6,
                    }}
                  >
                    Note
                  </p>
                  <textarea
                    autoFocus
                    value={pendingText}
                    onChange={(e) => setPendingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        confirmPending();
                      }
                      if (e.key === "Escape") setPendingAnnotation(null);
                    }}
                    placeholder="Add a note…"
                    rows={3}
                    style={{
                      width: "100%",
                      fontSize: 13,
                      resize: "none",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "6px 8px",
                      background: "var(--bg-sunken)",
                      color: "var(--ink)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: "var(--ink-4)",
                      marginBottom: 8,
                    }}
                  >
                    Cue annotation
                  </p>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      color: "var(--ink-3)",
                      marginBottom: 3,
                    }}
                  >
                    Cue number
                  </label>
                  <input
                    autoFocus
                    value={pendingCueNumber}
                    onChange={(e) => setPendingCueNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setPendingAnnotation(null);
                    }}
                    placeholder="e.g. 12.5"
                    style={{
                      width: "100%",
                      fontSize: 13,
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "5px 8px",
                      background: "var(--bg-sunken)",
                      color: "var(--ink)",
                      outline: "none",
                      marginBottom: 8,
                      fontFamily: "inherit",
                    }}
                  />
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      color: "var(--ink-3)",
                      marginBottom: 3,
                    }}
                  >
                    Description
                  </label>
                  <input
                    value={pendingCueDesc}
                    onChange={(e) => setPendingCueDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmPending();
                      if (e.key === "Escape") setPendingAnnotation(null);
                    }}
                    placeholder="e.g. Sound: doorbell"
                    style={{
                      width: "100%",
                      fontSize: 13,
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "5px 8px",
                      background: "var(--bg-sunken)",
                      color: "var(--ink)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  className="btn primary"
                  onClick={confirmPending}
                  style={{ fontSize: 12, height: 28, flex: 1 }}
                >
                  Save
                </button>
                <button
                  className="btn ghost"
                  onClick={() => setPendingAnnotation(null)}
                  style={{ fontSize: 12, height: 28 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Script info */}
        <p style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
          {script.title} · v{script.scriptVersion} · Your annotations are private
        </p>
      </div>

      {/* ── Right panel column ── */}
      <div
        style={{
          width: 248,
          flexShrink: 0,
          marginLeft: 16,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <BookmarksPanel
          bookmarks={bookmarks}
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onDelete={deleteBookmark}
        />
        <AnnotationsPanel
          annotations={pageAnnotations}
          currentPage={currentPage}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
          onDelete={deleteAnnotation}
        />
      </div>
    </div>
  );
}

// ── ThumbnailPanel ────────────────────────────────────────────────────────

function ThumbnailPanel({
  pdfUrl,
  totalPages,
  currentPage,
  onNavigate,
}: {
  pdfUrl: string;
  totalPages: number;
  currentPage: number;
  onNavigate: (page: number) => void;
}) {
  const [thumbs, setThumbs] = useState<(string | null)[]>(() =>
    Array(totalPages).fill(null),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfUrl || totalPages === 0) return;
    let cancelled = false;

    async function renderAll() {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      if (cancelled) return;

      for (let i = 1; i <= totalPages; i++) {
        if (cancelled) break;

        const key = `${pdfUrl}::thumb::${i}`;
        const cached = pdfThumbnailCache.get(key);
        if (cached) {
          setThumbs((prev) => {
            const next = [...prev];
            next[i - 1] = cached;
            return next;
          });
          continue;
        }

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        if (cancelled) break;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        pdfThumbnailCache.set(key, dataUrl);

        setThumbs((prev) => {
          const next = [...prev];
          next[i - 1] = dataUrl;
          return next;
        });
      }
    }

    setThumbs(Array(totalPages).fill(null));
    renderAll().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, totalPages]);

  // Scroll active thumbnail into view when navigating from outside the panel
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-page="${currentPage}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentPage]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 152,
        flexShrink: 0,
        alignSelf: "flex-start",
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 80px)",
        overflowY: "auto",
        borderRight: "1px solid var(--border)",
        background: "var(--bg-sunken)",
        display: "flex",
        flexDirection: "column",
        paddingTop: 8,
        paddingBottom: 8,
        gap: 0,
        marginRight: 12,
        borderRadius: "0 4px 4px 0",
      }}
    >
      {thumbs.map((thumb, i) => {
        const pageNum = i + 1;
        const isActive = pageNum === currentPage;
        return (
          <div
            key={pageNum}
            data-page={pageNum}
            onClick={() => onNavigate(pageNum)}
            title={`Page ${pageNum}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 10px",
              cursor: "pointer",
              background: isActive ? "color-mix(in oklch, var(--accent) 12%, transparent)" : "transparent",
              borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
              transition: "background .1s",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLDivElement).style.background = "var(--bg-muted)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            {thumb ? (
              <img
                src={thumb}
                alt={`Page ${pageNum}`}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 2,
                  display: "block",
                  boxShadow: isActive
                    ? "0 0 0 2px var(--accent), 0 2px 6px rgba(0,0,0,.2)"
                    : "0 1px 4px rgba(0,0,0,.22)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "8.5 / 11",
                  background: "var(--bg-muted)",
                  borderRadius: 2,
                  opacity: 0.5,
                }}
              />
            )}
            <span
              style={{
                fontSize: 10.5,
                color: isActive ? "var(--accent)" : "var(--ink-4)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {pageNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Canvas annotation renderer (used for PDF export) ─────────────────────

function drawAnnotationOnCanvas(
  ctx: CanvasRenderingContext2D,
  ann: Annotation,
  canvasW: number,
  canvasH: number,
) {
  const rx = ann.rect.x * canvasW;
  const ry = ann.rect.y * canvasH;
  const rw = ann.rect.width * canvasW;
  const rh = ann.rect.height * canvasH;

  ctx.save();

  if (ann.type === "highlight") {
    ctx.globalAlpha = 0.44;
    ctx.fillStyle = ann.color;
    ctx.fillRect(rx, ry, rw, rh);
  } else if (ann.type === "note") {
    ctx.globalAlpha = 0.33;
    ctx.fillStyle = ann.color;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.beginPath();
    ctx.arc(rx + rw, ry, 5, 0, Math.PI * 2);
    ctx.fillStyle = ann.color;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (ann.type === "cue") {
    const bottomY = ry + rh;
    const isLeft = ann.leaderSide === "left";
    const lineStartX = isLeft ? rx : rx + rw;
    const MARGIN_OFFSET = 6;
    const labelX = isLeft ? MARGIN_OFFSET : canvasW - MARGIN_OFFSET;

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = CUE_STROKE;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = CUE_STROKE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.beginPath();
    ctx.moveTo(lineStartX, bottomY);
    ctx.lineTo(labelX, bottomY);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(labelX, bottomY, 3, 0, Math.PI * 2);
    ctx.fillStyle = CUE_STROKE;
    ctx.fill();
    ctx.fillStyle = CUE_STROKE;
    ctx.textAlign = isLeft ? "left" : "right";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillText(ann.cueNumber, isLeft ? labelX + 5 : labelX - 5, bottomY - 3);
    if (ann.cueDescription) {
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillText(ann.cueDescription, isLeft ? labelX + 5 : labelX - 5, bottomY + 13);
    }
  }

  ctx.restore();
}

// ── AnnotationShape ────────────────────────────────────────────────────────

function AnnotationShape({
  annotation,
  canvasW,
  canvasH,
  selected,
  onClick,
}: {
  annotation: Annotation;
  canvasW: number;
  canvasH: number;
  selected: boolean;
  onClick: () => void;
}) {
  const rx = annotation.rect.x * canvasW;
  const ry = annotation.rect.y * canvasH;
  const rw = annotation.rect.width * canvasW;
  const rh = annotation.rect.height * canvasH;

  if (annotation.type === "highlight") {
    return (
      <rect
        x={rx}
        y={ry}
        width={rw}
        height={rh}
        fill={`${annotation.color}70`}
        stroke={selected ? "var(--ink)" : "none"}
        strokeWidth="1.5"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      />
    );
  }

  if (annotation.type === "note") {
    return (
      <g onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: "pointer" }}>
        <rect
          x={rx}
          y={ry}
          width={rw}
          height={rh}
          fill={`${annotation.color}55`}
          stroke={annotation.color}
          strokeWidth={selected ? "2" : "1"}
        />
        {/* Note indicator dot */}
        <circle
          cx={rx + rw}
          cy={ry}
          r={5}
          fill={annotation.color}
          stroke="white"
          strokeWidth="1"
        />
      </g>
    );
  }

  if (annotation.type === "cue") {
    const bottomY = ry + rh;
    const isLeft = annotation.leaderSide === "left";
    const lineStartX = isLeft ? rx : rx + rw;
    const MARGIN_OFFSET = 6;
    const labelX = isLeft ? MARGIN_OFFSET : canvasW - MARGIN_OFFSET;
    const textAnchor = isLeft ? "start" : "end";

    return (
      <g onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: "pointer" }}>
        {/* Box */}
        <rect
          x={rx}
          y={ry}
          width={rw}
          height={rh}
          fill="rgba(239,68,68,0.08)"
          stroke={CUE_STROKE}
          strokeWidth={selected ? "2" : "1.5"}
        />
        {/* Leader line from bottom edge of box to margin */}
        <line
          x1={lineStartX}
          y1={bottomY}
          x2={labelX}
          y2={bottomY}
          stroke={CUE_STROKE}
          strokeWidth="1"
        />
        {/* End marker */}
        <circle cx={labelX} cy={bottomY} r="3" fill={CUE_STROKE} />
        {/* Cue number */}
        <text
          x={isLeft ? labelX + 5 : labelX - 5}
          y={bottomY - 3}
          textAnchor={textAnchor}
          fontSize="11"
          fill={CUE_STROKE}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {annotation.cueNumber}
        </text>
        {/* Cue description */}
        {annotation.cueDescription && (
          <text
            x={isLeft ? labelX + 5 : labelX - 5}
            y={bottomY + 13}
            textAnchor={textAnchor}
            fontSize="10"
            fill={CUE_STROKE}
            fontFamily="system-ui, sans-serif"
          >
            {annotation.cueDescription}
          </text>
        )}
      </g>
    );
  }

  return null;
}

// ── BookmarksPanel ────────────────────────────────────────────────────────

function BookmarksPanel({
  bookmarks,
  currentPage,
  onNavigate,
  onDelete,
}: {
  bookmarks: Bookmark[];
  currentPage: number;
  onNavigate: (page: number) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...bookmarks].sort((a, b) => a.page - b.page);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 2px 8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 8,
        }}
      >
        <BookmarkIcon size={12} style={{ color: "var(--ink-4)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-4)" }}>
          Bookmarks
        </span>
        {bookmarks.length > 0 && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: 999,
              background: "var(--bg-sunken)",
              color: "var(--ink-3)",
            }}
          >
            {bookmarks.length}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--ink-4)", padding: "4px 2px 12px" }}>
          No bookmarks yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 8 }}>
          {sorted.map((bm) => (
            <div
              key={bm.id}
              onClick={() => onNavigate(bm.page)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 8px",
                borderRadius: 6,
                cursor: "pointer",
                background: bm.page === currentPage ? "var(--bg-muted)" : "transparent",
                transition: "background .1s",
              }}
              onMouseEnter={(e) => {
                if (bm.page !== currentPage)
                  (e.currentTarget as HTMLDivElement).style.background = "var(--bg-muted)";
              }}
              onMouseLeave={(e) => {
                if (bm.page !== currentPage)
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "var(--bg-sunken)",
                  color: "var(--ink-3)",
                  flexShrink: 0,
                }}
              >
                p.{bm.page}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {bm.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(bm.id);
                }}
                title="Remove bookmark"
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  display: "grid",
                  placeItems: "center",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--ink-4)",
                  borderRadius: 3,
                  opacity: 0.6,
                  transition: "opacity .1s, color .1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--c-clay)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-4)";
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AnnotationsPanel ──────────────────────────────────────────────────────

function AnnotationsPanel({
  annotations,
  currentPage,
  selectedId,
  onSelect,
  onDelete,
}: {
  annotations: Annotation[];
  currentPage: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...annotations].sort((a, b) =>
    a.rect.y !== b.rect.y ? a.rect.y - b.rect.y : a.rect.x - b.rect.x,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 2px 8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-4)" }}>
          Page {currentPage}
        </span>
        {annotations.length > 0 && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: 999,
              background: "var(--bg-sunken)",
              color: "var(--ink-3)",
            }}
          >
            {annotations.length}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--ink-4)", padding: "8px 2px" }}>
          No annotations on this page.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sorted.map((ann) => (
            <PanelAnnotationItem
              key={ann.id}
              annotation={ann}
              selected={selectedId === ann.id}
              onSelect={() => onSelect(ann.id)}
              onDelete={() => onDelete(ann.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PanelAnnotationItem({
  annotation,
  selected,
  onSelect,
  onDelete,
}: {
  annotation: Annotation;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const accentColor =
    annotation.type === "cue" ? CUE_STROKE : annotation.color;

  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "7px 8px",
        borderRadius: 6,
        borderLeft: `3px solid ${accentColor}`,
        background: selected ? "var(--bg-muted)" : "transparent",
        cursor: "pointer",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {annotation.type === "highlight" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: annotation.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Highlight</span>
          </div>
        )}

        {annotation.type === "note" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", marginBottom: 2 }}>
              Note
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink)",
                lineHeight: 1.4,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {annotation.text}
            </div>
          </>
        )}

        {annotation.type === "cue" && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: CUE_STROKE }}>
              {annotation.cueNumber}
            </div>
            {annotation.cueDescription && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-2)",
                  marginTop: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {annotation.cueDescription}
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          display: "grid",
          placeItems: "center",
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--ink-4)",
          borderRadius: 3,
          opacity: 0.6,
          transition: "opacity .1s, color .1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--c-clay)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-4)";
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── ToolButton ─────────────────────────────────────────────────────────────

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        display: "grid",
        placeItems: "center",
        border: "none",
        borderRadius: 6,
        background: active ? "var(--bg-elev)" : "transparent",
        boxShadow: active ? "var(--shadow-1)" : "none",
        color: active ? "var(--accent)" : "var(--ink-3)",
        cursor: "pointer",
        transition: "background .1s, color .1s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-muted)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-3)";
        }
      }}
    >
      {icon}
    </button>
  );
}
