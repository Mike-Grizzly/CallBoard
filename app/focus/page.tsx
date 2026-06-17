import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getVisibleProductions } from "@/features/productions/queries";

/**
 * Focus View entry resolver. Designer-package subscribers are routed here (they
 * have no dashboard); full users may also land here from a bare /focus link.
 * Resolves the user's first accessible production and sends them into its Focus
 * View. With no production yet, shows a minimal waiting state.
 */
export default async function FocusIndexPage() {
  const user = await requireCurrentUser();
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
