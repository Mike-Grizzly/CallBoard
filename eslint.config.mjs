import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference-only copies of the standalone HTML demo's JSX. Not part of
    // the build; kept for designers/developers to consult while we port.
    "design-reference/**",
    // Vendored tesseract.js engine (worker + WASM core), copied into public/
    // at build by scripts/copy-tesseract-assets.mjs. Minified third-party code.
    "public/tesseract/**",
    // Standalone Electron helper (own package.json + Node/CommonJS runtime).
    // Not part of the Next web app; lives outside the build.
    "tools/eos-helper/**",
  ]),
]);

export default eslintConfig;
