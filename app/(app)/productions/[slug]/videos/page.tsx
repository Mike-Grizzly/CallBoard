import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import {
  getVideosByProduction,
  getTimestampNotesByVideo,
} from "@/features/videos/queries";
import { VideosClient } from "./videos-client";

export default async function VideosPage({
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

  if (!can(user.role, "videos:view")) {
    redirect(`/productions/${slug}`);
  }

  const videos = await getVideosByProduction(production.id);
  // Seed the panel with the newest video's notes to avoid a load flash.
  const initialNotes = videos[0]
    ? await getTimestampNotesByVideo(videos[0].id)
    : [];

  return (
    <VideosClient
      videos={videos}
      initialNotes={initialNotes}
      productionId={production.id}
      canCreate={can(user.role, "videos:create")}
      canManage={canManage}
      currentUserId={user.id}
    />
  );
}
