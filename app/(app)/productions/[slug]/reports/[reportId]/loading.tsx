export default function Loading() {
  return (
    <div className="page-narrow anim-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card card-pad">
        <div className="skeleton-line" style={{ width: 140, height: 14, marginBottom: 12 }} />
        <div className="skeleton-line" style={{ width: 180, height: 11, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: 320, height: 26, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: 260, height: 12 }} />
      </div>
      <div className="grid grid-2" style={{ gap: 16 }}>
        <div className="card card-pad" style={{ minHeight: 110 }}>
          <div className="skeleton-line" style={{ width: 90, height: 13, marginBottom: 14 }} />
          <div className="skeleton-line" style={{ width: "70%", height: 18 }} />
        </div>
        <div className="card card-pad" style={{ minHeight: 110 }}>
          <div className="skeleton-line" style={{ width: 120, height: 13, marginBottom: 14 }} />
          <div className="skeleton-line" style={{ width: "60%", height: 14 }} />
        </div>
      </div>
      <div className="card card-pad" style={{ minHeight: 280 }}>
        <div className="skeleton-line" style={{ width: 160, height: 14, marginBottom: 16 }} />
        <div className="grid grid-2" style={{ gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{ padding: 14, border: "1px solid var(--border)", borderRadius: "var(--radius-s)" }}
            >
              <div className="skeleton-line" style={{ width: 100, height: 12, marginBottom: 10 }} />
              <div className="skeleton-line" style={{ width: "85%", height: 11 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
