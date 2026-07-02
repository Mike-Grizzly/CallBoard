import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser, isDesignerOnly } from "@/lib/auth";
import { getVisibleProductions } from "@/features/productions/queries";
import { getDesignerSeat } from "@/features/designer/entitlement";
import { availableDesignerPlans, STRIPE_DESIGNER_PRICE_IDS } from "@/lib/stripe";
import { DesignerBillingButtons } from "@/features/designer/billing-buttons";

/**
 * Focus View entry resolver. Designer-package subscribers are routed here (they
 * have no dashboard); full users may also land here from a bare /focus link.
 * Resolves the user's first accessible production and sends them into its Focus
 * View. With no production yet, shows a minimal waiting state.
 */
export default async function FocusIndexPage() {
  const user = await requireCurrentUser();

  // A designer-only user with no active seat subscribes HERE — this is the
  // entry point before they have any production (creating one needs a seat,
  // and the per-production settings page needs a slug they don't have yet).
  if (isDesignerOnly(user)) {
    const seat = await getDesignerSeat(user.id);
    if (!seat.hasSeat) {
      const plans = availableDesignerPlans().map((id) => ({
        id,
        hasMonthly: !!STRIPE_DESIGNER_PRICE_IDS[id].monthly,
        hasAnnual: !!STRIPE_DESIGNER_PRICE_IDS[id].annual,
      }));
      return (
        <div className="fx-body" data-mode="script">
          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              padding: "clamp(32px,7vh,80px) 20px",
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              Start your Proscene Studio
            </h1>
            <p
              className="muted"
              style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}
            >
              Pick a plan to open your private Script and Blocking workspace. The
              companies you work with stay free — this is just for your own prep
              between gigs.
            </p>
            {plans.length > 0 ? (
              <DesignerBillingButtons plans={plans} hasSeat={false} currentPlan={null} />
            ) : (
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                Online billing isn&apos;t available yet — check back soon.
              </p>
            )}
            <p className="muted" style={{ fontSize: 12.5, marginTop: 16 }}>
              Running a company?{" "}
              <Link href="/focus/full-app" className="btn-link" style={{ fontSize: 12.5 }}>
                Get the full app — free for 60 days
              </Link>
            </p>
          </div>
        </div>
      );
    }
  }

  const productions = await getVisibleProductions(user);

  if (productions.length > 0) {
    redirect(`/focus/${productions[0].slug}?mode=script`);
  }

  return (
    <div className="fx-body" data-mode="script">
      <div className="fx-soon" style={{ height: "100vh" }}>
        <p>No production yet.</p>
        <span style={{ fontSize: 13, color: "var(--ink-4)" }}>
          You&apos;ll land here once you&apos;re added to a show.
        </span>
      </div>
    </div>
  );
}
