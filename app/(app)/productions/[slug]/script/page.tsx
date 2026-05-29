import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getDefaultScript, getScriptAnnotations } from "@/features/scripts/queries";
import { getScriptUrl } from "@/features/scripts/actions";
import type { Annotation, Bookmark, PageOverrides } from "@/features/scripts/constants";
import { ScriptScreen } from "./script-screen";

export default async function ScriptPage({
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

  const script = await getDefaultScript(production.id);

  if (!script) {
    return (
      <div
        className="anim-in"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 12,
          color: "var(--ink-3)",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <p style={{ fontSize: 15, fontWeight: 500 }}>No script uploaded yet</p>
        <p style={{ fontSize: 13, textAlign: "center", maxWidth: 320 }}>
          A director or stage manager can upload a script in the Documents tab
          and set it as the default.
        </p>
      </div>
    );
  }

  const [annotationRow, pdfUrl] = await Promise.all([
    getScriptAnnotations(script.id, user.id),
    getScriptUrl(script.storagePath),
  ]);

  const annotations = (annotationRow?.annotations ?? []) as Annotation[];
  const bookmarks = (annotationRow?.bookmarks ?? []) as Bookmark[];
  const pageOverrides = (annotationRow?.pageOverrides ?? {}) as PageOverrides;
  const hasStalePages = annotationRow?.hasStalePages ?? false;

  return (
    <ScriptScreen
      script={script}
      productionId={production.id}
      pdfUrl={pdfUrl}
      initialAnnotations={annotations}
      initialBookmarks={bookmarks}
      initialPageOverrides={pageOverrides}
      initialHasStalePages={hasStalePages}
    />
  );
}
