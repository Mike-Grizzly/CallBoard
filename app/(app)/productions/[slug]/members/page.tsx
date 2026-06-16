import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug, getProductionRoles } from "@/features/productions/queries";
import {
  getProductionMembers,
  getPeopleDirectory,
} from "@/features/members/queries";
import { CastCrewBoard } from "./cast-crew-board";

export default async function ProductionMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();

  if (!can(user.role, "productions:manage")) {
    redirect("/productions");
  }

  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) {
    notFound();
  }

  const [people, members, characters] = await Promise.all([
    getPeopleDirectory(user.organizationId),
    getProductionMembers(production.id),
    getProductionRoles(production.id),
  ]);

  const canInvite = can(user.role, "settings:manage");

  return (
    <div className="page anim-in">
      <Link href={`/productions/${slug}`} className="pp-back">
        <Icon name="ChevronLeft" size={14} />
        <span>Back to {production.title}</span>
      </Link>

      <div style={{ margin: "10px 0 18px" }}>
        <div className="h-eyebrow">Production</div>
        <h1 className="h-section">Cast &amp; crew</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Drag people from the company onto a character or a team role. Assigning
          someone grants them access to this production.
        </p>
      </div>

      <CastCrewBoard
        productionId={production.id}
        productionTitle={production.title}
        people={people}
        characters={characters}
        members={members}
        currentUserId={user.id}
        canInvite={canInvite}
      />
    </div>
  );
}
