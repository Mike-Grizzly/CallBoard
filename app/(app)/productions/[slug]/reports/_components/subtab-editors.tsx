"use client";

import { Icon } from "@/components/ui/icon";
import { MentionInput } from "@/components/ui/mention-input";
import { ComboField } from "@/components/ui/combo-field";
import type { MentionMember } from "@/components/ui/mention-textarea";
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
  members = [],
}: {
  changes: ScheduleChange[];
  onChange: (next: ScheduleChange[]) => void;
  members?: MentionMember[];
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
            <MentionInput
              value={s.what}
              onChange={(v) => update(i, { what: v })}
              members={members}
              placeholder="What changed (type @ to mention)"
              singleLine
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
  members = [],
  characterOptions = [],
}: {
  lines: LineNote[];
  onChange: (next: LineNote[]) => void;
  members?: MentionMember[];
  /** The show's characters, for autofill; free-typing is still allowed. */
  characterOptions?: readonly string[];
}) {
  const update = (i: number, patch: Partial<LineNote>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const add = () => onChange([...lines, { who: "", line: "", issue: "" }]);
  const remove = (i: number) => onChange(lines.filter((_, j) => j !== i));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          className="muted"
          style={{ fontSize: 12.5, lineHeight: 1.5, padding: "0 12px 2px" }}
        >
          Flag line issues from the run — dropped, paraphrased, added, or a
          called line. One row per note; the line/cue is optional.
        </div>
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
            <ComboField
              value={l.who}
              onChange={(v) => update(i, { who: v })}
              options={characterOptions}
              placeholder="Character"
              ariaLabel="Character"
            />
            <input
              type="text"
              value={l.line}
              placeholder="Scripted line or cue"
              onChange={(e) => update(i, { line: e.target.value })}
              className="field"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
            <MentionInput
              value={l.issue}
              onChange={(v) => update(i, { issue: v })}
              members={members}
              placeholder="What happened — dropped, paraphrased, called…"
              singleLine
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
  members = [],
  personOptions = [],
}: {
  injuries: Injury[];
  onChange: (next: Injury[]) => void;
  members?: MentionMember[];
  /** Production people, for autofill; free-typing is still allowed. */
  personOptions?: readonly string[];
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
              <ComboField
                value={inj.who}
                onChange={(v) => update(i, { who: v })}
                options={personOptions}
                placeholder="Person"
                ariaLabel="Person"
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
            <MentionInput
              value={inj.text}
              onChange={(v) => update(i, { text: v })}
              members={members}
              placeholder="Description, treatment, follow-up…"
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
