import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getDocumentsByProduction } from "@/features/documents/queries";
import { DOCUMENT_TYPES } from "@/features/documents/constants";
import { DocumentUploadForm } from "./document-upload-form";
import { DocumentDeleteButton } from "./document-delete-button";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTypeLabel(value: string): string {
  const found = DOCUMENT_TYPES.find((t) => t.value === value);
  return found?.label ?? value;
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const documents = await getDocumentsByProduction(production.id);
  const canUpload = can(user.role, "documents:upload");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to {production.title}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        </div>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {production.title}
        </p>
      </div>

      {canUpload && (
        <DocumentUploadForm productionId={production.id} />
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-medium">No documents yet</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {canUpload
                ? "Upload scripts, schedules, and other production files."
                : "No documents have been uploaded yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const uploaderName =
              doc.uploadedByFirstName || doc.uploadedByLastName
                ? `${doc.uploadedByFirstName} ${doc.uploadedByLastName}`.trim()
                : doc.uploadedByEmail;

            return (
              <Card key={doc.id} className="transition-colors hover:bg-[color:var(--muted)]">
                <CardContent className="flex items-center justify-between p-4">
                  <Link
                    href={`/productions/${slug}/documents/${doc.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" aria-hidden />
                      <h2 className="truncate text-sm font-semibold">
                        {doc.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-xs">
                        {getTypeLabel(doc.documentType)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                      {doc.fileName} &middot; {formatFileSize(doc.fileSize)} &middot; Uploaded by{" "}
                      {uploaderName} on {formatDate(doc.createdAt)}
                    </p>
                  </Link>
                  {canUpload && (
                    <div className="ml-3 flex items-center gap-2">
                      <DocumentDeleteButton documentId={doc.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
