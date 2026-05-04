"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createReport,
  type CreateReportResult,
} from "@/features/reports/actions";
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
  const [scheduleNotes, setScheduleNotes] = useState("");
  const today = new Date().toISOString().split("T")[0];

  function importFromLog() {
    if (logContent) {
      setGeneralNotes(logContent);
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("general_notes", generalNotes);
    formData.set("schedule_notes", scheduleNotes);
    formAction(formData);
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
    >
      <input type="hidden" name="production_id" value={productionId} />

      {state?.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="report_date"
          className="mb-1.5 block text-sm font-medium"
        >
          Report date
        </label>
        <input
          id="report_date"
          name="report_date"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        />
        {state?.errors?.report_date && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.report_date}
          </p>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium">General notes</label>
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
          placeholder="What happened in rehearsal today?"
          minHeight="200px"
        />
        {state?.errors?.general_notes && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.general_notes}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium">
          Schedule notes
          <span className="ml-1 font-normal text-[color:var(--muted-foreground)]">
            (optional)
          </span>
        </label>
        <RichTextEditor
          content={scheduleNotes}
          onChange={setScheduleNotes}
          placeholder="Upcoming schedule changes, call times, etc."
          minHeight="120px"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
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
