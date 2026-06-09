"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/features/billing/actions";
import type { BillingInterval, PaidPlanId } from "@/lib/stripe";

export type PlanOption = {
  id: PaidPlanId;
  hasMonthly: boolean;
  hasAnnual: boolean;
};

type Card = {
  name: string;
  blurb: string;
  annual: number;
  monthly: number;
  features: string[];
  popular?: boolean;
};

const CARDS: Record<PaidPlanId, Card> = {
  season: {
    name: "Season",
    blurb: "One show at a time, with the full toolset.",
    annual: 249,
    monthly: 25,
    features: [
      "1 active production",
      "Unlimited cast & crew",
      "Reports, calls, scripts & blocking",
      "Document & media library",
      "Email support",
    ],
  },
  repertory: {
    name: "Repertory",
    blurb: "Up to 3 productions at once for busy companies.",
    annual: 499,
    monthly: 49,
    popular: true,
    features: [
      "Up to 3 productions at once",
      "Everything in Season",
      "Unlimited cast & crew",
      "The complete production toolset",
      "Email support",
    ],
  },
  company: {
    name: "Company",
    blurb: "Unlimited productions for a full season.",
    annual: 799,
    monthly: 79,
    features: [
      "Unlimited productions",
      "Everything in Repertory",
      "Custom branding",
      "Priority support",
    ],
  },
};

const ORDER: PaidPlanId[] = ["season", "repertory", "company"];

function savingsPct(card: Card) {
  return Math.round((1 - card.annual / (card.monthly * 12)) * 100);
}

const Tick = () => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, color: "var(--accent-ink)", marginTop: 2 }}
    aria-hidden
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export function BillingButtons({
  plans,
  showManage,
}: {
  plans: PlanOption[];
  showManage: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [error, setError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PaidPlanId | null>(null);
  const [pending, startTransition] = useTransition();

  const checkout = (plan: PaidPlanId) =>
    startTransition(async () => {
      setError(null);
      setPendingPlan(plan);
      const res = await createCheckoutSession(plan, interval);
      if (res.url) window.location.href = res.url;
      else {
        setError(res.error ?? "Something went wrong.");
        setPendingPlan(null);
      }
    });

  const portal = () =>
    startTransition(async () => {
      setError(null);
      const res = await createPortalSession();
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? "Something went wrong.");
    });

  if (showManage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        <div>
          <button className="btn" onClick={portal} disabled={pending}>
            {pending ? "Opening…" : "Manage billing"}
          </button>
        </div>
        {error && <p style={{ color: "var(--accent-ink)", fontSize: 13, margin: 0 }}>{error}</p>}
      </div>
    );
  }

  const available = ORDER.filter((id) => plans.some((p) => p.id === id));

  return (
    <div style={{ marginTop: 16 }}>
      {/* Billing-period toggle */}
      <div
        role="group"
        aria-label="Billing period"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: "var(--bg-muted)",
          border: "1px solid var(--border)",
          marginBottom: 18,
        }}
      >
        {(["annual", "monthly"] as BillingInterval[]).map((iv) => (
          <button
            key={iv}
            type="button"
            onClick={() => setInterval(iv)}
            style={{
              border: "none",
              cursor: "pointer",
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "capitalize",
              background: interval === iv ? "var(--bg-elev)" : "transparent",
              color: interval === iv ? "var(--ink)" : "var(--ink-3)",
              boxShadow: interval === iv ? "var(--shadow-1)" : "none",
            }}
          >
            {iv === "annual" ? "Annual" : "Monthly"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        {available.map((id) => {
          const card = CARDS[id];
          const price = interval === "annual" ? card.annual : card.monthly;
          const per = interval === "annual" ? "/yr" : "/mo";
          return (
            <div
              key={id}
              className="card card-pad"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderColor: card.popular ? "var(--accent)" : undefined,
                borderWidth: card.popular ? 2 : undefined,
              }}
            >
              {card.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: 16,
                    background: "var(--accent)",
                    color: "var(--accent-on, #fff)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  Most popular
                </span>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{card.name}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.4 }}>
                  {card.blurb}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 30, fontWeight: 700 }}>${price}</span>
                <span className="muted" style={{ fontSize: 13 }}> {per}</span>
                {interval === "annual" && (
                  <div style={{ fontSize: 12, color: "var(--accent-ink)", marginTop: 2 }}>
                    Save {savingsPct(card)}% vs monthly
                  </div>
                )}
              </div>
              <ul style={{ listStyle: "none", margin: "2px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                {card.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.4 }}>
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={card.popular ? "btn primary" : "btn"}
                onClick={() => checkout(id)}
                disabled={pending}
                style={{ marginTop: "auto" }}
              >
                {pending && pendingPlan === id ? "…" : `Choose ${card.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p style={{ color: "var(--accent-ink)", fontSize: 13, marginTop: 12 }}>{error}</p>}
    </div>
  );
}
