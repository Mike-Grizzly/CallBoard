"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type Matcher } from "react-day-picker";
import "react-day-picker/style.css";
import { Icon } from "@/components/ui/icon";

type Props = {
  /** Canonical value, "YYYY-MM-DD" or "". */
  value: string;
  onChange: (value: string) => void;
  /** Inclusive bounds as "YYYY-MM-DD" (rejects typing + disables in calendar). */
  min?: string;
  max?: string;
  id?: string;
  placeholder?: string;
};

const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const US_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

function toIso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  // Reject overflow dates (e.g. Feb 30 → Mar 2).
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Parse typed text → ISO, or null if unparseable. Empty string stays "". */
function parseTyped(input: string): string | null {
  const s = input.trim();
  if (!s) return "";
  let m = s.match(ISO_RE);
  if (m) return toIso(+m[1], +m[2], +m[3]);
  m = s.match(US_RE);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return toIso(y, +m[1], +m[2]);
  }
  return null;
}

/** ISO → "MM/DD/YYYY" for display. Empty/invalid → "". */
function toDisplay(iso: string): string {
  const m = iso.match(ISO_RE);
  if (!m) return "";
  return `${m[2].padStart(2, "0")}/${m[3].padStart(2, "0")}/${m[1]}`;
}

/** ISO → local Date (noon, to dodge timezone edges). */
function isoToDate(iso: string): Date | undefined {
  const m = iso.match(ISO_RE);
  if (!m) return undefined;
  return new Date(+m[1], +m[2] - 1, +m[3], 12);
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * A typeable + pasteable date field with a calendar popover. Stores the
 * canonical "YYYY-MM-DD" the rest of the app uses, but lets people type or
 * paste MM/DD/YYYY (committed on blur/Enter so a half-typed year never lands).
 * Out-of-range values are rejected and the calendar disables them.
 */
export function DateField({
  value,
  onChange,
  min,
  max,
  id,
  placeholder,
}: Props) {
  const [text, setText] = useState(() => toDisplay(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-sync the displayed text when `value` changes from outside (calendar
  // pick, reset). Adjusting state during render — React's documented pattern —
  // rather than in an effect, which avoids a cascading-render lint error.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(toDisplay(value));
    setInvalid(false);
  }

  // Close the popover on an outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function commit(raw: string) {
    const iso = parseTyped(raw);
    if (iso === null) {
      setInvalid(true);
      return;
    }
    if (iso && ((min && iso < min) || (max && iso > max))) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(iso);
  }

  const selected = isoToDate(value);
  const weekday = selected
    ? selected.toLocaleDateString("en-US", { weekday: "short" })
    : null;

  const disabled: Matcher[] = [];
  const minDate = min ? isoToDate(min) : undefined;
  const maxDate = max ? isoToDate(max) : undefined;
  if (minDate) disabled.push({ before: minDate });
  if (maxDate) disabled.push({ after: maxDate });

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          id={id}
          className="field"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          placeholder={placeholder ?? "MM/DD/YYYY"}
          aria-invalid={invalid || undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit((e.target as HTMLInputElement).value);
            }
          }}
          style={{ paddingRight: 52 }}
        />
        {weekday && (
          <span
            style={{
              position: "absolute",
              right: 32,
              fontSize: 11,
              color: "var(--ink-4)",
              pointerEvents: "none",
            }}
          >
            {weekday}
          </span>
        )}
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => setOpen((o) => !o)}
          style={{
            position: "absolute",
            right: 6,
            display: "inline-flex",
            padding: 4,
            background: "none",
            border: "none",
            color: "var(--ink-3)",
            cursor: "pointer",
          }}
        >
          <Icon name="Calendar" size={15} aria-hidden />
        </button>
      </div>
      {invalid && (
        <div style={{ fontSize: 11, color: "var(--c-clay)", marginTop: 2 }}>
          Enter a valid date (MM/DD/YYYY).
        </div>
      )}
      {open && (
        <div
          style={
            {
              position: "absolute",
              zIndex: 50,
              marginTop: 4,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-s)",
              boxShadow: "var(--shadow-2)",
              padding: 6,
              color: "var(--ink)",
              "--rdp-accent-color": "var(--accent)",
              "--rdp-accent-background-color": "var(--accent-soft)",
              "--rdp-today-color": "var(--accent)",
            } as React.CSSProperties
          }
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected ?? minDate}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={disabled.length ? disabled : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(dateToIso(d));
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
