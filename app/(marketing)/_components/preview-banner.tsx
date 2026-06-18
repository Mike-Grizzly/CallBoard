// Fixed banner shown only while Draft Mode is active, so it's obvious you're
// viewing unpublished drafts (not the live site) and there's a one-click way
// out. A plain <a> (not next/link) guarantees a full request to the disable
// route, which clears the cookie and redirects home.
export function PreviewBanner() {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        zIndex: 2147483000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 14px",
        borderRadius: 999,
        background: "#1d1b18",
        color: "#fbf8f3",
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 6px 24px rgba(0,0,0,.28)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#e0a82e",
          display: "inline-block",
        }}
      />
      Preview mode — showing drafts
      <a
        href="/api/draft-mode/disable"
        style={{
          color: "#fbf8f3",
          textDecoration: "underline",
          textUnderlineOffset: 2,
        }}
      >
        Exit
      </a>
    </div>
  );
}
