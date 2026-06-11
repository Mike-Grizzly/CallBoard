// Copies pdfjs-dist's CMap and standard-font data into public/ so the PDF
// viewers can render text that uses non-embedded fonts (e.g. Helvetica/Times
// referenced but not embedded — extremely common in theatre scripts).
//
// Without these assets pdfjs renders images but silently drops such text,
// which is why a script could look fine in the browser's native PDF viewer
// (Documents tab) yet appear blank in our pdfjs-based Script tool.
//
// Runs before `dev` and `build` (see package.json). Non-fatal: if pdfjs-dist
// or the asset folders aren't present, it warns and continues so a partial
// install never breaks the build.
import { createRequire } from "node:module";
import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

async function main() {
  let pkgPath;
  try {
    pkgPath = require.resolve("pdfjs-dist/package.json");
  } catch {
    console.warn("[copy-pdfjs-assets] pdfjs-dist not installed; skipping.");
    return;
  }

  const root = path.dirname(pkgPath);
  const dest = path.join(process.cwd(), "public", "pdfjs");

  for (const asset of ["cmaps", "standard_fonts"]) {
    const src = path.join(root, asset);
    if (!existsSync(src)) {
      console.warn(`[copy-pdfjs-assets] ${asset} missing in pdfjs-dist; skipping.`);
      continue;
    }
    const out = path.join(dest, asset);
    await mkdir(out, { recursive: true });
    await cp(src, out, { recursive: true });
    console.log(`[copy-pdfjs-assets] ${asset} -> public/pdfjs/${asset}`);
  }
}

main().catch((err) => {
  console.warn("[copy-pdfjs-assets] failed (non-fatal):", err.message);
});
