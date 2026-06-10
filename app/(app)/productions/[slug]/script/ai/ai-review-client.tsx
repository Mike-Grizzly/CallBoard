"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Users,
  ListTree,
  Info,
  Bookmark as BookmarkIcon,
} from "lucide-react";
import {
  applyScriptParse,
  discardScriptParse,
  fetchLatestScriptParse,
  reparseWithNotes,
} from "@/features/scripts/actions";
import { ROLE_TYPES } from "@/features/productions/wizard-constants";
import type {
  ScriptParseResult,
  ParsedRole,
  ParsedScene,
  ParsedBookmark,
} from "@/features/scripts/constants";

type ParseRow = {
  id: string;
  documentId: string | null;
  status: string;
  result: unknown;
  error: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  documentTitle: string;
};

type RoleEdit = ParsedRole & { key: string };
type SceneEdit = ParsedScene & { key: string };
type BookmarkEdit = ParsedBookmark & { key: string };

let keySeq = 0;
const nextKey = () => `k${keySeq++}`;

type ParseUsage = {
  used: number;
  limit: number;
  remaining: number;
  windowDays: number;
};

export function AiReviewClient({
  slug,
  productionId,
  initialParse,
  usage,
}: {
  slug: string;
  productionId: string;
  initialParse: ParseRow | null;
  usage: ParseUsage;
}) {
  const router = useRouter();
  const [parse, setParse] = useState<ParseRow | null>(initialParse);

  // Poll while the analysis is still running.
  const pollingRef = useRef(false);
  useEffect(() => {
    if (parse?.status !== "processing") return;
    pollingRef.current = true;
    const tick = async () => {
      const latest = (await fetchLatestScriptParse(productionId)) as ParseRow | null;
      if (!pollingRef.current) return;
      if (latest) setParse(latest);
    };
    const interval = setInterval(tick, 3000);
    return () => {
      pollingRef.current = false;
      clearInterval(interval);
    };
  }, [parse?.status, productionId]);

  return (
    <div className="anim-in" style={{ maxWidth: 820, margin: "0 auto", padding: "8px 0 64px" }}>
      <Link
        href={`/productions/${slug}/documents`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--ink-3)",
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={14} /> Documents
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={20} style={{ color: "var(--accent)" }} />
          <h1
            style={{
              fontFamily: "var(--font-display, Newsreader), serif",
              fontSize: 26,
              margin: 0,
            }}
          >
            AI Script Setup
          </h1>
        </div>
        <ParseQuota usage={usage} />
      </div>
      <p style={{ color: "var(--ink-3)", fontSize: 14, margin: "0 0 12px" }}>
        Claude reads your script and proposes a cast list, scene breakdown, and
        bookmarks. Review and edit below — nothing is saved to the production
        until you apply it.
      </p>
      <div
        style={{
          display: "flex",
          gap: 9,
          alignItems: "flex-start",
          padding: "10px 12px",
          margin: "0 0 24px",
          borderRadius: 8,
          background: "var(--c-amber-soft)",
          border: "1px solid color-mix(in oklch, var(--c-amber) 35%, transparent)",
        }}
      >
        <Info size={15} style={{ color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>
          Results vary with how a script is formatted. Modern scripts that clearly
          label songs and scene headings read best; older or lightly-formatted PDFs
          may need a tweak or two — songs are usually spot-on, scenes can blend in.
          Always give it a quick review, and use <strong>“Not quite right?”</strong>{" "}
          below to refine without re-uploading.
        </p>
      </div>

      {!parse && <EmptyState slug={slug} />}
      {parse?.status === "processing" && <Processing />}
      {parse?.status === "failed" && <Failed error={parse.error} slug={slug} />}
      {parse?.status === "applied" && (
        <Applied
          slug={slug}
          parseId={parse.id}
          onReanalyze={(newId) =>
            setParse((p) =>
              p
                ? { ...p, id: newId, status: "processing", result: null, error: null }
                : p,
            )
          }
        />
      )}
      {parse?.status === "ready" && (
        <ReviewForm
          parseId={parse.id}
          result={parse.result as ScriptParseResult}
          slug={slug}
          onApplied={() =>
            setParse((p) => (p ? { ...p, status: "applied" } : p))
          }
          onDiscarded={() => router.push(`/productions/${slug}/documents`)}
          onReanalyze={(newId) =>
            setParse((p) =>
              p
                ? { ...p, id: newId, status: "processing", result: null, error: null }
                : p,
            )
          }
        />
      )}

      {(parse?.inputTokens != null || parse?.outputTokens != null) && (
        <p
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            marginTop: 20,
            textAlign: "right",
          }}
        >
          {parse.inputTokens === 0 && parse.outputTokens === 0
            ? "Reused a previously verified breakdown of this script — no AI tokens used."
            : `Analysis used ${(parse.inputTokens ?? 0).toLocaleString()} input + ${(parse.outputTokens ?? 0).toLocaleString()} output tokens.`}
        </p>
      )}
    </div>
  );
}

/**
 * Small pill showing how many AI analyses remain for this production in the
 * rolling window, so directors aren't surprised when they hit the cap.
 */
function ParseQuota({ usage }: { usage: ParseUsage }) {
  const out = usage.remaining <= 0;
  const low = !out && usage.remaining <= 1;
  const fg = out ? "var(--c-clay)" : low ? "var(--c-amber)" : "var(--ink-3)";
  return (
    <span
      title={`${usage.used} of ${usage.limit} AI analyses used in the last ${usage.windowDays} days`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 600,
        color: fg,
        background: "var(--bg-muted)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "4px 11px",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Sparkles size={13} />
      {out
        ? `0 of ${usage.limit} analyses left`
        : `${usage.remaining} of ${usage.limit} analyses left`}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <Card>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 12px" }}>
        No analysis yet. Open a script in the Documents tab, use its menu, and
        choose <strong>Analyze with AI</strong>.
      </p>
      <Link href={`/productions/${slug}/documents`} style={primaryLink}>
        Go to Documents
      </Link>
    </Card>
  );
}

function Processing() {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          className="pdf-spinner"
          style={{ width: 22, height: 22, flexShrink: 0 }}
          aria-hidden
        />
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
            Analyzing your script…
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "4px 0 0" }}>
            This usually takes a minute or two for a full script. You can leave
            this page — we&apos;ll send you a notification when it&apos;s ready
            to review.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Failed({ error, slug }: { error: string | null; slug: string }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <AlertTriangle size={20} style={{ color: "var(--c-clay)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
            Analysis didn&apos;t finish
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "4px 0 14px" }}>
            {error ?? "Something went wrong while reading the script."}
          </p>
          <Link href={`/productions/${slug}/documents`} style={primaryLink}>
            Back to Documents
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Applied({
  slug,
  parseId,
  onReanalyze,
}: {
  slug: string;
  parseId: string;
  onReanalyze: (newParseId: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "color-mix(in oklch, var(--accent) 16%, transparent)",
              color: "var(--accent)",
            }}
          >
            <Check size={18} />
          </span>
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Applied to your production
          </p>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 16px" }}>
          The cast list and scene breakdown are now set up, and bookmarks have
          been added to the script for everyone on the team.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/productions/${slug}/members`} style={primaryLink}>
            Assign actors
          </Link>
          <Link href={`/productions/${slug}/script`} style={ghostLink}>
            Open script
          </Link>
          <Link href={`/productions/${slug}/blocking`} style={ghostLink}>
            Blocking
          </Link>
        </div>
      </Card>

      <ReanalyzeBox
        parseId={parseId}
        onReanalyze={onReanalyze}
        intro="Re-run the analysis on the same script — no need to re-upload. Applying again refreshes the cast, scenes, and AI bookmarks (your own bookmarks are kept)."
      />
    </div>
  );
}

/**
 * Re-run the analysis on the existing (already-uploaded) script with free-text
 * corrections. Used both while reviewing a fresh parse and after one has been
 * applied, so the AI page is a persistent home for refining the breakdown.
 */
function ReanalyzeBox({
  parseId,
  onReanalyze,
  intro,
}: {
  parseId: string;
  onReanalyze: (newParseId: string) => void;
  intro?: string;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setError(null);
    if (!notes.trim()) {
      setError("Add a note describing what to fix.");
      return;
    }
    startTransition(async () => {
      const res = await reparseWithNotes(parseId, notes.trim());
      if (res.error || !res.parseId) {
        setError(res.error ?? "Could not re-analyze.");
        return;
      }
      fetch(`/api/scripts/${res.parseId}/run`, { method: "POST" }).catch(() => {});
      onReanalyze(res.parseId);
    });
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={16} style={{ color: "var(--accent)" }} />
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Not quite right?</h2>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "6px 0 0" }}>
        {intro ??
          "Tell the AI what was wrong and re-run it — e.g. “songs are misnumbered after page 30, use the printed ‘No. X’ labels” or “page 45 isn’t a new scene.”"}
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What should the AI fix on the next pass?"
        rows={3}
        style={{ ...textInput, width: "100%", marginTop: 12, resize: "vertical", fontFamily: "inherit" }}
      />
      <button onClick={run} disabled={isPending || !notes.trim()} style={{ ...ghostBtn, marginTop: 10 }}>
        <Sparkles size={14} /> Re-analyze with notes
      </button>
      <p style={{ fontSize: 11, color: "var(--ink-3)", margin: "8px 0 0" }}>
        Re-running starts a fresh analysis (counts toward your limit).
      </p>
      {error && (
        <p style={{ color: "var(--c-clay)", fontSize: 13, margin: "8px 0 0" }}>{error}</p>
      )}
    </Card>
  );
}

function ReviewForm({
  parseId,
  result,
  slug,
  onApplied,
  onDiscarded,
  onReanalyze,
}: {
  parseId: string;
  result: ScriptParseResult;
  slug: string;
  onApplied: () => void;
  onDiscarded: () => void;
  onReanalyze: (newParseId: string) => void;
}) {
  const [roles, setRoles] = useState<RoleEdit[]>(
    (result?.roles ?? []).map((r) => ({ ...r, key: nextKey() })),
  );
  const [scenes, setScenes] = useState<SceneEdit[]>(
    (result?.scenes ?? []).map((s) => ({ ...s, key: nextKey() })),
  );
  const [bookmarks, setBookmarks] = useState<BookmarkEdit[]>(
    (result?.bookmarks ?? []).map((b) => ({ ...b, key: nextKey() })),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function apply() {
    setError(null);
    const payload: ScriptParseResult = {
      title: result?.title ?? "",
      roles: roles
        .map(({ name, type }) => ({ name: name.trim(), type }))
        .filter((r) => r.name.length > 0),
      scenes: scenes
        .map(({ actNumber, sceneNumber, title }) => ({
          actNumber,
          sceneNumber,
          title: title.trim(),
        }))
        .filter((s) => s.title.length > 0),
      bookmarks: bookmarks.map(({ page, title, kind }) => ({
        page,
        title: title.trim(),
        kind,
      })),
    };
    startTransition(async () => {
      const res = await applyScriptParse(parseId, payload);
      if (res.error) setError(res.error);
      else onApplied();
    });
  }

  function discard() {
    if (!confirm("Discard this analysis? You can run it again later.")) return;
    startTransition(async () => {
      await discardScriptParse(parseId);
      onDiscarded();
    });
  }

  const songs = bookmarks.filter((b) => b.kind === "song");
  const sceneMarks = bookmarks.filter((b) => b.kind === "scene");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Cast */}
      <Card>
        <SectionHeader
          icon={<Users size={16} />}
          title="Cast & characters"
          count={roles.length}
          hint="Set each character's prominence. You'll assign actors later."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {roles.map((r, i) => (
            <div key={r.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={r.name}
                onChange={(e) =>
                  setRoles((rs) =>
                    rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  )
                }
                placeholder="Character name"
                style={{ ...textInput, flex: 1 }}
              />
              <select
                value={r.type}
                onChange={(e) =>
                  setRoles((rs) =>
                    rs.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)),
                  )
                }
                style={{ ...textInput, width: 150 }}
              >
                {ROLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <RowDelete onClick={() => setRoles((rs) => rs.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
        <AddRow
          label="Add character"
          onClick={() =>
            setRoles((rs) => [...rs, { name: "", type: "Principal", key: nextKey() }])
          }
        />
      </Card>

      {/* Scenes */}
      <Card>
        <SectionHeader
          icon={<ListTree size={16} />}
          title="Scene breakdown"
          count={scenes.length}
          hint="Acts and scenes for the blocking tool — add beats inside each later."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {scenes.map((s, i) => (
            <div key={s.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <NumberField
                label="Act"
                value={s.actNumber}
                onChange={(v) =>
                  setScenes((ss) =>
                    ss.map((x, j) => (j === i ? { ...x, actNumber: v } : x)),
                  )
                }
              />
              <NumberField
                label="Sc"
                value={s.sceneNumber}
                onChange={(v) =>
                  setScenes((ss) =>
                    ss.map((x, j) => (j === i ? { ...x, sceneNumber: v } : x)),
                  )
                }
              />
              <input
                value={s.title}
                onChange={(e) =>
                  setScenes((ss) =>
                    ss.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                  )
                }
                placeholder="Scene title"
                style={{ ...textInput, flex: 1 }}
              />
              <RowDelete onClick={() => setScenes((ss) => ss.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
        <AddRow
          label="Add scene"
          onClick={() =>
            setScenes((ss) => [
              ...ss,
              {
                actNumber: ss.length ? ss[ss.length - 1].actNumber : 1,
                sceneNumber: (ss[ss.length - 1]?.sceneNumber ?? 0) + 1,
                title: "",
                key: nextKey(),
              },
            ])
          }
        />
      </Card>

      {/* Bookmarks */}
      <Card>
        <SectionHeader
          icon={<BookmarkIcon size={16} />}
          title="Bookmarks"
          count={bookmarks.length}
          hint="Jump points added to everyone's script reader."
        />
        {sceneMarks.length === 0 && songs.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 12 }}>
            No bookmarks were detected.
          </p>
        )}
        {sceneMarks.length > 0 && (
          <BookmarkGroup
            label="Scenes"
            items={bookmarks}
            kind="scene"
            setBookmarks={setBookmarks}
          />
        )}
        {songs.length > 0 && (
          <BookmarkGroup
            label="Musical numbers"
            items={bookmarks}
            kind="song"
            setBookmarks={setBookmarks}
          />
        )}
      </Card>

      {/* Re-analyze with corrections — same flow, runs on the existing file */}
      <ReanalyzeBox parseId={parseId} onReanalyze={onReanalyze} />

      {error && (
        <p style={{ color: "var(--c-clay)", fontSize: 13, margin: 0 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={apply} disabled={isPending} style={primaryBtn}>
          <Check size={15} /> Apply to production
        </button>
        <button onClick={discard} disabled={isPending} style={ghostBtn}>
          Discard
        </button>
        <Link href={`/productions/${slug}/script`} style={{ ...ghostBtn, textDecoration: "none" }}>
          Cancel
        </Link>
      </div>
    </div>
  );
}

function BookmarkGroup({
  label,
  items,
  kind,
  setBookmarks,
}: {
  label: string;
  items: BookmarkEdit[];
  kind: "scene" | "song";
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkEdit[]>>;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <p
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color: "var(--ink-3)",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items
          .map((b, idx) => ({ b, idx }))
          .filter(({ b }) => b.kind === kind)
          .map(({ b, idx }) => (
            <div key={b.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 11,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--ink-3)",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "3px 7px",
                  minWidth: 52,
                  textAlign: "center",
                }}
              >
                p.{b.page}
              </span>
              <input
                value={b.title}
                onChange={(e) =>
                  setBookmarks((bs) =>
                    bs.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)),
                  )
                }
                style={{ ...textInput, flex: 1 }}
              />
              <RowDelete onClick={() => setBookmarks((bs) => bs.filter((_, j) => j !== idx))} />
            </div>
          ))}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  hint: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
        <span
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            background: "var(--bg-muted)",
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          {count}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "6px 0 0" }}>{hint}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
        style={{ ...textInput, width: 52, textAlign: "center" }}
      />
    </label>
  );
}

function RowDelete({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Remove"
      style={{
        display: "grid",
        placeItems: "center",
        width: 30,
        height: 30,
        flexShrink: 0,
        border: "none",
        background: "transparent",
        color: "var(--ink-3)",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      <Trash2 size={14} />
    </button>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        fontSize: 13,
        color: "var(--accent)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <Plus size={14} /> {label}
    </button>
  );
}

const textInput: React.CSSProperties = {
  fontSize: 13,
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--bg)",
  color: "var(--ink)",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  fontWeight: 600,
  padding: "10px 18px",
  border: "none",
  borderRadius: 9,
  background: "var(--ink)",
  color: "var(--bg-elev)",
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  padding: "10px 16px",
  border: "1px solid var(--border)",
  borderRadius: 9,
  background: "transparent",
  color: "var(--ink-2)",
  cursor: "pointer",
};

const primaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  padding: "9px 16px",
  borderRadius: 9,
  background: "var(--ink)",
  color: "var(--bg-elev)",
  textDecoration: "none",
};

const ghostLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  padding: "9px 16px",
  borderRadius: 9,
  border: "1px solid var(--border)",
  color: "var(--ink-2)",
  textDecoration: "none",
};
