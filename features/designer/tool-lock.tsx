"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  changeDesignerPlan,
  previewDesignerPlanChange,
  createDesignerPortalSession,
  type DesignerPlanChangePreview,
} from "@/features/designer/actions";
import {
  DESIGNER_PRICES,
  DESIGNER_PLANS,
  DESIGNER_PLAN_LABELS,
  type DesignerTool,
  type DesignerPlanId,
} from "@/features/designer/constants";
import { FullAppCallout } from "@/features/designer/full-app-callout";

const TOOL_LABEL: Record<DesignerTool, string> = {
  script: "Script",
  blocking: "Blocking",
};

// `.btn-link` only exists in the marketing stylesheet — in the app it renders
// as unstyled, low-contrast text. Quiet links here style themselves instead so
// they read as clickable in both color modes.
const quietLink: CSSProperties = {
  fontSize: 13,
  color: "var(--accent-ink)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

const dollars = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Shown inside the Focus shell when a Single Tool designer opens the tool their
 * seat does NOT include. The requested tool renders as a blurred, inert TEASE
 * (a populated stage / a populated script) with an upgrade modal on top — the
 * toggle still reflects the switch, but the tool stays locked until they pick a
 * plan. Symmetric for script-only -> Blocking and blocking-only -> Script.
 *
 * Upgrading is deliberately TWO steps: picking a tier only fetches a Stripe
 * proration preview; the card then shows the exact amount due today and the
 * new recurring price, and only the explicit confirm button charges. Never
 * charge a card off a single click.
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
  const [pendingPlan, setPendingPlan] = useState<DesignerPlanId | null>(null);
  const [confirming, setConfirming] = useState<DesignerPlanChangePreview | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const label = TOOL_LABEL[tool];
  const otherTool: DesignerTool = tool === "blocking" ? "script" : "blocking";

  // Step 1 — price the change (no charge): fetch the prorated preview.
  const choose = (plan: DesignerPlanId) =>
    startTransition(async () => {
      setError(null);
      setPendingPlan(plan);
      const res = await previewDesignerPlanChange(plan);
      if (res.preview) setConfirming(res.preview);
      else setError(res.error ?? "Couldn't price that change.");
      setPendingPlan(null);
    });

  // Step 2 — the explicit consent click: this is the one that charges.
  const confirm = () => {
    if (!confirming) return;
    const plan = confirming.plan;
    startTransition(async () => {
      setError(null);
      const res = await changeDesignerPlan(plan);
      if (res.ok) {
        router.refresh(); // gate re-evaluates → the tool unlocks
        return;
      }
      setError(res.error ?? "Couldn't change your plan.");
      setConfirming(null);
    });
  };

  const manage = () =>
    startTransition(async () => {
      setError(null);
      const res = await createDesignerPortalSession();
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? "Couldn't open billing.");
    });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "80vh",
        overflow: "hidden",
      }}
    >
      {/* Blurred, inert tease of the locked tool — populated so it reads as a
          real, working surface through the blur. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          filter: "blur(5px)",
          opacity: 0.82,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {tool === "blocking" ? <BlockingTease /> : <ScriptTease />}
      </div>

      {/* Soft scrim so the card pops while the tool still peeks around it. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, color-mix(in srgb, var(--bg) 62%, transparent), color-mix(in srgb, var(--bg) 22%, transparent))",
          pointerEvents: "none",
        }}
      />

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
        }}
      >
        <div
          className="card card-pad"
          style={{
            maxWidth: 480,
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

          {confirming ? (
            <>
              <div>
                <h2 id="fx-lock-title" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  Confirm your upgrade
                </h2>
                <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
                  {`Moving to ${DESIGNER_PLAN_LABELS[confirming.plan]} unlocks ${label} right away.`}
                </p>
              </div>

              <div
                style={{
                  border: "1.5px solid var(--border-strong)",
                  borderRadius: "var(--radius-m, 10px)",
                  background: "var(--bg-elev)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                  <span className="muted">Charged to your card today</span>
                  <b>${dollars(confirming.dueTodayCents)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                  <span className="muted">{`${DESIGNER_PLAN_LABELS[confirming.plan]} from next period`}</span>
                  <b>
                    ${dollars(confirming.recurringCents)}
                    <span className="muted" style={{ fontWeight: 400 }}>
                      {confirming.interval === "annual" ? "/yr" : "/mo"}
                    </span>
                  </b>
                </div>
                <p className="muted" style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.5 }}>
                  Today&apos;s amount is prorated — you only pay the difference
                  for the rest of this billing period.
                </p>
              </div>

              <button
                type="button"
                className="btn primary"
                onClick={confirm}
                disabled={pending}
              >
                {pending
                  ? "Upgrading…"
                  : `Confirm upgrade — pay $${dollars(confirming.dueTodayCents)}`}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={pending}
                style={{ ...quietLink, alignSelf: "center" }}
              >
                Back to plans
              </button>
            </>
          ) : (
            <>
              <div>
                <h2 id="fx-lock-title" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  Unlock {label}
                </h2>
                <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
                  {`Your plan includes ${TOOL_LABEL[otherTool]} only. Add ${label} by moving up — everything you've already done stays exactly as it is. You'll see the exact price before anything is charged.`}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <TierButton
                  name="Studio"
                  blurb="Script + Blocking"
                  price={DESIGNER_PRICES.studio.monthly}
                  highlight
                  pending={pendingPlan === DESIGNER_PLANS.STUDIO}
                  disabled={pending}
                  onClick={() => choose(DESIGNER_PLANS.STUDIO)}
                />
                <TierButton
                  name="Studio Pro"
                  blurb="Both tools · every show at once"
                  price={DESIGNER_PRICES.studio_pro.monthly}
                  pending={pendingPlan === DESIGNER_PLANS.STUDIO_PRO}
                  disabled={pending}
                  onClick={() => choose(DESIGNER_PLANS.STUDIO_PRO)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 2 }}>
                <button
                  type="button"
                  onClick={() => router.push(`/focus/${slug}?mode=${otherTool}`)}
                  style={quietLink}
                >
                  Back to {TOOL_LABEL[otherTool]}
                </button>
                <button
                  type="button"
                  onClick={manage}
                  disabled={pending}
                  style={quietLink}
                >
                  Manage billing
                </button>
              </div>
              <FullAppCallout compact />
            </>
          )}
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

function TierButton({
  name,
  blurb,
  price,
  highlight,
  pending,
  disabled,
  onClick,
}: {
  name: string;
  blurb: string;
  price: number;
  highlight?: boolean;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        border: `1.5px solid ${highlight ? "var(--accent)" : "var(--border-strong)"}`,
        borderRadius: "var(--radius-m, 10px)",
        padding: "11px 13px",
        background: "var(--bg-elev)",
        opacity: disabled && !pending ? 0.6 : 1,
        transition: "border-color .12s, transform .12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
        {pending && <span className="muted" style={{ fontSize: 12 }}>…</span>}
      </div>
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.35, marginTop: 2 }}>
        {blurb}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 7 }}>
        ${price}
        <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}> /mo</span>
      </div>
    </button>
  );
}

/** A populated stage — grid, set pieces, and actor tokens — so the blur reads
 *  as a real blocking diagram. Purely decorative. */
function BlockingTease() {
  const actors = [
    { x: "30%", y: "40%", c: "#E0A23A", l: "JD" },
    { x: "52%", y: "30%", c: "#5B8C7B", l: "MR" },
    { x: "67%", y: "56%", c: "#C26B5A", l: "AL" },
    { x: "41%", y: "63%", c: "#6E7BA6", l: "SP" },
    { x: "76%", y: "42%", c: "#9A6FA6", l: "TK" },
  ];
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
          position: "relative",
          width: "72%",
          height: "74%",
          border: "2px solid var(--border-strong)",
          borderRadius: 14,
          backgroundColor: "var(--bg-elev)",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 31px, var(--border) 31px 32px), repeating-linear-gradient(90deg, transparent 0 31px, var(--border) 31px 32px)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ position: "absolute", left: "12%", top: "16%", width: "24%", height: "17%", borderRadius: 8, background: "var(--border-strong)", opacity: 0.55 }} />
        <div style={{ position: "absolute", right: "10%", bottom: "13%", width: "17%", height: "24%", borderRadius: 8, background: "var(--border-strong)", opacity: 0.5 }} />
        {actors.map((a, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: a.x,
              top: a.y,
              width: 40,
              height: 40,
              marginLeft: -20,
              marginTop: -20,
              borderRadius: "50%",
              background: a.c,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            {a.l}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A populated script page — character cues, dialogue, and a couple of
 *  highlighted lines — so the blur reads as a real annotated script. */
function ScriptTease() {
  const blocks = [
    { name: 20, lines: [86, 72], hl: -1 },
    { name: 16, lines: [92, 80, 58], hl: 0 },
    { name: 24, lines: [76, 88], hl: -1 },
    { name: 18, lines: [83, 64, 80], hl: 2 },
    { name: 22, lines: [70, 90], hl: -1 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg-elev)", display: "flex", justifyContent: "center", paddingTop: 44 }}>
      <div style={{ width: "58%", display: "flex", flexDirection: "column", gap: 20 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <span style={{ height: 11, width: `${b.name}%`, borderRadius: 5, background: "var(--ink-3)" }} />
            {b.lines.map((w, j) => (
              <span
                key={j}
                style={{
                  height: 9,
                  width: `${w}%`,
                  borderRadius: 5,
                  background: b.hl === j ? "var(--accent)" : "var(--border-strong)",
                  opacity: b.hl === j ? 0.5 : 1,
                  alignSelf: "flex-start",
                  marginLeft: "9%",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
