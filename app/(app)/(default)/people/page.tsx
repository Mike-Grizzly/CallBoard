import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getPeopleDirectory } from "@/features/members/queries";
import { getProductionsByOrganization } from "@/features/productions/queries";
import { resolveProductionColorToken } from "@/features/productions/constants";
import { PeopleDirectory } from "./people-directory";

export default async function PeoplePage() {
  const user = await requireCurrentUser();

  if (!can(user.role, "settings:manage")) {
    redirect("/dashboard");
  }

  const [people, productionRows] = await Promise.all([
    getPeopleDirectory(user.organizationId),
    getProductionsByOrganization(user.organizationId),
  ]);

  const productions = productionRows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    colorToken: resolveProductionColorToken({ id: p.id, color: p.color }),
  }));

  return (
    <PeopleDirectory
      people={people}
      productions={productions}
      currentUserId={user.id}
    />
  );
}
