"use client";

import { useActionState, useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
      <p className="text-sm text-[color:var(--muted-foreground)] italic">
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
                : "border-[color:var(--border)] hover:bg-[color:var(--accent)]",
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
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--accent)] transition-colors"
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
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[color:var(--accent)] transition-colors">
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
}: {
  productionId: string;
  slug: string;
  existingCall?: Call;
  castMembers?: CastMember[];
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
          Start with the general focus — you can fill in specific scenes and
          cast closer to the call.
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
            <p className={labelCls}>Cast called</p>
            <CastSelector
              castMembers={castMembers}
              initialValue={existingCall?.castCalled}
            />
            <p className={cn(hintCls, "mt-2")}>
              Who&apos;s needed (fill in 1–2 days out)
            </p>
          </div>
          <div>
            <label htmlFor="schedule" className={labelCls}>
              Schedule breakdown
            </label>
            <textarea
              id="schedule"
              name="schedule"
              rows={5}
              defaultValue={existingCall?.schedule ?? ""}
              placeholder={
                "6:00 – 6:30  work projections\n6:30 – 6:45  vocal warmups\n6:45 – 7:00  prep Act I"
              }
              className={inputCls}
            />
            <p className={hintCls}>One item per line — any format works</p>
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
