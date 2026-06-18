"use client";

// Create-workspace setup wizard — four steps from blank slate to a live
// workspace the user owns as its first admin.
//
// Step 1 · Workspace  — name + optional logo
// Step 2 · About      — optional company profile (shows/year, team size, types)
// Step 3 · Team        — optionally invite people by email
// Step 4 · Review      — confirm + create
//
// Reuses the New Production wizard's `.np-root` / `.np-overlay` chrome (see
// app/globals.css) so the two setup flows feel like one product. The logo is
// held in the browser until the org exists, then uploaded on the final step —
// the signed-upload path is scoped to the new org id, which only exists once
// createWorkspace has run.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  createWorkspace,
  finalizeWorkspaceLogoUpload,
  requestWorkspaceLogoUpload,
} from "@/features/workspace/actions";
import { inviteMembers } from "@/features/members/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import {
  ANNUAL_SHOWS_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from "@/features/workspace/constants";
import { ROLE_META } from "@/features/members/constants";
import { ROLES, type Role } from "@/types/roles";

const STEPS = [
  { id: "workspace", no: "01", label: "Workspace", hint: "Name & logo" },
  { id: "about", no: "02", label: "About your company", hint: "Tailors your defaults" },
  { id: "team", no: "03", label: "Invite your team", hint: "Optional — add later too" },
  { id: "review", no: "04", label: "Review", hint: "Confirm & create" },
] as const;

const LOGO_ACCEPT = "image/png,image/jpeg";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const NAME_MAX = 60;

type InviteRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

function newInviteRow(): InviteRow {
  return {
    id: Math.random().toString(36).slice(2),
    firstName: "",
    lastName: "",
    email: "",
    role: "stage_manager",
  };
}

type Done = { name: string; invited: number; warnings: string[] };

export default function CreateWorkspaceWizard() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  // Step 1
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile],
  );
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [annualShows, setAnnualShows] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [productionTypes, setProductionTypes] = useState<string[]>([]);

  // Step 3
  const [invites, setInvites] = useState<InviteRow[]>([newInviteRow()]);

  const step = STEPS[stepIdx];
  const last = stepIdx === STEPS.length - 1;
  const canAdvance = step.id === "workspace" ? name.trim().length > 0 : true;

  const toggleType = (t: string) =>
    setProductionTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Logo must be a PNG or JPG.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError("Logo must be 2MB or smaller.");
      return;
    }
    setLogoFile(file);
  };

  const goNext = () => {
    setError(null);
    if (!last) {
      setStepIdx((i) => i + 1);
      return;
    }
    void create();
  };
  const goPrev = () => {
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  };

  async function create() {
    setPending(true);
    setError(null);

    const result = await createWorkspace({
      name: name.trim(),
      annualShows,
      teamSize,
      productionTypes,
    });
    if (result.error || !result.organizationId) {
      setError(result.error ?? "Could not create the workspace.");
      setPending(false);
      return;
    }

    // From here the org exists and the caller is its admin (auth has already
    // switched them in), so logo + invites are best-effort: a failure leaves
    // the workspace intact and is surfaced as a warning, not a hard stop.
    const warnings: string[] = [];

    if (logoFile) {
      const signed = await requestWorkspaceLogoUpload(
        logoFile.name,
        logoFile.type,
        logoFile.size,
      );
      if (signed.error || !signed.path || !signed.token) {
        warnings.push(
          `Logo wasn't saved (${signed.error ?? "upload couldn't start"}). Add it later in Settings.`,
        );
      } else {
        const up = await uploadFileToSignedUrl(
          signed.path,
          signed.token,
          logoFile,
        );
        if (up.error) {
          warnings.push(`Logo wasn't saved (${up.error}). Add it later in Settings.`);
        } else {
          const fin = await finalizeWorkspaceLogoUpload(signed.path);
          if (fin.error) {
            warnings.push(`Logo wasn't saved (${fin.error}). Add it later in Settings.`);
          }
        }
      }
    }

    let invited = 0;
    const people = invites.filter((r) => r.email.trim());
    if (people.length > 0) {
      const res = await inviteMembers({
        sendInvite: true,
        people: people.map((r) => ({
          firstName: r.firstName.trim(),
          lastName: r.lastName.trim(),
          email: r.email.trim(),
          role: r.role,
        })),
      });
      if (res.error) {
        warnings.push(`Invites weren't sent (${res.error}). Add people from the Team page.`);
      } else if (res.summary) {
        invited = res.summary.invited + res.summary.added;
        if (res.summary.errored > 0) {
          warnings.push(
            `${res.summary.errored} invite${res.summary.errored === 1 ? "" : "s"} couldn't be sent. Check them on the Team page.`,
          );
        }
      }
    }

    setDone({ name: name.trim(), invited, warnings });
    setPending(false);
  }

  if (done) {
    return (
      <div className="np-root">
        <DoneScreen done={done} router={router} />
      </div>
    );
  }

  return (
    <div className="np-root">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-badge is-light" src="/brand-ink.svg" alt="" width={26} height={26} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-badge is-dark" src="/brand-paper.svg" alt="" width={26} height={26} />
          </div>
          <span>Proscene</span>
        </div>
        <div className="top-crumbs">
          <Icon name="ChevronRight" size={12} />
          <span style={{ color: "var(--ink)" }}>New workspace</span>
        </div>
        <Link className="top-exit" href="/settings" title="Cancel setup">
          <Icon name="X" size={14} />
          <span>Cancel</span>
        </Link>
      </div>

      <div className="body">
        <aside className="rail">
          <h1>Set up your workspace.</h1>
          <div className="rail-sub">
            A workspace is your company&apos;s home for shows, people, and
            documents. You can change all of this later.
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={
                  "step " + (i === stepIdx ? "active" : i < stepIdx ? "done" : "")
                }
                onClick={() => setStepIdx(i)}
              >
                <div className="step-no">
                  {i < stepIdx ? (
                    <Icon name="Check" size={12} strokeWidth={2.5} />
                  ) : (
                    s.no
                  )}
                </div>
                <div>
                  <div className="step-label">{s.label}</div>
                  <div className="step-hint">{s.hint}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rail-foot">
            <b>You&apos;ll be the admin</b>
            Creating a workspace makes you its first admin, with full control
            over members and settings.
          </div>
        </aside>

        <div className="main">
          <div key={step.id} className="anim-in">
            <div className="crumb">
              Step {step.no} of {String(STEPS.length).padStart(2, "0")}
            </div>

            {step.id === "workspace" && (
              <>
                <h2 className="page-title">Name your workspace.</h2>
                <div className="page-sub">
                  Usually your theatre company or organization name. It shows in
                  the rail, on reports, and anywhere your workspace appears.
                </div>
                <div className="grid grid-2">
                  <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="label">
                      Workspace name<span className="req">*</span>
                    </label>
                    <input
                      className="field lg"
                      value={name}
                      placeholder="e.g. Wellman Theatre Company"
                      maxLength={NAME_MAX}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="label">Logo</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          background: "var(--bg-muted)",
                          border: "1px solid var(--border)",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Icon
                            name="Building2"
                            size={28}
                            aria-hidden
                            style={{ color: "var(--ink-4)" }}
                          />
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Icon name="Upload" size={14} aria-hidden />
                          {logoFile ? "Replace" : "Upload"}
                        </button>
                        {logoFile && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setLogoFile(null)}
                          >
                            <Icon name="Trash2" size={14} aria-hidden /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="hint">
                      Optional. PNG or JPG. Square works best. Up to 2MB.
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept={LOGO_ACCEPT}
                      onChange={onPickLogo}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </>
            )}

            {step.id === "about" && (
              <>
                <h2 className="page-title">Tell us about your company.</h2>
                <div className="page-sub">
                  Optional, and only takes a moment. We use it to tailor your
                  defaults — skip any question you&apos;d rather not answer.
                </div>

                <div className="field-group">
                  <label className="label">How many shows do you produce a year?</label>
                  <ChipRow
                    options={ANNUAL_SHOWS_OPTIONS}
                    selected={annualShows ? [annualShows] : []}
                    onToggle={(v) => setAnnualShows((cur) => (cur === v ? null : v))}
                  />
                </div>

                <div className="field-group" style={{ marginTop: 20 }}>
                  <label className="label">How big is your team?</label>
                  <ChipRow
                    options={TEAM_SIZE_OPTIONS}
                    selected={teamSize ? [teamSize] : []}
                    onToggle={(v) => setTeamSize((cur) => (cur === v ? null : v))}
                  />
                </div>

                <div className="field-group" style={{ marginTop: 20 }}>
                  <label className="label">
                    What kinds of productions do you put on?
                  </label>
                  <ChipRow
                    options={PRODUCTION_TYPE_OPTIONS}
                    selected={productionTypes}
                    onToggle={toggleType}
                  />
                  <div className="hint">Pick as many as apply.</div>
                </div>
              </>
            )}

            {step.id === "team" && (
              <>
                <h2 className="page-title">Invite your team.</h2>
                <div className="page-sub">
                  Optional — you can always add people later from the Team page.
                  Invitees get an email to join {name.trim() || "your workspace"}.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {invites.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1.4fr auto auto",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <input
                        className="field"
                        placeholder="First name"
                        value={row.firstName}
                        onChange={(e) =>
                          setInvites((rows) =>
                            rows.map((r) =>
                              r.id === row.id
                                ? { ...r, firstName: e.target.value }
                                : r,
                            ),
                          )
                        }
                      />
                      <input
                        className="field"
                        placeholder="Last name"
                        value={row.lastName}
                        onChange={(e) =>
                          setInvites((rows) =>
                            rows.map((r) =>
                              r.id === row.id
                                ? { ...r, lastName: e.target.value }
                                : r,
                            ),
                          )
                        }
                      />
                      <input
                        className="field"
                        type="email"
                        placeholder="email@company.com"
                        value={row.email}
                        onChange={(e) =>
                          setInvites((rows) =>
                            rows.map((r) =>
                              r.id === row.id ? { ...r, email: e.target.value } : r,
                            ),
                          )
                        }
                      />
                      <select
                        className="field"
                        value={row.role}
                        onChange={(e) =>
                          setInvites((rows) =>
                            rows.map((r) =>
                              r.id === row.id
                                ? { ...r, role: e.target.value as Role }
                                : r,
                            ),
                          )
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_META[r].label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn ghost icon-only sm"
                        title="Remove row"
                        onClick={() =>
                          setInvites((rows) =>
                            rows.length === 1
                              ? [newInviteRow()]
                              : rows.filter((r) => r.id !== row.id),
                          )
                        }
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 12 }}
                  onClick={() => setInvites((rows) => [...rows, newInviteRow()])}
                >
                  <Icon name="Plus" size={14} aria-hidden /> Add another
                </button>
              </>
            )}

            {step.id === "review" && (
              <>
                <h2 className="page-title">Ready to create.</h2>
                <div className="page-sub">
                  Quick check before we set everything up. You can edit all of
                  this once you&apos;re in.
                </div>
                <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <ReviewRow label="Workspace" onEdit={() => setStepIdx(0)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {logoPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoPreview}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }}
                        />
                      )}
                      <strong>{name.trim() || "—"}</strong>
                      {!logoFile && <span className="muted">· no logo</span>}
                    </div>
                  </ReviewRow>
                  <ReviewRow label="Company profile" onEdit={() => setStepIdx(1)}>
                    {annualShows || teamSize || productionTypes.length > 0 ? (
                      <span>
                        {[
                          annualShows && `${annualShows} shows/yr`,
                          teamSize && `${teamSize} people`,
                          productionTypes.length > 0 && productionTypes.join(", "),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : (
                      <span className="muted">Skipped</span>
                    )}
                  </ReviewRow>
                  <ReviewRow label="Invites" onEdit={() => setStepIdx(2)}>
                    {(() => {
                      const n = invites.filter((r) => r.email.trim()).length;
                      return n > 0 ? (
                        <span>
                          {n} {n === 1 ? "person" : "people"}
                        </span>
                      ) : (
                        <span className="muted">None yet</span>
                      );
                    })()}
                  </ReviewRow>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="banner" style={{ marginTop: 24, marginBottom: 0 }}>
              <Icon name="AlertTriangle" size={16} />
              <div>{error}</div>
            </div>
          )}

          <div className="actions">
            <button
              className="btn ghost"
              onClick={goPrev}
              disabled={stepIdx === 0 || pending}
              style={{ opacity: stepIdx === 0 ? 0.4 : 1 }}
            >
              <Icon name="ChevronLeft" size={14} />
              <span>Back</span>
            </button>
            <span className="progress-tag">
              {String(stepIdx + 1).padStart(2, "0")} /{" "}
              {String(STEPS.length).padStart(2, "0")}
            </span>
            <div className="spacer" />
            <button
              className={"btn " + (last ? "accent" : "primary")}
              onClick={goNext}
              disabled={!canAdvance || pending}
              style={{ opacity: canAdvance && !pending ? 1 : 0.4 }}
            >
              <span>
                {pending ? "Creating…" : last ? "Create workspace" : "Continue"}
              </span>
              {!last && !pending && <Icon name="ChevronRight" size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipRow({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className="btn"
            aria-pressed={on}
            onClick={() => onToggle(opt)}
            style={{
              borderColor: on ? "var(--accent)" : undefined,
              background: on ? "var(--accent-soft, var(--bg-elev))" : undefined,
              color: on ? "var(--accent)" : undefined,
            }}
          >
            {on && <Icon name="Check" size={13} strokeWidth={2.5} aria-hidden />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div className="label" style={{ marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 14 }}>{children}</div>
      </div>
      <button type="button" className="btn ghost sm" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

function DoneScreen({
  done,
  router,
}: {
  done: Done;
  router: ReturnType<typeof useRouter>;
}) {
  // Hard navigate so the destination always gets a fresh server render with
  // the new org's selectedOrganizationId — client-side push + refresh() races
  // and can serve a cached page still scoped to the previous org.
  const go = (href: string) => {
    window.location.href = href;
  };
  return (
    <div className="main" style={{ margin: "0 auto", maxWidth: 560, paddingTop: 80 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--c-sage-soft)",
          display: "grid",
          placeItems: "center",
          marginBottom: 20,
        }}
      >
        <Icon name="Check" size={26} strokeWidth={2.5} style={{ color: "var(--c-sage)" }} />
      </div>
      <h2 className="page-title">{done.name} is ready.</h2>
      <div className="page-sub">
        You&apos;re now an admin of this workspace.
        {done.invited > 0
          ? ` We emailed ${done.invited} ${done.invited === 1 ? "invite" : "invites"}.`
          : ""}
      </div>

      {done.warnings.length > 0 && (
        <div className="banner" style={{ marginBottom: 20 }}>
          <Icon name="AlertTriangle" size={16} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {done.warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn primary" onClick={() => go("/dashboard")}>
          Go to your workspace
        </button>
        <button className="btn" onClick={() => go("/productions/new")}>
          <Icon name="Plus" size={14} aria-hidden /> Create your first production
        </button>
      </div>
    </div>
  );
}
