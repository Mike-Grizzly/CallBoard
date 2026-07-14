import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Shared empty-state block (S3). Componentizes the people-directory `pp-empty`
 * pattern — icon tile + title + hint + optional action — so list surfaces stop
 * hand-rolling three different font sizes for the same idea.
 *
 * To preserve the people-directory's context-aware copy (a different message
 * when filters are active vs. genuinely empty), callers pass already-resolved
 * `title`/`hint`/`icon` — the component makes no assumptions about which state
 * it's in.
 */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  iconSize = 26,
  variant = "card",
  className,
}: {
  icon: IconName;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  iconSize?: number;
  /**
   * "card" (default) is the framed dashed-border block for full-width lists;
   * "bare" drops the frame and tightens the padding for narrow sidebars (e.g.
   * the notes list column) where the framed version would overwhelm.
   */
  variant?: "card" | "bare";
  className?: string;
}) {
  const cls = ["pp-empty", variant === "bare" ? "is-bare" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls}>
      <div className="pp-empty-ico">
        <Icon name={icon} size={iconSize} />
      </div>
      <b>{title}</b>
      {hint && <span>{hint}</span>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
