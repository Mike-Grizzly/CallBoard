import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser, isDesignerOnly } from "@/lib/auth";
import { getDesignerSeat } from "@/features/designer/entitlement";
import { FullAppCta } from "@/features/designer/full-app-cta";

/**
 * The designer → full-app "level up" splash. A marketing-flavored, in-app page
 * showing what the full company suite adds on top of the Studio tools, with a
 * one-click conversion: same workspace, everything carries over, the standard
 * 60-day trial starts at conversion, and the Studio seat stops billing at the
 * end of its paid period. Linked from the tool-lock modal and Focus settings.
 */

const FEATURES: { title: string; blurb: string }[] = [
  {
    title: "Rehearsal reports",
    blurb: "Structured nightly reports with attachments, drafts, and one-click distribution to the company.",
  },
  {
    title: "Calls & calendar",
    blurb: "Schedule calls from templates, collect confirmations, and keep every conflict visible.",
  },
  {
    title: "Documents & files",
    blurb: "A real production file room — folders, versions, comments, and controlled access.",
  },
  {
    title: "People & roles",
    blurb: "The whole company in one directory, with per-role permissions across eight roles.",
  },
  {
    title: "Announcements",
    blurb: "Post once, reach everyone — with read acknowledgments so you know who saw it.",
  },
  {
    title: "Rehearsal video",
    blurb: "Upload runs and leave timestamped notes the cast can jump straight to.",
  },
  {
    title: "Notes & tags",
    blurb: "Director's and SM notes, tagged to people and scenes, searchable forever.",
  },
  {
    title: "Push notifications",
    blurb: "Calls, reports, and mentions land on phones the moment they're posted.",
  },
];

const TIERS: { name: string; price: string; sub: string; blurb: string }[] = [
  {
    name: "Season",
    price: "$25",
    sub: "/mo · or $249/yr",
    blurb: "One production at a time",
  },
  {
    name: "Repertory",
    price: "$49",
    sub: "/mo · or $499/yr",
    blurb: "Three productions at once",
  },
  {
    name: "Company",
    price: "$79",
    sub: "/mo · or $799/yr",
    blurb: "Unlimited productions",
  },
];

export default async function FullAppUpgradePage() {
  const user = await requireCurrentUser();
  // Full users already have all of this — nothing to sell them here.
  if (!isDesignerOnly(user)) redirect("/dashboard");
  const seat = await getDesignerSeat(user.id);

  return (
    <div className="fx-body" data-mode="script" style={{ minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "clamp(32px,6vh,72px) 20px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div>
          <Link
            href="/focus"
            className="btn-link"
            style={{ fontSize: 13, display: "inline-block", marginBottom: 18 }}
          >
            ← Back to your studio
          </Link>
          <span
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--accent-ink)",
              marginBottom: 10,
            }}
          >
            Proscene · the full app
          </span>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Run the whole production,
            <br />
            not just your corner of it.
          </h1>
          <p
            className="muted"
            style={{ fontSize: 15, marginTop: 12, lineHeight: 1.6, maxWidth: 620 }}
          >
            Your Studio seat covers Script and Blocking. The full app is the
            production office around them — reports, scheduling, files, people,
            announcements, video — for the companies you run, in the same
            workspace you&apos;re using now.
          </p>
        </div>

        <div className="card card-pad" style={{ borderColor: "var(--accent)", borderWidth: 2 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                Free for 60 days — everything carries over
              </h2>
              <ul
                className="muted"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  margin: "8px 0 0",
                  paddingLeft: 18,
                }}
              >
                <li>
                  <b style={{ color: "var(--ink)" }}>Same workspace, same work.</b>{" "}
                  Your productions, scripts, parses, and blocking stay exactly
                  where they are — the dashboard just opens up around them.
                </li>
                <li>
                  <b style={{ color: "var(--ink)" }}>The standard 60-day trial, from today.</b>{" "}
                  Full access, no card required. Pick a plan whenever you&apos;re
                  ready in Settings → Billing; nothing is charged during the trial.
                </li>
                <li>
                  <b style={{ color: "var(--ink)" }}>Your Studio seat stops billing.</b>{" "}
                  {seat.hasSeat
                    ? "It winds down at the end of its current paid period — no further seat charges, and the full app includes both tools anyway."
                    : "You don't have an active seat, so there's nothing extra to wind down."}
                </li>
                <li>
                  <b style={{ color: "var(--ink)" }}>Focus view stays.</b> The
                  full app includes the same distraction-free Script and
                  Blocking workspace you use today.
                </li>
              </ul>
            </div>
            <FullAppCta />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>
            What the full app adds
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-pad">
                <div style={{ fontSize: 14, fontWeight: 700 }}>{f.title}</div>
                <p
                  className="muted"
                  style={{ fontSize: 12.5, lineHeight: 1.5, margin: "6px 0 0" }}
                >
                  {f.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
            Plans after your trial
          </h2>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 12px", lineHeight: 1.55 }}>
            The organization subscribes — cast, crew, and designers are always
            free. Plans differ only by how many productions you run at once.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {TIERS.map((t) => (
              <div key={t.name} className="card card-pad">
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{t.price}</span>
                  <span className="muted" style={{ fontSize: 12.5 }}> {t.sub}</span>
                </div>
                <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 0" }}>
                  {t.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
