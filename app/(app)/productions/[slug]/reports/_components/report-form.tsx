"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createReport,
  updateReport,
  type ReportActionResult,
} from "@/features/reports/actions";
import { DEPARTMENTS } from "@/features/reports/constants";
import type { ReportDetail } from "@/features/reports/queries";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import { Icon } from "@/components/ui/icon";
import { DeptNoteModal } from "./dept-note-modal";
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
  logContent,
  initial,
}: {
  mode: Mode;
  productionId: string;
  productionTitle: string;
  slug: string;
  logContent: string | null;
  initial?: ReportDetail;
}) {
  const action = mode === "edit" ? updateReport : createReport;
  const [state, formAction, pending] = useActionState<
    ReportActionResult | undefined,
    FormData
  >(action, undefined);

  const today = new Date().toISOString().split("T")[0];
  const [reportDate, setReportDate] = useState(
    initial?.reportDate ?? today,
  );
  const [generalNotes, setGeneralNotes] = useState(
    initial?.generalNotes ?? "",
  );
  const [deptNotes, setDeptNotes] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const d of DEPARTMENTS) {
      m[d.key] = ((initial?.[d.key] as string | null) ?? "") || "";
    }
    return m;
  });
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const editingDeptDef = DEPARTMENTS.find((d) => d.key === editingDept) ?? null;
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

  function importFromLog() {
    if (logContent) setGeneralNotes(logContent);
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
                disabled={pending}
              >
                <Icon name="Check" size={14} aria-hidden />
                <span>{pending ? "Saving…" : "Save changes"}</span>
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  name="status"
                  value="draft"
                  className="btn"
                  disabled={pending}
                >
                  <Icon name="Check" size={14} aria-hidden />
                  <span>Save draft</span>
                </button>
                <button
                  type="submit"
                  name="status"
                  value="distributed"
                  className="btn primary"
                  disabled={pending}
                >
                  <Icon name="Send" size={14} aria-hidden />
                  <span>Distribute</span>
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
              {DEPARTMENTS.map((d) => {
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
                          fontStyle: "italic",
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
            />
          </div>
          <div style={{ display: activeTab === "lines" ? "block" : "none" }}>
            <LineNotesEditor lines={lineNotes} onChange={setLineNotes} />
          </div>
          <div style={{ display: activeTab === "injuries" ? "block" : "none" }}>
            <InjuriesEditor injuries={injuries} onChange={setInjuries} />
          </div>
          <div style={{ display: activeTab === "general" ? "block" : "none" }}>
            {logContent && !isEdit && (
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Overall summary of the day's rehearsal
                </span>
                <button
                  type="button"
                  onClick={importFromLog}
                  className="btn ghost"
                  style={{ height: 28, padding: "0 10px", fontSize: 12 }}
                >
                  <Icon name="Download" size={12} aria-hidden />
                  <span>Import from daily log</span>
                </button>
              </div>
            )}
            <RichTextEditor
              content={generalNotes}
              onChange={setGeneralNotes}
              placeholder="Overall summary of the day's rehearsal…"
              minHeight="220px"
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

      {editingDeptDef && (
        <DeptNoteModal
          open={!!editingDept}
          title={editingDeptDef.label}
          icon={editingDeptDef.icon}
          accentColor={editingDeptDef.c}
          value={deptNotes[editingDeptDef.key]}
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
