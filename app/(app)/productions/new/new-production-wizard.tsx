"use client";

// New Production setup wizard — 6 steps from blank slate to launched show.
//
// Step 1 · Basics       — title, venue, season
// Step 2 · Calendar     — key dates + default rehearsal pattern
// Step 3 · Departments  — which functional areas this show needs
// Step 4 · Roles        — characters in the play
// Step 5 · Team         — invite stage management + creative + cast
// Step 6 · Review       — confirm + launch
//
// Ported from the original standalone React island into a typed CallBoard
// client component. Styling lives under `.np-root` in globals.css.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { createProductionFull } from "@/features/productions/actions";
import {
  ALL_DEPTS,
  ROLE_TYPES,
  SEASONS,
  TEAM_ROLES,
  castTeamLabelForType,
  type WizardOrgUser,
} from "@/features/productions/wizard-constants";

type FullProductionResultSkip = { email: string; reason: string };

// `actorEmail` is captured when the actor is chosen from the org autocomplete;
// it marks them as an existing org member (vs a free-typed name to invite).
type RoleRow = {
  id: string;
  name: string;
  actor: string;
  actorEmail?: string;
  type: string;
};

// One person to resolve at launch: someone named in the wizard who may or may
// not already be in the org.
type WizardPerson = {
  key: string;
  name: string;
  /** Email captured from the org autocomplete, if any. */
  capturedEmail?: string;
  /** Team-role label this person is assigned/invited under. */
  roleLabel: string;
  dept: string;
  /** Where they came from, shown in the invite prompt (e.g. "Frederic · Principal"). */
  context: string;
};
type TeamRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  dept: string;
  c: string;
};

type WizardData = {
  title: string;
  venue: string;
  season: string;
  firstRehearsal: string;
  techStart: string;
  opening: string;
  closing: string;
  rehearsalDays: Record<string, boolean>;
  rehearsalStart: string;
  rehearsalEnd: string;
  depts: Record<string, boolean>;
  roles: RoleRow[];
  team: TeamRow[];
};

const STEPS = [
  { id: "basics", no: "01", label: "Production basics", hint: "Title, venue, season" },
  { id: "calendar", no: "02", label: "Key dates", hint: "Tech, opening, closing" },
  { id: "depts", no: "03", label: "Departments", hint: "Which teams this show needs" },
  { id: "roles", no: "04", label: "Roles & characters", hint: "The cast list for this show" },
  { id: "team", no: "05", label: "Invite your team", hint: "Stage management, creative, cast" },
  { id: "review", no: "06", label: "Review & launch", hint: "Confirm and create" },
] as const;

const SEED_TEAM: Omit<TeamRow, "id">[] = [
  { name: "", email: "", role: "Director", dept: "director", c: "accent" },
  { name: "", email: "", role: "Stage Manager", dept: "stage", c: "" },
  { name: "", email: "", role: "Music Director", dept: "music", c: "plum" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type LaunchSummary = {
  departments: number;
  roles: number;
  assigned: number;
  invited: number;
  skipped: FullProductionResultSkip[];
};

export default function NewProductionWizard({
  mode = "page",
  orgUsers,
  onClose,
}: {
  mode?: "page" | "overlay";
  orgUsers: WizardOrgUser[];
  onClose?: () => void;
}) {
  const overlay = mode === "overlay";
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<WizardData>({
    title: "",
    venue: "",
    season: "Spring 2026",
    firstRehearsal: "",
    techStart: "",
    opening: "",
    closing: "",
    rehearsalDays: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false },
    rehearsalStart: "7:00 PM",
    rehearsalEnd: "10:30 PM",
    depts: {
      director: true, stage: true, music: true, costumes: true, props: true,
      set: true, lighting: true, sound: true, choreo: false, intimacy: false,
      dramaturgy: false, casting: false,
    },
    roles: [
      { id: "r1", name: "", actor: "", type: "Principal" },
      { id: "r2", name: "", actor: "", type: "Principal" },
      { id: "r3", name: "", actor: "", type: "Ensemble" },
    ],
    team: SEED_TEAM.map((t, i) => ({ ...t, id: `t-seed-${i}` })),
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState<{ slug: string; summary: LaunchSummary; trialWarning?: string } | null>(null);
  // Non-org people awaiting an email before launch (null = prompt closed).
  const [invitePrompt, setInvitePrompt] = useState<WizardPerson[] | null>(null);

  const set = (patch: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...patch }));
  const step = STEPS[stepIdx];

  // Resolve a name to an org member's email: exact (case-insensitive) match.
  const orgByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of orgUsers) m.set(u.name.trim().toLowerCase(), u.email);
    return m;
  }, [orgUsers]);

  // Everyone named in the wizard — cast actors + crew — flattened for launch.
  const collectPeople = (): WizardPerson[] => {
    const people: WizardPerson[] = [];
    for (const r of data.roles) {
      const name = r.actor.trim();
      if (!name) continue;
      people.push({
        key: `role-${r.id}`,
        name,
        capturedEmail: r.actorEmail,
        roleLabel: castTeamLabelForType(r.type),
        dept: "cast",
        context: [r.name.trim() || "Role", r.type].filter(Boolean).join(" · "),
      });
    }
    for (const t of data.team) {
      const name = t.name.trim();
      if (!name) continue;
      people.push({
        key: `team-${t.id}`,
        name,
        capturedEmail: t.email,
        roleLabel: t.role,
        dept: t.dept,
        context: t.role,
      });
    }
    return people;
  };

  // The email we already know for a person (picked from the org, or an exact
  // name match against the org directory); empty string if they're not in org.
  const knownEmail = (p: WizardPerson): string =>
    (p.capturedEmail ?? "").trim() ||
    orgByName.get(p.name.toLowerCase()) ||
    "";

  // Esc closes the overlay.
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [overlay, onClose, pending]);

  // `extraEmails` carries addresses the user typed in the end-of-launch prompt,
  // keyed by WizardPerson.key. Everyone with a resolvable email (org member or
  // freshly entered) is sent to the server to be assigned or invited; people
  // without one are simply not added (cast names still stay as role labels).
  const submit = async (
    status: "draft" | "active",
    extraEmails: Record<string, string> = {},
  ) => {
    if (!data.title.trim()) {
      setError("Add a title before saving.");
      setStepIdx(0);
      return;
    }
    setPending(true);
    setError(null);

    const seen = new Set<string>();
    const team = collectPeople()
      .map((p) => ({
        name: p.name,
        email: (knownEmail(p) || (extraEmails[p.key] ?? "").trim()).toLowerCase(),
        role: p.roleLabel,
        dept: p.dept,
      }))
      .filter((t) => {
        if (!t.email || seen.has(t.email)) return false;
        seen.add(t.email);
        return true;
      });

    const result = await createProductionFull({
      title: data.title,
      venue: data.venue,
      season: data.season,
      firstRehearsal: data.firstRehearsal,
      techStart: data.techStart,
      opening: data.opening,
      closing: data.closing,
      rehearsalDays: data.rehearsalDays,
      rehearsalStart: data.rehearsalStart,
      rehearsalEnd: data.rehearsalEnd,
      depts: data.depts,
      roles: data.roles.map((r) => ({ name: r.name, actor: r.actor, type: r.type })),
      team,
      status,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      setInvitePrompt(null);
      return;
    }
    if (status === "draft") {
      // Drafts drop straight into the production hub to keep editing.
      router.push(`/productions/${result.slug}`);
      router.refresh();
      return;
    }
    setLaunched({ slug: result.slug!, summary: result.summary!, trialWarning: result.trialWarning });
  };

  // Launch: if anyone named isn't in the org, prompt for their emails first;
  // otherwise create straight away.
  const attemptLaunch = () => {
    const unresolved = collectPeople().filter((p) => !knownEmail(p));
    if (unresolved.length > 0) {
      setInvitePrompt(unresolved);
      return;
    }
    void submit("active");
  };

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else attemptLaunch();
  };
  const goPrev = () => stepIdx > 0 && setStepIdx(stepIdx - 1);

  if (launched) {
    return (
      <div className="np-root" data-mode={mode}>
        <LaunchScreen
          data={data}
          overlay={overlay}
          slug={launched.slug}
          summary={launched.summary}
          trialWarning={launched.trialWarning}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="np-root" data-mode={mode}>
      <NPTopBar overlay={overlay} onClose={onClose} />
      <div className="body">
        <NPRail stepIdx={stepIdx} setStepIdx={setStepIdx} />
        <div className="main">
          {/* Phone-only step header + segmented progress (the desktop rail
              is hidden at ≤720px). */}
          <div className="np-mobile-bar">
            <div className="np-mb-head">
              <div className="np-mb-titles">
                <span className="np-mb-title">New production</span>
                <span className="np-mb-step">{step.label}</span>
              </div>
              <span className="np-mb-count mono">
                <b>{step.no}</b>/06
              </span>
            </div>
            <div className="np-mb-segs">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="np-mb-seg"
                  data-state={i < stepIdx ? "done" : i === stepIdx ? "active" : "todo"}
                  onClick={() => setStepIdx(i)}
                  aria-label={s.label}
                />
              ))}
            </div>
          </div>
          <div key={step.id} className="anim-in">
            <div className="crumb">Step {step.no} of 06</div>
            {step.id === "basics" && <StepBasics data={data} set={set} />}
            {step.id === "calendar" && <StepCalendar data={data} set={set} />}
            {step.id === "depts" && <StepDepts data={data} set={set} />}
            {step.id === "roles" && <StepRoles data={data} set={set} orgUsers={orgUsers} />}
            {step.id === "team" && (
              <StepTeam data={data} set={set} orgUsers={orgUsers} />
            )}
            {step.id === "review" && <StepReview data={data} jumpTo={setStepIdx} />}
          </div>
          {error && (
            <div className="banner" style={{ marginTop: 24, marginBottom: 0 }}>
              <Icon name="AlertTriangle" size={16} />
              <div>{error}</div>
            </div>
          )}
          <Actions
            stepIdx={stepIdx}
            pending={pending}
            onPrev={goPrev}
            onNext={goNext}
            onSaveDraft={() => void submit("draft")}
            canNext={canAdvance(data, step.id)}
          />
        </div>
      </div>

      {invitePrompt && (
        <InvitePrompt
          people={invitePrompt}
          pending={pending}
          onCancel={() => setInvitePrompt(null)}
          onLaunch={(emails) => void submit("active", emails)}
        />
      )}
    </div>
  );
}

function canAdvance(data: WizardData, stepId: string): boolean {
  if (stepId === "basics") return data.title.trim().length > 0;
  return true;
}

// ─── Chrome ───────────────────────────────────────────────────────────
function NPTopBar({ overlay, onClose }: { overlay: boolean; onClose?: () => void }) {
  if (overlay) {
    return (
      <div className="topbar overlay">
        <button className="btn ghost sm" onClick={onClose}>
          <Icon name="ChevronLeft" size={14} />
          <span>Back to productions</span>
        </button>
        <div className="brand" style={{ marginLeft: "auto" }}>
          <div className="brand-mark">C</div>
          <span>New production</span>
        </div>
        <button
          className="btn ghost icon-only sm"
          onClick={onClose}
          title="Close (Esc)"
          style={{ marginLeft: 14 }}
        >
          <Icon name="X" size={14} />
        </button>
      </div>
    );
  }
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">C</div>
        <span>CallBoard</span>
      </div>
      <div className="top-crumbs">
        <Icon name="ChevronRight" size={12} />
        <Link href="/productions">Productions</Link>
        <Icon name="ChevronRight" size={12} />
        <span style={{ color: "var(--ink)" }}>New production</span>
      </div>
      <Link className="top-exit" href="/productions" title="Exit setup">
        <Icon name="X" size={14} />
        <span>Save &amp; exit</span>
      </Link>
    </div>
  );
}

function NPRail({
  stepIdx,
  setStepIdx,
}: {
  stepIdx: number;
  setStepIdx: (i: number) => void;
}) {
  return (
    <aside className="rail">
      <h1>Set up your production.</h1>
      <div className="rail-sub">Six quick steps. You can edit everything later.</div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={"step " + (i === stepIdx ? "active" : i < stepIdx ? "done" : "")}
            onClick={() => setStepIdx(i)}
          >
            <div className="step-no">
              {i < stepIdx ? <Icon name="Check" size={12} strokeWidth={2.5} /> : s.no}
            </div>
            <div>
              <div className="step-label">{s.label}</div>
              <div className="step-hint">{s.hint}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="rail-foot">
        <b>Tip</b>
        Need to invite cast later? You can send invite links from the Team page any time.
      </div>
    </aside>
  );
}

function Actions({
  stepIdx,
  pending,
  onPrev,
  onNext,
  onSaveDraft,
  canNext,
}: {
  stepIdx: number;
  pending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  canNext: boolean;
}) {
  const last = stepIdx === STEPS.length - 1;
  return (
    <div className="actions">
      <button
        className="btn ghost"
        onClick={onPrev}
        disabled={stepIdx === 0 || pending}
        style={{ opacity: stepIdx === 0 ? 0.4 : 1 }}
      >
        <Icon name="ChevronLeft" size={14} />
        <span>Back</span>
      </button>
      <span className="progress-tag">{String(stepIdx + 1).padStart(2, "0")} / 06</span>
      <div className="spacer" />
      <button className="btn ghost" onClick={onSaveDraft} disabled={pending}>
        Save draft
      </button>
      <button
        className={"btn " + (last ? "accent" : "primary")}
        onClick={onNext}
        disabled={!canNext || pending}
        style={{ opacity: canNext && !pending ? 1 : 0.4 }}
      >
        <span>{pending ? "Working…" : last ? "Launch production" : "Continue"}</span>
        {!last && !pending && <Icon name="ChevronRight" size={14} />}
      </button>
    </div>
  );
}

// ─── End-of-launch invite prompt — people not yet in the org ──────────
function InvitePrompt({
  people,
  pending,
  onCancel,
  onLaunch,
}: {
  people: WizardPerson[];
  pending: boolean;
  onCancel: () => void;
  onLaunch: (emails: Record<string, string>) => void;
}) {
  const [emails, setEmails] = useState<Record<string, string>>({});
  const filled = people.filter((p) => (emails[p.key] ?? "").trim()).length;

  return (
    <div
      className="np-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Invite people not in your organization"
    >
      <div className="np-modal">
        <h3 className="np-modal-title">A few people aren&apos;t in your org yet.</h3>
        <p className="np-modal-sub">
          Add an email to invite them — they&apos;ll join your organization and land
          on this production. Leave any blank to skip; you can always invite people
          later from the Team page.
        </p>

        <div className="np-invite-list">
          {people.map((p) => (
            <div key={p.key} className="np-invite-row">
              <div className="np-invite-who">
                <div className="np-invite-name">{p.name}</div>
                <div className="np-invite-ctx">{p.context}</div>
              </div>
              <input
                className="field"
                type="email"
                placeholder="name@theatre.com"
                value={emails[p.key] ?? ""}
                onChange={(e) =>
                  setEmails((prev) => ({ ...prev, [p.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <div className="np-modal-actions">
          <button className="btn ghost" onClick={onCancel} disabled={pending}>
            Back to edit
          </button>
          <div className="spacer" />
          <button
            className="btn ghost"
            onClick={() => onLaunch({})}
            disabled={pending}
          >
            Skip &amp; launch
          </button>
          <button
            className="btn accent"
            onClick={() => onLaunch(emails)}
            disabled={pending}
          >
            {pending
              ? "Working…"
              : filled > 0
                ? `Invite ${filled} & launch`
                : "Launch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 1 · Basics ──────────────────────────────────────────────────
function StepBasics({ data, set }: { data: WizardData; set: (p: Partial<WizardData>) => void }) {
  return (
    <>
      <h2 className="page-title">Tell us about your show.</h2>
      <div className="page-sub">
        Just the essentials — we&apos;ll use this for naming on reports, call sheets, and your season archive.
      </div>

      <div className="grid grid-2">
        <div className="field-group" style={{ gridColumn: "1 / -1" }}>
          <label className="label">
            Title<span className="req">*</span>
          </label>
          <input
            className="field lg"
            value={data.title}
            placeholder="e.g. The Pirates of Penzance"
            onChange={(e) => set({ title: e.target.value })}
            autoFocus
          />
        </div>
        <div className="field-group">
          <label className="label">Venue</label>
          <input
            className="field"
            value={data.venue}
            placeholder="e.g. Wellman Theatre"
            onChange={(e) => set({ venue: e.target.value })}
          />
          <div className="hint">Where you&apos;ll perform. You can add rehearsal rooms later.</div>
        </div>
        <div className="field-group">
          <label className="label">Season</label>
          <select
            className="field"
            value={data.season}
            onChange={(e) => set({ season: e.target.value })}
          >
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="hint">Used to group productions in your archive.</div>
        </div>
      </div>
    </>
  );
}

// ─── STEP 2 · Calendar ────────────────────────────────────────────────
function StepCalendar({ data, set }: { data: WizardData; set: (p: Partial<WizardData>) => void }) {
  return (
    <>
      <h2 className="page-title">When does this happen?</h2>
      <div className="page-sub">
        These dates power your dashboard countdown, default call windows, and rehearsal-day naming.
        You can adjust them any time — we&apos;ll update everything downstream.
      </div>

      <div className="banner">
        <Icon name="Info" size={16} />
        <div>
          <b style={{ fontWeight: 600 }}>Only opening night is required.</b> Everything else can be set
          later, but adding them now lets CallBoard plan ahead — flag conflicts, schedule auto-reminders,
          and structure your default rehearsal calendar.
        </div>
      </div>

      <div className="grid grid-2">
        <div className="field-group">
          <label className="label">First rehearsal</label>
          <input
            className="field"
            type="date"
            value={data.firstRehearsal}
            onChange={(e) => set({ firstRehearsal: e.target.value })}
          />
        </div>
        <div className="field-group">
          <label className="label">Tech week starts</label>
          <input
            className="field"
            type="date"
            value={data.techStart}
            onChange={(e) => set({ techStart: e.target.value })}
          />
        </div>
        <div className="field-group">
          <label className="label">
            Opening night<span className="req">*</span>
          </label>
          <input
            className="field"
            type="date"
            value={data.opening}
            onChange={(e) => set({ opening: e.target.value })}
          />
        </div>
        <div className="field-group">
          <label className="label">Closing</label>
          <input
            className="field"
            type="date"
            value={data.closing}
            onChange={(e) => set({ closing: e.target.value })}
          />
        </div>
      </div>

      <h3 className="sec" style={{ marginTop: 36 }}>
        Default rehearsal pattern
      </h3>
      <div className="field-group" style={{ marginBottom: 18 }}>
        <label className="label">Which days of the week do you rehearse?</label>
        <div className="day-picker">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              className="day-chip"
              data-on={data.rehearsalDays[d] ? "1" : "0"}
              onClick={() =>
                set({ rehearsalDays: { ...data.rehearsalDays, [d]: !data.rehearsalDays[d] } })
              }
            >
              {d}
            </button>
          ))}
        </div>
        <div className="hint">
          {Object.values(data.rehearsalDays).filter(Boolean).length} days/week selected. Tap any day to toggle.
        </div>
      </div>
      <div className="grid grid-2">
        <div className="field-group">
          <label className="label">Typical start</label>
          <input
            className="field"
            value={data.rehearsalStart}
            onChange={(e) => set({ rehearsalStart: e.target.value })}
          />
        </div>
        <div className="field-group">
          <label className="label">Typical end</label>
          <input
            className="field"
            value={data.rehearsalEnd}
            onChange={(e) => set({ rehearsalEnd: e.target.value })}
          />
        </div>
      </div>
      <div className="hint" style={{ marginTop: 8 }}>
        Used to pre-fill call times when creating reports — overridden per day.
      </div>
    </>
  );
}

// ─── STEP 3 · Departments ─────────────────────────────────────────────
function StepDepts({ data, set }: { data: WizardData; set: (p: Partial<WizardData>) => void }) {
  const toggle = (key: string) => {
    if (ALL_DEPTS.find((d) => d.key === key)?.required) return;
    set({ depts: { ...data.depts, [key]: !data.depts[key] } });
  };
  const onCount = Object.values(data.depts).filter(Boolean).length;
  return (
    <>
      <h2 className="page-title">Which departments are active?</h2>
      <div className="page-sub">
        Turn on the teams this production needs. Each enabled department gets its own section in rehearsal
        reports, document folder, and a notification channel.
      </div>

      <h3 className="sec">
        Departments <span className="count">{onCount} active</span>
      </h3>
      <div className="dept-grid">
        {ALL_DEPTS.map((d) => {
          const on = data.depts[d.key];
          return (
            <div
              key={d.key}
              className="dept-card"
              data-on={on ? "1" : "0"}
              onClick={() => toggle(d.key)}
            >
              <div
                className="dept-ico"
                style={{
                  background: on ? `var(--c-${d.c}-soft, var(--bg-sunken))` : "var(--bg-sunken)",
                  color: on && d.c ? `color-mix(in oklch, var(--c-${d.c}) 45%, var(--ink))` : "var(--ink-3)",
                }}
              >
                <Icon name={d.icon} size={16} />
              </div>
              <div className="dept-meta">
                <b>
                  {d.label}
                  {d.required && (
                    <span style={{ color: "var(--ink-4)", fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                      · required
                    </span>
                  )}
                </b>
                <span>{d.hint}</span>
              </div>
              <div className="dept-toggle" />
            </div>
          );
        })}
      </div>

      <div className="banner" style={{ marginTop: 28 }}>
        <Icon name="Info" size={16} />
        <div>
          Don&apos;t worry about getting this perfect — you can add or remove departments later from{" "}
          <b>Settings → Departments</b>. Disabled departments just disappear from the report form and team
          filters.
        </div>
      </div>
    </>
  );
}

// ─── STEP 4 · Roles / Characters ──────────────────────────────────────
function StepRoles({
  data,
  set,
  orgUsers,
}: {
  data: WizardData;
  set: (p: Partial<WizardData>) => void;
  orgUsers: WizardOrgUser[];
}) {
  const update = (i: number, patch: Partial<RoleRow>) =>
    set({ roles: data.roles.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const remove = (i: number) => set({ roles: data.roles.filter((_, j) => j !== i) });
  const add = () =>
    set({ roles: [...data.roles, { id: `r${Date.now()}`, name: "", actor: "", type: "Principal" }] });

  const [bulk, setBulk] = useState("");
  const applyBulk = () => {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: RoleRow[] = lines.map((line, i) => {
      const parts = line.split(/[,—|\t]+/).map((s) => s.trim());
      return {
        id: `r${Date.now()}-${i}`,
        name: parts[0] || "",
        actor: parts[1] || "",
        type: parts[2] || "Principal",
      };
    });
    set({ roles: [...data.roles, ...parsed] });
    setBulk("");
  };

  const bulkCount = bulk.split("\n").filter((l) => l.trim()).length;

  return (
    <>
      <h2 className="page-title">Cast list &amp; characters.</h2>
      <div className="page-sub">
        Add the roles in your show. You can leave actor names blank for now and assign them later as you
        cast — or invite cast directly in the next step.
      </div>

      <h3 className="sec">
        Roles <span className="count">{data.roles.length}</span>
      </h3>

      <div className="row-list">
        <div className="row-header role-row">
          <span>Character / role</span>
          <span>Actor (optional)</span>
          <span>Type</span>
          <span></span>
        </div>
        {data.roles.map((r, i) => (
          <div key={r.id} className="row-item role-row">
            <input
              className="field"
              value={r.name}
              placeholder="Frederic"
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <PersonAutocomplete
              value={r.actor}
              orgUsers={orgUsers}
              onChange={(name, email) =>
                update(i, { actor: name, actorEmail: email })
              }
            />
            <select className="field" value={r.type} onChange={(e) => update(i, { type: e.target.value })}>
              {ROLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button
              className="btn ghost icon-only sm delete"
              onClick={() => remove(i)}
              title="Remove"
            >
              <Icon name="Trash2" size={12} />
            </button>
          </div>
        ))}
        <button className="add-btn" onClick={add}>
          <Icon name="Plus" size={14} />
          <span>Add a role</span>
        </button>
      </div>

      <details className="bulk">
        <summary>Paste a cast list to import several at once</summary>
        <div className="bulk-body">
          <div className="hint" style={{ margin: "4px 0 10px" }}>
            One per line — <span className="mono">Character, Actor, Type</span> (commas, tabs, or dashes
            work). Actor and type are optional.
          </div>
          <textarea
            className="field"
            value={bulk}
            placeholder={"Frederic, Theo Marsh, Principal\nMabel, Priya Anand, Principal\nPirate King, Marcus Beale, Principal\nDaughter chorus, , Ensemble"}
            onChange={(e) => setBulk(e.target.value)}
          />
          <button className="btn sm primary" style={{ marginTop: 10 }} onClick={applyBulk} disabled={!bulk.trim()}>
            <Icon name="Plus" size={12} />
            <span>
              Import {bulkCount} role{bulkCount === 1 ? "" : "s"}
            </span>
          </button>
        </div>
      </details>
    </>
  );
}

// ─── Person autocomplete — typeahead over org members ─────────────────
// `onChange(name, email?)` fires `email` only when a row is picked from the
// dropdown, so callers can tell "chosen org member" from "free-typed name".
function PersonAutocomplete({
  value,
  orgUsers,
  placeholder,
  onChange,
}: {
  value: string;
  orgUsers: WizardOrgUser[];
  placeholder?: string;
  onChange: (name: string, email?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const matches = useMemo(() => {
    if (!value || !value.trim()) return [];
    const q = value.toLowerCase().trim();
    return orgUsers
      .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [value, orgUsers]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (u: WizardOrgUser) => {
    onChange(u.name, u.email);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        className="field"
        value={value}
        placeholder={placeholder ?? "Type a name…"}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          }
          if (e.key === "Enter") {
            e.preventDefault();
            pick(matches[active]);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && matches.length > 0 && (
        <div className="ac-pop">
          <div className="ac-head">From your org</div>
          {matches.map((u, i) => (
            <div
              key={u.email}
              className="ac-item"
              data-active={i === active ? "1" : "0"}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(u);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <div className="av" style={{ background: "var(--c-dusk)", width: 24, height: 24, fontSize: 10 }}>
                {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {u.email}
                </div>
              </div>
            </div>
          ))}
          <div className="ac-foot">↑↓ to navigate · ↵ to select</div>
        </div>
      )}
    </div>
  );
}

// ─── STEP 5 · Team / Invites ──────────────────────────────────────────
function StepTeam({
  data,
  set,
  orgUsers,
}: {
  data: WizardData;
  set: (p: Partial<WizardData>) => void;
  orgUsers: WizardOrgUser[];
}) {
  const update = (i: number, patch: Partial<TeamRow>) =>
    set({ team: data.team.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const remove = (i: number) => set({ team: data.team.filter((_, j) => j !== i) });
  const add = (role?: (typeof TEAM_ROLES)[number]) => {
    const r = role || { label: "Stage Manager", dept: "stage", c: "" };
    set({
      team: [...data.team, { id: `t${Date.now()}`, name: "", email: "", role: r.label, dept: r.dept, c: r.c }],
    });
  };

  const [bulk, setBulk] = useState("");
  const applyBulk = () => {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: TeamRow[] = lines.map((line, i) => {
      const parts = line.split(/[,\t]+/).map((s) => s.trim());
      const label = parts[2] || "Stage Manager";
      const match = TEAM_ROLES.find((x) => x.label === label);
      return {
        id: `t${Date.now()}-${i}`,
        name: parts[0] || "",
        email: parts[1] || "",
        role: match?.label || "Stage Manager",
        dept: match?.dept || "stage",
        c: match?.c || "",
      };
    });
    set({ team: [...data.team, ...parsed] });
    setBulk("");
  };

  return (
    <>
      <h2 className="page-title">Invite your team.</h2>
      <div className="page-sub">
        Add stage management, creatives, and crew by name — start typing and pick
        them from your organization. Anyone who isn&apos;t in your org yet, we&apos;ll
        ask you to invite by email at the end.
      </div>

      <div className="banner success">
        <Icon name="Info" size={16} />
        <div>
          <b style={{ fontWeight: 600 }}>Permissions are set per role.</b> Stage Managers &amp; Directors get
          full edit access. Designers see their department + shared docs. Cast see their schedule, call times,
          and the cast-facing report view — line notes and internal SM notes stay private.
        </div>
      </div>

      <h3 className="sec">
        Team members <span className="count">{data.team.length}</span>
      </h3>

      <div className="row-list">
        <div className="row-header team-row">
          <span>Name</span>
          <span>Role</span>
          <span></span>
        </div>
        {data.team.map((m, i) => (
          <div key={m.id} className="row-item team-row">
            <PersonAutocomplete
              value={m.name}
              orgUsers={orgUsers}
              placeholder="Full name"
              onChange={(name, email) =>
                update(i, { name, email: email ?? "" })
              }
            />
            <select
              className="field"
              value={m.role}
              onChange={(e) => {
                const r = TEAM_ROLES.find((x) => x.label === e.target.value);
                update(i, { role: e.target.value, dept: r?.dept || m.dept, c: r?.c || m.c });
              }}
            >
              {TEAM_ROLES.map((r) => (
                <option key={r.label}>{r.label}</option>
              ))}
            </select>
            <button className="btn ghost icon-only sm delete" onClick={() => remove(i)} title="Remove">
              <Icon name="Trash2" size={12} />
            </button>
          </div>
        ))}
        <button className="add-btn" onClick={() => add()}>
          <Icon name="Plus" size={14} />
          <span>Add a team member</span>
        </button>
      </div>

      <h3 className="sec" style={{ marginTop: 32 }}>
        Quick add by role
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TEAM_ROLES.slice(0, 12).map((r) => (
          <button key={r.label} className="btn sm" onClick={() => add(r)}>
            <Icon name="Plus" size={11} />
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      <details className="bulk">
        <summary>Bulk invite from a CSV or spreadsheet</summary>
        <div className="bulk-body">
          <div className="hint" style={{ margin: "4px 0 10px" }}>
            One per line — <span className="mono">Name, Email, Role</span>.
          </div>
          <textarea
            className="field"
            value={bulk}
            placeholder={"Maya Okafor, maya@example.com, Stage Manager\nHelena Voss, helena@example.com, Music Director\nTheo Marsh, theo@example.com, Cast — Principal"}
            onChange={(e) => setBulk(e.target.value)}
          />
          <button className="btn sm primary" style={{ marginTop: 10 }} onClick={applyBulk} disabled={!bulk.trim()}>
            <Icon name="Plus" size={12} />
            <span>Add to team</span>
          </button>
        </div>
      </details>
    </>
  );
}

// ─── STEP 6 · Review ──────────────────────────────────────────────────
function StepReview({ data, jumpTo }: { data: WizardData; jumpTo: (i: number) => void }) {
  const onDepts = Object.entries(data.depts).filter(([, v]) => v).map(([k]) => k);
  const fmt = (d: string) =>
    d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const filledTeam = data.team.filter((t) => t.name || t.email);
  const filledRoles = data.roles.filter((r) => r.name);

  return (
    <>
      <h2 className="page-title">Ready to launch.</h2>
      <div className="page-sub">
        Here&apos;s what we&apos;ll set up. Click any section to make changes — your team gets notified the
        moment you launch, so double-check before you press the button.
      </div>

      <div className="review-grid">
        <div className="review-card" style={{ gridColumn: "1 / -1" }}>
          <h4>
            <Icon name="Star" size={12} />
            <span>Production</span>
            <a onClick={() => jumpTo(0)}>Edit</a>
          </h4>
          <div className="kv">
            <span className="k">Title</span>
            <span className="v" style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
              {data.title || "Untitled production"}
            </span>
          </div>
          <div className="kv">
            <span className="k">Venue</span>
            <span className="v">{data.venue || "—"}</span>
          </div>
          <div className="kv">
            <span className="k">Season</span>
            <span className="v">{data.season}</span>
          </div>
          <div className="kv">
            <span className="k">Rehearsal days</span>
            <span className="v">
              {Object.entries(data.rehearsalDays).filter(([, v]) => v).map(([k]) => k).join(", ") || "—"}
            </span>
          </div>
          <div className="kv">
            <span className="k">Typical call</span>
            <span className="v" style={{ fontFamily: "var(--font-mono)" }}>
              {data.rehearsalStart} – {data.rehearsalEnd}
            </span>
          </div>
        </div>

        <div className="review-card" style={{ gridColumn: "1 / -1" }}>
          <h4>
            <Icon name="Calendar" size={12} />
            <span>Calendar</span>
            <a onClick={() => jumpTo(1)}>Edit</a>
          </h4>
          <div className="date-band">
            <div className="item">
              <span>First rehearsal</span>
              <b>{fmt(data.firstRehearsal)}</b>
            </div>
            <div className="item">
              <span>Tech starts</span>
              <b>{fmt(data.techStart)}</b>
            </div>
            <div className="item">
              <span>Opening</span>
              <b style={{ color: "var(--accent)" }}>{fmt(data.opening)}</b>
            </div>
            <div className="item">
              <span>Closing</span>
              <b>{fmt(data.closing)}</b>
            </div>
          </div>
        </div>

        <div className="review-card">
          <h4>
            <Icon name="Layers" size={12} />
            <span>Departments</span>
            <a onClick={() => jumpTo(2)}>Edit</a>
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {onDepts.map((key) => {
              const d = ALL_DEPTS.find((x) => x.key === key);
              return (
                <span key={key} className="pill" data-c={d?.c || ""}>
                  {d?.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="review-card">
          <h4>
            <Icon name="Mask" size={12} />
            <span>Roles</span>
            <a onClick={() => jumpTo(3)}>Edit</a>
          </h4>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, lineHeight: 1 }}>
            {filledRoles.length}
          </div>
          <div className="hint" style={{ marginTop: 6 }}>
            {filledRoles.length
              ? filledRoles.slice(0, 4).map((r) => r.name).join(" · ") +
                (filledRoles.length > 4 ? ` · +${filledRoles.length - 4} more` : "")
              : "No roles added yet."}
          </div>
        </div>

        <div className="review-card" style={{ gridColumn: "1 / -1" }}>
          <h4>
            <Icon name="Users" size={12} />
            <span>
              Team — {filledTeam.length} member{filledTeam.length === 1 ? "" : "s"}
            </span>
            <a onClick={() => jumpTo(4)}>Edit</a>
          </h4>
          {filledTeam.length === 0 ? (
            <div className="hint">No team added yet — you can add members after launching.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {filledTeam.slice(0, 6).map((m, i) => (
                <div
                  key={i}
                  style={{ display: "grid", gridTemplateColumns: "26px 1fr 1fr auto", alignItems: "center", gap: 10, fontSize: 13 }}
                >
                  <div className="av" style={{ background: m.c ? `var(--c-${m.c})` : "var(--ink-3)" }}>
                    {m.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"}
                  </div>
                  <span style={{ fontWeight: 500 }}>{m.name || <span className="hint">unnamed</span>}</span>
                  <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {m.email || "invite at launch"}
                  </span>
                  <span className="pill" data-c={m.c || ""}>
                    {m.role}
                  </span>
                </div>
              ))}
              {filledTeam.length > 6 && <div className="hint">+{filledTeam.length - 6} more</div>}
            </div>
          )}
        </div>
      </div>

      <div className="banner success" style={{ marginTop: 28 }}>
        <Icon name="Check" size={16} />
        <div>
          <b style={{ fontWeight: 600 }}>When you launch:</b> we&apos;ll create the production dashboard,
          generate folder structure for all enabled departments, send invite emails to your team, and drop
          you into the Overview page ready to schedule your first rehearsal.
        </div>
      </div>
    </>
  );
}

// ─── Launch screen ────────────────────────────────────────────────────
function LaunchScreen({
  data,
  overlay,
  slug,
  summary,
  trialWarning,
  onClose,
}: {
  data: WizardData;
  overlay: boolean;
  slug: string;
  summary: LaunchSummary;
  trialWarning?: string;
  onClose?: () => void;
}) {
  return (
    <>
      {!overlay && <NPTopBar overlay={false} />}
      <div className="main" style={{ margin: "0 auto", maxWidth: 680 }}>
        <div className="launch anim-in">
          <div className="launch-mark">{(data.title || "P")[0]}</div>
          <h2>{data.title || "Your production"} is live.</h2>
          <p>
            {summary.invited > 0
              ? `Invites are on their way to ${summary.invited} new team member${summary.invited === 1 ? "" : "s"}.`
              : "Your dashboard is ready."}{" "}
            Schedule your first rehearsal and start tracking from day one.
          </p>
          {trialWarning && (
            <div className="banner" style={{ textAlign: "left", maxWidth: 480, margin: "0 auto 28px" }}>
              <Icon name="Info" size={16} />
              <div>{trialWarning}</div>
            </div>
          )}
          {summary.skipped.length > 0 && (
            <div className="banner" style={{ textAlign: "left", maxWidth: 480, margin: "0 auto 28px" }}>
              <Icon name="Info" size={16} />
              <div>
                {summary.skipped.length} team member{summary.skipped.length === 1 ? "" : "s"} couldn&apos;t be
                added automatically:
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {summary.skipped.map((s) => (
                    <li key={s.email}>
                      <b>{s.email}</b> — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="launch-stats">
            <div className="item">
              <b>{summary.roles}</b>
              <span>Roles</span>
            </div>
            <div className="item">
              <b>{summary.assigned + summary.invited}</b>
              <span>Team added</span>
            </div>
            <div className="item">
              <b>{summary.departments}</b>
              <span>Departments</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            {overlay ? (
              <button className="btn" onClick={onClose}>
                Back to productions
              </button>
            ) : (
              <Link className="btn" href="/productions">
                All productions
              </Link>
            )}
            <Link className="btn accent" href={`/productions/${slug}`}>
              <span>Open {data.title || "production"}</span>
              <Icon name="ChevronRight" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
