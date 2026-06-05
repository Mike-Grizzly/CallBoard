import { PlaceholderPage } from "@/components/app-shell/placeholder-page";
import { requireCurrentUser } from "@/lib/auth";

export default async function DocumentsPage() {
  await requireCurrentUser();
  return (
    <PlaceholderPage
      title="Documents"
      description="Scripts, designs, schedules, and other production files."
    />
  );
}
