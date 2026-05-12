import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getDocumentById } from "@/features/documents/queries";
import { getDocumentUrl } from "@/features/documents/actions";
import { DocumentViewer } from "./document-viewer";

const TYPE_META: Record<string, { color: string; label: string }> = {
  script:    { color: "clay",  label: "Script" },
  schedule:  { color: "sage",  label: "Schedule" },
  design:    { color: "plum",  label: "Design / Tech" },
  music:     { color: "amber", label: "Music / Score" },
  reference: { color: "dusk",  label: "Reference" },
  general:   { color: "",      label: "General" },
};

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
      ? `${doc.uploadedByFirstName ?? ""} ${doc.uploadedByLastName ?? ""}`.trim()
      : doc.uploadedByEmail;

  const meta = TYPE_META[doc.documentType] ?? TYPE_META.general;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/productions/${slug}/documents`}
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            textDecoration: "none",
          }}
          className="hover:underline"
        >
          ← Documents
        </Link>
      </div>

      {/* File header */}
      <div className="row-between" style={{ marginBottom: 20, gap: 16 }}>
        <div className="row" style={{ gap: 14, minWidth: 0 }}>
          <div
            className="notif-ico"
            data-c={meta.color || undefined}
            style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>
              {doc.documentType === "script" && "📄"}
              {doc.documentType === "schedule" && "📅"}
              {doc.documentType === "design" && "🎨"}
              {doc.documentType === "music" && "🎵"}
              {doc.documentType === "reference" && "📚"}
              {doc.documentType === "general" && "📁"}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {doc.title}
              </h1>
              <span className="pill" data-c={meta.color || undefined}>
                {meta.label}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
              {doc.fileName} · {formatFileSize(doc.fileSize)} · uploaded by{" "}
              {uploaderName}
            </div>
          </div>
        </div>
        <a href={signedUrl} download={doc.fileName} style={{ flexShrink: 0 }}>
          <button className="btn" style={{ gap: 6 }}>
            <Download size={14} />
            <span>Download</span>
          </button>
        </a>
      </div>

      {/* Viewer + comments sidebar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          className="card"
          style={{ overflow: "hidden", minHeight: 600 }}
        >
          <DocumentViewer
            url={signedUrl}
            contentType={doc.contentType}
            fileName={doc.fileName}
          />
        </div>

        <div className="card card-pad">
          <div className="h-eyebrow" style={{ marginBottom: 12 }}>
            Comments
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>
            Annotations and comments coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
