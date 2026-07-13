#!/usr/bin/env node
/**
 * Seed the four Phase-1 SEO blog drafts into Sanity as real, editable `post`
 * documents (published, so they show on the site immediately).
 *
 * It reads docs/seo/blog-drafts/*.md, parses the front-matter + Markdown body,
 * converts the body to Portable Text (headings, paragraphs, bold/italic/links,
 * bulleted + numbered lists, and the custom `codeBlock` / `table` types added
 * to the post schema), rewrites the pre-billing "Free during open beta" CTAs to
 * the real 60-day-trial line, and upserts one document per draft.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=sk_...   node scripts/seed-blog-posts.mjs
 *   (optional) NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET override
 *   Flags:
 *     --dry       Print what would be written, don't touch Sanity.
 *     --replace   Overwrite existing docs (default: skip ones that already exist).
 *
 * Get a write token at sanity.io/manage -> project -> API -> Tokens (Editor role).
 * This talks to sanity.io, so run it somewhere with network access to Sanity
 * (your machine), not necessarily inside a restricted CI sandbox.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = join(__dirname, "..", "docs", "seo", "blog-drafts");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dsciikio";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-12-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
const DRY = process.argv.includes("--dry");
const REPLACE = process.argv.includes("--replace");

// Publish dates (the drafts have none); kept in step with the static registry.
const PUBLISHED_AT = {
  "how-to-write-a-rehearsal-report": "2026-06-04T14:00:00Z",
  "blocking-notation-complete-guide": "2026-06-11T14:00:00Z",
  "stage-manager-tech-week-checklist": "2026-06-18T14:00:00Z",
  "how-to-build-a-rehearsal-schedule": "2026-06-25T14:00:00Z",
};

const CTA_FIX = [
  "Free during open beta.",
  "Free for your first production, a 60-day trial, no card required.",
];

// ── key generator (Portable Text requires a unique _key on every node) ──────
let keyCounter = 0;
const k = () => `k${(keyCounter++).toString(36)}`;

// ── front-matter + body split ───────────────────────────────────────────────
function parseDraft(raw) {
  const lines = raw.split(/\r?\n/);
  const sepIdx = lines.findIndex((l) => l.trim() === "---");
  const metaLines = sepIdx >= 0 ? lines.slice(0, sepIdx) : [];
  let bodyLines = sepIdx >= 0 ? lines.slice(sepIdx + 1) : lines;

  const meta = {};
  for (const line of metaLines) {
    const m = line.match(/^\s*-\s*\*\*([^:*]+):\*\*\s*(.+)\s*$/);
    if (m) meta[m[1].trim().toLowerCase()] = m[2].trim();
  }

  // Drop leading blanks and the body's H1 (title lives in front-matter).
  while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();
  if (bodyLines[0]?.startsWith("# ")) bodyLines.shift();

  let body = bodyLines.join("\n");
  body = body.split(CTA_FIX[0]).join(CTA_FIX[1]);
  return { meta, body };
}

// ── inline Markdown -> Portable Text spans (+ link markDefs) ─────────────────
function parseInline(text) {
  const children = [];
  const markDefs = [];
  const push = (str, marks) => {
    if (str) children.push({ _type: "span", _key: k(), text: str, marks });
  };
  // Ordered by priority: link, bold, italic(*), italic(_), inline code.
  const token =
    /(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/;
  let rest = text;
  let guard = 0;
  while (rest && guard++ < 5000) {
    const m = rest.match(token);
    if (!m) {
      push(rest, []);
      break;
    }
    push(rest.slice(0, m.index), []);
    if (m[1]) {
      const key = k();
      markDefs.push({ _type: "link", _key: key, href: m[3] });
      push(m[2], [key]);
    } else if (m[4]) {
      push(m[5], ["strong"]);
    } else if (m[6]) {
      push(m[7], ["em"]);
    } else if (m[8]) {
      push(m[9], ["em"]);
    } else if (m[10]) {
      push(m[11], []); // no inline-code mark in the schema; keep as plain text
    }
    rest = rest.slice(m.index + m[0].length);
  }
  if (!children.length) children.push({ _type: "span", _key: k(), text: "", marks: [] });
  return { children, markDefs };
}

function textBlock(style, text, extra = {}) {
  const { children, markDefs } = parseInline(text);
  return { _type: "block", _key: k(), style, markDefs, children, ...extra };
}

// ── block-level Markdown -> Portable Text ────────────────────────────────────
function markdownToPortableText(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  const isTable = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isTableSep = (l) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes("-");

  while (i < lines.length) {
    let line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      const code = buf.join("\n").replace(/&amp;/g, "&");
      blocks.push({ _type: "codeBlock", _key: k(), code, ...(lang ? { language: lang } : {}) });
      continue;
    }

    // Table
    if (isTable(line)) {
      const rows = [];
      while (i < lines.length && isTable(lines[i])) {
        const raw = lines[i];
        i++;
        if (isTableSep(raw)) continue; // header underline
        const cells = raw
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim().replace(/&amp;/g, "&"));
        rows.push({ _type: "tableRow", _key: k(), cells });
      }
      if (rows.length) blocks.push({ _type: "table", _key: k(), rows });
      continue;
    }

    // Headings
    const h = trimmed.match(/^(#{2,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      blocks.push(textBlock(level === 2 ? "h2" : level === 3 ? "h3" : "h4", h[2]));
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(textBlock("blockquote", buf.join(" ")));
      continue;
    }

    // Lists (bulleted incl. "- [ ]" checkboxes, or numbered)
    const listM = trimmed.match(/^([-*]|\d+\.)\s+(.*)$/);
    if (listM) {
      const numbered = /\d+\./.test(listM[1]);
      while (i < lines.length && lines[i].trim().match(/^([-*]|\d+\.)\s+/)) {
        const item = lines[i].trim().replace(/^([-*]|\d+\.)\s+/, "");
        const clean = item.replace(/^\[[ xX]\]\s+/, ""); // strip checkbox marker
        blocks.push(
          textBlock("normal", clean, {
            listItem: numbered ? "number" : "bullet",
            level: 1,
          }),
        );
        i++;
      }
      continue;
    }

    // Paragraph (join consecutive plain lines)
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !isTable(lines[i]) &&
      !/^(#{2,6})\s+/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i].trim()) &&
      !lines[i].trim().match(/^([-*]|\d+\.)\s+/)
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(textBlock("normal", buf.join(" ").trim()));
  }
  return blocks;
}

// ── build a Sanity document from a draft ─────────────────────────────────────
function toDocument(meta, body) {
  const slug = meta["slug"];
  if (!slug) throw new Error(`Draft missing slug: ${meta["title"] ?? "(untitled)"}`);
  const readTime = meta["read time"] ? `${meta["read time"].replace(/\s*read$/i, "")} read` : undefined;
  const tags = meta["tags"]
    ? meta["tags"].split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;
  return {
    _id: `post-${slug}`,
    _type: "post",
    title: meta["title"],
    slug: { _type: "slug", current: slug },
    excerpt: meta["excerpt"],
    metaDescription: meta["excerpt"],
    category: meta["category"] || "SM craft",
    author: "The Proscene team",
    readTime,
    publishedAt: PUBLISHED_AT[slug] || new Date("2026-06-01T14:00:00Z").toISOString(),
    tags,
    body: markdownToPortableText(body),
  };
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".md")).sort();
  const docs = files.map((f) => {
    keyCounter = 0; // stable keys per doc so re-runs produce identical documents
    const { meta, body } = parseDraft(readFileSync(join(DRAFTS_DIR, f), "utf8"));
    return toDocument(meta, body);
  });

  console.log(`Parsed ${docs.length} drafts:`);
  for (const d of docs) {
    const tables = d.body.filter((b) => b._type === "table").length;
    const code = d.body.filter((b) => b._type === "codeBlock").length;
    console.log(
      `  - ${d.slug.current}  (${d.body.length} blocks, ${tables} tables, ${code} code)  "${d.title}"`,
    );
  }

  if (DRY) {
    const sampleTable = docs.flatMap((d) => d.body).find((b) => b._type === "table");
    console.log("\n--dry: nothing written. Sample table block:\n");
    console.log(JSON.stringify(sampleTable, null, 2));
    return;
  }
  if (!token) {
    console.error(
      "\nERROR: set SANITY_API_WRITE_TOKEN (Editor token from sanity.io/manage) to write. Or pass --dry to preview.",
    );
    process.exit(1);
  }

  const { createClient } = await import("@sanity/client");
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

  console.log(`\nWriting to ${projectId}/${dataset} (${REPLACE ? "replace" : "create-if-not-exists"})...`);
  for (const doc of docs) {
    if (REPLACE) {
      await client.createOrReplace(doc);
      console.log(`  replaced  ${doc._id}`);
    } else {
      const res = await client.createIfNotExists(doc);
      const existed = res._id === doc._id && res._updatedAt && res._createdAt !== res._updatedAt;
      console.log(`  ${existed ? "exists (skipped)" : "created"}  ${doc._id}`);
    }
  }
  console.log("\nDone. Published posts appear on /blog immediately and are editable at /studio.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
