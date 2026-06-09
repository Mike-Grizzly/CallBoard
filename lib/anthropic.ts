import Anthropic from "@anthropic-ai/sdk";

/**
 * The model that parses uploaded scripts. Opus 4.8 for best extraction quality
 * on long, irregularly-formatted scripts; cost per script is a few cents given
 * the 1M context window.
 */
export const SCRIPT_PARSE_MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

/**
 * Lazily construct the Anthropic client. Returns null when `ANTHROPIC_API_KEY`
 * is unset so a missing key degrades gracefully (the parse fails with a clear
 * message) rather than throwing at import time — same posture as web-push.
 */
export function getAnthropicClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}
