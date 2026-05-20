import type { Role } from "@/types/roles";
import { ROLES } from "@/types/roles";
import { ROLE_META, type CsvFieldKey } from "./constants";

/** Loose email check — good enough for client-side preview; server re-checks. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Splits a free-text full name into first/last. Everything after the first
 *  whitespace-delimited token becomes the last name. */
export function splitName(full: string): {
  firstName: string;
  lastName: string;
} {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Best-effort match of a free-text role string to a CallBoard role. */
export function matchRole(raw: string | undefined): Role {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return "cast";

  const exact = ROLES.find((r) => ROLE_META[r].label.toLowerCase() === value);
  if (exact) return exact;

  if (value.includes("admin")) return "admin";
  if (value.includes("produc")) return "producer";
  if (value.includes("choreo")) return "choreographer";
  if (
    value.includes("stage manager") ||
    value.includes("asm") ||
    value === "sm"
  )
    return "stage_manager";
  if (value.includes("direct")) return "director";
  if (
    value.includes("crew") ||
    value.includes("design") ||
    value.includes("props") ||
    value.includes("tech") ||
    value.includes("run")
  )
    return "crew";
  if (value.includes("cast")) return "cast";
  return "cast";
}

function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    ",": (line.match(/,/g) ?? []).length,
    "\t": (line.match(/\t/g) ?? []).length,
    ";": (line.match(/;/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** Tiny CSV/TSV parser — handles quoted fields and comma/tab/semicolon. */
export function parseDelimited(text: string): {
  headers: string[];
  rows: string[][];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delim = detectDelimiter(lines[0]);
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"' && inQuotes) {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === delim && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  return {
    headers: splitLine(lines[0]),
    rows: lines.slice(1).map(splitLine),
  };
}

/** Auto-guesses which column maps to which field by header name. */
export function guessMapping(headers: string[]): Record<CsvFieldKey, number> {
  const find = (...patterns: string[]) =>
    headers.findIndex((h) =>
      patterns.some((p) => h.toLowerCase().includes(p)),
    );
  return {
    name: find("name"),
    email: find("email", "e-mail"),
    phone: find("phone", "mobile", "cell"),
    role: find("role", "position", "title"),
    pronouns: find("pronoun"),
    production: find("production", "show"),
  };
}

export type ParsedPerson = {
  name: string;
  email: string;
  phone: string;
  valid: boolean;
};

/** Parses a free-form pasted list — `Name <email>` or delimited `Name, email, phone`. */
export function parsePastedList(raw: string): ParsedPerson[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      let name = "";
      let email = "";
      let phone = "";
      const angle = line.match(/^(.+?)\s*<([^>]+)>$/);
      if (angle) {
        name = angle[1].trim();
        email = angle[2].trim();
      } else {
        const parts = line.split(/[,\t;|]+/).map((s) => s.trim());
        name = parts[0] ?? "";
        email = parts.find((p) => /@/.test(p)) ?? "";
        phone = parts.find((p) => /^[\d\s\-().+]{7,}$/.test(p)) ?? "";
      }
      return { name, email, phone, valid: !!name && isValidEmail(email) };
    });
}
