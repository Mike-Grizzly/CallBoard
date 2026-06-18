import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const user = await requireCurrentUser();

  const [org] = await db
    .select({ name: organizations.name, onboardedAt: organizations.onboardedAt })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  if (org?.onboardedAt) redirect("/dashboard");

  return (
    <div className="np-root">
      <SetupForm orgName={org?.name ?? "Your workspace"} />
    </div>
  );
}
