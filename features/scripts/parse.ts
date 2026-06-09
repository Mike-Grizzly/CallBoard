import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { documents, scriptParses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient, SCRIPT_PARSE_MODEL } from "@/lib/anthropic";
import { sendScriptParseReady } from "@/features/notifications/announce";
import type { ScriptParseResult } from "./constants";

// Guard against a pathological PDF blowing the context budget. ~600k chars is
// roughly 150k tokens — comfortably inside Opus's 1M window with headroom.
const MAX_TEXT_CHARS = 600_000;

/**
 * Extract the text of each page of a PDF, returned one string per page (index 0
 * = page 1). Runs server-side in the Node runtime using pdfjs's legacy build,
 * which does not require a browser worker.
 */
async function extractPdfPages(data: Uint8Array): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if ("str" in item) {
        text += item.str;
        if (item.hasEOL) text += "\n";
        else text += " ";
      }
    }
    pages.push(text.replace(/[ \t]+/g, " ").trim());
    page.cleanup();
  }
  await doc.cleanup();
  return pages;
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
  "bookmarks": [{ "page": integer, "title": string, "kind": "scene" | "song" }]
}`;

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
3. bookmarks — navigational markers with the PAGE NUMBER they begin on (the N from the page marker). Include every scene start (kind "scene") and every musical number / song (kind "song"). title is the scene name or song title.

Be accurate about page numbers — use only the page where the item actually begins. If the script is not actually a script (e.g. a contract or a flyer), return empty arrays.

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
    const tagged = buildTaggedScript(pages);
    if (tagged.trim().length < 200) {
      throw new Error(
        "Couldn't read enough text from this PDF — it may be a scan or image-only file.",
      );
    }

    const stream = client.messages.stream({
      model: SCRIPT_PARSE_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyse this script (${pages.length} pages):\n${tagged}`,
        },
      ],
    });

    const message = await stream.finalMessage();
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const result = JSON.parse(extractJson(text)) as ScriptParseResult;
    if (!Array.isArray(result.roles) || !Array.isArray(result.scenes)) {
      throw new Error("The analysis came back in an unexpected format.");
    }
    result.bookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : [];

    await db
      .update(scriptParses)
      .set({
        status: "ready",
        result,
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
