"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  completeOnboarding,
  requestWorkspaceLogoUpload,
  finalizeWorkspaceLogoUpload,
} from "@/features/workspace/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import {
  ANNUAL_SHOWS_OPTIONS,
  AUDIENCE_SIZE_OPTIONS,
  BRAND_COLOR_PRESETS,
  PRODUCTION_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from "@/features/workspace/constants";

const LOGO_ACCEPT = "image/svg+xml,image/png,image/jpeg";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

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

  // Brand color
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState("");

  // Survey
  const [avgAudienceSize, setAvgAudienceSize] = useState<string | null>(null);
  const [annualShows, setAnnualShows] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [productionTypes, setProductionTypes] = useState<string[]>([]);

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

  const resolvedColor = brandColor ?? (customColor.match(/^#[0-9a-fA-F]{6}$/) ? customColor : null);

  async function handleSubmit() {
    setPending(true);
    setError(null);

    // Upload logo (best-effort, soft failure)
    if (logoFile) {
      const signed = await requestWorkspaceLogoUpload(
        logoFile.name,
        logoFile.type,
        logoFile.size,
      );
      if (!signed.error && signed.path && signed.token) {
        const up = await uploadFileToSignedUrl(signed.path, signed.token, logoFile);
        if (!up.error) {
          await finalizeWorkspaceLogoUpload(signed.path);
        }
      }
    }

    const result = await completeOnboarding({
      brandColor: resolvedColor,
      avgAudienceSize,
      annualShows,
      teamSize,
      productionTypes,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function handleSkip() {
    setPending(true);
    await completeOnboarding({});
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
          <span style={{ color: "var(--ink)" }}>Set up your workspace</span>
        </div>
      </div>

      <div className="body">
        <aside className="rail">
          <h1>Let&apos;s get you set up.</h1>
          <div className="rail-sub">
            A few quick questions help us tailor your experience and improve
            Proscene. Everything is optional.
          </div>
        </aside>

        <div className="main">
          {/* Section: Logo */}
          <div className="field-group">
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
              Optional. SVG, PNG, or JPG. Square works best. Up to 2MB.
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_ACCEPT}
              onChange={onPickLogo}
              style={{ display: "none" }}
            />
          </div>

          {/* Section: Brand color */}
          <div className="field-group" style={{ marginTop: 24 }}>
            <label className="label">Brand color</label>
            <div className="hint" style={{ marginBottom: 8 }}>
              We&apos;ll use this to personalize your workspace.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {BRAND_COLOR_PRESETS.map((color) => {
                const selected = brandColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-pressed={selected}
                    onClick={() => {
                      setBrandColor(selected ? null : color);
                      setCustomColor("");
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: color,
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      boxShadow: selected
                        ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}`
                        : "none",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {customColor.match(/^#[0-9a-fA-F]{6}$/) && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: customColor,
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                />
              )}
              <input
                className="field"
                placeholder="#HEX"
                maxLength={7}
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setBrandColor(null);
                }}
                style={{ maxWidth: 120 }}
              />
            </div>
          </div>

          {/* Section: About your company */}
          <div className="field-group" style={{ marginTop: 24 }}>
            <label className="label">Average audience size</label>
            <ChipRow
              options={AUDIENCE_SIZE_OPTIONS}
              selected={avgAudienceSize ? [avgAudienceSize] : []}
              onToggle={(v) => setAvgAudienceSize((cur) => (cur === v ? null : v))}
            />
          </div>

          <div className="field-group" style={{ marginTop: 20 }}>
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
            <label className="label">What kinds of productions do you put on?</label>
            <ChipRow
              options={PRODUCTION_TYPE_OPTIONS}
              selected={productionTypes}
              onToggle={toggleType}
            />
            <div className="hint">Pick as many as apply.</div>
          </div>

          {error && (
            <div className="banner" style={{ marginTop: 24, marginBottom: 0 }}>
              <Icon name="AlertTriangle" size={16} />
              <div>{error}</div>
            </div>
          )}

          <div className="actions" style={{ marginTop: 32 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={handleSkip}
              disabled={pending}
            >
              Skip for now →
            </button>
            <div className="spacer" />
            <button
              type="button"
              className="btn primary"
              onClick={handleSubmit}
              disabled={pending}
            >
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
