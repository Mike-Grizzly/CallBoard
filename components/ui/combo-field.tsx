"use client";

import { useId } from "react";

/**
 * A "pick or type" text field: suggests known values (scenes, characters,
 * people) via a native <datalist> but still accepts any free-typed value —
 * for guests, understudies, ensemble, or anything not in the system. Used by
 * the rehearsal-report editors to wire their inputs to the show's real data
 * without forcing a match.
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
  // Stable, id-safe (React's useId contains colons that some browsers dislike
  // in the `list` reference).
  const listId = `cf-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // De-dupe + drop blanks so the suggestion list stays clean.
  const seen = new Set<string>();
  const suggestions = options.filter((o) => {
    const t = o.trim();
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  return (
    <>
      <input
        type="text"
        list={suggestions.length ? listId : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
        aria-label={ariaLabel}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </>
  );
}
