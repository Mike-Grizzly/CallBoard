/**
 * Shared route-level loading fallback (S5). Rendered by each production tab's
 * `loading.tsx` so navigation shows immediate feedback instead of a frozen
 * frame while the server component streams. Centered spinner + label, matching
 * the pattern the script/blocking tabs already used.
 */
export function RouteLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="anim-in"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: 420,
        color: "var(--accent)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="pdf-spinner" aria-hidden />
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{label}</span>
      </div>
    </div>
  );
}
