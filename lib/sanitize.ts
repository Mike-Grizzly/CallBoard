import sanitize from "sanitize-html";

// Color values permitted in inline styles — hex, rgb(a), hsl(a), or a bare
// CSS color keyword. Restrictive enough to keep style attributes inert.
const COLOR = [/^#(0x)?[0-9a-f]+$/i, /^rgba?\(/i, /^hsla?\(/i, /^[a-z-]+$/i];

/**
 * Sanitizes user-authored rich-text HTML before it is injected via
 * dangerouslySetInnerHTML, neutralizing stored-XSS payloads. TipTap output
 * must pass through here on every render path.
 *
 * Uses sanitize-html rather than DOMPurify: it is a pure string parser that
 * runs identically on the server and client with no jsdom dependency —
 * jsdom does not bundle reliably in the Next.js server runtime.
 *
 * The allowlist matches what the TipTap editors can produce (StarterKit,
 * Underline, TextAlign, TextStyle/Color, Highlight, Mention). Mention spans
 * keep `data-id` so mention parsing downstream still works.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  return sanitize(html, {
    allowedTags: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "strong", "b", "em", "i", "u", "s", "strike", "mark",
      "a", "span",
      // Task lists (checkboxes)
      "label", "input", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      span: ["class", "data-type", "data-id", "data-label"],
      mark: ["class", "data-color"],
      ul: ["data-type"],
      li: ["data-checked", "data-type"],
      // Display-only checkboxes; forced inert via transformTags below.
      input: ["type", "checked", "disabled"],
      "*": ["style"],
    },
    transformTags: {
      input: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, disabled: "disabled" },
      }),
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: COLOR,
        "background-color": COLOR,
      },
    },
  });
}
