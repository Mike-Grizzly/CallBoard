"use client";

import dynamic from "next/dynamic";

/**
 * Lazy entry point for the TipTap editor. TipTap and its extensions are
 * ~300KB; loading them on demand keeps them out of the initial bundle for
 * pages that only mount the editor after interaction.
 */
export const RichTextEditor = dynamic(
  () => import("./rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-md border border-[color:var(--border)]"
        style={{ minHeight: "200px" }}
      />
    ),
  },
);
