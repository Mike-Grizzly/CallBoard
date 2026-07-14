"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createReport,
  updateReport,
  type ReportActionResult,
} from "@/features/reports/actions";
import { reorderProductionDepartments } from "@/features/productions/department-actions";
import {
  requestReportAttachmentUpload,
  finalizeReportAttachmentUpload,
  deleteReportAttachment,
} from "@/features/reports/attachments";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import type { ResolvedDepartment } from "@/features/productions/departments";
import type { ReportDetail } from "@/features/reports/queries";
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import type { MentionMember } from "@/components/ui/mention-textarea";
import { Icon } from "@/components/ui/icon";
import { DeptNoteModal } from "./dept-note-modal";
import {
  AttachmentStaging,
  type ExistingAttachment,
} from "./attachment-staging";
import {
  CallTimesEditor,
  AttendanceEditor,
  ScenesWorkedEditor,
} from "./summary-editors";
import type {
  Break,
  SceneWorked,
  AttendanceNote,
  ScheduleChange,
  LineNote,
  Injury,
} from "@/features/reports/types";
import {
  ScheduleChangesEditor,
  LineNotesEditor,
  InjuriesEditor,
} from "./subtab-editors";

function formatLongDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * True at phone widths (matches the app's ≤720px mobile breakpoint). Drives the
 * report form's mobile affordances (B1): the tabbed sections render as a stacked
 * accordion and department notes are edited inline instead of in a modal. Starts
 * `false` so SSR/first paint matches the desktop markup (no hydration mismatch),
 * then corrects after mount.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

type Mode = "create" | "edit";

type SectionId =
  | "notes"
  | "sched"
  | "lines"
  | "injuries"
  | "general"
  | "next";

const SECTION_ORDER: SectionId[] = [
  "notes",
  "sched",
  "lines",
  "injuries",
  "general",
  "next",
];

export function ReportForm({
  mode,
  productionId,
  productionTitle,
  slug,
  initial,
  departments,
  existingAttachments = [],
  members,
  sceneOptions = [],
  characterOptions = [],
  scenePageByLabel = {},
  personOptions = [],
}: {
  mode: Mode;
  productionId: string;
  productionTitle: string;
  slug: string;
  initial?: ReportDetail;
  departments: ResolvedDepartment[];
  existingAttachments?: ExistingAttachment[];
  members?: MentionMember[];
  /** Real-data autofill for report inputs (scenes / characters / people). */
  sceneOptions?: readonly string[];
  characterOptions?: readonly string[];
  /** Scene label → script page, so picking a scene prefills the Pages box. */
  scenePageByLabel?: Record<string, string>;
  personOptions?: readonly string[];
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const action = mode === "edit" ? updateReport : createReport;
  const [state, formAction, pending] = useActionState<
    ReportActionResult | undefined,
    FormData
  >(action, undefined);

  // Staged-attachment flow: files are held in client state until the form
  // submits. Once the server action returns the report id, we upload each
  // staged file against that id, then navigate. This way the user can pick
  // attachments on the new-report page without having to save a draft first.
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<ExistingAttachment[]>(
    existingAttachments,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const handledRef = useRef<string | null>(null);
  // Which submit button was pressed, so post-save navigation can differ: a
  // draft returns to the reports list; distribute/save-changes opens the report.
  const submittedStatusRef = useRef<"draft" | "distributed" | null>(null);

  useEffect(() => {
    const id = state?.reportId;
    if (!id || handledRef.current === id) return;
    handledRef.current = id;

    const justDistributed = state?.justDistributed ?? false;
    const targetSlug = state?.slug ?? slug;
    // A saved draft drops back on the reports list (you're done for now);
    // distributing or saving a live report opens it (email prompt on send).
    const dest =
      submittedStatusRef.current === "draft"
        ? `/productions/${targetSlug}/reports`
        : `/productions/${targetSlug}/reports/${id}${
            justDistributed ? "?email=1" : ""
          }`;

    if (stagedFiles.length === 0) {
      router.push(dest);
      return;
    }

    setUploading(true);
    setUploadError(null);
    (async () => {
      for (const file of stagedFiles) {
        const signed = await requestReportAttachmentUpload(
          id,
          file.name,
          file.type,
          file.size,
        );
        if (signed.error || !signed.path || !signed.token) {
          setUploadError(
            `Saved the report, but couldn't upload ${file.name}: ${
              signed.error ?? "could not start upload"
            }`,
          );
          setUploading(false);
          router.push(dest);
          return;
        }
        const uploaded = await uploadFileToSignedUrl(
          signed.path,
          signed.token,
          file,
        );
        if (uploaded.error) {
          setUploadError(
            `Saved the report, but couldn't upload ${file.name}: ${uploaded.error}`,
          );
          setUploading(false);
          router.push(dest);
          return;
        }
        const finalized = await finalizeReportAttachmentUpload({
          reportId: id,
          storagePath: signed.path,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        });
        if (finalized.error) {
          setUploadError(
            `Saved the report, but couldn't attach ${file.name}: ${finalized.error}`,
          );
          setUploading(false);
          router.push(dest);
          return;
        }
      }
      setUploading(false);
      setStagedFiles([]);
      router.push(dest);
    })();
    // We want this to run only when the action result changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleRemoveExisting(id: string) {
    const prev = existing;
    setExisting((cur) => cur.filter((a) => a.id !== id));
    const result = await deleteReportAttachment(id);
    if (result.error) {
      setExisting(prev);
      setUploadError(result.error);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const [reportDate, setReportDate] = useState(
    initial?.reportDate ?? today,
  );
  const [generalNotes, setGeneralNotes] = useState(
    initial?.generalNotes ?? "",
  );
  const [deptNotes, setDeptNotes] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const d of departments) {
      const v = d.columnKey
        ? (initial?.[d.columnKey as keyof ReportDetail] as string | null)
        : initial?.deptNotes?.[d.key];
      m[d.key] = (v ?? "") || "";
    }
    return m;
  });
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const editingDeptDef = departments.find((d) => d.key === editingDept) ?? null;
  // Department note order — reorderable in-form and persisted to the production
  // (so it sticks for future reports and drives the distributed report's order).
  const [deptOrder, setDeptOrder] = useState<string[]>(() =>
    departments.map((d) => d.key),
  );
  const deptByKey = useMemo(
    () => new Map(departments.map((d) => [d.key, d])),
    [departments],
  );
  const [, startDeptReorder] = useTransition();
  const [dragDeptKey, setDragDeptKey] = useState<string | null>(null);
  // Latest order, so drop can persist the result of the drag-over reorders.
  const deptOrderRef = useRef(deptOrder);
  deptOrderRef.current = deptOrder;

  function onDeptDragStart(e: React.DragEvent, key: string) {
    setDragDeptKey(key);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", key);
    } catch {
      /* some browsers throw on setData during programmatic drags */
    }
  }
  function onDeptDragOver(e: React.DragEvent, overKey: string) {
    if (!dragDeptKey) return;
    e.preventDefault();
    if (dragDeptKey === overKey) return;
    setDeptOrder((prev) => {
      const from = prev.indexOf(dragDeptKey);
      const to = prev.indexOf(overKey);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragDeptKey);
      return next;
    });
  }
  function onDeptDragEnd() {
    if (dragDeptKey) {
      startDeptReorder(() => {
        void reorderProductionDepartments(productionId, deptOrderRef.current);
      });
    }
    setDragDeptKey(null);
  }
  const [breaks, setBreaks] = useState<Break[]>(initial?.breaks ?? []);
  const [scenesWorked, setScenesWorked] = useState<SceneWorked[]>(
    initial?.scenesWorked ?? [],
  );
  const [present, setPresent] = useState<number>(
    initial?.attendancePresent ?? 0,
  );
  const [absent, setAbsent] = useState<number>(initial?.attendanceAbsent ?? 0);
  const [late, setLate] = useState<number>(initial?.attendanceLate ?? 0);
  const [attendanceNotes, setAttendanceNotes] = useState<AttendanceNote[]>(
    initial?.attendanceNotes ?? [],
  );
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>(
    initial?.scheduleChanges ?? [],
  );
  const [lineNotes, setLineNotes] = useState<LineNote[]>(
    initial?.lineNotes ?? [],
  );
  const [injuries, setInjuries] = useState<Injury[]>(initial?.injuries ?? []);
  const [activeTab, setActiveTab] = useState<SectionId>("notes");

  // Section headers for the day's-work card (B1). Rendered as a desktop tab row
  // or a mobile accordion from the same source; `count` shows a filled-item pill.
  const deptFilledCount = Object.values(deptNotes).filter(
    (v) => v && v.replace(/<[^>]+>/g, "").trim(),
  ).length;
  const sectionMeta: Record<SectionId, { label: string; count: number }> = {
    notes: { label: "Department notes", count: deptFilledCount },
    sched: { label: "Schedule changes", count: scheduleChanges.length },
    lines: { label: "Line notes", count: lineNotes.length },
    injuries: { label: "Injuries / incidents", count: injuries.length },
    general: {
      label: "General notes",
      count: generalNotes.replace(/<[^>]+>/g, "").trim() ? 1 : 0,
    },
    next: {
      label: "Next rehearsal",
      count:
        initial?.nextRehearsalDate ||
        initial?.nextRehearsalTime ||
        initial?.nextRehearsalLocation ||
        initial?.nextRehearsalNotes
          ? 1
          : 0,
    },
  };

  // R1: "Distribute" no longer fires blind — it opens a preview of the report
  // exactly as recipients will see it (same sanitized RichTextDisplay render
  // path as the detail page), with an explicit confirm. Save draft stays one
  // click. The uncontrolled inputs (call times, next rehearsal) are captured
  // from the live form when the preview opens.
  const formRef = useRef<HTMLFormElement>(null);
  const distributeSubmitRef = useRef<HTMLButtonElement>(null);
  const [showDistributePreview, setShowDistributePreview] = useState(false);
  const [previewExtras, setPreviewExtras] = useState<Record<string, string>>({});

  function openDistributePreview() {
    const fd = formRef.current ? new FormData(formRef.current) : null;
    const grab = (k: string) => ((fd?.get(k) as string) ?? "").trim();
    setPreviewExtras({
      actualStart: grab("actual_start"),
      endTime: grab("end_time"),
      nextDate: grab("next_rehearsal_date"),
      nextTime: grab("next_rehearsal_time"),
      nextLocation: grab("next_rehearsal_location"),
      nextNotes: grab("next_rehearsal_notes"),
    });
    setShowDistributePreview(true);
  }

  function confirmDistribute() {
    setShowDistributePreview(false);
    submittedStatusRef.current = "distributed";
    distributeSubmitRef.current?.click();
  }

  function handleSubmit(formData: FormData) {
    formData.set("general_notes", generalNotes);
    formAction(formData);
  }

  const isEdit = mode === "edit";
  const initialStatus = initial?.status ?? "draft";
  const isAlreadyDistributed = isEdit && initialStatus === "distributed";
  const reportNumLabel =
    initial?.reportNumber !== null && initial?.reportNumber !== undefined
      ? `R-${String(initial.reportNumber).padStart(2, "0")}`
      : null;

  const headerPill = isAlreadyDistributed
    ? { c: "sage" as const, label: "Distributed" }
    : isEdit
      ? { c: "amber" as const, label: "Editing draft" }
      : { c: "amber" as const, label: "New draft" };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <input type="hidden" name="production_id" value={productionId} />
      {isEdit && initial && (
        <input type="hidden" name="report_id" value={initial.id} />
      )}

      <div className="card card-pad">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <Link
            href={
              isEdit && initial
                ? `/productions/${slug}/reports/${initial.id}`
                : `/productions/${slug}/reports`
            }
            prefetch
            className="btn ghost"
            style={{ padding: "0 8px" }}
          >
            <Icon name="ChevronLeft" size={14} aria-hidden />
            <span>{isEdit ? "Back" : "Cancel"}</span>
          </Link>
          <span className="muted">·</span>
          <span className="pill" data-c={headerPill.c}>
            <span className="dot" />
            {headerPill.label}
          </span>
        </div>
        <div className="row-between rf-header">
          <div>
            <div className="h-eyebrow" style={{ marginBottom: 4 }}>
              {isEdit
                ? `Rehearsal Report${reportNumLabel ? ` · ${reportNumLabel}` : ""}`
                : "New rehearsal report"}
            </div>
            <h2 className="h-section">{formatLongDate(reportDate)}</h2>
            <div
              className="muted"
              style={{
                fontSize: 13,
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {reportNumLabel && (
                <>
                  <span>Report number {reportNumLabel}</span>
                  <span>·</span>
                </>
              )}
              <span>{productionTitle}</span>
              <span>·</span>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                <Icon name="Calendar" size={12} aria-hidden />
                <input
                  type="date"
                  name="report_date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  required
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: 0,
                    fontSize: 13,
                    color: "inherit",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
            {state?.errors?.report_date && (
              <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>
                {state.errors.report_date}
              </div>
            )}
          </div>
          <div className="row rf-header-actions" style={{ gap: 8 }}>
            {isAlreadyDistributed ? (
              <button
                type="submit"
                name="status"
                value="distributed"
                className="btn primary"
                disabled={pending || uploading}
                onClick={() => {
                  submittedStatusRef.current = "distributed";
                }}
              >
                <Icon name="Check" size={14} aria-hidden />
                <span>
                  {uploading
                    ? "Uploading…"
                    : pending
                      ? "Saving…"
                      : "Save changes"}
                </span>
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  name="status"
                  value="draft"
                  className="btn"
                  disabled={pending || uploading}
                  onClick={() => {
                    submittedStatusRef.current = "draft";
                  }}
                >
                  <Icon name="Check" size={14} aria-hidden />
                  <span>
                    {uploading
                      ? "Uploading…"
                      : pending
                        ? "Saving…"
                        : "Save draft"}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={pending || uploading}
                  onClick={openDistributePreview}
                >
                  <Icon name="Send" size={14} aria-hidden />
                  <span>
                    {uploading
                      ? "Uploading…"
                      : pending
                        ? "Distributing…"
                        : "Distribute"}
                  </span>
                </button>
                {/* The real submit — fired only from the preview's confirm. */}
                <button
                  ref={distributeSubmitRef}
                  type="submit"
                  name="status"
                  value="distributed"
                  style={{ display: "none" }}
                  aria-hidden
                  tabIndex={-1}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {state?.error && (
        <div
          className="card card-pad"
          style={{
            background: "var(--c-amber-soft)",
            borderColor: "transparent",
            fontSize: 13,
          }}
        >
          {state.error}
        </div>
      )}

      {/* Preserve scheduledCall on edit even though it isn't shown in the form */}
      {isEdit && initial?.scheduledCall && (
        <input
          type="hidden"
          name="scheduled_call"
          value={initial.scheduledCall}
        />
      )}

      <div className="grid grid-3" style={{ gap: 16, alignItems: "start" }}>
        <CallTimesEditor
          actualStart={initial?.actualStart ?? ""}
          endTime={initial?.endTime ?? ""}
          breaks={breaks}
          onBreaksChange={setBreaks}
        />
        <AttendanceEditor
          present={present}
          absent={absent}
          late={late}
          notes={attendanceNotes}
          onPresentChange={setPresent}
          onAbsentChange={setAbsent}
          onLateChange={setLate}
          onNotesChange={setAttendanceNotes}
          members={members}
        />
        <ScenesWorkedEditor
          scenes={scenesWorked}
          onChange={setScenesWorked}
          sceneOptions={sceneOptions}
          scenePageByLabel={scenePageByLabel}
        />
      </div>


      {/* B1: the day's-work sections. On desktop this is a horizontal tab
          strip with the active panel below; at phone widths (≤720px) it
          becomes a stacked accordion — every section is reachable without a
          horizontal scroll, and department notes are edited inline instead of
          in a modal. All panels stay mounted (inactive ones are display:none)
          so the whole form submits regardless of which section is open. */}
      <div className="card rf-seccard">
        <div className="rf-sections">
          {SECTION_ORDER.flatMap((id) => {
            const meta = sectionMeta[id];
            const active = activeTab === id;
            return [
              <button
                key={`head-${id}`}
                type="button"
                className="tab rf-head"
                data-active={active ? "1" : "0"}
                aria-expanded={active}
                onClick={() => setActiveTab(id)}
              >
                <span className="rf-head-label">{meta.label}</span>
                {meta.count > 0 && <span className="count">{meta.count}</span>}
                <Icon name="ChevronDown" className="rf-head-chev" size={16} aria-hidden />
              </button>,
              <div
                key={`panel-${id}`}
                className="rf-panel"
                style={{ display: active ? undefined : "none" }}
              >
                {id === "notes" && (
                  isMobile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {deptOrder.map((deptKey) => {
                        const d = deptByKey.get(deptKey);
                        if (!d) return null;
                        const html = deptNotes[d.key];
                        const empty = !html || !html.replace(/<[^>]+>/g, "").trim();
                        const open = editingDept === d.key;
                        return (
                          <div
                            key={d.key}
                            className="dept-note-card"
                            style={{
                              padding: "10px 12px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-s)",
                            }}
                          >
                            <button
                              type="button"
                              className="rf-dept-head"
                              aria-expanded={open}
                              onClick={() => setEditingDept(open ? null : d.key)}
                            >
                              <div
                                className="notif-ico"
                                data-c={d.c}
                                style={{ width: 24, height: 24 }}
                              >
                                <Icon name={d.icon} size={13} aria-hidden />
                              </div>
                              <b style={{ fontSize: 13, fontWeight: 600, flex: 1, textAlign: "left" }}>
                                {d.label}
                              </b>
                              {!empty && !open && (
                                <span
                                  aria-hidden
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "var(--c-sage)",
                                  }}
                                />
                              )}
                              <Icon
                                name="ChevronDown"
                                className="rf-dept-chev"
                                data-open={open ? "1" : "0"}
                                size={16}
                                aria-hidden
                              />
                            </button>
                            {open ? (
                              <div style={{ marginTop: 8 }}>
                                <RichTextEditor
                                  content={html}
                                  onChange={(v) =>
                                    setDeptNotes((prev) => ({ ...prev, [d.key]: v }))
                                  }
                                  members={members}
                                  minHeight="140px"
                                  placeholder={`Notes for ${d.label.toLowerCase()}…`}
                                />
                              </div>
                            ) : empty ? (
                              <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 2 }}>
                                Tap to add notes for {d.label.toLowerCase()}…
                              </div>
                            ) : (
                              <div style={{ marginTop: 4 }}>
                                <RichTextDisplay content={html} />
                              </div>
                            )}
                            <input type="hidden" name={d.field} value={html} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-2" style={{ gap: 14 }}>
                      {deptOrder.map((deptKey) => {
                        const d = deptByKey.get(deptKey);
                        if (!d) return null;
                        const html = deptNotes[d.key];
                        const empty = !html || !html.replace(/<[^>]+>/g, "").trim();
                        return (
                          <div
                            key={d.key}
                            draggable
                            onDragStart={(e) => onDeptDragStart(e, d.key)}
                            onDragOver={(e) => onDeptDragOver(e, d.key)}
                            onDragEnd={onDeptDragEnd}
                            onClick={() => setEditingDept(d.key)}
                            className="dept-note-card"
                            style={{
                              padding: "10px 12px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-s)",
                              cursor: "pointer",
                              minHeight: 80,
                              opacity: dragDeptKey === d.key ? 0.5 : 1,
                              transition:
                                "border-color .12s, background .12s, box-shadow .12s, opacity .12s",
                            }}
                          >
                            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                              <div
                                className="notif-ico"
                                data-c={d.c}
                                style={{ width: 24, height: 24 }}
                              >
                                <Icon name={d.icon} size={13} aria-hidden />
                              </div>
                              <b style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</b>
                              <div
                                style={{
                                  marginLeft: "auto",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span
                                  className="dept-note-edit-hint muted"
                                  style={{
                                    fontSize: 11,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Icon name="PenLine" size={11} aria-hidden />
                                  <span>Edit</span>
                                </span>
                                <span
                                  title="Drag to reorder"
                                  aria-hidden
                                  style={{
                                    display: "inline-flex",
                                    color: "var(--ink-4)",
                                    cursor: "grab",
                                  }}
                                >
                                  <Icon name="Grip" size={13} />
                                </span>
                              </div>
                            </div>
                            {empty ? (
                              <div
                                style={{
                                  fontSize: 13,
                                  lineHeight: 1.55,
                                  color: "var(--ink-4)",
                                }}
                              >
                                Click to add notes for {d.label.toLowerCase()}…
                              </div>
                            ) : (
                              <RichTextDisplay content={html} />
                            )}
                            <input type="hidden" name={d.field} value={html} />
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
                {id === "sched" && (
                  <ScheduleChangesEditor
                    changes={scheduleChanges}
                    onChange={setScheduleChanges}
                    members={members}
                  />
                )}
                {id === "lines" && (
                  <LineNotesEditor
                    lines={lineNotes}
                    onChange={setLineNotes}
                    members={members}
                    characterOptions={characterOptions}
                  />
                )}
                {id === "injuries" && (
                  <InjuriesEditor
                    injuries={injuries}
                    onChange={setInjuries}
                    members={members}
                    personOptions={personOptions}
                  />
                )}
                {id === "general" && (
                  <>
                    <RichTextEditor
                      content={generalNotes}
                      onChange={setGeneralNotes}
                      placeholder="Overall summary of the day's rehearsal…"
                      minHeight="220px"
                      members={members}
                    />
                    {state?.errors?.general_notes && (
                      <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 6 }}>
                        {state.errors.general_notes}
                      </div>
                    )}
                  </>
                )}
                {id === "next" && (
                  <div className="grid grid-3 rf-next-grid" style={{ gap: 10 }}>
                    <div>
                      <div className="label">Date</div>
                      <input
                        type="date"
                        name="next_rehearsal_date"
                        defaultValue={initial?.nextRehearsalDate ?? ""}
                        className="field"
                      />
                    </div>
                    <div>
                      <div className="label">Time</div>
                      <input
                        type="text"
                        name="next_rehearsal_time"
                        placeholder="7:00 PM"
                        defaultValue={initial?.nextRehearsalTime ?? ""}
                        className="field"
                      />
                    </div>
                    <div>
                      <div className="label">Location</div>
                      <input
                        type="text"
                        name="next_rehearsal_location"
                        placeholder="Studio A"
                        defaultValue={initial?.nextRehearsalLocation ?? ""}
                        className="field"
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div className="label">What will be covered</div>
                      <textarea
                        name="next_rehearsal_notes"
                        rows={3}
                        defaultValue={initial?.nextRehearsalNotes ?? ""}
                        className="field"
                        style={{ resize: "vertical", minHeight: 64 }}
                      />
                    </div>
                  </div>
                )}
              </div>,
            ];
          })}
        </div>
      </div>

      <div className="card card-pad">
        <div className="h-eyebrow" style={{ marginBottom: 10 }}>
          Attachments
        </div>
        <AttachmentStaging
          staged={stagedFiles}
          onStagedChange={setStagedFiles}
          existing={existing}
          onRemoveExisting={handleRemoveExisting}
          disabled={pending || uploading}
        />
        {uploadError && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "var(--accent-ink)",
              background: "var(--accent-soft)",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            {uploadError}
          </div>
        )}
      </div>

      {/* Desktop edits a department note in a modal; on mobile it expands
          inline within the accordion (B1), so the modal is desktop-only. */}
      {!isMobile && editingDeptDef && (
        <DeptNoteModal
          open={!!editingDept}
          title={editingDeptDef.label}
          icon={editingDeptDef.icon}
          accentColor={editingDeptDef.c}
          value={deptNotes[editingDeptDef.key]}
          members={members}
          onSave={(html) => {
            setDeptNotes((prev) => ({ ...prev, [editingDeptDef.key]: html }));
            setEditingDept(null);
          }}
          onClose={() => setEditingDept(null)}
        />
      )}

      {/* R1: preview-before-distribute. Renders the report the way recipients
          will see it — department notes and rich text go through the same
          sanitized RichTextDisplay path as the detail page. */}
      {showDistributePreview && (
        <div
          onClick={() => setShowDistributePreview(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 12, 10, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card anim-in"
            role="dialog"
            aria-modal="true"
            aria-label="Preview report before distributing"
            style={{
              width: "min(640px, 100%)",
              maxHeight: "min(85vh, 820px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              className="row-between"
              style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <div className="h-eyebrow" style={{ marginBottom: 2 }}>
                  Preview before distributing
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  This is what recipients will see
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDistributePreview(false)}
                className="btn ghost btn-icon"
                aria-label="Close preview"
              >
                <Icon name="X" size={14} aria-hidden />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
              <div className="h-eyebrow" style={{ marginBottom: 4 }}>
                Rehearsal Report{reportNumLabel ? ` · ${reportNumLabel}` : ""}
              </div>
              <h3 className="h-section" style={{ marginBottom: 2 }}>
                {formatLongDate(reportDate)}
              </h3>
              <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                {productionTitle}
              </div>

              <div className="row" style={{ gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
                {(previewExtras.actualStart || previewExtras.endTime) && (
                  <div>
                    <div className="h-eyebrow" style={{ marginBottom: 2 }}>Rehearsal</div>
                    <div className="mono" style={{ fontSize: 14 }}>
                      {[previewExtras.actualStart, previewExtras.endTime]
                        .filter(Boolean)
                        .join(" – ")}
                    </div>
                  </div>
                )}
                <div>
                  <div className="h-eyebrow" style={{ marginBottom: 2 }}>Attendance</div>
                  <div className="mono" style={{ fontSize: 14 }}>
                    {present} present · {absent} absent · {late} late
                  </div>
                </div>
                {scenesWorked.length > 0 && (
                  <div>
                    <div className="h-eyebrow" style={{ marginBottom: 2 }}>Scenes worked</div>
                    <div style={{ fontSize: 13.5 }}>
                      {scenesWorked.map((s) => s.label).filter(Boolean).join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-eyebrow" style={{ margin: "14px 0 6px" }}>
                Department notes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deptOrder.map((key) => {
                  const dept = deptByKey.get(key);
                  if (!dept) return null;
                  const html = (deptNotes[key] ?? "").trim();
                  return (
                    <div
                      key={key}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: html ? 4 : 0 }}>
                        {dept.label}
                      </div>
                      {html ? (
                        <RichTextDisplay content={html} />
                      ) : (
                        <div className="muted" style={{ fontSize: 12.5 }}>
                          No notes today.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {generalNotes.trim() && (
                <>
                  <div className="h-eyebrow" style={{ margin: "16px 0 6px" }}>
                    General notes
                  </div>
                  <RichTextDisplay content={generalNotes} />
                </>
              )}

              {scheduleChanges.length > 0 && (
                <>
                  <div className="h-eyebrow" style={{ margin: "16px 0 6px" }}>
                    Schedule changes
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                    {scheduleChanges.map((c, i) => (
                      <li key={i}>{[c.who, c.what].filter(Boolean).join(" — ")}</li>
                    ))}
                  </ul>
                </>
              )}

              {injuries.length > 0 && (
                <>
                  <div className="h-eyebrow" style={{ margin: "16px 0 6px" }}>
                    Injuries &amp; incidents
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
                    {injuries.map((inj, i) => (
                      <li key={i}>{[inj.who, inj.text].filter(Boolean).join(" — ")}</li>
                    ))}
                  </ul>
                </>
              )}

              {(previewExtras.nextDate ||
                previewExtras.nextTime ||
                previewExtras.nextLocation ||
                previewExtras.nextNotes) && (
                <>
                  <div className="h-eyebrow" style={{ margin: "16px 0 6px" }}>
                    Next rehearsal
                  </div>
                  <div style={{ fontSize: 13.5 }}>
                    {[
                      previewExtras.nextDate,
                      previewExtras.nextTime,
                      previewExtras.nextLocation,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {previewExtras.nextNotes && (
                      <div className="muted" style={{ marginTop: 2 }}>
                        {previewExtras.nextNotes}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div
              className="row"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span className="muted" style={{ fontSize: 12.5 }}>
                {members && members.length > 0
                  ? `Becomes visible in-app to all ${members.length} production members; the email picker opens next.`
                  : "Becomes visible in-app to the whole production; the email picker opens next."}
              </span>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowDistributePreview(false)}
                >
                  <span>Keep editing</span>
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={pending || uploading}
                  onClick={confirmDistribute}
                >
                  <Icon name="Send" size={14} aria-hidden />
                  <span>
                    {members && members.length > 0
                      ? `Distribute to ${members.length} ${members.length === 1 ? "person" : "people"}`
                      : "Distribute"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
