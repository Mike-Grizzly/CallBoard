import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership, getProductionMembers } from "@/features/members/queries";
import { getStageConfiguration, getCastMembers, getBlockingPositionsForBeat, getCustomSetPieces, getArrowsForBeat } from "@/features/blocking/queries";
import { getScenesWithBeats } from "@/features/scenes/queries";
import { getDocumentById } from "@/features/documents/queries";
import { getDocumentUrl } from "@/features/documents/actions";
import { getCustomSetPieceUrls } from "@/features/blocking/actions";
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

  const [stageConfig, scenesWithBeats, castMembers, productionMembers, customPieceRows] =
    await Promise.all([
      getStageConfiguration(production.id),
      getScenesWithBeats(production.id),
      getCastMembers(production.id),
      getProductionMembers(production.id),
      getCustomSetPieces(production.id),
    ]);

  // If no stage config, redirect to setup (only for editors)
  if (!stageConfig && can(user.role, "blocking:edit")) {
    redirect(`/productions/${slug}/blocking/setup`);
  }

  let pdfUrl: string | null = null;
  if (stageConfig?.groundPlanDocumentId) {
    const doc = await getDocumentById(stageConfig.groundPlanDocumentId);
    if (doc) {
      pdfUrl = await getDocumentUrl(doc.id);
    }
  }

  const signedUrls = await getCustomSetPieceUrls(production.id);
  const initialCustomSetPieces = customPieceRows.map((p) => ({
    id: p.id,
    name: p.name,
    storagePath: p.storagePath,
    fileType: p.fileType,
    imageUrl: signedUrls[p.storagePath] ?? "",
  }));

  const firstBeatId = scenesWithBeats[0]?.beats[0]?.id ?? null;
  const [initialPositions, initialArrows] = firstBeatId
    ? await Promise.all([
        getBlockingPositionsForBeat(firstBeatId),
        getArrowsForBeat(firstBeatId),
      ])
    : [[], []];

  return (
    <BlockingCanvas
      production={{ id: production.id, title: production.title, slug }}
      stageConfig={stageConfig}
      scenesWithBeats={scenesWithBeats}
      castMembers={castMembers}
      productionMembers={productionMembers}
      pdfUrl={pdfUrl}
      canEdit={can(user.role, "blocking:edit")}
      currentUserId={user.id}
      initialBeatId={firstBeatId}
      initialPositions={initialPositions}
      initialArrows={initialArrows}
      initialCustomSetPieces={initialCustomSetPieces}
    />
  );
}
