import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getDocumentById } from "@/features/documents/queries";
import { getDocumentUrl } from "@/features/documents/actions";
import { DOCUMENT_TYPES } from "@/features/documents/constants";
import { DocumentViewer } from "./document-viewer";

function getTypeLabel(value: string): string {
  const found = DOCUMENT_TYPES.find((t) => t.value === value);
  return found?.label ?? value;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; documentId: string }>;
}) {
  const { slug, documentId } = await params;
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

  const doc = await getDocumentById(documentId);
  if (!doc || doc.productionId !== production.id) {
    notFound();
  }

  const signedUrl = await getDocumentUrl(doc.storagePath);

  const uploaderName =
    doc.uploadedByFirstName || doc.uploadedByLastName
      ? `${doc.uploadedByFirstName} ${doc.uploadedByLastName}`.trim()
      : doc.uploadedByEmail;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          href={`/productions/${slug}/documents`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to documents
        </Link>
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {doc.title}
            </h1>
            <span className="rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-xs">
              {getTypeLabel(doc.documentType)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            {doc.fileName} &middot; {formatFileSize(doc.fileSize)} &middot;
            Uploaded by {uploaderName}
          </p>
        </div>
        <a href={signedUrl} download={doc.fileName}>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" aria-hidden />
            Download
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-h-[600px] overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]">
          <DocumentViewer
            url={signedUrl}
            contentType={doc.contentType}
            fileName={doc.fileName}
          />
        </div>

        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
          <h2 className="text-sm font-semibold">Comments</h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Annotations and comments coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
