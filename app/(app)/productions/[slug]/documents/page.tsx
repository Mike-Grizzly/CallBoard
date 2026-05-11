import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembers,
  getProductionMembership,
} from "@/features/members/queries";
import {
  getDocumentsByProduction,
  getFoldersByProduction,
} from "@/features/documents/queries";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const [{ slug }, { doc: initialDocId }] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) {
      redirect("/productions");
    }
  }

  const [documents, folders, members] = await Promise.all([
    getDocumentsByProduction(production.id),
    getFoldersByProduction(production.id),
    getProductionMembers(production.id),
  ]);

  const canUpload = can(user.role, "documents:upload");

  return (
    <DocumentsClient
      documents={documents}
      folders={folders}
      members={members}
      productionId={production.id}
      productionTitle={production.title}
      slug={slug}
      canUpload={canUpload}
      initialDocId={initialDocId}
    />
  );
}
