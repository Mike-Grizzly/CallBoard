import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getStageConfiguration, getCastMembers } from "@/features/blocking/queries";
import { getScenesWithBeats } from "@/features/scenes/queries";
import { getDocumentById } from "@/features/documents/queries";
import { getDocumentUrl } from "@/features/documents/actions";
import { BlockingCanvas } from "./blocking-canvas";

export default async function BlockingPage({
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

  if (!can(user.role, "blocking:view")) {
    redirect(`/productions/${slug}`);
  }

  const [stageConfig, scenesWithBeats, castMembers] = await Promise.all([
    getStageConfiguration(production.id),
    getScenesWithBeats(production.id),
    getCastMembers(production.id),
  ]);

  // If no stage config, redirect to setup (only for editors)
  if (!stageConfig && can(user.role, "blocking:edit")) {
    redirect(`/productions/${slug}/blocking/setup`);
  }

  let pdfUrl: string | null = null;
  if (stageConfig?.groundPlanDocumentId) {
    const doc = await getDocumentById(stageConfig.groundPlanDocumentId);
    if (doc) {
      pdfUrl = await getDocumentUrl(doc.storagePath);
    }
  }

  return (
    <BlockingCanvas
      production={{ id: production.id, title: production.title, slug }}
      stageConfig={stageConfig}
      scenesWithBeats={scenesWithBeats}
      castMembers={castMembers}
      pdfUrl={pdfUrl}
      canEdit={can(user.role, "blocking:edit")}
      currentUserId={user.id}
    />
  );
}
