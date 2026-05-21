import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes rich-text HTML before it is injected via dangerouslySetInnerHTML.
 * TipTap output is user-authored, so it must pass through here on every
 * render path to neutralize stored-XSS payloads.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
