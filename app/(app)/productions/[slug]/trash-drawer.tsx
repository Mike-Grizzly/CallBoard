"use client";

import { useState, useTransition, useCallback } from "react";
import { Trash2, X, RotateCcw, FileText, File, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer/drawer";
import { useRouter } from "next/navigation";
import {
  restoreDocument,
  permanentlyDeleteDocument,
} from "@/features/documents/actions";
import {
  restoreReport,
  permanentlyDeleteReport,
} from "@/features/reports/actions";
import {
  fetchDeletedDocumentsByProduction,
} from "@/features/documents/actions";
import {
  fetchDeletedReportsByProduction,
} from "@/features/reports/actions";

type DeletedDoc = Awaited<ReturnType<typeof fetchDeletedDocumentsByProduction>>[number];
type DeletedReport = Awaited<ReturnType<typeof fetchDeletedReportsByProduction>>[number];

interface Props {
  productionId: string;
  initialTrashCount: number;
}

function daysAgo(date: Date | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function daysUntilPurge(date: Date | null): number {
  if (!date) return 30;
  const diff = new Date(date).getTime() + 30 * 86_400_000 - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function TrashDrawer({ productionId, initialTrashCount }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState<{
    type: "doc" | "report";
    id: string;
  } | null>(null);
  const [docs, setDocs] = useState<DeletedDoc[]>([]);
  const [reports, setReports] = useState<DeletedReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const trashCount = docs.length + reports.length;
  const displayCount = loaded ? trashCount : initialTrashCount;

  const reload = useCallback(async () => {
    const [d, r] = await Promise.all([
      fetchDeletedDocumentsByProduction(productionId),
      fetchDeletedReportsByProduction(productionId),
    ]);
    setDocs(d);
    setReports(r);
    setLoaded(true);
  }, [productionId]);

  function openDrawer() {
    setOpen(true);
    if (!loaded) reload();
  }

  function handleRestore(type: "doc" | "report", id: string) {
    const formData = new FormData();
    formData.set(type === "doc" ? "document_id" : "report_id", id);
    startTransition(async () => {
      if (type === "doc") await restoreDocument(formData);
      else await restoreReport(formData);
      await reload();
      router.refresh();
    });
  }

  function handlePermanentDelete(type: "doc" | "report", id: string) {
    setConfirmPurge({ type, id });
  }

  function doPermanentDelete(type: "doc" | "report", id: string) {
    const formData = new FormData();
    formData.set(type === "doc" ? "document_id" : "report_id", id);
    startTransition(async () => {
      if (type === "doc") await permanentlyDeleteDocument(formData);
      else await permanentlyDeleteReport(formData);
      await reload();
      router.refresh();
    });
  }

  return (
    <>
      {/* Trash icon button */}
      <button
        type="button"
        className="btn ghost btn-icon"
        title="Recently deleted"
        aria-label="Recently deleted"
        onClick={openDrawer}
        style={{ position: "relative" }}
      >
        <Trash2 className="ico" aria-hidden size={16} />
        {displayCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--c-amber)",
              border: "2px solid var(--bg-elev)",
            }}
          />
        )}
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledby="trash-drawer-title"
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <Trash2 size={16} style={{ color: "var(--ink-3)" }} />
          <div style={{ flex: 1 }}>
            <div id="trash-drawer-title" style={{ fontSize: 14, fontWeight: 600 }}>
              Recently Deleted
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              Items are permanently removed after 30 days
            </div>
          </div>
          <button
            className="btn ghost btn-icon"
            onClick={() => setOpen(false)}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!loaded ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--ink-4)",
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          ) : trashCount === 0 ? (
            <div
              style={{
                padding: "56px 32px",
                textAlign: "center",
                color: "var(--ink-4)",
                fontSize: 13,
              }}
            >
              <Trash2
                size={40}
                strokeWidth={1.2}
                style={{ margin: "0 auto 12px", display: "block" }}
              />
              Trash is empty
            </div>
          ) : (
            <>
              {docs.length > 0 && (
                <Section title="Documents">
                  {docs.map((d) => (
                    <TrashItem
                      key={d.id}
                      icon={<File size={15} strokeWidth={1.5} />}
                      name={d.title}
                      meta={d.folderName ?? "No folder"}
                      deletedAt={d.deletedAt}
                      isPending={isPending}
                      onRestore={() => handleRestore("doc", d.id)}
                      onPermanentDelete={() =>
                        handlePermanentDelete("doc", d.id)
                      }
                    />
                  ))}
                </Section>
              )}
              {reports.length > 0 && (
                <Section title="Rehearsal Reports">
                  {reports.map((r) => (
                    <TrashItem
                      key={r.id}
                      icon={<FileText size={15} strokeWidth={1.5} />}
                      name={
                        r.reportNumber
                          ? `Report #${r.reportNumber}`
                          : `Report — ${r.reportDate}`
                      }
                      meta={r.reportDate}
                      deletedAt={r.deletedAt}
                      isPending={isPending}
                      onRestore={() => handleRestore("report", r.id)}
                      onPermanentDelete={() =>
                        handlePermanentDelete("report", r.id)
                      }
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </Drawer>
      <ConfirmDialog
        open={confirmPurge !== null}
        title="Permanently delete?"
        message={`This ${confirmPurge?.type === "report" ? "report" : "document"} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={isPending}
        onConfirm={() => {
          if (confirmPurge) doPermanentDelete(confirmPurge.type, confirmPurge.id);
          setConfirmPurge(null);
        }}
        onCancel={() => setConfirmPurge(null)}
      />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          padding: "12px 20px 6px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "var(--ink-4)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function TrashItem({
  icon,
  name,
  meta,
  deletedAt,
  isPending,
  onRestore,
  onPermanentDelete,
}: {
  icon: React.ReactNode;
  name: string;
  meta: string;
  deletedAt: Date | null;
  isPending: boolean;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  const purgeIn = daysUntilPurge(deletedAt);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--bg-sunken)",
          display: "grid",
          placeItems: "center",
          color: "var(--ink-3)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-4)",
            marginTop: 2,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>{meta}</span>
          <span>·</span>
          <span>Deleted {daysAgo(deletedAt)}</span>
          {purgeIn <= 3 && (
            <>
              <span>·</span>
              <span
                style={{
                  color: "var(--c-clay)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <AlertTriangle size={10} />
                {purgeIn === 0 ? "Purges today" : `${purgeIn}d left`}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button
          className="btn"
          onClick={onRestore}
          disabled={isPending}
          title="Restore"
          style={{ gap: 5, padding: "4px 10px", fontSize: 12, height: 28 }}
        >
          <RotateCcw size={12} />
          Restore
        </button>
        <button
          onClick={onPermanentDelete}
          disabled={isPending}
          title="Delete permanently"
          style={{
            width: 28,
            height: 28,
            border: "none",
            borderRadius: "var(--radius-s)",
            background: "transparent",
            color: "var(--c-clay)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "color-mix(in oklch, var(--c-clay) 10%, transparent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
