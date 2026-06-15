"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { CountedTextarea } from "@/components/ui/counted-textarea";
import {
  createCall,
  updateCall,
  type CallResult,
} from "@/features/calls/actions";
import type { Call } from "@/db/schema";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** The top of the next hour in local time, as "HH:MM" — a sensible default
 *  start so a new call doesn't inherit the odd minute the SM happened to open
 *  the form at. */
function nextHourHHMM(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return `${pad2(d.getHours())}:00`;
}

/** Add whole hours to an "HH:MM" string, wrapping past midnight. */
function addHoursHHMM(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setHours(d.getHours() + hours);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Convert stored time string to "HH:MM" for <input type="time"> defaultValue. */
function toInputTime(stored: string | null | undefined): string {
  if (!stored) return "";
  if (/^\d{2}:\d{2}$/.test(stored)) return stored;
  const m = stored.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1]);
    const mins = m[2];
    const period = m[3].toLowerCase();
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${mins}`;
  }
  return "";
}

const hintCls = "mt-1 text-xs text-[color:var(--muted-foreground)]";

export type CastMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  characterName: string | null;
  email: string;
};

type Mode = "full_cast" | "principals" | "ensemble" | "custom" | null;

const QUICK_SELECT = [
  { key: "full_cast" as const, label: "Full Cast" },
  { key: "principals" as const, label: "Principals" },
  { key: "ensemble" as const, label: "Full Ensemble" },
] as const;

function memberName(m: CastMember): string {
  return `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email;
}

function serializeSelection(
  mode: Mode,
  selected: Set<string>,
  castMembers: CastMember[],
): string {
  if (mode === "full_cast") return "Full Cast";
  if (mode === "principals") return "Principals";
  if (mode === "ensemble") return "Full Ensemble";
  if (selected.size === 0) return "";
  return castMembers
    .filter((m) => selected.has(m.id))
    .map((m) =>
      m.characterName ? `${m.characterName} (${memberName(m)})` : memberName(m),
    )
    .join(", ");
}

function parseInitialValue(
  value: string | null | undefined,
  principals: CastMember[],
  ensemble: CastMember[],
  all: CastMember[],
): { mode: Mode; selected: Set<string> } {
  if (!value) return { mode: null, selected: new Set() };
  if (value === "Full Cast")
    return { mode: "full_cast", selected: new Set(all.map((m) => m.id)) };
  if (value === "Principals")
    return {
      mode: "principals",
      selected: new Set(principals.map((m) => m.id)),
    };
  if (value === "Full Ensemble")
    return {
      mode: "ensemble",
      selected: new Set(ensemble.map((m) => m.id)),
    };
  return { mode: "custom", selected: new Set() };
}

function CastSelector({
  castMembers,
  initialValue,
}: {
  castMembers: CastMember[];
  initialValue?: string | null;
}) {
  const principals = useMemo(
    () =>
      [...castMembers.filter((m) => m.characterName)].sort((a, b) =>
        (a.characterName ?? "").localeCompare(b.characterName ?? ""),
      ),
    [castMembers],
  );
  const ensemble = useMemo(
    () =>
      [...castMembers.filter((m) => !m.characterName)].sort((a, b) =>
        memberName(a).localeCompare(memberName(b)),
      ),
    [castMembers],
  );

  const parsed = useMemo(
    () => parseInitialValue(initialValue, principals, ensemble, castMembers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [mode, setMode] = useState<Mode>(parsed.mode);
  const [selected, setSelected] = useState<Set<string>>(parsed.selected);

  function handleQuickSelect(key: "full_cast" | "principals" | "ensemble") {
    setMode(key);
    if (key === "full_cast") setSelected(new Set(castMembers.map((m) => m.id)));
    else if (key === "principals")
      setSelected(new Set(principals.map((m) => m.id)));
    else setSelected(new Set(ensemble.map((m) => m.id)));
  }

  function toggleMember(id: string) {
    setMode("custom");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const value = serializeSelection(mode, selected, castMembers);

  if (castMembers.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted-foreground)]">
        No cast members assigned to this production yet.
      </p>
    );
  }

  return (
    <div>
      <input type="hidden" name="cast_called" value={value} />

      {/* Quick-select buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_SELECT.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => handleQuickSelect(opt.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              mode === opt.key
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-[color:var(--primary)]"
                : "border-[color:var(--border)] hover:bg-[color:var(--muted)]",
            )}
          >
            {opt.label}
          </button>
        ))}
        {mode !== null && (
          <button
            type="button"
            onClick={() => {
              setMode(null);
              setSelected(new Set());
            }}
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Member list */}
      <div className="max-h-56 overflow-y-auto rounded-md border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
        {principals.length > 0 && (
          <>
            {ensemble.length > 0 && (
              <div className="px-3 py-1.5 bg-[color:var(--muted)]">
                <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
                  Principals
                </span>
              </div>
            )}
            {principals.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                checked={selected.has(m.id)}
                onToggle={toggleMember}
              />
            ))}
          </>
        )}
        {ensemble.length > 0 && (
          <>
            {principals.length > 0 && (
              <div className="px-3 py-1.5 bg-[color:var(--muted)]">
                <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
                  Ensemble
                </span>
              </div>
            )}
            {ensemble.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                checked={selected.has(m.id)}
                onToggle={toggleMember}
              />
            ))}
          </>
        )}
      </div>

      {selected.size > 0 && mode === "custom" && (
        <p className={hintCls}>
          {selected.size} of {castMembers.length} selected
        </p>
      )}
    </div>
  );
}

function MemberRow({
  member,
  checked,
  onToggle,
}: {
  member: CastMember;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[color:var(--muted)] transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(member.id)}
        className="h-4 w-4 rounded accent-[color:var(--primary)]"
      />
      <div className="min-w-0 flex-1">
        {member.characterName ? (
          <span className="text-sm font-medium">{member.characterName}</span>
        ) : null}
        <span
          className={cn(
            "text-sm",
            member.characterName
              ? "ml-2 text-xs text-[color:var(--muted-foreground)]"
              : "font-medium",
          )}
        >
          {memberName(member)}
        </span>
      </div>
    </label>
  );
}

export function CallForm({
  productionId,
  slug,
  existingCall,
  castMembers = [],
  prefillDate,
  mode = "page",
  onClose,
  onCreated,
}: {
  productionId: string;
  slug: string;
  existingCall?: Call;
  castMembers?: CastMember[];
  prefillDate?: string;
  /** "tray" renders inside the slide-in scheduler and reports success via
   *  callbacks instead of navigating. */
  mode?: "page" | "tray";
  onClose?: () => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const action = existingCall ? updateCall : createCall;
  const [state, formAction, pending] = useActionState<
    CallResult | undefined,
    FormData
  >(action, undefined);

  const isEdit = !!existingCall;

  // Times are controlled so the end can track the start (start + 2h) and a
  // new call can default to the next whole hour.
  const [callTime, setCallTime] = useState(() =>
    toInputTime(existingCall?.callTime),
  );
  const [endTime, setEndTime] = useState(() =>
    toInputTime(existingCall?.endTime),
  );

  // Default a brand-new call to "next hour → +2h". Done in an effect (not the
  // initializer) so the server-rendered markup and first client render agree.
  useEffect(() => {
    if (existingCall) return;
    const start = nextHourHHMM();
    setCallTime(start);
    setEndTime(addHoursHHMM(start, 2));
  }, [existingCall]);

  const onStartChange = (v: string) => {
    setCallTime(v);
    if (v) setEndTime(addHoursHHMM(v, 2));
  };

  // After a successful save, leave the form: a tray closes + refreshes the
  // calendar in place; a full page navigates back to the schedule.
  useEffect(() => {
    if (!state?.success) return;
    if (mode === "tray") {
      onCreated?.();
    } else {
      router.push(`/productions/${slug}/calls`);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="cform">
      <input type="hidden" name="production_id" value={productionId} />
      {isEdit && (
        <input type="hidden" name="call_id" value={existingCall.id} />
      )}

      {state?.error && (
        <div className="cform-err">
          <Icon name="AlertTriangle" width={16} height={16} />
          <span>{state.error}</span>
        </div>
      )}

      {/* When & where */}
      <div className="cform-card">
        <div className="cform-card-h">When &amp; where</div>

        <label className="cform-row" htmlFor="call_date">
          <Icon name="Calendar" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">
            Date<em>*</em>
          </span>
          <input
            id="call_date"
            name="call_date"
            type="date"
            required
            defaultValue={existingCall?.callDate ?? prefillDate ?? ""}
            className="cform-control"
          />
        </label>

        <div className="cform-row">
          <Icon name="Clock" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Time</span>
          <div className="cform-timepair">
            <input
              name="call_time"
              type="time"
              aria-label="Call time"
              value={callTime}
              onChange={(e) => onStartChange(e.target.value)}
              className="cform-control"
            />
            <Icon name="ChevronRight" className="cform-arrow" width={15} height={15} />
            <input
              name="end_time"
              type="time"
              aria-label="End time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="cform-control"
            />
          </div>
        </div>

        <label className="cform-row" htmlFor="location">
          <Icon name="MapPin" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Location</span>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={150}
            defaultValue={existingCall?.location ?? ""}
            placeholder="Studio A"
            className="cform-control grow"
          />
        </label>
      </div>

      {/* What's being worked */}
      <div className="cform-card">
        <div className="cform-card-h">What&apos;s being worked</div>
        <p className="cform-card-sub">
          Start with the general focus — you can fill in specific scenes and
          cast closer to the call.
        </p>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="PenLine" className="cform-ico" width={18} height={18} />
            <label htmlFor="focus">Focus</label>
          </div>
          <input
            id="focus"
            name="focus"
            type="text"
            maxLength={200}
            defaultValue={existingCall?.focus ?? ""}
            placeholder="Act II — choreography, music review"
            className="cform-field"
          />
          <p className="cform-hint">General work area (known a week out)</p>
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="FileText" className="cform-ico" width={18} height={18} />
            <label htmlFor="scenes">Scenes / numbers</label>
          </div>
          <CountedTextarea
            id="scenes"
            name="scenes"
            rows={3}
            maxLength={500}
            defaultValue={existingCall?.scenes ?? ""}
            placeholder="e.g. pp. 42–72, I Am the Very Model, A Modern Major-General"
            className="cform-field"
          />
          <p className="cform-hint">
            Specific scenes or numbers (fill in 1–2 days out)
          </p>
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="Users" className="cform-ico" width={18} height={18} />
            <span>Cast called</span>
          </div>
          <CastSelector
            castMembers={castMembers}
            initialValue={existingCall?.castCalled}
          />
          <p className="cform-hint">Who&apos;s needed (fill in 1–2 days out)</p>
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="CalendarDays" className="cform-ico" width={18} height={18} />
            <label htmlFor="schedule">Schedule breakdown</label>
          </div>
          <CountedTextarea
            id="schedule"
            name="schedule"
            rows={5}
            maxLength={1500}
            defaultValue={existingCall?.schedule ?? ""}
            placeholder={
              "6:00 – 6:30  work projections\n6:30 – 6:45  vocal warmups\n6:45 – 7:00  prep Act I"
            }
            className="cform-field"
          />
          <p className="cform-hint">One item per line — any format works</p>
        </div>
      </div>

      {/* Notes */}
      <div className="cform-card">
        <div className="cform-card-h">Notes</div>
        <div className="cform-row col">
          <CountedTextarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={1000}
            defaultValue={existingCall?.notes ?? ""}
            placeholder="Anything else the company should know..."
            className="cform-field"
          />
        </div>
      </div>

      <div className="cform-actions">
        {mode === "tray" ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        ) : (
          <Link href={`/productions/${slug}/calls`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        )}
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
