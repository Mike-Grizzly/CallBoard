"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * A "pick or type" text field with an app-styled suggestion dropdown. Suggests
 * known values (scenes, characters, people) but always accepts free-typed text
 * for guests, understudies, ensemble, or anything not in the system. Custom
 * (not a native <datalist>) so the dropdown matches the rest of the UI.
 */
export function ComboField({
  value,
  onChange,
  options,
  placeholder,
  className = "field",
  style,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Suggested values; typing something else is still allowed. */
  options: readonly string[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const o of options) {
      const t = o.trim();
      if (t && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        uniq.push(t);
      }
    }
    const q = value.trim().toLowerCase();
    const list = q ? uniq.filter((o) => o.toLowerCase().includes(q)) : uniq;
    return list.slice(0, 50);
  }, [value, options]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const showPop = open && matches.length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        type="text"
        className={className}
        style={style}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-expanded={showPop}
        aria-controls={listId}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showPop) {
            if (e.key === "ArrowDown") setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            onChange(matches[active]);
            setOpen(false);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showPop && (
        <div
          id={listId}
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            minWidth: 180,
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 60,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-s)",
            boxShadow: "var(--shadow-2)",
            padding: 4,
          }}
        >
          {matches.map((o, i) => (
            <div
              key={o}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: "6px 8px",
                borderRadius: "var(--radius-s)",
                fontSize: 13,
                cursor: "pointer",
                color: "var(--ink)",
                background: i === active ? "var(--bg-muted)" : "transparent",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
