"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  completeOnboarding,
  requestWorkspaceLogoUpload,
  finalizeWorkspaceLogoUpload,
} from "@/features/workspace/actions";
import { inviteMembers } from "@/features/members/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import { contrastText } from "@/lib/brand-colors";
import {
  ANNUAL_SHOWS_OPTIONS,
  AUDIENCE_SIZE_OPTIONS,
  BRAND_COLOR_PRESETS,
  PRODUCTION_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from "@/features/workspace/constants";
import { ROLE_META } from "@/features/members/constants";
import { ROLES, type Role } from "@/types/roles";

const LOGO_ACCEPT = "image/svg+xml,image/png,image/jpeg";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

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

function ColorPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const [custom, setCustom] = useState("");
  const resolvedCustom = custom.match(/^#[0-9a-fA-F]{6}$/) ? custom : null;

  const handleSwatch = (color: string) => {
    setCustom("");
    onChange(value === color ? null : color);
  };

  const handleCustom = (raw: string) => {
    setCustom(raw);
    onChange(raw.match(/^#[0-9a-fA-F]{6}$/) ? raw : null);
  };

  const active = value ?? resolvedCustom;

  return (
    <div className="field-group">
      <label className="label">{label}</label>
      <div className="hint" style={{ marginBottom: 10 }}>{hint}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {BRAND_COLOR_PRESETS.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={selected}
              onClick={() => handleSwatch(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: color,
                border: "none",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                boxShadow: selected
                  ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}`
                  : "0 0 0 1px rgba(0,0,0,0.12)",
                transition: "box-shadow 0.12s",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {active && (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: active,
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          />
        )}
        <input
          className="field"
          placeholder="Custom #HEX"
          maxLength={7}
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          style={{ maxWidth: 140 }}
        />
        {active && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => { setCustom(""); onChange(null); }}
          >
            Clear
          </button>
        )}
      </div>
      {active && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              background: active,
              color: contrastText(active),
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Aa preview
          </div>
          <span className="hint" style={{ margin: 0 }}>
            {contrastText(active) === "#000000" ? "Black" : "White"} text on this color.
          </span>
        </div>
      )}
    </div>
  );
}

export function SetupForm({ orgName }: { orgName: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile],
  );
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Brand colors
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [brandColorSecondary, setBrandColorSecondary] = useState<string | null>(null);
  const [brandColorHighlight, setBrandColorHighlight] = useState<string | null>(null);

  // Survey
  const [avgAudienceSize, setAvgAudienceSize] = useState<string | null>(null);
  const [annualShows, setAnnualShows] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [productionTypes, setProductionTypes] = useState<string[]>([]);

  // Team invites
  const [invites, setInvites] = useState<InviteRow[]>([newInviteRow()]);

  const toggleType = (t: string) =>
    setProductionTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!["image/svg+xml", "image/png", "image/jpeg"].includes(file.type)) {
      setError("Logo must be an SVG, PNG, or JPG.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError("Logo must be 2MB or smaller.");
      return;
    }
    setLogoFile(file);
  };

  async function submit(skip = false) {
    setPending(true);
    setError(null);

    if (!skip && logoFile) {
      const signed = await requestWorkspaceLogoUpload(
        logoFile.name,
        logoFile.type,
        logoFile.size,
      );
      if (!signed.error && signed.path && signed.token) {
        const up = await uploadFileToSignedUrl(signed.path, signed.token, logoFile);
        if (!up.error) await finalizeWorkspaceLogoUpload(signed.path);
      }
    }

    const result = await completeOnboarding(
      skip
        ? {}
        : { brandColor, brandColorSecondary, brandColorHighlight, avgAudienceSize, annualShows, teamSize, productionTypes },
    );

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (!skip) {
      const people = invites.filter((r) => r.email.trim());
      if (people.length > 0) {
        await inviteMembers({
          sendInvite: true,
          people: people.map((r) => ({
            firstName: r.firstName.trim(),
            lastName: r.lastName.trim(),
            email: r.email.trim(),
            role: r.role,
          })),
        });
      }
    }

    window.location.href = "/dashboard";
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
          <span style={{ color: "var(--ink)" }}>Set up {orgName}</span>
        </div>
      </div>

      <div className="body">
        <aside className="rail">
          <h1>Let&apos;s get you set up.</h1>
          <div className="rail-sub">
            A few quick questions help us personalize your workspace and improve
            Proscene. Everything is optional.
          </div>
          <div className="rail-foot">
            <b>All optional.</b> You can update everything here from Settings
            any time.
          </div>
        </aside>

        <div className="main">

          {/* Logo */}
          <section>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 12 }}>Logo</h2>
            <div className="field-group">
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
                    <img src={logoPreview} alt="Logo preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Icon name="Building2" size={28} aria-hidden style={{ color: "var(--ink-4)" }} />
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn" onClick={() => logoInputRef.current?.click()}>
                    <Icon name="Upload" size={14} aria-hidden />
                    {logoFile ? "Replace" : "Upload"}
                  </button>
                  {logoFile && (
                    <button type="button" className="btn" onClick={() => setLogoFile(null)}>
                      <Icon name="Trash2" size={14} aria-hidden /> Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="hint">SVG, PNG, or JPG. Square works best. Up to 2MB.</div>
              <input ref={logoInputRef} type="file" accept={LOGO_ACCEPT} onChange={onPickLogo} style={{ display: "none" }} />
            </div>
          </section>

          {/* Brand colors */}
          <section style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 4 }}>Brand colors</h2>
            <p className="page-sub" style={{ marginBottom: 20, marginTop: 4 }}>
              Personalize your workspace. Text on these colors is automatically
              set to black or white for readability.
            </p>
            <ColorPicker label="Primary" hint="Buttons, active states, and links." value={brandColor} onChange={setBrandColor} />
            <div style={{ marginTop: 20 }}>
              <ColorPicker label="Secondary" hint="Status indicators and active show highlights." value={brandColorSecondary} onChange={setBrandColorSecondary} />
            </div>
            <div style={{ marginTop: 20 }}>
              <ColorPicker label="Highlight" hint="Pinned items, announcements, and callouts." value={brandColorHighlight} onChange={setBrandColorHighlight} />
            </div>
          </section>

          {/* About your company */}
          <section style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 16 }}>About your company</h2>
            <div className="field-group">
              <label className="label">Average audience size</label>
              <ChipRow options={AUDIENCE_SIZE_OPTIONS} selected={avgAudienceSize ? [avgAudienceSize] : []} onToggle={(v) => setAvgAudienceSize((c) => (c === v ? null : v))} />
            </div>
            <div className="field-group" style={{ marginTop: 20 }}>
              <label className="label">How many shows do you produce a year?</label>
              <ChipRow options={ANNUAL_SHOWS_OPTIONS} selected={annualShows ? [annualShows] : []} onToggle={(v) => setAnnualShows((c) => (c === v ? null : v))} />
            </div>
            <div className="field-group" style={{ marginTop: 20 }}>
              <label className="label">How big is your team?</label>
              <ChipRow options={TEAM_SIZE_OPTIONS} selected={teamSize ? [teamSize] : []} onToggle={(v) => setTeamSize((c) => (c === v ? null : v))} />
            </div>
            <div className="field-group" style={{ marginTop: 20 }}>
              <label className="label">What kinds of productions do you put on?</label>
              <ChipRow options={PRODUCTION_TYPE_OPTIONS} selected={productionTypes} onToggle={toggleType} />
              <div className="hint">Pick as many as apply.</div>
            </div>
          </section>

          {/* Invite your team */}
          <section style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <h2 className="page-title" style={{ fontSize: 18, marginBottom: 4 }}>Invite your team</h2>
            <p className="page-sub" style={{ marginTop: 4, marginBottom: 16 }}>
              Optional — you can always add people later from the Team page.
              Invitees get an email to join {orgName}.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {invites.map((row) => (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr auto auto", gap: 8, alignItems: "center" }}>
                  <input className="field" placeholder="First name" value={row.firstName}
                    onChange={(e) => setInvites((rows) => rows.map((r) => r.id === row.id ? { ...r, firstName: e.target.value } : r))} />
                  <input className="field" placeholder="Last name" value={row.lastName}
                    onChange={(e) => setInvites((rows) => rows.map((r) => r.id === row.id ? { ...r, lastName: e.target.value } : r))} />
                  <input className="field" type="email" placeholder="email@company.com" value={row.email}
                    onChange={(e) => setInvites((rows) => rows.map((r) => r.id === row.id ? { ...r, email: e.target.value } : r))} />
                  <select className="field" value={row.role}
                    onChange={(e) => setInvites((rows) => rows.map((r) => r.id === row.id ? { ...r, role: e.target.value as Role } : r))}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                  </select>
                  <button type="button" className="btn ghost icon-only sm" title="Remove row"
                    onClick={() => setInvites((rows) => rows.length === 1 ? [newInviteRow()] : rows.filter((r) => r.id !== row.id))}>
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn" style={{ marginTop: 12 }}
              onClick={() => setInvites((rows) => [...rows, newInviteRow()])}>
              <Icon name="Plus" size={14} aria-hidden /> Add another
            </button>
          </section>

          {error && (
            <div className="banner" style={{ marginTop: 24, marginBottom: 0 }}>
              <Icon name="AlertTriangle" size={16} />
              <div>{error}</div>
            </div>
          )}

          <div className="actions" style={{ marginTop: 32 }}>
            <button type="button" className="btn ghost" onClick={() => submit(true)} disabled={pending}>
              Skip for now →
            </button>
            <div className="spacer" />
            <button type="button" className="btn primary" onClick={() => submit(false)} disabled={pending}>
              {pending ? "Saving…" : "Finish setup"}
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
