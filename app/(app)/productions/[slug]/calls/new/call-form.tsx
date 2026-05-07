"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  createCall,
  updateCall,
  type CallResult,
} from "@/features/calls/actions";
import type { Call } from "@/db/schema";

const inputCls =
  "w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] placeholder:text-[color:var(--muted-foreground)]";
const labelCls = "mb-1.5 block text-sm font-medium";
const hintCls = "mt-1 text-xs text-[color:var(--muted-foreground)]";

export function CallForm({
  productionId,
  slug,
  existingCall,
}: {
  productionId: string;
  slug: string;
  existingCall?: Call;
}) {
  const action = existingCall ? updateCall : createCall;
  const [state, formAction, pending] = useActionState<
    CallResult | undefined,
    FormData
  >(action, undefined);

  const isEdit = !!existingCall;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="production_id" value={productionId} />
      {isEdit && (
        <input type="hidden" name="call_id" value={existingCall.id} />
      )}

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Date + Time + Location */}
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          When &amp; Where
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="call_date" className={labelCls}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="call_date"
              name="call_date"
              type="date"
              required
              defaultValue={existingCall?.callDate ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="call_time" className={labelCls}>
              Call time
            </label>
            <input
              id="call_time"
              name="call_time"
              type="text"
              defaultValue={existingCall?.callTime ?? ""}
              placeholder="7:00 PM"
              className={inputCls}
            />
            <p className={hintCls}>Any format — "7pm", "TBD", "see schedule"</p>
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={existingCall?.location ?? ""}
              placeholder="Studio A"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* What's being worked */}
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          What&apos;s Being Worked
        </h2>
        <p className="mb-4 text-xs text-[color:var(--muted-foreground)]">
          Start with the general focus — you can fill in specific scenes and cast closer to the call.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="focus" className={labelCls}>
              Focus
            </label>
            <input
              id="focus"
              name="focus"
              type="text"
              defaultValue={existingCall?.focus ?? ""}
              placeholder="Act II — choreography, music review"
              className={inputCls}
            />
            <p className={hintCls}>General work area (known a week out)</p>
          </div>
          <div>
            <label htmlFor="scenes" className={labelCls}>
              Scenes / numbers
            </label>
            <textarea
              id="scenes"
              name="scenes"
              rows={3}
              defaultValue={existingCall?.scenes ?? ""}
              placeholder="e.g. pp. 42–72, I Am the Very Model, A Modern Major-General"
              className={inputCls}
            />
            <p className={hintCls}>
              Specific scenes or numbers (fill in 1–2 days out)
            </p>
          </div>
          <div>
            <label htmlFor="cast_called" className={labelCls}>
              Cast called
            </label>
            <textarea
              id="cast_called"
              name="cast_called"
              rows={3}
              defaultValue={existingCall?.castCalled ?? ""}
              placeholder="e.g. Full company except Walter Ek (excused)"
              className={inputCls}
            />
            <p className={hintCls}>
              Who&apos;s needed (fill in 1–2 days out)
            </p>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Additional Notes
        </h2>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={existingCall?.notes ?? ""}
          placeholder="Anything else the company should know..."
          className={inputCls}
        />
      </section>

      <div className="flex items-center justify-between">
        <Link href={`/productions/${slug}`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? "Saving..."
              : "Scheduling..."
            : isEdit
              ? "Save changes"
              : "Schedule call"}
        </Button>
      </div>
    </form>
  );
}
