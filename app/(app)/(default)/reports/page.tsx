import { PlaceholderPage } from "@/components/app-shell/placeholder-page";
import { requireCurrentUser } from "@/lib/auth";

export default async function ReportsPage() {
  await requireCurrentUser();
  return (
    <PlaceholderPage
      title="Reports"
      description="Rehearsal reports from your stage management team."
    />
  );
}
