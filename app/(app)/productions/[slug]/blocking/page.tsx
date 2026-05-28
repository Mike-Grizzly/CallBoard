import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership, getProductionMembers } from "@/features/members/queries";
import { getStageConfiguration, getCastMembers, getBlockingPositionsForBeat, getCustomSetPieces, getArrowsForBeat } from "@/features/blocking/queries";
import { getScenesWithBeats } from "@/features/scenes/queries";
import { ensureFirstSceneAndBeat } from "@/features/scenes/actions";
import { getDocumentById } from "@/features/documents/queries";
import { getDocumentUrl } from "@/features/documents/actions";
import { getCustomSetPieceUrls, getGroundPlanImageUrl } from "@/features/blocking/actions";
import { BlockingCanvas } from "./blocking-canvas";

export default async function BlockingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  if (!can(user.role, "blocking:view")) {
    redirect(`/productions/${slug}`);
  }

  const [stageConfig, scenesWithBeatsInitial, castMembers, productionMembers, customPieceRows] =
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

  // First-time setup: an editor opening blocking on a production with no
  // scenes/beats yet should land on a canvas they can drag onto
  // immediately, not on an empty state that silently swallows drops. Seed
  // a default Scene 1 / Beat 1 so the rest of the page renders ready to
  // edit. Also covers the case where a scene exists but has no beats
  // under it (e.g. created earlier then beats deleted) — we'd otherwise
  // leave the user staring at a canvas with no active beat. Viewers
  // don't trigger this; they'll see the empty state.
  let scenesWithBeats = scenesWithBeatsInitial;
  const noBeats = scenesWithBeats.every((s) => s.beats.length === 0);
  if (noBeats && can(user.role, "blocking:edit")) {
    await ensureFirstSceneAndBeat(production.id);
    scenesWithBeats = await getScenesWithBeats(production.id);
  }

  // Prefer the rasterized ground-plan image (cheap <img>, works on phone).
  // Fall back to the source PDF for legacy stage configs that don't have an
  // image saved yet — those will still go through pdf.js on desktop and
  // the "View floor plan" link on phone.
  let groundPlanImageUrl: string | null = null;
  let pdfUrl: string | null = null;
  if (stageConfig?.groundPlanImagePath) {
    groundPlanImageUrl = await getGroundPlanImageUrl(stageConfig.groundPlanImagePath);
  }
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

  // Pick the first beat across all scenes — `scenesWithBeats[0].beats[0]`
  // returns null when the first scene happens to be empty but a later
  // scene has beats, which left the canvas with no active beat selected.
  const firstBeatId =
    scenesWithBeats.flatMap((s) => s.beats)[0]?.id ?? null;
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
      groundPlanImageUrl={groundPlanImageUrl}
      canEdit={can(user.role, "blocking:edit")}
      currentUserId={user.id}
      initialBeatId={firstBeatId}
      initialPositions={initialPositions}
      initialArrows={initialArrows}
      initialCustomSetPieces={initialCustomSetPieces}
    />
  );
}
