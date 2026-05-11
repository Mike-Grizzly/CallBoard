"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createReport,
  type CreateReportResult,
} from "@/features/reports/actions";
import { DEPARTMENTS } from "@/features/reports/constants";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Icon } from "@/components/ui/icon";

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

export function CreateReportForm({
  productionId,
  productionTitle,
  slug,
  logContent,
}: {
  productionId: string;
  productionTitle: string;
  slug: string;
  logContent: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    CreateReportResult | undefined,
    FormData
  >(createReport, undefined);

  const today = new Date().toISOString().split("T")[0];
  const [reportDate, setReportDate] = useState(today);
  const [generalNotes, setGeneralNotes] = useState("");

  function importFromLog() {
    if (logContent) setGeneralNotes(logContent);
  }

  function handleSubmit(formData: FormData) {
    formData.set("general_notes", generalNotes);
    formAction(formData);
  }

  return (
    <form
      action={handleSubmit}
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <input type="hidden" name="production_id" value={productionId} />

      {/* Header card */}
      <div className="card card-pad">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <Link
            href={`/productions/${slug}/reports`}
            prefetch
            className="btn ghost"
            style={{ padding: "0 8px" }}
          >
            <Icon name="ChevronLeft" size={14} aria-hidden />
            <span>Cancel</span>
          </Link>
          <span className="muted">·</span>
          <span className="pill" data-c="amber">
            <span className="dot" />
            New draft
          </span>
        </div>
        <div className="row-between">
          <div>
            <div className="h-eyebrow" style={{ marginBottom: 4 }}>
              New rehearsal report
            </div>
            <h2 className="h-section">{formatLongDate(reportDate)}</h2>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {productionTitle}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link
              href={`/productions/${slug}/reports`}
              prefetch
              className="btn"
            >
              <Icon name="X" size={14} aria-hidden />
              <span>Cancel</span>
            </Link>
            <button type="submit" className="btn primary" disabled={pending}>
              <Icon name="Send" size={14} aria-hidden />
              <span>{pending ? "Submitting…" : "Submit report"}</span>
            </button>
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

      {/* Summary cards: report date + call times | next rehearsal */}
      <div className="grid grid-2" style={{ gap: 16 }}>
        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Call times</h3>
          <div className="grid grid-2" style={{ gap: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">Date</div>
              <input
                type="date"
                name="report_date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                className="field"
              />
              {state?.errors?.report_date && (
                <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>
                  {state.errors.report_date}
                </div>
              )}
            </div>
            <div>
              <div className="label">Scheduled call</div>
              <input
                type="time"
                name="scheduled_call"
                className="field"
              />
            </div>
            <div>
              <div className="label">Actual start</div>
              <input
                type="time"
                name="actual_start"
                className="field"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">End time</div>
              <input
                type="time"
                name="end_time"
                className="field"
              />
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Next rehearsal</h3>
          <div className="grid grid-2" style={{ gap: 10 }}>
            <div>
              <div className="label">Date</div>
              <input
                type="date"
                name="next_rehearsal_date"
                className="field"
              />
            </div>
            <div>
              <div className="label">Time</div>
              <input
                type="text"
                name="next_rehearsal_time"
                placeholder="7:00 PM"
                className="field"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">Location</div>
              <input
                type="text"
                name="next_rehearsal_location"
                placeholder="Studio A"
                className="field"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">What will be covered</div>
              <textarea
                name="next_rehearsal_notes"
                rows={3}
                className="field"
                style={{ resize: "vertical", minHeight: 64 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* General notes */}
      <div className="card card-pad">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <h3 className="h-card">General notes</h3>
          {logContent && (
            <button
              type="button"
              onClick={importFromLog}
              className="btn ghost"
              style={{ height: 28, padding: "0 10px", fontSize: 12 }}
            >
              <Icon name="Download" size={12} aria-hidden />
              <span>Import from daily log</span>
            </button>
          )}
        </div>
        <RichTextEditor
          content={generalNotes}
          onChange={setGeneralNotes}
          placeholder="Overall summary of the day's rehearsal…"
          minHeight="180px"
        />
        {state?.errors?.general_notes && (
          <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 6 }}>
            {state.errors.general_notes}
          </div>
        )}
      </div>

      {/* Department notes */}
      <div className="card card-pad">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 className="h-card">Department notes</h3>
          <span className="muted" style={{ fontSize: 12 }}>
            Leave blank for departments with nothing to report
          </span>
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          {DEPARTMENTS.map((d) => (
            <div
              key={d.key}
              style={{
                padding: "14px 16px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-s)",
              }}
            >
              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                <div className="notif-ico" data-c={d.c} style={{ width: 24, height: 24 }}>
                  <Icon name={d.icon} size={13} aria-hidden />
                </div>
                <label htmlFor={d.field} style={{ fontSize: 13, fontWeight: 600 }}>
                  {d.label}
                </label>
              </div>
              <textarea
                id={d.field}
                name={d.field}
                rows={3}
                placeholder={`Notes for ${d.label.toLowerCase()}…`}
                className="field"
                style={{ resize: "vertical", minHeight: 64, fontSize: 13 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer action row */}
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <Link
          href={`/productions/${slug}/reports`}
          prefetch
          className="btn"
        >
          <span>Cancel</span>
        </Link>
        <button type="submit" className="btn primary" disabled={pending}>
          <Icon name="Send" size={14} aria-hidden />
          <span>{pending ? "Submitting…" : "Submit report"}</span>
        </button>
      </div>
    </form>
  );
}
