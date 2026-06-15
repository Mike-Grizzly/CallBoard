// Eos / USITT ASCII Showfile export.
//
// ETC Eos imports cue lists via the USITT ASCII Showfile format (File ▸ Import ▸
// USITT ASCII), NOT plain CSV — CSV is only used for things like patch. So to
// land our cue numbers + labels next to a lighting designer's cues, we emit a
// minimal `.asc` showfile: a flat cue list where each cue carries its number
// and our description as the cue Text (label).
//
// What we DON'T emit: channel levels, fade times, links/follows. Importing only
// number + label is deliberate and non-destructive — it seeds the LD's cue
// stack with our labels without touching their programmed looks or timing.
//
// ⚠️ PROTOTYPE: built to the USITT ASCII Showfile spec but not yet validated
// against a real Eos/Nomad import. Eos can be picky about the header idents and
// keyword casing; verify on hardware/Nomad before relying on it.

/** Minimal shape an Eos cue needs from one of our cue annotations. */
export type EosCueInput = {
  /** Cue number as the user labelled it, e.g. "1", "5.5", "0.5". */
  cueNumber: string;
  /** Our note for the cue — becomes the Eos cue Text (label). */
  cueDescription: string;
  /** The script line the cue is called on, if captured — emitted as a comment. */
  line?: string;
};

/** Escape a value for a single-line ASCII keyword argument (Text/Note). */
function asciiLine(v: string): string {
  // The format is line-oriented; collapse any newlines so one cue = one Text.
  return v.replace(/[\r\n]+/g, " ").trim();
}

/** Numeric-aware sort so "2" < "10" and "5" < "5.5", matching cue ordering. */
function compareCueNumber(a: string, b: string): number {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Build a USITT ASCII Showfile (.asc) string from our cues. Cues with no usable
 * number are skipped (Eos keys everything off the cue number). The list is
 * sorted ascending by cue number.
 */
export function cueSheetToEosAscii(cues: EosCueInput[], title: string): string {
  const usable = cues
    .filter((c) => c.cueNumber.trim().length > 0)
    .slice()
    .sort((a, b) => compareCueNumber(a.cueNumber, b.cueNumber));

  const out: string[] = [];
  // Header — identifies the file as a v3.0 USITT ASCII showfile.
  out.push("Ident 3:0");
  out.push("Manufacturer ETC");
  out.push("Console Eos");
  out.push(`! Cue labels exported from CallBoard — ${asciiLine(title)}`);
  out.push(`! ${usable.length} cue${usable.length === 1 ? "" : "s"}`);
  out.push("");
  out.push("Clear All");
  out.push("");

  for (const c of usable) {
    out.push(`Cue ${c.cueNumber.trim()}`);
    const label = asciiLine(c.cueDescription);
    if (label) out.push(`Text ${label}`);
    const line = asciiLine(c.line ?? "");
    if (line) out.push(`! Called on: ${line}`);
    out.push("");
  }

  out.push("EndData");
  // USITT ASCII is a DOS-era line format — CRLF endings.
  return out.join("\r\n") + "\r\n";
}
