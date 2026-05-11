import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    redirect("/dashboard");
  }

  redirect("/settings/members");
}
