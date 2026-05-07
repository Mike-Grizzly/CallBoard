"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] placeholder:text-[color:var(--muted-foreground)]";

interface Props
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "maxLength"> {
  maxLength: number;
}

export function CountedTextarea({
  maxLength,
  defaultValue = "",
  onChange,
  className,
  ...rest
}: Props) {
  const [count, setCount] = useState(String(defaultValue).length);
  const remaining = maxLength - count;
  const nearLimit = remaining <= 50;
  const atLimit = remaining <= 10;

  return (
    <div>
      <textarea
        {...rest}
        maxLength={maxLength}
        defaultValue={defaultValue}
        onChange={(e) => {
          setCount(e.target.value.length);
          onChange?.(e);
        }}
        className={cn(base, className)}
      />
      {nearLimit && (
        <p
          className={cn(
            "mt-1 text-right text-xs tabular-nums",
            atLimit
              ? "text-red-500"
              : "text-[color:var(--muted-foreground)]",
          )}
        >
          {remaining} character{remaining !== 1 ? "s" : ""} left
        </p>
      )}
    </div>
  );
}
