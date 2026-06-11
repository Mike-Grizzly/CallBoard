"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  generateCalls,
  type GenerateResult,
} from "@/features/call-templates/actions";

export type TemplateOption = {
  id: string;
  name: string;
  callTime: string | null;
  endTime: string | null;
  location: string | null;
  focus: string | null;
  scenes: string | null;
  castCalled: string | null;
  schedule: string | null;
  notes: string | null;
};

type Fields = {
  callTime: string;
  endTime: string;
  location: string;
  focus: string;
  scenes: string;
  castCalled: string;
  schedule: string;
  notes: string;
};

const EMPTY: Fields = {
  callTime: "",
  endTime: "",
  location: "",
  focus: "",
  scenes: "",
  castCalled: "",
  schedule: "",
  notes: "",
};

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const pad2 = (n: number) => String(n).padStart(2, "0");
function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fieldsFromTemplate(t: TemplateOption): Fields {
  return {
    callTime: t.callTime ?? "",
    endTime: t.endTime ?? "",
    location: t.location ?? "",
    focus: t.focus ?? "",
    scenes: t.scenes ?? "",
    castCalled: t.castCalled ?? "",
    schedule: t.schedule ?? "",
    notes: t.notes ?? "",
  };
}

export function GenerateForm({
  productionId,
  slug,
  templates,
  prefillTemplateId,
}: {
  productionId: string;
  slug: string;
  templates: TemplateOption[];
  prefillTemplateId?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    GenerateResult | undefined,
    FormData
  >(generateCalls, undefined);

  const initialTemplate = useMemo(
    () => templates.find((t) => t.id === prefillTemplateId),
    [templates, prefillTemplateId],
  );

  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const [fields, setFields] = useState<Fields>(
    initialTemplate ? fieldsFromTemplate(initialTemplate) : EMPTY,
  );
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set());
  // Default to today → six weeks out. Computed up front; the date inputs carry
  // suppressHydrationWarning since "today" can differ between a UTC server and
  // the user's timezone at the midnight boundary.
  const [startDate, setStartDate] = useState(() => ymdLocal(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 42);
    return ymdLocal(d);
  });

  function onPickTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    setFields(t ? fieldsFromTemplate(t) : EMPTY);
  }

  function setField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function toggleWeekday(value: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <form action={formAction} className="cform">
      <input type="hidden" name="production_id" value={productionId} />
      {[...weekdays].map((d) => (
        <input key={d} type="hidden" name="weekdays" value={d} />
      ))}
      <input type="hidden" name="call_time" value={fields.callTime} />
      <input type="hidden" name="end_time" value={fields.endTime} />
      <input type="hidden" name="location" value={fields.location} />
      <input type="hidden" name="focus" value={fields.focus} />
      <input type="hidden" name="scenes" value={fields.scenes} />
      <input type="hidden" name="cast_called" value={fields.castCalled} />
      <input type="hidden" name="schedule" value={fields.schedule} />
      <input type="hidden" name="notes" value={fields.notes} />

      {state?.error && (
        <div className="cform-err">
          <Icon name="AlertTriangle" width={16} height={16} />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <span className="inline-flex items-center gap-2">
            <Icon name="Check" width={16} height={16} />
            Created {state.count} {state.count === 1 ? "call" : "calls"} — adjust
            below to generate more.
          </span>
          <Link
            href={`/productions/${slug}/calls`}
            onClick={() => router.refresh()}
            className="shrink-0 font-medium underline underline-offset-2"
          >
            View calendar
          </Link>
        </div>
      )}

      <div className="cform-card">
        <div className="cform-card-h">Recurrence</div>

        {templates.length > 0 && (
          <label className="cform-row" htmlFor="template">
            <Icon name="Tag" className="cform-ico" width={18} height={18} />
            <span className="cform-row-label">Template</span>
            <select
              id="template"
              value={templateId}
              onChange={(e) => onPickTemplate(e.target.value)}
              className="cform-control grow"
            >
              <option value="">— Start from blank —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="cform-row">
          <Icon name="Calendar" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">
            Dates<em>*</em>
          </span>
          <div className="cform-timepair">
            <input
              type="date"
              name="start_date"
              aria-label="Start date"
              required
              suppressHydrationWarning
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="cform-control"
            />
            <Icon
              name="ChevronRight"
              className="cform-arrow"
              width={15}
              height={15}
            />
            <input
              type="date"
              name="end_date"
              aria-label="End date"
              required
              suppressHydrationWarning
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="cform-control"
            />
          </div>
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon
              name="CalendarDays"
              className="cform-ico"
              width={18}
              height={18}
            />
            <span>
              Repeat on<em>*</em>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const on = weekdays.has(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleWeekday(d.value)}
                  className={
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors " +
                    (on
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-[color:var(--primary)]"
                      : "border-[color:var(--border)] hover:bg-[color:var(--muted)]")
                  }
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <p className="cform-hint">
            A call is created on every selected weekday in the date range.
          </p>
        </div>

        <label className="cform-row" htmlFor="skip_existing">
          <Icon name="Check" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Skip clashes</span>
          <span className="flex items-center gap-2">
            <input
              id="skip_existing"
              name="skip_existing"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded accent-[color:var(--primary)]"
            />
            <span className="text-sm text-[color:var(--muted-foreground)]">
              Don&apos;t add a call on a day that already has one
            </span>
          </span>
        </label>
      </div>

      <div className="cform-card">
        <div className="cform-card-h">Call defaults</div>
        <p className="cform-card-sub">
          Applied to every generated call. Pick a template above to fill these
          in, or set them here.
        </p>

        <div className="cform-row">
          <Icon name="Clock" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Time</span>
          <div className="cform-timepair">
            <input
              type="time"
              aria-label="Call time"
              value={fields.callTime}
              onChange={(e) => setField("callTime", e.target.value)}
              className="cform-control"
            />
            <Icon
              name="ChevronRight"
              className="cform-arrow"
              width={15}
              height={15}
            />
            <input
              type="time"
              aria-label="End time"
              value={fields.endTime}
              onChange={(e) => setField("endTime", e.target.value)}
              className="cform-control"
            />
          </div>
        </div>

        <label className="cform-row" htmlFor="gen_location">
          <Icon name="MapPin" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Location</span>
          <input
            id="gen_location"
            type="text"
            maxLength={150}
            value={fields.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Studio A"
            className="cform-control grow"
          />
        </label>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="PenLine" className="cform-ico" width={18} height={18} />
            <label htmlFor="gen_focus">Focus</label>
          </div>
          <input
            id="gen_focus"
            type="text"
            maxLength={200}
            value={fields.focus}
            onChange={(e) => setField("focus", e.target.value)}
            className="cform-field"
          />
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="Users" className="cform-ico" width={18} height={18} />
            <label htmlFor="gen_cast">Cast called</label>
          </div>
          <input
            id="gen_cast"
            type="text"
            maxLength={300}
            value={fields.castCalled}
            onChange={(e) => setField("castCalled", e.target.value)}
            placeholder="Full Cast"
            className="cform-field"
          />
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon
              name="CalendarDays"
              className="cform-ico"
              width={18}
              height={18}
            />
            <label htmlFor="gen_schedule">Schedule breakdown</label>
          </div>
          <textarea
            id="gen_schedule"
            rows={4}
            maxLength={1500}
            value={fields.schedule}
            onChange={(e) => setField("schedule", e.target.value)}
            placeholder={"7:00 – 7:15  warmups\n7:15 – 9:00  work scenes"}
            className="cform-field"
          />
        </div>
      </div>

      <div className="cform-actions">
        <Link href={`/productions/${slug}/calls`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Generating..." : "Generate calls"}
        </Button>
      </div>
    </form>
  );
}
