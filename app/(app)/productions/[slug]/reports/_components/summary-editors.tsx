"use client";

import { Icon } from "@/components/ui/icon";
import type {
  Break,
  BreakKind,
  SceneWorked,
  AttendanceNote,
} from "@/features/reports/types";

// ─── Call times + breaks ──────────────────────────────────────────────

export function CallTimesEditor({
  scheduledCall,
  actualStart,
  endTime,
  breaks,
  onBreaksChange,
  errorReportDate,
  reportDate,
  onReportDateChange,
}: {
  scheduledCall: string;
  actualStart: string;
  endTime: string;
  breaks: Break[];
  onBreaksChange: (next: Break[]) => void;
  errorReportDate?: string;
  reportDate: string;
  onReportDateChange: (v: string) => void;
}) {
  const update = (i: number, patch: Partial<Break>) =>
    onBreaksChange(breaks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const add = () =>
    onBreaksChange([...breaks, { start: "", end: "", kind: "10-min" }]);
  const remove = (i: number) =>
    onBreaksChange(breaks.filter((_, j) => j !== i));

  return (
    <div className="card card-pad">
      <h3 className="h-card" style={{ marginBottom: 10 }}>Call times</h3>
      <div className="grid grid-2" style={{ gap: 10 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="label">Date</div>
          <input
            type="date"
            name="report_date"
            value={reportDate}
            onChange={(e) => onReportDateChange(e.target.value)}
            required
            className="field"
          />
          {errorReportDate && (
            <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>
              {errorReportDate}
            </div>
          )}
        </div>
        <div>
          <div className="label">Scheduled</div>
          <input
            type="time"
            name="scheduled_call"
            defaultValue={scheduledCall}
            className="field"
          />
        </div>
        <div>
          <div className="label">Start</div>
          <input
            type="time"
            name="actual_start"
            defaultValue={actualStart}
            className="field"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="label">End</div>
          <input
            type="time"
            name="end_time"
            defaultValue={endTime}
            className="field"
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="label">Breaks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {breaks.map((b, i) => (
            <div key={i} className="row" style={{ gap: 6 }}>
              <input
                type="time"
                value={b.start}
                placeholder="Start"
                onChange={(e) => update(i, { start: e.target.value })}
                className="field"
                style={{ width: 90, fontSize: 12 }}
              />
              <input
                type="time"
                value={b.end}
                placeholder="End"
                onChange={(e) => update(i, { end: e.target.value })}
                className="field"
                style={{ width: 90, fontSize: 12 }}
              />
              <select
                value={b.kind}
                onChange={(e) =>
                  update(i, { kind: e.target.value as BreakKind })
                }
                className="field"
                style={{ flex: 1 }}
              >
                <option value="5-min">5-min</option>
                <option value="10-min">10-min</option>
                <option value="Meal">Meal</option>
              </select>
              <button
                type="button"
                onClick={() => remove(i)}
                className="btn ghost btn-icon"
                aria-label="Remove break"
              >
                <Icon name="X" size={13} aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="btn ghost"
            style={{
              alignSelf: "flex-start",
              height: 28,
              padding: "0 10px",
              fontSize: 12,
            }}
          >
            <Icon name="Plus" size={12} aria-hidden />
            <span>Add break</span>
          </button>
        </div>
      </div>
      <input type="hidden" name="breaks_json" value={JSON.stringify(breaks)} />
    </div>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────

export function AttendanceEditor({
  present,
  absent,
  late,
  notes,
  onPresentChange,
  onAbsentChange,
  onLateChange,
  onNotesChange,
}: {
  present: number;
  absent: number;
  late: number;
  notes: AttendanceNote[];
  onPresentChange: (v: number) => void;
  onAbsentChange: (v: number) => void;
  onLateChange: (v: number) => void;
  onNotesChange: (next: AttendanceNote[]) => void;
}) {
  const update = (i: number, patch: Partial<AttendanceNote>) =>
    onNotesChange(notes.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const add = () => onNotesChange([...notes, { who: "", note: "" }]);
  const remove = (i: number) =>
    onNotesChange(notes.filter((_, j) => j !== i));

  return (
    <div className="card card-pad">
      <h3 className="h-card" style={{ marginBottom: 10 }}>Attendance</h3>
      <div className="grid grid-3" style={{ gap: 8, marginBottom: 10 }}>
        <NumberStat
          name="attendance_present"
          value={present}
          onChange={onPresentChange}
          label="Present"
          c="sage"
        />
        <NumberStat
          name="attendance_absent"
          value={absent}
          onChange={onAbsentChange}
          label="Absent"
          c="amber"
        />
        <NumberStat
          name="attendance_late"
          value={late}
          onChange={onLateChange}
          label="Late"
          c=""
        />
      </div>
      <div className="label" style={{ marginTop: 6 }}>Notes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {notes.map((n, i) => (
          <div key={i} className="row" style={{ gap: 6 }}>
            <input
              type="text"
              value={n.who}
              placeholder="Who"
              onChange={(e) => update(i, { who: e.target.value })}
              className="field"
              style={{ width: 130, fontSize: 12.5 }}
            />
            <input
              type="text"
              value={n.note}
              placeholder="Excused, vocal rest…"
              onChange={(e) => update(i, { note: e.target.value })}
              className="field"
              style={{ flex: 1, fontSize: 12.5 }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="btn ghost btn-icon"
              aria-label="Remove attendance note"
            >
              <Icon name="X" size={13} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="btn ghost"
          style={{
            alignSelf: "flex-start",
            height: 28,
            padding: "0 10px",
            fontSize: 12,
          }}
        >
          <Icon name="Plus" size={12} aria-hidden />
          <span>Add note</span>
        </button>
      </div>
      <input
        type="hidden"
        name="attendance_notes_json"
        value={JSON.stringify(notes)}
      />
    </div>
  );
}

function NumberStat({
  name,
  value,
  onChange,
  label,
  c,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  label: string;
  c: string;
}) {
  const bg = c ? `var(--c-${c}-soft)` : "var(--bg-sunken)";
  const fg = c
    ? `color-mix(in oklch, var(--c-${c}) 50%, var(--ink))`
    : "var(--ink)";
  return (
    <div
      style={{
        textAlign: "center",
        padding: "10px 4px",
        background: bg,
        borderRadius: 6,
      }}
    >
      <input
        name={name}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        style={{
          width: "100%",
          border: 0,
          background: "transparent",
          textAlign: "center",
          fontSize: 22,
          fontWeight: 600,
          color: fg,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "inherit",
          outline: "none",
          padding: 0,
        }}
      />
      <div className="h-eyebrow">{label}</div>
    </div>
  );
}

// ─── Scenes worked ────────────────────────────────────────────────────

export function ScenesWorkedEditor({
  scenes,
  onChange,
}: {
  scenes: SceneWorked[];
  onChange: (next: SceneWorked[]) => void;
}) {
  const update = (i: number, patch: Partial<SceneWorked>) =>
    onChange(scenes.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () => onChange([...scenes, { label: "", pages: "", time: "" }]);
  const remove = (i: number) => onChange(scenes.filter((_, j) => j !== i));

  return (
    <div className="card card-pad">
      <h3 className="h-card" style={{ marginBottom: 10 }}>Scenes worked</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {scenes.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              background: "var(--bg-sunken)",
              borderRadius: 6,
            }}
          >
            <input
              type="text"
              value={s.label}
              placeholder="Act II, Sc. 1 — Title"
              onChange={(e) => update(i, { label: e.target.value })}
              style={{
                width: "100%",
                border: 0,
                padding: 0,
                background: "transparent",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                outline: "none",
                color: "var(--ink)",
              }}
            />
            <div className="row" style={{ gap: 8 }}>
              <input
                type="text"
                value={s.pages}
                placeholder="42–48"
                onChange={(e) => update(i, { pages: e.target.value })}
                className="field"
                style={{ width: 90, fontSize: 12 }}
              />
              <input
                type="text"
                value={s.time}
                placeholder="55m"
                onChange={(e) => update(i, { time: e.target.value })}
                className="field"
                style={{ width: 80, fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="btn ghost btn-icon"
                style={{ marginLeft: "auto" }}
                aria-label="Remove scene"
              >
                <Icon name="X" size={13} aria-hidden />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="btn ghost"
          style={{
            alignSelf: "flex-start",
            height: 28,
            padding: "0 10px",
            fontSize: 12,
          }}
        >
          <Icon name="Plus" size={12} aria-hidden />
          <span>Add scene</span>
        </button>
      </div>
      <input
        type="hidden"
        name="scenes_worked_json"
        value={JSON.stringify(scenes)}
      />
    </div>
  );
}
