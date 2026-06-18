"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ color: "var(--ink-4)", maxWidth: "40ch" }}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn" onClick={reset}>
          Try again
        </button>
        <Link className="btn ghost" href="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
