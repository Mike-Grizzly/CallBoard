"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createReport,
  type CreateReportResult,
} from "@/features/reports/actions";
import { Button } from "@/components/ui/button";

export function CreateReportForm({
  productionId,
  slug,
}: {
  productionId: string;
  slug: string;
}) {
  const [state, formAction, pending] = useActionState<
    CreateReportResult | undefined,
    FormData
  >(createReport, undefined);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      action={formAction}
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
        <label
          htmlFor="general_notes"
          className="mb-1.5 block text-sm font-medium"
        >
          General notes
        </label>
        <textarea
          id="general_notes"
          name="general_notes"
          required
          rows={6}
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="What happened in rehearsal today? Notes on blocking, run-throughs, issues, etc."
        />
        {state?.errors?.general_notes && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.general_notes}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="schedule_notes"
          className="mb-1.5 block text-sm font-medium"
        >
          Schedule notes
          <span className="ml-1 font-normal text-[color:var(--muted-foreground)]">
            (optional)
          </span>
        </label>
        <textarea
          id="schedule_notes"
          name="schedule_notes"
          rows={3}
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[color:var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          placeholder="Upcoming schedule changes, call times, etc."
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
