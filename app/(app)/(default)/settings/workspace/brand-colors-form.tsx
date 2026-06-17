"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { saveBrandColors } from "@/features/workspace/actions";
import { contrastText } from "@/lib/brand-colors";
import { BRAND_COLOR_PRESETS } from "@/features/workspace/constants";

type Slot = "primary" | "secondary" | "highlight";

const SLOTS: { key: Slot; label: string; hint: string }[] = [
  { key: "primary",   label: "Primary",   hint: "Buttons, active states, and links." },
  { key: "secondary", label: "Secondary", hint: "Status indicators and show highlights." },
  { key: "highlight", label: "Highlight", hint: "Pinned items, announcements, and callouts." },
];

function SwatchPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [custom, setCustom] = useState(
    value && !BRAND_COLOR_PRESETS.includes(value as (typeof BRAND_COLOR_PRESETS)[number])
      ? value
      : "",
  );
  const resolvedCustom = custom.match(/^#[0-9a-fA-F]{6}$/) ? custom : null;
  const active = value ?? resolvedCustom;

  const handleSwatch = (color: string) => {
    setCustom("");
    onChange(value === color ? null : color);
  };

  const handleCustom = (raw: string) => {
    setCustom(raw);
    onChange(raw.match(/^#[0-9a-fA-F]{6}$/) ? raw : null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div className="label" style={{ marginBottom: 2 }}>{label}</div>
        <div className="muted" style={{ fontSize: 12 }}>{hint}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: color,
                border: "none",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                boxShadow: selected
                  ? `0 0 0 2px var(--bg-elev), 0 0 0 3.5px ${color}`
                  : "0 0 0 1px rgba(0,0,0,0.12)",
                transition: "box-shadow 0.12s",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {active && (
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: active, border: "1px solid var(--border)", flexShrink: 0 }} />
        )}
        <input
          className="field"
          placeholder="Custom #HEX"
          maxLength={7}
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          style={{ maxWidth: 130, height: 30, fontSize: 13 }}
        />
        {active && (
          <button type="button" className="btn ghost sm" onClick={() => { setCustom(""); onChange(null); }}>
            Clear
          </button>
        )}
        {active && (
          <div style={{ background: active, color: contrastText(active), borderRadius: 5, padding: "3px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
            Aa
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandColorsForm({
  currentPrimary,
  currentSecondary,
  currentHighlight,
}: {
  currentPrimary: string | null;
  currentSecondary: string | null;
  currentHighlight: string | null;
}) {
  const [primary, setPrimary] = useState<string | null>(currentPrimary);
  const [secondary, setSecondary] = useState<string | null>(currentSecondary);
  const [highlight, setHighlight] = useState<string | null>(currentHighlight);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const hasColors = primary || secondary || highlight;
  const dirty =
    primary !== currentPrimary ||
    secondary !== currentSecondary ||
    highlight !== currentHighlight;

  const save = (p: string | null, s: string | null, h: string | null) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveBrandColors({ primary: p, secondary: s, highlight: h });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  const revertToDefaults = () => {
    setPrimary(null);
    setSecondary(null);
    setHighlight(null);
    save(null, null, null);
  };

  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Brand colors</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Personalizes your workspace across all themes. Text on brand colors is
            automatically set to black or white for readability.
          </p>
        </div>
        {hasColors && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={revertToDefaults}
            disabled={pending}
            style={{ flexShrink: 0 }}
          >
            Revert to defaults
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SwatchPicker label="Primary" hint="Buttons, active states, and links." value={primary} onChange={setPrimary} />
        <SwatchPicker label="Secondary" hint="Status indicators and show highlights." value={secondary} onChange={setSecondary} />
        <SwatchPicker label="Highlight" hint="Pinned items, announcements, and callouts." value={highlight} onChange={setHighlight} />
      </div>

      {error && (
        <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>
      )}
      {saved && !dirty && (
        <div style={{ color: "var(--c-sage)", fontSize: 13, marginTop: 10 }}>Colors saved.</div>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn primary"
          disabled={pending || !dirty}
          onClick={() => save(primary, secondary, highlight)}
        >
          {pending ? "Saving…" : "Save colors"}
        </button>
      </div>
    </div>
  );
}
