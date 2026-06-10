import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getLatestScriptParse } from "@/features/scripts/queries";
import { AiReviewClient } from "./ai-review-client";

export default async function ScriptAiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);
  if (!production) notFound();

  // Setting up the cast/scene template is a manage-the-script action.
  if (!can(user.role, "documents:upload")) {
    redirect(`/productions/${slug}/script`);
  }
  if (!can(user.role, "productions:manage")) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const parse = await getLatestScriptParse(production.id);

  return (
    <AiReviewClient
      slug={slug}
      productionId={production.id}
      initialParse={parse}
    />
  );
}
