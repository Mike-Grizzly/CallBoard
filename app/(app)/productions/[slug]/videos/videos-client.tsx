"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clapperboard,
  Gauge,
  Plus,
  Send,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  formatTimecode,
  gradientForId,
  type VideoProvider,
} from "@/features/videos/constants";
import { buildShareUrl } from "@/features/videos/validation";
import type { VideoWithMeta, TimestampNoteRow } from "@/features/videos/queries";
import {
  createVideo,
  deleteVideo,
  setVideoDuration,
  addTimestampNote,
  deleteTimestampNote,
  fetchTimestampNotes,
} from "@/features/videos/actions";
import { VideoPlayer, type PlayerHandle } from "./video-player";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function personName(
  first: string | null,
  last: string | null,
  email: string,
): string {
  return `${first ?? ""} ${last ?? ""}`.trim() || email;
}

function shortDate(value: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VideosClient({
  videos,
  initialNotes,
  productionId,
  canCreate,
  canManage,
  currentUserId,
}: {
  videos: VideoWithMeta[];
  initialNotes: TimestampNoteRow[];
  productionId: string;
  canCreate: boolean;
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const playerRef = useRef<PlayerHandle>(null);

  const [selectedId, setSelectedId] = useState<string | null>(
    videos[0]?.id ?? null,
  );
  const [notes, setNotes] = useState<TimestampNoteRow[]>(initialNotes);
  const [currentTime, setCurrentTime] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(2); // 1×
  const [noteBody, setNoteBody] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share clip");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = videos.find((v) => v.id === selectedId) ?? null;

  // Poll the player for the playhead so the "add note at …" affordances track
  // playback live (matches the concept's "@ 4:47" labels).
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => {
      void playerRef.current?.getCurrentTime().then((t) => {
        if (Number.isFinite(t)) setCurrentTime(t);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selected]);

  const reloadNotes = useCallback((videoId: string) => {
    void fetchTimestampNotes(videoId).then(setNotes);
  }, []);

  // Switch the active video: reset the playhead and load its notes. Done in the
  // handler (not an effect) so we don't trigger cascading renders. The initial
  // selection is seeded from props (initialNotes), so no load is needed then.
  const selectVideo = useCallback(
    (videoId: string | null) => {
      setSelectedId(videoId);
      setCurrentTime(0);
      if (videoId) reloadNotes(videoId);
      else setNotes([]);
    },
    [reloadNotes],
  );

  const handleReady = useCallback(
    (duration: number) => {
      if (selected && selected.durationSeconds == null) {
        void setVideoDuration(selected.id, duration);
      }
    },
    [selected],
  );

  function cycleSpeed() {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    playerRef.current?.setPlaybackRate(SPEEDS[next]);
  }

  function seekTo(seconds: number) {
    playerRef.current?.seekTo(seconds);
    setCurrentTime(seconds);
  }

  async function copyShareLink() {
    if (!selected) return;
    const url = buildShareUrl(
      selected.provider as VideoProvider,
      selected.videoId,
      selected.embedHash,
      currentTime,
    );
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied!");
      setTimeout(() => setShareLabel("Share clip"), 1800);
    } catch {
      setShareLabel("Copy failed");
      setTimeout(() => setShareLabel("Share clip"), 1800);
    }
  }

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !noteBody.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set("video_id", selected.id);
    fd.set("body", noteBody.trim());
    fd.set("seconds", String(Math.round(currentTime)));
    startTransition(async () => {
      const res = await addTimestampNote(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNoteBody("");
      reloadNotes(selected.id);
      router.refresh();
    });
  }

  function removeNote(noteId: string) {
    const fd = new FormData();
    fd.set("note_id", noteId);
    startTransition(async () => {
      const res = await deleteTimestampNote(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (selectedId) reloadNotes(selectedId);
      router.refresh();
    });
  }

  function removeVideo(videoId: string) {
    const fd = new FormData();
    fd.set("video_id", videoId);
    startTransition(async () => {
      const res = await deleteVideo(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (selectedId === videoId) {
        const remaining = videos.filter((v) => v.id !== videoId);
        selectVideo(remaining[0]?.id ?? null);
      }
      router.refresh();
    });
  }

  // ---- Empty state ----
  if (videos.length === 0) {
    return (
      <>
        {showAddForm && (
          <AddVideoForm
            productionId={productionId}
            onClose={() => setShowAddForm(false)}
            onError={setError}
          />
        )}
        <div
          className="anim-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            gap: 12,
            color: "var(--ink-3)",
            textAlign: "center",
          }}
        >
          <Clapperboard size={48} strokeWidth={1.2} aria-hidden />
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-2)" }}>
            No rehearsal videos yet
          </p>
          <p style={{ fontSize: 13, maxWidth: 360 }}>
            {canCreate
              ? "Paste a YouTube or Vimeo link to share rehearsal footage with the cast and crew. The video stays on the platform — nothing is uploaded here."
              : "A stage manager or member of the creative team can link rehearsal footage from YouTube or Vimeo here."}
          </p>
          {canCreate && (
            <button
              type="button"
              className="btn primary"
              onClick={() => setShowAddForm(true)}
              style={{ marginTop: 4 }}
            >
              <Plus className="ico" aria-hidden />
              <span>Add a video</span>
            </button>
          )}
        </div>
      </>
    );
  }

  const speed = SPEEDS[speedIndex];

  return (
    <div className="anim-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div
          role="alert"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            padding: "8px 12px",
            borderRadius: "var(--radius-s)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Add button row */}
      {canCreate && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="ico" aria-hidden />
            <span>Add video</span>
          </button>
        </div>
      )}

      {showAddForm && (
        <AddVideoForm
          productionId={productionId}
          onClose={() => setShowAddForm(false)}
          onError={setError}
        />
      )}

      {/* Player + timestamp notes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          {/* Now playing header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                }}
              >
                Now playing
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selected?.title}
              </div>
            </div>
            {selected?.recordedDate && (
              <span
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "var(--c-amber)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--c-amber)",
                  }}
                />
                REC {shortDate(selected.recordedDate)}
              </span>
            )}
          </div>

          {/* 16:9 player */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              background: "#000",
              borderRadius: "var(--radius)",
              overflow: "hidden",
            }}
          >
            {selected && (
              <VideoPlayer
                key={selected.id}
                ref={playerRef}
                provider={selected.provider as VideoProvider}
                videoId={selected.videoId}
                embedHash={selected.embedHash}
                onReady={handleReady}
              />
            )}
          </div>

          {/* Player toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--ink-3)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTimecode(currentTime)}
            </span>
            <button type="button" className="btn ghost" onClick={copyShareLink}>
              <Share2 className="ico" aria-hidden />
              <span>{shareLabel}</span>
            </button>
            <button type="button" className="btn ghost" onClick={cycleSpeed}>
              <Gauge className="ico" aria-hidden />
              <span>Speed {speed % 1 === 0 ? `${speed}.0` : speed}×</span>
            </button>
          </div>
        </div>

        {/* Timestamp notes panel */}
        <aside
          style={{
            background: "var(--bg-elev)",
            border: "1px solid var(--line, rgba(0,0,0,0.08))",
            borderRadius: "var(--radius)",
            display: "flex",
            flexDirection: "column",
            maxHeight: 560,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: "1px solid var(--line, rgba(0,0,0,0.08))",
            }}
          >
            <strong style={{ fontSize: 14 }}>Timestamps</strong>
            <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
            {notes.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-4)",
                  padding: "20px 14px",
                  textAlign: "center",
                }}
              >
                No timestamps yet. Pin a note to a moment below.
              </p>
            ) : (
              notes.map((note) => {
                const canRemove = canManage || note.authorId === currentUserId;
                return (
                  <div
                    key={note.id}
                    style={{
                      padding: "8px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => seekTo(note.seconds)}
                        style={{
                          fontSize: 11,
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                          color: "var(--accent-ink)",
                          background: "var(--accent-soft)",
                          border: "none",
                          borderRadius: 4,
                          padding: "1px 6px",
                          cursor: "pointer",
                        }}
                      >
                        {formatTimecode(note.seconds)}
                      </button>
                      <span style={{ fontSize: 12, color: "var(--ink-3)", flex: 1 }}>
                        {personName(
                          note.authorFirstName,
                          note.authorLastName,
                          note.authorEmail,
                        )}
                      </span>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => removeNote(note.id)}
                          disabled={pending}
                          aria-label="Delete note"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--ink-4)",
                            cursor: "pointer",
                            padding: 2,
                            display: "inline-flex",
                          }}
                        >
                          <Trash2 size={13} aria-hidden />
                        </button>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--ink)",
                        margin: 0,
                        cursor: "pointer",
                      }}
                      onClick={() => seekTo(note.seconds)}
                    >
                      {note.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Add note */}
          <form
            onSubmit={submitNote}
            style={{
              display: "flex",
              gap: 6,
              padding: "10px 12px",
              borderTop: "1px solid var(--line, rgba(0,0,0,0.08))",
            }}
          >
            <input
              type="text"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={`Note at ${formatTimecode(currentTime)}…`}
              maxLength={1000}
              style={{
                flex: 1,
                fontSize: 13,
                padding: "7px 10px",
                borderRadius: "var(--radius-s)",
                border: "1px solid var(--line, rgba(0,0,0,0.12))",
                background: "var(--bg)",
                color: "var(--ink)",
                minWidth: 0,
              }}
            />
            <button
              type="submit"
              className="btn primary btn-icon"
              disabled={pending || !noteBody.trim()}
              aria-label="Add timestamp note"
            >
              <Send className="ico" aria-hidden />
            </button>
          </form>
        </aside>
      </div>

      {/* Library */}
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
            marginBottom: 10,
          }}
        >
          Library · {videos.length} {videos.length === 1 ? "session" : "sessions"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {videos.map((video) => {
            const isActive = video.id === selectedId;
            return (
              <div
                key={video.id}
                style={{
                  position: "relative",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  border: isActive
                    ? "2px solid var(--accent)"
                    : "1px solid var(--line, rgba(0,0,0,0.08))",
                  background: "var(--bg-elev)",
                  cursor: "pointer",
                }}
                onClick={() => selectVideo(video.id)}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "16 / 9",
                    background: gradientForId(video.videoId),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clapperboard
                    size={28}
                    color="rgba(255,255,255,0.85)"
                    aria-hidden
                  />
                  {video.durationSeconds != null && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        fontSize: 11,
                        fontVariantNumeric: "tabular-nums",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        padding: "1px 5px",
                        borderRadius: 4,
                      }}
                    >
                      {formatTimecode(video.durationSeconds)}
                    </span>
                  )}
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {video.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--ink-4)",
                      marginTop: 3,
                    }}
                  >
                    <span>{shortDate(video.recordedDate ?? video.createdAt)}</span>
                    <span>
                      {video.noteCount ?? 0}{" "}
                      {(video.noteCount ?? 0) === 1 ? "note" : "notes"}
                    </span>
                  </div>
                </div>
                {canCreate && (
                  <button
                    type="button"
                    aria-label="Remove video"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideo(video.id);
                    }}
                    disabled={pending}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                      padding: 4,
                      display: "inline-flex",
                    }}
                  >
                    <X size={13} aria-hidden />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddVideoForm({
  productionId,
  onClose,
  onError,
}: {
  productionId: string;
  onClose: () => void;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("production_id", productionId);
    setLocalError(null);
    startTransition(async () => {
      const res = await createVideo(fd);
      if (res.error) {
        setLocalError(res.error);
        return;
      }
      onError(null);
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a rehearsal video"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-elev)",
          borderRadius: "var(--radius-l)",
          padding: 20,
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 16 }}>Add a rehearsal video</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {localError && (
          <div
            role="alert"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              padding: "8px 12px",
              borderRadius: "var(--radius-s)",
              fontSize: 13,
            }}
          >
            {localError}
          </div>
        )}

        <label style={labelStyle}>
          YouTube or Vimeo link
          <input
            name="url"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=…"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Title
          <input
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="Act II Run-through"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Recorded on (optional)
          <input name="recorded_date" type="date" style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Description (optional)
          <textarea
            name="description"
            rows={2}
            maxLength={2000}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? "Adding…" : "Add video"}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink-2)",
};

const inputStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "8px 10px",
  borderRadius: "var(--radius-s)",
  border: "1px solid var(--line, rgba(0,0,0,0.12))",
  background: "var(--bg)",
  color: "var(--ink)",
  fontWeight: 400,
};
