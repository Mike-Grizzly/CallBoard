import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getNotesByProduction, getNoteTagsByOrg } from "@/features/notes/queries";
import { NotesPanel } from "./notes-panel";
import { ProductionTabs } from "../production-tabs";

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

  const [notes, tags] = await Promise.all([
    getNotesByProduction(production.id),
    getNoteTagsByOrg(org.id, user.id),
  ]);

  const canCreate = can(user.role, "notes:create");
  const canManageTags = can(user.role, "notes:manage_tags");

  const tabs = [
    { label: "Overview", href: `/productions/${slug}` },
    { label: "Reports", href: `/productions/${slug}/reports` },
    { label: "Documents", href: `/productions/${slug}/documents` },
  ];
  if (can(user.role, "reports:create")) {
    tabs.push({ label: "Daily Log", href: `/productions/${slug}/log` });
  }
  if (can(user.role, "blocking:view")) {
    tabs.push({ label: "Blocking", href: `/productions/${slug}/blocking` });
  }
  tabs.push({ label: "Notes", href: `/productions/${slug}/notes` });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {production.title} — Notes
        </h1>
      </div>

      <ProductionTabs slug={slug} tabs={tabs} />

      <NotesPanel
        notes={notes}
        tags={tags}
        productionId={production.id}
        productionSlug={slug}
        currentUserId={user.id}
        canCreate={canCreate}
        canManageTags={canManageTags}
        organizationId={org.id}
      />
    </div>
  );
}
