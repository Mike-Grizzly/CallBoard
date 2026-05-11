"use client";

import { Icon } from "@/components/ui/icon";
import type {
  ScheduleChange,
  LineNote,
  Injury,
} from "@/features/reports/types";
import { DEPARTMENTS } from "@/features/reports/constants";

// ─── Schedule changes ─────────────────────────────────────────────────

export function ScheduleChangesEditor({
  changes,
  onChange,
}: {
  changes: ScheduleChange[];
  onChange: (next: ScheduleChange[]) => void;
}) {
  const deptOpts = DEPARTMENTS.map((d) => ({
    label: d.label.split(" /")[0],
    c: d.c,
  }));

  const update = (i: number, patch: Partial<ScheduleChange>) =>
    onChange(changes.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () =>
    onChange([...changes, { who: deptOpts[0]?.label ?? "", what: "" }]);
  const remove = (i: number) => onChange(changes.filter((_, j) => j !== i));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {changes.map((s, i) => (
          <div
            key={i}
            className="row"
            style={{
              gap: 8,
              padding: "10px 12px",
              background: "var(--bg-sunken)",
              borderRadius: 6,
            }}
          >
            <select
              value={s.who}
              onChange={(e) => {
                const opt = deptOpts.find((o) => o.label === e.target.value);
                update(i, { who: e.target.value, c: opt?.c || "" });
              }}
              className="field"
              style={{ width: 160 }}
            >
              {deptOpts.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={s.what}
              placeholder="What changed"
              onChange={(e) => update(i, { what: e.target.value })}
              className="field"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="btn ghost btn-icon"
              aria-label="Remove change"
            >
              <Icon name="X" size={13} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="btn ghost"
          style={{ alignSelf: "flex-start" }}
        >
          <Icon name="Plus" size={14} aria-hidden />
          <span>Add change</span>
        </button>
        {changes.length === 0 && (
          <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>
            No schedule changes yet.
          </div>
        )}
      </div>
      <input
        type="hidden"
        name="schedule_changes_json"
        value={JSON.stringify(changes)}
      />
    </>
  );
}

// ─── Line notes ───────────────────────────────────────────────────────

export function LineNotesEditor({
  lines,
  onChange,
}: {
  lines: LineNote[];
  onChange: (next: LineNote[]) => void;
}) {
  const update = (i: number, patch: Partial<LineNote>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const add = () => onChange([...lines, { who: "", line: "", issue: "" }]);
  const remove = (i: number) => onChange(lines.filter((_, j) => j !== i));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 220px 1fr 32px",
            gap: 8,
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
          }}
        >
          <span>Character</span>
          <span>Line / cue</span>
          <span>Note</span>
          <span></span>
        </div>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "160px 220px 1fr 32px",
              gap: 8,
              padding: "4px 12px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={l.who}
              placeholder="Frederic"
              onChange={(e) => update(i, { who: e.target.value })}
              className="field"
            />
            <input
              type="text"
              value={l.line}
              placeholder='"…line text"'
              onChange={(e) => update(i, { line: e.target.value })}
              className="field"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
            <input
              type="text"
              value={l.issue}
              placeholder="Paraphrased / dropped / clean"
              onChange={(e) => update(i, { issue: e.target.value })}
              className="field"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="btn ghost btn-icon"
              aria-label="Remove line note"
            >
              <Icon name="X" size={13} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="btn ghost"
          style={{ alignSelf: "flex-start", marginTop: 4 }}
        >
          <Icon name="Plus" size={14} aria-hidden />
          <span>Add line note</span>
        </button>
        {lines.length === 0 && (
          <div
            className="muted"
            style={{ fontSize: 13, padding: "8px 12px" }}
          >
            No line notes yet.
          </div>
        )}
      </div>
      <input
        type="hidden"
        name="line_notes_json"
        value={JSON.stringify(lines)}
      />
    </>
  );
}

// ─── Injuries ─────────────────────────────────────────────────────────

export function InjuriesEditor({
  injuries,
  onChange,
}: {
  injuries: Injury[];
  onChange: (next: Injury[]) => void;
}) {
  const update = (i: number, patch: Partial<Injury>) =>
    onChange(injuries.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () =>
    onChange([...injuries, { who: "", text: "", time: "" }]);
  const remove = (i: number) => onChange(injuries.filter((_, j) => j !== i));

  if (injuries.length === 0) {
    return (
      <>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "var(--c-sage-soft)",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <Icon name="Check" size={14} aria-hidden />
            <span>No incidents reported.</span>
            <button
              type="button"
              onClick={add}
              className="btn ghost"
              style={{
                height: 24,
                padding: "0 8px",
                fontSize: 12,
                color: "var(--accent)",
              }}
            >
              Log an incident
            </button>
          </div>
        </div>
        <input
          type="hidden"
          name="injuries_json"
          value={JSON.stringify(injuries)}
        />
      </>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {injuries.map((inj, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              background: "var(--c-amber-soft)",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div className="row" style={{ gap: 8 }}>
              <input
                type="text"
                value={inj.who}
                placeholder="Person"
                onChange={(e) => update(i, { who: e.target.value })}
                className="field"
                style={{ width: 200 }}
              />
              <input
                type="text"
                value={inj.time}
                placeholder="Time"
                onChange={(e) => update(i, { time: e.target.value })}
                className="field"
                style={{ width: 120, fontFamily: "var(--font-mono)" }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="btn ghost btn-icon"
                style={{ marginLeft: "auto" }}
                aria-label="Remove incident"
              >
                <Icon name="X" size={13} aria-hidden />
              </button>
            </div>
            <textarea
              value={inj.text}
              placeholder="Description, treatment, follow-up…"
              onChange={(e) => update(i, { text: e.target.value })}
              className="field"
              style={{ minHeight: 60 }}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="btn ghost"
          style={{ alignSelf: "flex-start" }}
        >
          <Icon name="Plus" size={14} aria-hidden />
          <span>Add incident</span>
        </button>
      </div>
      <input
        type="hidden"
        name="injuries_json"
        value={JSON.stringify(injuries)}
      />
    </>
  );
}
