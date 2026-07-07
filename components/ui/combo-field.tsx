"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/**
 * A "pick or type" text field with a visible dropdown chevron and an app-styled
 * suggestion menu. Suggests known values (scenes, characters, people) but always
 * accepts free-typed text for guests, understudies, ensemble, or anything not in
 * the system.
 *
 * The menu is portaled to <body> and positioned with fixed coordinates from the
 * input's rect, so it can never be clipped or stacked-under by an ancestor
 * (cards, grids, overflow containers).
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
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const { width: styleWidth, ...restStyle } = style ?? {};

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

  const showPop = open && matches.length > 0 && rect !== null;

  function measure() {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.bottom + 4, width: r.width });
  }

  function openPop() {
    measure();
    setActive(0);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inputRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <>
      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: styleWidth ?? "100%",
          verticalAlign: "top",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className={className}
          style={{ ...restStyle, width: "100%", paddingRight: 26 }}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          role="combobox"
          aria-expanded={showPop}
          aria-controls={listId}
          onChange={(e) => {
            onChange(e.target.value);
            openPop();
          }}
          onFocus={openPop}
          onClick={openPop}
          onKeyDown={(e) => {
            if (!showPop) {
              if (e.key === "ArrowDown") openPop();
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
              choose(matches[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Show suggestions"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            openPop();
          }}
          style={{
            position: "absolute",
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
            display: "inline-flex",
            padding: 2,
            background: "none",
            border: "none",
            color: "var(--ink-3)",
            cursor: "pointer",
          }}
        >
          <ChevronDown size={14} aria-hidden />
        </button>
      </div>
      {showPop &&
        createPortal(
          <div
            ref={popRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              minWidth: 180,
              maxHeight: 240,
              overflowY: "auto",
              zIndex: 9999,
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
                  choose(o);
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
          </div>,
          document.body,
        )}
    </>
  );
}
