// Copies tesseract.js's worker script and WASM core into public/tesseract/ so
// the in-browser script OCR (lib/ocr.ts) loads its engine from our own origin
// instead of a third-party CDN. Mirrors copy-pdfjs-assets.mjs.
//
// The language data (eng.traineddata, ~10MB) is NOT vendored here — it's
// fetched at runtime from the configured langPath (default: the tessdata CDN,
// override with NEXT_PUBLIC_TESSERACT_LANG_PATH). Keeping it out of the repo
// avoids committing a large binary; self-hosting it is a later option.
//
// Runs before `dev` and `build` (see package.json). Non-fatal: if tesseract.js
// isn't present it warns and continues so a partial install never breaks the
// build.
import { createRequire } from "node:module";
import { cp, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

async function main() {
  const dest = path.join(process.cwd(), "public", "tesseract");
  await mkdir(dest, { recursive: true });

  // 1. Worker script (tesseract.js/dist/worker.min.js).
  try {
    const workerPkg = path.dirname(require.resolve("tesseract.js/package.json"));
    const worker = path.join(workerPkg, "dist", "worker.min.js");
    if (existsSync(worker)) {
      await cp(worker, path.join(dest, "worker.min.js"));
      console.log("[copy-tesseract-assets] worker.min.js -> public/tesseract/");
    } else {
      console.warn("[copy-tesseract-assets] worker.min.js missing; skipping.");
    }
  } catch {
    console.warn("[copy-tesseract-assets] tesseract.js not installed; skipping.");
    return;
  }

  // 2. WASM core (tesseract.js-core/*.wasm + loader .js). Copy the whole
  //    package so tesseract.js can auto-select the right variant by name.
  try {
    const corePkg = path.dirname(
      require.resolve("tesseract.js-core/package.json"),
    );
    const entries = await readdir(corePkg);
    let copied = 0;
    for (const name of entries) {
      if (name.endsWith(".wasm") || name.endsWith(".js")) {
        await cp(path.join(corePkg, name), path.join(dest, name));
        copied += 1;
      }
    }
    console.log(`[copy-tesseract-assets] core (${copied} files) -> public/tesseract/`);
  } catch {
    console.warn("[copy-tesseract-assets] tesseract.js-core not found; skipping core.");
  }
}

main().catch((err) => {
  console.warn("[copy-tesseract-assets] failed (non-fatal):", err.message);
});
