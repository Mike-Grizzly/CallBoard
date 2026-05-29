"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Search,
  X,
} from "lucide-react";
import { saveAnnotations } from "@/features/scripts/actions";
import { loadPdfDocument } from "@/lib/pdf";
import type {
  Annotation,
  Bookmark,
  HighlightAnnotation,
  PageOverrides,
} from "@/features/scripts/constants";

// Low-res page thumbnails for the grid; shared across opens of the grid.
const thumbCache = new Map<string, string>(); // "url::page" -> jpeg dataURL

const GAP = 8; // px between pages in the continuous scroll
const DEFAULT_RATIO = 11 / 8.5; // letter portrait until we measure page 1
const WINDOW = 2; // pages rendered on either side of the current page

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

type Props = {
  scriptId: string;
  productionId: string;
  pdfUrl: string;
  title: string;
  initialAnnotations: Annotation[];
  initialBookmarks: Bookmark[];
  initialPageOverrides: PageOverrides;
  /** When used as a desktop "Read mode" overlay: close instead of navigating. */
  onExit?: () => void;
  /** Bubble bookmark changes up so a host (desktop viewer) stays in sync. */
  onBookmarksChange?: (bookmarks: Bookmark[]) => void;
  /** Open scrolled to this page (e.g. the desktop viewer's current page). */
  startPage?: number;
};

export function MobileScriptReader({
  scriptId,
  productionId,
  pdfUrl,
  title,
  initialAnnotations,
  initialBookmarks,
  initialPageOverrides,
  onExit,
  onBookmarksChange,
  startPage,
}: Props) {
  const router = useRouter();
  const exit = useCallback(() => {
    if (onExit) onExit();
    else router.back();
  }, [onExit, router]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvases = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const rendered = useRef<Set<number>>(new Set());
  const inFlight = useRef<Set<number>>(new Set());
  const pitchRef = useRef(0);

  const [pageCount, setPageCount] = useState(0);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [gridOpen, setGridOpen] = useState(false);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Existing highlight annotations are shown read-only over each page so a
  // reader still sees their marks (full editing lands in Phase 2).
  const highlightsByPage = useMemo(() => {
    const map = new Map<number, HighlightAnnotation[]>();
    for (const a of initialAnnotations) {
      if (a.type !== "highlight") continue;
      const list = map.get(a.page) ?? [];
      list.push(a);
      map.set(a.page, list);
    }
    return map;
  }, [initialAnnotations]);

  // ── Load the document: page count + aspect ratio from page 1 ──────────
  useEffect(() => {
    let active = true;
    loadPdfDocument(pdfUrl)
      .then(async (pdf) => {
        if (!active) return;
        setPageCount(pdf.numPages);
        const page = await pdf.getPage(1);
        const vp = page.getViewport({ scale: 1 });
        if (active) setRatio(vp.height / vp.width);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pdfUrl]);

  // ── Measure the scroll port ───────────────────────────────────────────
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const measure = () => setContainerWidth(sc.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sc);
    return () => ro.disconnect();
  }, []);

  const slotH = containerWidth ? Math.round(containerWidth * ratio) : 0;
  useEffect(() => {
    pitchRef.current = slotH ? slotH + GAP : 0;
  }, [slotH]);

  // ── Render a single page to its canvas ────────────────────────────────
  const renderPage = useCallback(
    async (n: number) => {
      const canvas = canvases.current.get(n);
      if (
        !canvas ||
        !containerWidth ||
        rendered.current.has(n) ||
        inFlight.current.has(n)
      ) {
        return;
      }
      inFlight.current.add(n);
      try {
        const pdf = await loadPdfDocument(pdfUrl);
        const page = await pdf.getPage(n);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp1 = page.getViewport({ scale: 1 });
        const scale = (containerWidth * dpr) / vp1.width;
        const vp = page.getViewport({ scale });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvas, viewport: vp }).promise;
        rendered.current.add(n);
      } catch {
        // ignore — a later scroll will retry
      } finally {
        inFlight.current.delete(n);
      }
    },
    [pdfUrl, containerWidth],
  );

  // ── Windowed rendering: keep current ± WINDOW painted, clear the rest ──
  useEffect(() => {
    if (!pageCount || !containerWidth) return;
    const lo = Math.max(1, currentPage - WINDOW);
    const hi = Math.min(pageCount, currentPage + WINDOW);
    for (let n = lo; n <= hi; n++) renderPage(n);
    rendered.current.forEach((n) => {
      if (n < lo - 1 || n > hi + 1) {
        const c = canvases.current.get(n);
        if (c) {
          c.width = 0;
          c.height = 0;
        }
        rendered.current.delete(n);
      }
    });
  }, [currentPage, pageCount, containerWidth, renderPage]);

  const onScroll = () => {
    const sc = scrollRef.current;
    const pitch = pitchRef.current;
    if (!sc || !pitch) return;
    const cur = clamp(Math.round(sc.scrollTop / pitch) + 1, 1, pageCount || 1);
    if (cur !== currentPage) setCurrentPage(cur);
  };

  const jumpTo = useCallback(
    (n: number, smooth = false) => {
      const sc = scrollRef.current;
      const pitch = pitchRef.current;
      if (!sc || !pitch) return;
      const t = clamp(n, 1, pageCount || 1);
      sc.scrollTo({ top: (t - 1) * pitch, behavior: smooth ? "smooth" : "auto" });
    },
    [pageCount],
  );

  // ── Bookmarks ─────────────────────────────────────────────────────────
  const persist = useCallback(
    (next: Bookmark[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const fd = new FormData();
        fd.set("script_id", scriptId);
        fd.set("production_id", productionId);
        fd.set("annotations", JSON.stringify(initialAnnotations));
        fd.set("bookmarks", JSON.stringify(next));
        fd.set("page_overrides", JSON.stringify(initialPageOverrides));
        startTransition(() => {
          void saveAnnotations(fd);
        });
      }, 600);
    },
    [scriptId, productionId, initialAnnotations, initialPageOverrides],
  );

  const toggleBookmark = useCallback(
    (n: number) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.page === n);
        const next = exists
          ? prev.filter((b) => b.page !== n)
          : [
              ...prev,
              {
                id:
                  typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `bm-${Date.now()}`,
                page: n,
                title: "",
                createdAt: new Date().toISOString(),
              },
            ];
        persist(next);
        onBookmarksChange?.(next);
        return next;
      });
    },
    [persist, onBookmarksChange],
  );

  const isBookmarked = useCallback(
    (n: number) => bookmarks.some((b) => b.page === n),
    [bookmarks],
  );

  // ── Scrubber drag ─────────────────────────────────────────────────────
  const scrubDrag = useRef<{ y: number; page: number } | null>(null);
  const onScrubDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    scrubDrag.current = { y: e.clientY, page: currentPage };
  };
  const onScrubMove = (e: React.PointerEvent) => {
    if (!scrubDrag.current) return;
    const dy = e.clientY - scrubDrag.current.y;
    const track = window.innerHeight * 0.7;
    const delta = Math.round((dy / track) * (pageCount || 1));
    jumpTo(scrubDrag.current.page + delta, false);
  };
  const onScrubUp = () => {
    scrubDrag.current = null;
  };

  // Esc exits (used by the desktop Read-mode overlay).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit]);

  // Jump to the requested start page once the layout is measured.
  const didInitialJump = useRef(false);
  useEffect(() => {
    if (didInitialJump.current) return;
    if (pageCount > 0 && containerWidth > 0 && pitchRef.current > 0) {
      didInitialJump.current = true;
      if (startPage && startPage > 1) jumpTo(startPage, false);
    }
  }, [pageCount, containerWidth, startPage, jumpTo]);

  const ready = pageCount > 0 && containerWidth > 0;

  return (
    <div className="msr">
      <header className="msr-top">
        <button className="msr-icon" onClick={exit} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="msr-title">{title}</div>
        <button
          className="msr-icon"
          data-on={isBookmarked(currentPage) ? "1" : "0"}
          onClick={() => toggleBookmark(currentPage)}
          aria-label={
            isBookmarked(currentPage) ? "Remove bookmark" : "Bookmark this page"
          }
        >
          <BookmarkIcon
            size={19}
            fill={isBookmarked(currentPage) ? "currentColor" : "none"}
          />
        </button>
        <button
          className="msr-icon"
          onClick={() => setGridOpen(true)}
          aria-label="All pages"
        >
          <LayoutGrid size={19} />
        </button>
      </header>

      <div className="msr-scroll" ref={scrollRef} onScroll={onScroll}>
        {ready &&
          Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className="msr-slot"
              data-page={n}
              style={{ height: slotH }}
            >
              <canvas
                className="msr-canvas"
                ref={(el) => {
                  if (el) canvases.current.set(n, el);
                  else canvases.current.delete(n);
                }}
              />
              {highlightsByPage.get(n)?.map((h) => (
                <div
                  key={h.id}
                  className="msr-hl"
                  style={{
                    left: `${h.rect.x * 100}%`,
                    top: `${h.rect.y * 100}%`,
                    width: `${h.rect.width * 100}%`,
                    height: `${h.rect.height * 100}%`,
                    background: h.color,
                  }}
                />
              ))}
              <span className="msr-slot-num">{n}</span>
            </div>
          ))}
        {!ready && <div className="msr-loading">Loading script…</div>}
      </div>

      {ready && (
        <div className="msr-scrub">
          <button
            className="msr-scrub-btn"
            onClick={() => jumpTo(currentPage - 1, true)}
            aria-label="Previous page"
          >
            <ChevronUp size={18} />
          </button>
          <div
            className="msr-scrub-num"
            onPointerDown={onScrubDown}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubUp}
            onPointerCancel={onScrubUp}
          >
            <b>{currentPage}</b>
            <span />
            <i>{pageCount}</i>
          </div>
          <button
            className="msr-scrub-btn"
            onClick={() => jumpTo(currentPage + 1, true)}
            aria-label="Next page"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      )}

      {gridOpen && (
        <PageGrid
          pageCount={pageCount}
          pdfUrl={pdfUrl}
          ratio={ratio}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          onJump={(n) => {
            setGridOpen(false);
            // Let the grid unmount before scrolling the reader.
            requestAnimationFrame(() => jumpTo(n, false));
          }}
          onClose={() => setGridOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Page grid overlay ──────────────────────────────────────────────────
function PageGrid({
  pageCount,
  pdfUrl,
  ratio,
  bookmarks,
  onToggleBookmark,
  onJump,
  onClose,
}: {
  pageCount: number;
  pdfUrl: string;
  ratio: number;
  bookmarks: Bookmark[];
  onToggleBookmark: (n: number) => void;
  onJump: (n: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "bookmarks">("all");

  const bmByPage = useMemo(
    () => new Map(bookmarks.map((b) => [b.page, b.title] as const)),
    [bookmarks],
  );

  const pages = useMemo(() => {
    let list = Array.from({ length: pageCount }, (_, i) => i + 1);
    if (mode === "bookmarks") list = list.filter((n) => bmByPage.has(n));
    const q = query.trim().toLowerCase();
    if (q) {
      if (/^\d+$/.test(q)) {
        list = list.filter((n) => String(n).includes(q));
      } else {
        list = list.filter((n) => (bmByPage.get(n) ?? "").toLowerCase().includes(q));
      }
    }
    return list;
  }, [pageCount, mode, query, bmByPage]);

  return (
    <div className="msr-grid-screen">
      <div className="msr-grid-bar">
        <div className="msr-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search page # or bookmark"
            autoFocus
          />
        </div>
        <button className="msr-icon" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="msr-grid-filter">
        <button data-on={mode === "all" ? "1" : "0"} onClick={() => setMode("all")}>
          All pages
        </button>
        <button
          data-on={mode === "bookmarks" ? "1" : "0"}
          onClick={() => setMode("bookmarks")}
        >
          Bookmarks
        </button>
      </div>
      <div className="msr-grid">
        {pages.map((n) => (
          <PageThumb
            key={n}
            n={n}
            pdfUrl={pdfUrl}
            ratio={ratio}
            bookmarked={bmByPage.has(n)}
            title={bmByPage.get(n) || ""}
            onJump={onJump}
            onToggle={onToggleBookmark}
          />
        ))}
        {pages.length === 0 && (
          <div className="msr-grid-empty">No matching pages.</div>
        )}
      </div>
    </div>
  );
}

function PageThumb({
  n,
  pdfUrl,
  ratio,
  bookmarked,
  title,
  onJump,
  onToggle,
}: {
  n: number;
  pdfUrl: string;
  ratio: number;
  bookmarked: boolean;
  title: string;
  onJump: (n: number) => void;
  onToggle: (n: number) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [src, setSrc] = useState<string | null>(
    () => thumbCache.get(`${pdfUrl}::${n}`) ?? null,
  );

  useEffect(() => {
    if (src) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        (async () => {
          try {
            const pdf = await loadPdfDocument(pdfUrl);
            const page = await pdf.getPage(n);
            const vp1 = page.getViewport({ scale: 1 });
            const vp = page.getViewport({ scale: 240 / vp1.width });
            const c = document.createElement("canvas");
            c.width = Math.floor(vp.width);
            c.height = Math.floor(vp.height);
            await page.render({ canvas: c, viewport: vp }).promise;
            const data = c.toDataURL("image/jpeg", 0.7);
            thumbCache.set(`${pdfUrl}::${n}`, data);
            if (!cancelled) setSrc(data);
          } catch {
            // ignore
          }
        })();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [n, pdfUrl, src]);

  return (
    <button ref={ref} className="msr-thumb" onClick={() => onJump(n)}>
      <div className="msr-thumb-img" style={{ aspectRatio: `1 / ${ratio}` }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Page ${n}`} />
        ) : (
          <div className="msr-thumb-ph" />
        )}
        <span
          className="msr-thumb-bm"
          data-on={bookmarked ? "1" : "0"}
          role="button"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark page"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(n);
          }}
        >
          <BookmarkIcon size={15} fill={bookmarked ? "currentColor" : "none"} />
        </span>
      </div>
      <div className="msr-thumb-cap">
        <b>{n}</b>
        {title ? <span>{title}</span> : null}
      </div>
    </button>
  );
}
