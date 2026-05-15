import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getNotesByProduction, getNoteTagsByOrg } from "@/features/notes/queries";
import { getPinnedItemIds } from "@/features/pins/queries";
import { NotesPanel } from "./notes-panel";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  if (!can(user.role, "notes:view")) redirect(`/productions/${slug}`);

  const [notes, tags, pinnedNoteIds] = await Promise.all([
    getNotesByProduction(production.id),
    getNoteTagsByOrg(org.id, user.id),
    getPinnedItemIds(user.id, "note"),
  ]);

  const canCreate = can(user.role, "notes:create");
  const canManageTags = can(user.role, "notes:manage_tags");

  return (
    <NotesPanel
      notes={notes}
      tags={tags}
      productionId={production.id}
      productionSlug={slug}
      currentUserId={user.id}
      canCreate={canCreate}
      canManageTags={canManageTags}
      organizationId={org.id}
      pinnedNoteIds={pinnedNoteIds}
    />
  );
}
