"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ROLES, type Role } from "@/types/roles";
import {
  ROLE_META,
  PRONOUN_OPTIONS,
  CSV_FIELDS,
  SAMPLE_CSV,
  type CsvFieldKey,
} from "@/features/members/constants";
import {
  parseDelimited,
  guessMapping,
  matchRole,
  parsePastedList,
  splitName,
  isValidEmail,
} from "@/features/members/validation";
import {
  inviteMembers,
  type InvitePersonInput,
} from "@/features/members/actions";
import type { ProductionOption } from "./helpers";

type Path = "manual" | "csv" | "bulk" | null;

type InviteFn = (
  people: InvitePersonInput[],
  sendInvite: boolean,
) => Promise<void>;

export function AddPeopleModal({
  productions,
  onClose,
  onDone,
}: {
  productions: ProductionOption[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [path, setPath] = useState<Path>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doInvite: InviteFn = async (people, sendInvite) => {
    if (pending) return;
    if (people.length === 0) {
      setError("No valid people to add.");
      return;
    }
    setPending(true);
    setError(null);
    const res = await inviteMembers({ people, sendInvite });
    setPending(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    const s = res.summary!;
    if (s.invited + s.added === 0 && s.errored > 0) {
      const firstError = res.results?.find((r) => r.outcome === "error");
      setError(firstError?.message ?? "Could not add anyone.");
      return;
    }
    const parts: string[] = [];
    if (s.invited) parts.push(`invited ${s.invited}`);
    if (s.added) parts.push(`added ${s.added}`);
    if (s.skipped) parts.push(`skipped ${s.skipped} already in org`);
    if (s.errored) parts.push(`${s.errored} failed`);
    onDone(`People updated — ${parts.join(", ")}.`);
  };

  const title =
    path === "manual"
      ? "Add a single person"
      : path === "csv"
        ? "Upload a CSV"
        : path === "bulk"
          ? "Bulk add wizard"
          : "Add people to your org";

  return (
    <div className="pp-modal-bg" onClick={onClose}>
      <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pp-modal-h">
          {path && (
            <button
              className="pp-icon-btn"
              onClick={() => {
                setPath(null);
                setError(null);
              }}
              aria-label="Back"
            >
              <Icon name="ChevronLeft" size={14} />
            </button>
          )}
          <h2>{title}</h2>
          <div style={{ flex: 1 }} />
          <button className="pp-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="X" size={14} />
          </button>
        </div>

        {!path && <PathPicker onPick={setPath} />}
        {path === "manual" && (
          <ManualForm
            productions={productions}
            pending={pending}
            error={error}
            onInvite={doInvite}
          />
        )}
        {path === "csv" && (
          <CsvFlow
            productions={productions}
            pending={pending}
            error={error}
            onInvite={doInvite}
          />
        )}
        {path === "bulk" && (
          <BulkWizard
            productions={productions}
            pending={pending}
            error={error}
            onInvite={doInvite}
          />
        )}
      </div>
    </div>
  );
}

function PathPicker({ onPick }: { onPick: (p: Path) => void }) {
  const opts: {
    key: Path;
    title: string;
    sub: string;
    icon: "User" | "Upload" | "Layers";
    time: string;
  }[] = [
    {
      key: "manual",
      title: "Add a single person",
      sub: "Type their info into a quick form. Fastest for one or two.",
      icon: "User",
      time: "~30 sec",
    },
    {
      key: "csv",
      title: "Upload a CSV",
      sub: "Drop a spreadsheet. Map the columns and preview before adding.",
      icon: "Upload",
      time: "~2 min for 50+ people",
    },
    {
      key: "bulk",
      title: "Bulk add wizard",
      sub: "Paste a list and add many at once with a guided flow.",
      icon: "Layers",
      time: "~5 min for a season",
    },
  ];
  return (
    <div className="pp-paths">
      {opts.map((o) => (
        <button key={o.key} className="pp-path" onClick={() => onPick(o.key)}>
          <div className="pp-path-ico">
            <Icon name={o.icon} size={18} />
          </div>
          <div className="pp-path-body">
            <b>{o.title}</b>
            <span>{o.sub}</span>
            <span className="pp-path-time">{o.time}</span>
          </div>
          <Icon name="ChevronRight" size={14} />
        </button>
      ))}
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="pp-form-error" role="alert">
      {error}
    </div>
  );
}

function SendInviteCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="pp-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

// ─── Manual single-person form ────────────────────────────────────────
function ManualForm({
  productions,
  pending,
  error,
  onInvite,
}: {
  productions: ProductionOption[];
  pending: boolean;
  error: string | null;
  onInvite: InviteFn;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [role, setRole] = useState<Role>("cast");
  const [sendInvite, setSendInvite] = useState(true);
  const [assigns, setAssigns] = useState<
    { productionId: string; role: Role }[]
  >([]);

  const valid = name.trim().length > 0 && isValidEmail(email);

  const submit = () => {
    if (!valid) return;
    const { firstName, lastName } = splitName(name);
    const person: InvitePersonInput = {
      firstName,
      lastName,
      email: email.trim(),
      phone: phone.trim() || null,
      pronouns: pronouns.trim() || null,
      role,
      assignments: assigns
        .filter((a) => a.productionId)
        .map((a) => ({ productionId: a.productionId, role: a.role })),
    };
    onInvite([person], sendInvite);
  };

  return (
    <div className="pp-form">
      <div className="pp-form-grid">
        <div className="pp-fg" style={{ gridColumn: "1 / -1" }}>
          <label>
            Full name<span className="pp-req">*</span>
          </label>
          <input
            className="pp-field"
            value={name}
            placeholder="e.g. Theo Marsh"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="pp-fg">
          <label>
            Email<span className="pp-req">*</span>
          </label>
          <input
            className="pp-field"
            type="email"
            value={email}
            placeholder="theo@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="pp-fg">
          <label>Phone</label>
          <input
            className="pp-field"
            value={phone}
            placeholder="(617) 555-0142"
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="pp-fg">
          <label>Pronouns</label>
          <select
            className="pp-field"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
          >
            {PRONOUN_OPTIONS.map((p) => (
              <option key={p || "none"} value={p}>
                {p || "—"}
              </option>
            ))}
          </select>
        </div>
        <div className="pp-fg">
          <label>Organization role</label>
          <select
            className="pp-field"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pp-form-section">
        <div className="pp-form-section-h">
          <h4>
            Assign to productions{" "}
            <span className="pp-muted">(optional — can add later)</span>
          </h4>
          {productions.length > 0 && (
            <button
              type="button"
              className="btn sm"
              onClick={() =>
                setAssigns((prev) => [
                  ...prev,
                  { productionId: productions[0].id, role },
                ])
              }
            >
              <Icon name="Plus" size={11} />
              <span>Add</span>
            </button>
          )}
        </div>
        {productions.length === 0 ? (
          <div className="pp-empty-sm">No productions to assign to yet.</div>
        ) : assigns.length === 0 ? (
          <div className="pp-empty-sm">No productions assigned yet.</div>
        ) : (
          <div className="pp-assign-list">
            {assigns.map((a, i) => (
              <div key={i} className="pp-assign-row">
                <select
                  className="pp-field"
                  value={a.productionId}
                  onChange={(e) =>
                    setAssigns((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, productionId: e.target.value } : x,
                      ),
                    )
                  }
                >
                  {productions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <select
                  className="pp-field"
                  value={a.role}
                  onChange={(e) =>
                    setAssigns((prev) =>
                      prev.map((x, j) =>
                        j === i
                          ? { ...x, role: e.target.value as Role }
                          : x,
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
                  className="pp-icon-btn delete"
                  aria-label="Remove assignment"
                  onClick={() =>
                    setAssigns((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <SendInviteCheck
        checked={sendInvite}
        onChange={setSendInvite}
        label="Send an invite email so they can create an account"
      />

      <FormError error={error} />

      <div className="pp-form-actions">
        <div style={{ flex: 1 }} />
        <button
          className="btn primary"
          disabled={!valid || pending}
          onClick={submit}
        >
          <Icon name="Check" size={14} />
          <span>
            {pending
              ? "Adding…"
              : sendInvite
                ? "Add person & send invite"
                : "Add person"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── CSV upload flow ──────────────────────────────────────────────────
function CsvFlow({
  productions,
  pending,
  error,
  onInvite,
}: {
  productions: ProductionOption[];
  pending: boolean;
  error: string | null;
  onInvite: InviteFn;
}) {
  const [stage, setStage] = useState<"drop" | "map" | "preview">("drop");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<CsvFieldKey, number>>({
    name: -1,
    email: -1,
    phone: -1,
    role: -1,
    pronouns: -1,
    production: -1,
  });
  const [sendInvite, setSendInvite] = useState(true);
  const dropRef = useRef<HTMLDivElement>(null);

  const load = (text: string) => {
    const parsed = parseDelimited(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(guessMapping(parsed.headers));
    setStage("map");
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => load(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const prodByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productions) m.set(p.title.trim().toLowerCase(), p.id);
    return m;
  }, [productions]);

  const cell = (row: string[], key: CsvFieldKey) => {
    const idx = mapping[key];
    return idx >= 0 ? (row[idx] ?? "").trim() : "";
  };

  const previewRows = useMemo(
    () =>
      rows.map((row) => {
        const name = cell(row, "name");
        const email = cell(row, "email");
        const role = matchRole(cell(row, "role"));
        const production = cell(row, "production");
        return {
          name,
          email,
          phone: cell(row, "phone"),
          pronouns: cell(row, "pronouns"),
          role,
          production,
          productionId: prodByName.get(production.toLowerCase()) ?? null,
          valid: name.length > 0 && isValidEmail(email),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, mapping, prodByName],
  );

  const validCount = previewRows.filter((r) => r.valid).length;

  const finalize = () => {
    const people: InvitePersonInput[] = previewRows
      .filter((r) => r.valid)
      .map((r) => {
        const { firstName, lastName } = splitName(r.name);
        return {
          firstName,
          lastName,
          email: r.email,
          phone: r.phone || null,
          pronouns: r.pronouns || null,
          role: r.role,
          assignments: r.productionId
            ? [{ productionId: r.productionId, role: r.role }]
            : [],
        };
      });
    onInvite(people, sendInvite);
  };

  if (stage === "drop") {
    return (
      <div className="pp-form">
        <div
          ref={dropRef}
          className="pp-drop"
          onDragOver={(e) => {
            e.preventDefault();
            dropRef.current?.classList.add("over");
          }}
          onDragLeave={() => dropRef.current?.classList.remove("over")}
          onDrop={(e) => {
            e.preventDefault();
            dropRef.current?.classList.remove("over");
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div className="pp-drop-ico">
            <Icon name="Upload" size={28} />
          </div>
          <b>Drop your CSV here</b>
          <span>or</span>
          <label className="btn primary" style={{ cursor: "pointer" }}>
            <Icon name="File" size={13} />
            <span>Choose file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          <button className="pp-link" onClick={() => load(SAMPLE_CSV)}>
            Load a sample CSV instead
          </button>
        </div>
        <div className="pp-csv-hints">
          <div>
            <b>Recommended columns:</b>{" "}
            <span className="mono">
              Name, Email, Phone, Role, Pronouns, Production
            </span>
          </div>
          <div className="pp-muted">
            Commas, tabs, or semicolons all work — we auto-detect and let you
            map columns next.
          </div>
        </div>
      </div>
    );
  }

  if (stage === "map") {
    const ready = mapping.name >= 0 && mapping.email >= 0;
    return (
      <div className="pp-form">
        <div className="pp-banner">
          <Icon name="Info" size={14} />
          <span>
            Found <b>{rows.length}</b> rows. Match columns to fields below — we
            auto-guessed where we could.
          </span>
        </div>
        <div className="pp-map">
          {CSV_FIELDS.map((f) => (
            <div key={f.key} className="pp-map-row">
              <div className="pp-map-label">
                {f.label}
                {f.required && <span className="pp-req">*</span>}
              </div>
              <select
                className="pp-field"
                value={mapping[f.key]}
                onChange={(e) =>
                  setMapping((m) => ({
                    ...m,
                    [f.key]: parseInt(e.target.value, 10),
                  }))
                }
              >
                <option value={-1}>— ignore —</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
              <div className="pp-map-preview">
                {mapping[f.key] >= 0 && rows[0] ? (
                  <>
                    <span className="pp-muted">e.g.</span> &quot;
                    {rows[0][mapping[f.key]]}&quot;
                  </>
                ) : (
                  <span className="pp-muted">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="pp-form-actions">
          <button className="btn ghost" onClick={() => setStage("drop")}>
            <Icon name="ChevronLeft" size={12} />
            <span>Back</span>
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="btn primary"
            disabled={!ready}
            onClick={() => setStage("preview")}
          >
            <span>Preview {rows.length} rows</span>
            <Icon name="ChevronRight" size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-form">
      <div className="pp-banner success">
        <Icon name="Check" size={14} />
        <span>
          <b>{validCount}</b> of {rows.length} rows look good.
          {rows.length - validCount > 0 &&
            ` · ${rows.length - validCount} skipped (missing name or email).`}
        </span>
      </div>
      <div className="pp-preview-wrap">
        <table className="pp-preview">
          <thead>
            <tr>
              <th />
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Production</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.slice(0, 20).map((r, i) => (
              <tr key={i} data-bad={r.valid ? "0" : "1"}>
                <td>
                  <Icon
                    name={r.valid ? "Check" : "AlertTriangle"}
                    size={12}
                  />
                </td>
                <td>{r.name || <span className="pp-muted">—</span>}</td>
                <td className="mono">
                  {r.email || <span className="pp-muted">—</span>}
                </td>
                <td>
                  <span className="pp-pill" data-c={ROLE_META[r.role].c}>
                    {ROLE_META[r.role].label}
                  </span>
                </td>
                <td>
                  <span className="pp-muted">
                    {r.production
                      ? r.productionId
                        ? r.production
                        : `${r.production} (no match)`
                      : "—"}
                  </span>
                </td>
              </tr>
            ))}
            {previewRows.length > 20 && (
              <tr>
                <td colSpan={5} className="pp-preview-more">
                  …+{previewRows.length - 20} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <SendInviteCheck
        checked={sendInvite}
        onChange={setSendInvite}
        label={`Send invite emails to all ${validCount} valid people`}
      />
      <FormError error={error} />
      <div className="pp-form-actions">
        <button className="btn ghost" onClick={() => setStage("map")}>
          <Icon name="ChevronLeft" size={12} />
          <span>Back</span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="btn primary"
          disabled={validCount === 0 || pending}
          onClick={finalize}
        >
          <Icon name="Check" size={14} />
          <span>
            {pending
              ? "Adding…"
              : `Add ${validCount} ${validCount === 1 ? "person" : "people"}`}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Bulk wizard ──────────────────────────────────────────────────────
function BulkWizard({
  productions,
  pending,
  error,
  onInvite,
}: {
  productions: ProductionOption[];
  pending: boolean;
  error: string | null;
  onInvite: InviteFn;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [text, setText] = useState("");
  const [defaultRole, setDefaultRole] = useState<Role>("cast");
  const [defaultProd, setDefaultProd] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  const parsed = useMemo(() => parsePastedList(text), [text]);
  const validCount = parsed.filter((p) => p.valid).length;

  const finalize = () => {
    const people: InvitePersonInput[] = parsed
      .filter((p) => p.valid)
      .map((p) => {
        const { firstName, lastName } = splitName(p.name);
        return {
          firstName,
          lastName,
          email: p.email,
          phone: p.phone || null,
          role: defaultRole,
          assignments: defaultProd
            ? [{ productionId: defaultProd, role: defaultRole }]
            : [],
        };
      });
    onInvite(people, sendInvite);
  };

  return (
    <div className="pp-form">
      <div className="pp-stepper">
        {["Paste your list", "Review names", "Set roles & send"].map(
          (label, i) => (
            <div
              key={label}
              className="pp-stepper-i"
              data-state={
                step === i + 1 ? "active" : step > i + 1 ? "done" : "idle"
              }
            >
              <span className="n">
                {step > i + 1 ? <Icon name="Check" size={10} /> : i + 1}
              </span>
              <span>{label}</span>
            </div>
          ),
        )}
      </div>

      {step === 1 && (
        <>
          <div className="pp-fg">
            <label>Paste one person per line</label>
            <textarea
              className="pp-field"
              rows={9}
              value={text}
              placeholder={
                "Theo Marsh <theo.marsh@example.com>\n" +
                "Priya Anand, priya@example.com, (617) 555-0512\n" +
                "Marcus Beale, marcus.beale@example.com"
              }
              onChange={(e) => setText(e.target.value)}
            />
            <div className="pp-muted" style={{ marginTop: 6 }}>
              Accepts <span className="mono">Name &lt;email&gt;</span> or
              comma/tab-separated <span className="mono">Name, email, phone</span>.
            </div>
          </div>
          <div className="pp-form-actions">
            <div style={{ flex: 1 }} />
            <button
              className="btn primary"
              disabled={!text.trim()}
              onClick={() => setStep(2)}
            >
              <span>Continue</span>
              <Icon name="ChevronRight" size={12} />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="pp-banner success">
            <Icon name="Check" size={14} />
            <span>
              Parsed <b>{validCount}</b> of {parsed.length} lines.
              {parsed.length - validCount > 0 &&
                ` · ${parsed.length - validCount} couldn't be read.`}
            </span>
          </div>
          <div className="pp-preview-wrap">
            <table className="pp-preview">
              <thead>
                <tr>
                  <th />
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} data-bad={r.valid ? "0" : "1"}>
                    <td>
                      <Icon
                        name={r.valid ? "Check" : "AlertTriangle"}
                        size={12}
                      />
                    </td>
                    <td>{r.name || <span className="pp-muted">—</span>}</td>
                    <td className="mono">
                      {r.email || (
                        <span className="pp-muted">missing email</span>
                      )}
                    </td>
                    <td className="mono">
                      {r.phone || <span className="pp-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pp-form-actions">
            <button className="btn ghost" onClick={() => setStep(1)}>
              <Icon name="ChevronLeft" size={12} />
              <span>Back</span>
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="btn primary"
              disabled={validCount === 0}
              onClick={() => setStep(3)}
            >
              <span>Continue</span>
              <Icon name="ChevronRight" size={12} />
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="pp-banner">
            <Icon name="Info" size={14} />
            <span>
              Apply the same role &amp; production to all {validCount} people.
              You can change individuals afterward in the directory.
            </span>
          </div>
          <div className="pp-form-grid">
            <div className="pp-fg" style={{ gridColumn: "1 / -1" }}>
              <label>Default role for everyone</label>
              <select
                className="pp-field"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pp-fg" style={{ gridColumn: "1 / -1" }}>
              <label>Assign all to production</label>
              <select
                className="pp-field"
                value={defaultProd}
                onChange={(e) => setDefaultProd(e.target.value)}
              >
                <option value="">— don&apos;t assign yet —</option>
                {productions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <SendInviteCheck
            checked={sendInvite}
            onChange={setSendInvite}
            label={`Send invite emails to all ${validCount} people`}
          />
          <FormError error={error} />
          <div className="pp-form-actions">
            <button className="btn ghost" onClick={() => setStep(2)}>
              <Icon name="ChevronLeft" size={12} />
              <span>Back</span>
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="btn primary"
              disabled={validCount === 0 || pending}
              onClick={finalize}
            >
              <Icon name="Check" size={14} />
              <span>
                {pending
                  ? "Adding…"
                  : `Add ${validCount} ${validCount === 1 ? "person" : "people"}`}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
