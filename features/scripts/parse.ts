import { createHash } from "crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { documents, scriptParses, scriptCache } from "@/db/schema";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient, SCRIPT_PARSE_MODEL } from "@/lib/anthropic";
import { sendScriptParseReady } from "@/features/notifications/announce";
import type {
  ScriptParseResult,
  ParsedRole,
  ParsedScene,
  ParsedBookmark,
} from "./constants";

// Guard against a pathological PDF blowing the context budget. ~600k chars is
// roughly 150k tokens — comfortably inside Opus's 1M window with headroom.
const MAX_TEXT_CHARS = 600_000;

/**
 * Extract the text of each page of a PDF, one string per page (index 0 = page
 * 1). Uses `unpdf`, which ships a serverless-safe pdfjs build — no browser
 * globals (DOMMatrix etc.), so it runs on Vercel's Node runtime.
 */
async function extractPdfPages(data: Uint8Array): Promise<string[]> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return pages.map((t) => (t ?? "").replace(/[ \t]+/g, " ").trim());
}

/** Join per-page text into a single page-tagged document for the model. */
function buildTaggedScript(pages: string[]): string {
  let out = "";
  for (let i = 0; i < pages.length; i++) {
    const chunk = `\n===== PAGE ${i + 1} =====\n${pages[i]}\n`;
    if (out.length + chunk.length > MAX_TEXT_CHARS) break;
    out += chunk;
  }
  return out;
}

const OUTPUT_SHAPE = `{
  "title": string,                       // the show's title, "" if unknown
  "roles":  [{ "name": string, "type": "Principal" | "Supporting" | "Ensemble" }],
  "scenes": [{ "actNumber": integer, "sceneNumber": integer, "title": string }],
  "bookmarks": [{ "kind": "scene" | "song", "title": string, "anchor": string }]
}`;

/** Normalize text for anchor matching: lowercase, alnum + single spaces. */
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve each bookmark's page deterministically by locating its verbatim
 * anchor (falling back to the title) in the per-page text. This removes the
 * model's page-number drift over long scripts, and drops any bookmark whose
 * anchor can't be found — which also filters hallucinated scene markers.
 */
function resolveBookmarks(
  raw: { kind?: string; title?: string; anchor?: string }[],
  pages: string[],
): ParsedBookmark[] {
  const pagesNorm = pages.map(normalizeText);

  // Identify front-matter "index" pages — a table of contents, "musical
  // numbers" list, or synopsis of scenes. These list many scene/song titles
  // together, so a naive first-match would resolve every bookmark to the index
  // instead of the real page. A page is treated as an index page if it names an
  // index section, or if it contains many (≥4) distinct bookmark anchors.
  const INDEX_KEYWORDS = [
    "musical numbers",
    "scenes and musical numbers",
    "synopsis of scenes",
    "table of contents",
    "list of scenes",
  ];
  const anchorTexts = raw
    .map((b) => normalizeText(b.anchor ?? b.title ?? ""))
    .filter((a) => a.length >= 4);
  const indexPages = new Set<number>();
  for (let i = 0; i < pagesNorm.length; i++) {
    const text = pagesNorm[i];
    const distinctHits = new Set(anchorTexts.filter((a) => text.includes(a)));
    const hasKeyword = INDEX_KEYWORDS.some((k) => text.includes(k));
    if (hasKeyword || distinctHits.size >= 4) indexPages.add(i);
  }
  const findBodyPage = (needle: string) =>
    pagesNorm.findIndex((p, i) => !indexPages.has(i) && p.includes(needle));

  const out: ParsedBookmark[] = [];
  const seen = new Set<string>();
  for (const b of raw) {
    const anchor = normalizeText(b.anchor ?? "");
    const title = normalizeText(b.title ?? "");
    let page = -1;
    if (anchor.length >= 4) page = findBodyPage(anchor);
    if (page === -1 && title.length >= 4) page = findBodyPage(title);
    if (page === -1) continue; // unfindable outside the index → drop
    const key = `${page}|${(b.title ?? "").trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      page: page + 1,
      title: (b.title ?? "").trim() || `Page ${page + 1}`,
      kind: b.kind === "song" ? "song" : "scene",
    });
  }
  out.sort((a, b) => a.page - b.page);
  return out;
}

/** Pull the JSON object out of the model's reply, tolerating stray fences/prose. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

const SYSTEM_PROMPT = `You analyse theatrical scripts and musical-theatre librettos to set up a production template. You are given the full script as plain text, split into pages with "===== PAGE N =====" markers.

Produce four things:
1. roles — every named speaking/singing character. Classify each as Principal (large role, drives the plot, sings/speaks frequently), Supporting (named role with meaningful but smaller presence), or Ensemble (chorus, named groups, or one-scene bit parts). Use the character name as it appears in the script (e.g. "Frederic", not "FREDERIC:"). Do not invent characters; do not list stage directions, narrators of headings, or props as characters. Each character appears once.
2. scenes — the Act/Scene structure in reading order. actNumber and sceneNumber are 1-based integers; for a single-act play use actNumber 1 throughout. title is a short scene label (the script's own scene heading if present, otherwise a brief setting like "The town square").
3. bookmarks — one entry per scene start (kind "scene") and per musical number / song (kind "song"). Do NOT return a page number. Instead return an "anchor": a short, EXACT, verbatim quote (3–8 words) copied character-for-character from the script at that point — the scene heading or the song's title/number line as printed (e.g. "No. 7 — Poor Wandering One" or "ACT II, SCENE 1"). The anchor MUST appear verbatim in the script text so it can be located; if you can't quote it exactly, omit that bookmark. For song titles and numbers, copy the script's own printed label exactly — never renumber, re-letter, or invent a sequence. Only mark genuine scene/song starts, not every page or stage direction. IMPORTANT: front-matter listing pages — a table of contents, a "Musical Numbers" list, a synopsis/list of scenes — are reference only. Use them to understand the structure, but create exactly ONE bookmark per scene/song at its ACTUAL start in the body of the script, never a bookmark for its entry in such a list.

If the script is not actually a script (e.g. a contract or a flyer), return empty arrays.

Respond with ONLY a single JSON object in this exact shape — no markdown, no code fences, no commentary:
${OUTPUT_SHAPE}`;

/**
 * Run the analysis for a staged parse row: download the PDF, extract its text,
 * ask the model for the cast/scene/bookmark breakdown, and store the proposal
 * back on the row. On success the row goes to `ready` and the requester is
 * notified; on any failure it goes to `failed` with a message. Never throws —
 * the row's status is the single source of truth the UI polls.
 */
export async function runScriptParse(parseId: string): Promise<void> {
  const [parse] = await db
    .select({
      id: scriptParses.id,
      productionId: scriptParses.productionId,
      documentId: scriptParses.documentId,
      storagePath: scriptParses.storagePath,
      requestedBy: scriptParses.requestedBy,
      notes: scriptParses.notes,
    })
    .from(scriptParses)
    .where(eq(scriptParses.id, parseId))
    .limit(1);

  if (!parse) return;

  try {
    const client = getAnthropicClient();
    if (!client) {
      throw new Error(
        "AI is not configured on the server (ANTHROPIC_API_KEY is missing).",
      );
    }

    // Resolve the PDF source: a production document (Documents flow) or a temp
    // upload path (new-production wizard, before the production exists).
    let storagePath: string;
    if (parse.documentId) {
      const [doc] = await db
        .select({
          storagePath: documents.storagePath,
          contentType: documents.contentType,
        })
        .from(documents)
        .where(eq(documents.id, parse.documentId))
        .limit(1);
      if (!doc) throw new Error("Script document no longer exists.");
      if (doc.contentType !== "application/pdf") {
        throw new Error("AI analysis currently supports PDF scripts only.");
      }
      storagePath = doc.storagePath;
    } else if (parse.storagePath) {
      storagePath = parse.storagePath;
    } else {
      throw new Error("No script file is attached to this analysis.");
    }

    const supabase = createSupabaseAdminClient();
    const { data: signed } = await supabase.storage
      .from("attachments")
      .createSignedUrl(storagePath, 600);
    if (!signed?.signedUrl) throw new Error("Could not read the script file.");

    const res = await fetch(signed.signedUrl);
    if (!res.ok) throw new Error("Could not download the script file.");
    const bytes = new Uint8Array(await res.arrayBuffer());

    const pages = await extractPdfPages(bytes);
    const fullText = pages.join("\n");
    if (fullText.trim().length < 200) {
      throw new Error(
        "Couldn't read enough text from this PDF — it may be a scan or image-only file.",
      );
    }

    // Content fingerprint → global cache. An exact-file match reuses a
    // previously human-verified breakdown (instant, free, no model call).
    // Skipped for a re-analysis, where the point is a fresh take.
    const fingerprint = createHash("sha256")
      .update(normalizeText(fullText))
      .digest("hex");

    if (!parse.notes) {
      const [hit] = await db
        .select({ result: scriptCache.result })
        .from(scriptCache)
        .where(eq(scriptCache.fingerprint, fingerprint))
        .limit(1);
      const cached = hit?.result as ScriptParseResult | undefined;
      if (cached && ((cached.roles?.length ?? 0) > 0 || (cached.scenes?.length ?? 0) > 0)) {
        await db
          .update(scriptParses)
          .set({
            status: "ready",
            result: cached,
            fingerprint,
            error: null,
            inputTokens: 0,
            outputTokens: 0,
            updatedAt: new Date(),
          })
          .where(eq(scriptParses.id, parseId));
        if (parse.documentId) {
          await db
            .update(documents)
            .set({ processingStatus: "ready" })
            .where(eq(documents.id, parse.documentId));
        }
        if (parse.requestedBy && parse.productionId) {
          await sendScriptParseReady({
            userId: parse.requestedBy,
            productionId: parse.productionId,
            roleCount: cached.roles.length,
            sceneCount: cached.scenes.length,
          });
        }
        return;
      }
    }

    const tagged = buildTaggedScript(pages);

    // On a re-analysis, prepend the director's corrections and (if available)
    // the previous result so the model fixes the specific problems.
    let preface = "";
    if (parse.notes) {
      let prior: unknown = null;
      if (parse.documentId) {
        const [prev] = await db
          .select({ result: scriptParses.result })
          .from(scriptParses)
          .where(
            and(
              eq(scriptParses.documentId, parse.documentId),
              ne(scriptParses.id, parseId),
              isNotNull(scriptParses.result),
            ),
          )
          .orderBy(desc(scriptParses.createdAt))
          .limit(1);
        prior = prev?.result ?? null;
      }
      preface =
        "This is a RE-ANALYSIS. A previous analysis was reviewed by the director, " +
        "who gave these corrections — apply them precisely:\n\"\"\"\n" +
        `${parse.notes}\n"""\n` +
        (prior
          ? `\nThe previous analysis (to correct, not to copy) was:\n${JSON.stringify(prior)}\n`
          : "") +
        "\nNow re-analyse the script and produce a corrected result.\n\n";
    }

    const stream = client.messages.stream({
      model: SCRIPT_PARSE_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${preface}Analyse this script (${pages.length} pages):\n${tagged}`,
        },
      ],
    });

    const message = await stream.finalMessage();
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const raw = JSON.parse(extractJson(text)) as {
      title?: string;
      roles?: ParsedRole[];
      scenes?: ParsedScene[];
      bookmarks?: { kind?: string; title?: string; anchor?: string }[];
    };
    if (!Array.isArray(raw.roles) || !Array.isArray(raw.scenes)) {
      throw new Error("The analysis came back in an unexpected format.");
    }
    const result: ScriptParseResult = {
      title: raw.title ?? "",
      roles: raw.roles,
      scenes: raw.scenes,
      // Page numbers are resolved in code from anchors, not trusted from the
      // model — this is what fixes long-script bookmark drift.
      bookmarks: resolveBookmarks(
        Array.isArray(raw.bookmarks) ? raw.bookmarks : [],
        pages,
      ),
    };

    await db
      .update(scriptParses)
      .set({
        status: "ready",
        result,
        fingerprint,
        error: null,
        inputTokens: message.usage?.input_tokens ?? null,
        outputTokens: message.usage?.output_tokens ?? null,
        updatedAt: new Date(),
      })
      .where(eq(scriptParses.id, parseId));
    if (parse.documentId) {
      await db
        .update(documents)
        .set({ processingStatus: "ready" })
        .where(eq(documents.id, parse.documentId));
    }

    // Notify only for production-scoped (Documents flow) parses. A wizard parse
    // has no production and the user is watching it live, so there's no one to
    // route a notification to.
    if (parse.requestedBy && parse.productionId) {
      await sendScriptParseReady({
        userId: parse.requestedBy,
        productionId: parse.productionId,
        roleCount: result.roles.length,
        sceneCount: result.scenes.length,
      });
    }
  } catch (err) {
    const messageText =
      err instanceof Error ? err.message : "Script analysis failed.";
    await db
      .update(scriptParses)
      .set({ status: "failed", error: messageText, updatedAt: new Date() })
      .where(eq(scriptParses.id, parseId));
    if (parse.documentId) {
      await db
        .update(documents)
        .set({ processingStatus: "failed" })
        .where(eq(documents.id, parse.documentId));
    }
  }
}
