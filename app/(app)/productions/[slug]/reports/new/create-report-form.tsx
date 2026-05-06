"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createReport,
  type CreateReportResult,
} from "@/features/reports/actions";
import { DEPARTMENTS } from "@/features/reports/constants";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export function CreateReportForm({
  productionId,
  slug,
  logContent,
}: {
  productionId: string;
  slug: string;
  logContent: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    CreateReportResult | undefined,
    FormData
  >(createReport, undefined);

  const [generalNotes, setGeneralNotes] = useState("");
  const today = new Date().toISOString().split("T")[0];

  function importFromLog() {
    if (logContent) {
      setGeneralNotes(logContent);
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("general_notes", generalNotes);
    formAction(formData);
  }

  const inputCls =
    "w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]";
  const labelCls = "mb-1.5 block text-sm font-medium";

  return (
    <form
      action={handleSubmit}
      className="space-y-6"
    >
      <input type="hidden" name="production_id" value={productionId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Report Header
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="report_date" className={labelCls}>
              Report date
            </label>
            <input
              id="report_date"
              name="report_date"
              type="date"
              required
              defaultValue={today}
              className={inputCls}
            />
            {state?.errors?.report_date && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.report_date}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="scheduled_call" className={labelCls}>
              Scheduled call
            </label>
            <input
              id="scheduled_call"
              name="scheduled_call"
              type="text"
              placeholder="7:00 PM"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="actual_start" className={labelCls}>
              Actual start
            </label>
            <input
              id="actual_start"
              name="actual_start"
              type="text"
              placeholder="7:10 PM"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="end_time" className={labelCls}>
              End time
            </label>
            <input
              id="end_time"
              name="end_time"
              type="text"
              placeholder="10:30 PM"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            General Notes
          </h2>
          {logContent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={importFromLog}
              className="text-xs"
            >
              <FileDown className="h-3 w-3" aria-hidden />
              Import from daily log
            </Button>
          )}
        </div>
        <RichTextEditor
          content={generalNotes}
          onChange={setGeneralNotes}
          placeholder="Overall summary of the day's rehearsal..."
          minHeight="180px"
        />
        {state?.errors?.general_notes && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.general_notes}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Department Notes
        </h2>
        <p className="mb-4 text-xs text-[color:var(--muted-foreground)]">
          Leave blank for any department with nothing to report — empty fields
          will display as &ldquo;None&rdquo; on the report.
        </p>
        <div className="space-y-4">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.key}>
              <label htmlFor={dept.field} className={labelCls}>
                {dept.label}
              </label>
              <textarea
                id={dept.field}
                name={dept.field}
                rows={2}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Next Rehearsal
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="next_rehearsal_date" className={labelCls}>
              Date
            </label>
            <input
              id="next_rehearsal_date"
              name="next_rehearsal_date"
              type="date"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="next_rehearsal_time" className={labelCls}>
              Time
            </label>
            <input
              id="next_rehearsal_time"
              name="next_rehearsal_time"
              type="text"
              placeholder="7:00 PM"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="next_rehearsal_location" className={labelCls}>
              Location
            </label>
            <input
              id="next_rehearsal_location"
              name="next_rehearsal_location"
              type="text"
              placeholder="Studio A"
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="next_rehearsal_notes" className={labelCls}>
            What will be covered
          </label>
          <textarea
            id="next_rehearsal_notes"
            name="next_rehearsal_notes"
            rows={3}
            className={inputCls}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link href={`/productions/${slug}/reports`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
