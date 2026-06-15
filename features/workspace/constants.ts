// Survey options for the create-workspace wizard's "About your company" step.
// Plain client/server-safe constants (kept out of the "use server" actions
// file). Values are stored verbatim on organizations.{annualShows,teamSize,
// productionTypes}, so editing a label changes what new rows record — old
// rows keep whatever they were saved with.

export const ANNUAL_SHOWS_OPTIONS = ["1–2", "3–5", "6–10", "10+"] as const;

export const TEAM_SIZE_OPTIONS = [
  "Just me",
  "2–10",
  "11–25",
  "26–50",
  "50+",
] as const;

export const PRODUCTION_TYPE_OPTIONS = [
  "Plays",
  "Musicals",
  "Opera",
  "Dance",
  "Devised / new work",
  "Youth / education",
  "Improv / comedy",
  "Concerts / cabaret",
] as const;
