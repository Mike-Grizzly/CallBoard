import { PlaceholderPage } from "@/components/app-shell/placeholder-page";
import { requireCurrentUser } from "@/lib/auth";

export default async function ActivityPage() {
  await requireCurrentUser();
  return (
    <PlaceholderPage
      title="Activity"
      description="A timeline of everything that's happened in this production."
    />
  );
}
