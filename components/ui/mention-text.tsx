import { Fragment } from "react";

/**
 * Renders a plain-text string that may contain `@{Full Name}` mention tokens,
 * displaying each token as a highlighted `@Full Name` chip (matching the rich
 * text mention styling) while leaving the rest of the text untouched. Used for
 * the report's structured note fields (schedule changes, line notes, etc.)
 * which store mentions as plain `@{Name}` tokens rather than rich-text nodes.
 */
export function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\{[^}]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^@\{([^}]+)\}$/.exec(part);
        return m ? (
          <span key={i} className="mention-tag">
            @{m[1]}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
