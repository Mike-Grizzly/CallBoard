export default function Loading() {
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
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
          Loading script…
        </span>
      </div>
    </div>
  );
}
