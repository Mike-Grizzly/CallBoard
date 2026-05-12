"use client";

/**
 * Renders stored @{First Last} mention tokens as highlighted spans.
 * All other text is rendered as-is.
 */
export function MentionBody({ body }: { body: string }) {
  const parts = body.split(/(@\{[^}]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^@\{([^}]+)\}$/);
        if (m) {
          return (
            <span
              key={i}
              style={{
                background: "color-mix(in oklch, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                borderRadius: 3,
                padding: "0 3px",
                fontWeight: 500,
              }}
            >
              @{m[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
