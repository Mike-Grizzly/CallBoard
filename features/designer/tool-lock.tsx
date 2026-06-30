"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDesignerPortalSession } from "@/features/designer/actions";
import { DESIGNER_PRICES, type DesignerTool } from "@/features/designer/constants";

const TOOL_LABEL: Record<DesignerTool, string> = {
  script: "Script",
  blocking: "Blocking",
};

/**
 * Shown inside the Focus shell when a Single Tool designer opens the tool their
 * seat does NOT include. The requested tool renders as a blurred, inert
 * placeholder with an upgrade modal on top — so the toggle still reflects the
 * switch they made, but the tool stays locked until they upgrade. Symmetric for
 * script-only → Blocking and blocking-only → Script.
 */
export function DesignerToolLock({
  tool,
  slug,
}: {
  tool: DesignerTool;
  slug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label = TOOL_LABEL[tool];
  const otherTool: DesignerTool = tool === "blocking" ? "script" : "blocking";

  const upgrade = () =>
    startTransition(async () => {
      setError(null);
      const res = await createDesignerPortalSession();
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? "Couldn't open billing — try again.");
    });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "78vh",
        overflow: "hidden",
      }}
    >
      {/* Blurred, inert preview of the locked tool */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          filter: "blur(7px)",
          opacity: 0.45,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {tool === "blocking" ? <BlockingPlaceholder /> : <ScriptPlaceholder />}
      </div>

      {/* Upgrade modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fx-lock-title"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "color-mix(in srgb, var(--bg) 45%, transparent)",
        }}
      >
        <div
          className="card card-pad"
          style={{
            maxWidth: 470,
            width: "100%",
            textAlign: "center",
            boxShadow: "var(--shadow-2)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <span
            style={{
              alignSelf: "center",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--accent-ink)",
              background: "var(--accent-soft)",
              border: "1px solid var(--border-strong)",
              borderRadius: 999,
              padding: "4px 12px",
            }}
          >
            {label} is locked
          </span>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {label} is part of Studio
            </h2>
            <p
              className="muted"
              style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}
            >
              Your plan includes {TOOL_LABEL[otherTool]} only. Upgrade to unlock{" "}
              {label} too — everything you&apos;ve already done stays exactly as
              it is.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Tier
              name="Studio"
              blurb="Script + Blocking"
              price={DESIGNER_PRICES.studio.monthly}
              highlight
            />
            <Tier
              name="Studio Pro"
              blurb="Both tools · every show at once"
              price={DESIGNER_PRICES.studio_pro.monthly}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <button
              className="btn primary"
              onClick={upgrade}
              disabled={pending}
              style={{ flex: 1 }}
            >
              {pending ? "Opening…" : "Upgrade my plan"}
            </button>
            <button
              className="btn"
              onClick={() => router.push(`/focus/${slug}?mode=${otherTool}`)}
              style={{ flex: "0 0 auto" }}
            >
              Back to {TOOL_LABEL[otherTool]}
            </button>
          </div>
          {error && (
            <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Tier({
  name,
  blurb,
  price,
  highlight,
}: {
  name: string;
  blurb: string;
  price: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "left",
        border: `1px solid ${highlight ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius-m, 10px)",
        padding: "10px 12px",
        background: "var(--bg-elev)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.35, marginTop: 2 }}>
        {blurb}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
        ${price}
        <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
          {" "}
          /mo
        </span>
      </div>
    </div>
  );
}

/** A blank stage / ground-plan grid (purely decorative, blurred behind the modal). */
function BlockingPlaceholder() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-muted)",
      }}
    >
      <div
        style={{
          width: "68%",
          height: "70%",
          border: "2px solid var(--border-strong)",
          borderRadius: 12,
          backgroundColor: "var(--bg-elev)",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 39px, var(--border) 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, var(--border) 39px 40px)",
        }}
      />
    </div>
  );
}

/** Blank script text lines (decorative, blurred behind the modal). */
function ScriptPlaceholder() {
  const lines = Array.from({ length: 16 }, (_, i) => 45 + ((i * 13) % 50));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        gap: 13,
        padding: "52px 20%",
        background: "var(--bg-elev)",
      }}
    >
      {lines.map((w, i) => (
        <span
          key={i}
          style={{
            height: 11,
            width: `${w}%`,
            borderRadius: 6,
            background: "var(--border-strong)",
          }}
        />
      ))}
    </div>
  );
}
