import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership, getProductionMembers } from "@/features/members/queries";
import { getNotesByProduction, getNoteTagsByOrg } from "@/features/notes/queries";
import { NotesPanel } from "./notes-panel";

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const [{ slug }, { id: initialSelectedId }] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  if (!can(user.role, "notes:view")) redirect(`/productions/${slug}`);

  const [notes, tags, members] = await Promise.all([
    getNotesByProduction(production.id, user.id),
    getNoteTagsByOrg(user.organizationId, user.id),
    getProductionMembers(production.id),
  ]);

  const canCreate = can(user.role, "notes:create");
  const canManageTags = can(user.role, "notes:manage_tags");

  const mentionMembers = members.map((m) => ({
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  }));

  return (
    <NotesPanel
      notes={notes}
      tags={tags}
      members={mentionMembers}
      productionId={production.id}
      productionSlug={slug}
      currentUserId={user.id}
      canCreate={canCreate}
      canManageTags={canManageTags}
      organizationId={user.organizationId}
      initialSelectedId={initialSelectedId}
    />
  );
}
