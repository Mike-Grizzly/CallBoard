import type { DirectoryPerson } from "@/features/members/queries";
import { ROLE_META } from "@/features/members/constants";

export type ProductionOption = {
  id: string;
  title: string;
  slug: string;
  colorToken: string;
};

type NamedPerson = { firstName: string; lastName: string; email: string };

export function displayName(p: NamedPerson): string {
  const name = `${p.firstName} ${p.lastName}`.trim();
  return name || p.email;
}

export function initials(p: NamedPerson): string {
  const pair = `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`;
  return (pair || p.email.slice(0, 2) || "?").toUpperCase();
}

export function relativeTime(date: Date | string | null): string {
  if (!date) return "—";
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} wk ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function memberSince(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Builds a CSV from directory people and triggers a browser download. */
export function exportPeopleCsv(people: DirectoryPerson[]) {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Pronouns",
    "Role",
    "Status",
    "Productions",
  ];
  const rows = people.map((p) => [
    `${p.firstName} ${p.lastName}`.trim(),
    p.email,
    p.phone ?? "",
    p.pronouns ?? "",
    ROLE_META[p.role].label,
    p.status,
    p.assignments
      .map(
        (a) =>
          `${a.productionTitle} (${ROLE_META[a.role].label}${
            a.characterName ? `: ${a.characterName}` : ""
          })`,
      )
      .join("; "),
  ]);
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [header, ...rows]
    .map((r) => r.map(esc).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "people.csv";
  link.click();
  URL.revokeObjectURL(url);
}
