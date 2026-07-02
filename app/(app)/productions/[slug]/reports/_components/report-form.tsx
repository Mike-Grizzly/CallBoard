"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createReport,
  updateReport,
  type ReportActionResult,
} from "@/features/reports/actions";
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

type Mode = "create" | "edit";

export function ReportForm({
  mode,
  productionId,
  productionTitle,
  slug,
  initial,
  departments,
  existingAttachments = [],
  members,
}: {
  mode: Mode;
  productionId: string;
  productionTitle: string;
  slug: string;
  initial?: ReportDetail;
  departments: ResolvedDepartment[];
  existingAttachments?: ExistingAttachment[];
  members?: MentionMember[];
}) {
  const router = useRouter();
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
  const [activeTab, setActiveTab] = useState<
    "notes" | "sched" | "lines" | "injuries" | "general" | "next"
  >("notes");

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
        <div className="row-between">
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
          <div className="row" style={{ gap: 8 }}>
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
                  type="submit"
                  name="status"
                  value="distributed"
                  className="btn primary"
                  disabled={pending || uploading}
                  onClick={() => {
                    submittedStatusRef.current = "distributed";
                  }}
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
        />
      </div>


      <div className="card">
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            padding: "0 16px",
          }}
        >
          {[
            {
              id: "notes" as const,
              label: "Department notes",
              count: Object.values(deptNotes).filter(
                (v) => v && v.replace(/<[^>]+>/g, "").trim(),
              ).length,
            },
            {
              id: "sched" as const,
              label: "Schedule changes",
              count: scheduleChanges.length,
            },
            {
              id: "lines" as const,
              label: "Line notes",
              count: lineNotes.length,
            },
            {
              id: "injuries" as const,
              label: "Injuries / incidents",
              count: injuries.length,
            },
            {
              id: "general" as const,
              label: "General notes",
              count: generalNotes.replace(/<[^>]+>/g, "").trim() ? 1 : 0,
            },
            {
              id: "next" as const,
              label: "Next rehearsal",
              count:
                (initial?.nextRehearsalDate ||
                initial?.nextRehearsalTime ||
                initial?.nextRehearsalLocation ||
                initial?.nextRehearsalNotes)
                  ? 1
                  : 0,
            },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              className="tab"
              data-active={activeTab === s.id ? "1" : "0"}
              onClick={() => setActiveTab(s.id)}
            >
              <span>{s.label}</span>
              {s.count > 0 && <span className="count">{s.count}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
            <div className="grid grid-2" style={{ gap: 14 }}>
              {departments.map((d) => {
                const html = deptNotes[d.key];
                const empty = !html || !html.replace(/<[^>]+>/g, "").trim();
                return (
                  <div
                    key={d.key}
                    onClick={() => setEditingDept(d.key)}
                    className="dept-note-card"
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-s)",
                      cursor: "pointer",
                      minHeight: 80,
                      transition:
                        "border-color .12s, background .12s, box-shadow .12s",
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
                      <span
                        className="dept-note-edit-hint muted"
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="PenLine" size={11} aria-hidden />
                        <span>Edit</span>
                      </span>
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
          </div>
          <div style={{ display: activeTab === "sched" ? "block" : "none" }}>
            <ScheduleChangesEditor
              changes={scheduleChanges}
              onChange={setScheduleChanges}
              members={members}
            />
          </div>
          <div style={{ display: activeTab === "lines" ? "block" : "none" }}>
            <LineNotesEditor
              lines={lineNotes}
              onChange={setLineNotes}
              members={members}
            />
          </div>
          <div style={{ display: activeTab === "injuries" ? "block" : "none" }}>
            <InjuriesEditor
              injuries={injuries}
              onChange={setInjuries}
              members={members}
            />
          </div>
          <div style={{ display: activeTab === "general" ? "block" : "none" }}>
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
          </div>
          <div style={{ display: activeTab === "next" ? "block" : "none" }}>
            <div className="grid grid-3" style={{ gap: 10 }}>
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
          </div>
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

      {editingDeptDef && (
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
    </form>
  );
}
