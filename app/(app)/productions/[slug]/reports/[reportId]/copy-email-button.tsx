"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Member = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function CopyEmailButton({
  text,
  members,
}: {
  text: string;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(members.map((m) => m.userId)),
  );
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const allSelected = selected.size === members.length;

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(members.map((m) => m.userId)),
    );
  }

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  function displayName(m: Member) {
    return m.firstName || m.lastName
      ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()
      : m.email;
  }

  async function handleCopy() {
    const toAddresses = members
      .filter((m) => selected.has(m.userId))
      .map((m) => m.email)
      .join(", ");

    const payload =
      toAddresses.length > 0 ? `To: ${toAddresses}\n\n${text}` : text;

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" aria-hidden />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden />
            Copy as Email
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
          </>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Recipients
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[color:var(--accent)]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium">Select all</span>
            </label>

            <div className="my-1 border-t border-[color:var(--border)]" />

            {members.map((m) => (
              <label
                key={m.userId}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[color:var(--accent)]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(m.userId)}
                  onChange={() => toggleMember(m.userId)}
                  className="h-4 w-4 rounded"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {displayName(m)}
                  </span>
                  <span className="block truncate text-xs text-[color:var(--muted-foreground)]">
                    {m.email}
                  </span>
                </span>
              </label>
            ))}

            {members.length === 0 && (
              <p className="px-2 py-2 text-sm text-[color:var(--muted-foreground)]">
                No members assigned to this production.
              </p>
            )}
          </div>

          <div className="border-t border-[color:var(--border)] p-3">
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={selected.size === 0}
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" aria-hidden />
              Copy ({selected.size})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
