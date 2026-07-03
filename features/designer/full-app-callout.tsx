import Link from "next/link";

/**
 * High-visibility "level up to the full app" callout used at every designer
 * billing surface (Focus settings, the seatless paywall, the tool-lock modal).
 * A bordered accent card with a real button — NOT a text link: `.btn-link`
 * only exists in the marketing stylesheet, so inside the app it rendered as
 * unstyled low-contrast text that didn't read as clickable (worst in dark
 * mode). Pure presentational component — safe in server and client trees.
 */
export function FullAppCallout({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/focus/full-app"
      style={{ textDecoration: "none", display: "block", marginTop: compact ? 4 : 16 }}
    >
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: compact ? "10px 12px" : "14px 16px",
          borderColor: "var(--accent)",
          background:
            "linear-gradient(90deg, var(--accent-soft), var(--bg-elev) 70%)",
          textAlign: "left",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: compact ? 13.5 : 14.5,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            Running a company? Get the full app
          </div>
          <div
            className="muted"
            style={{ fontSize: compact ? 12 : 12.5, marginTop: 2, lineHeight: 1.45 }}
          >
            Reports, calendar, documents, people — free for 60 days, and
            everything you&apos;ve built carries over.
          </div>
        </div>
        <span
          className="btn primary"
          style={{
            whiteSpace: "nowrap",
            pointerEvents: "none",
            fontSize: compact ? 12.5 : 13,
          }}
          aria-hidden
        >
          See the full app →
        </span>
      </div>
    </Link>
  );
}
