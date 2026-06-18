import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 16,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Page not found</h2>
      <p style={{ color: "var(--ink-4)", maxWidth: "40ch" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link className="btn primary" href="/">
        Go home
      </Link>
    </div>
  );
}
