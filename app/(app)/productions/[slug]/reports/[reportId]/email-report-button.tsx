"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Mail, ChevronDown, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendReport } from "@/features/reports/send-report";

type Member = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function EmailReportButton({
  reportId,
  slug,
  members,
}: {
  reportId: string;
  slug: string;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(members.map((m) => m.userId)),
  );
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();
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

  const allSelected = selected.size === members.length && members.length > 0;

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

  function handleSend() {
    const emails = members
      .filter((m) => selected.has(m.userId))
      .map((m) => m.email);

    startTransition(async () => {
      const result = await sendReport(reportId, slug, emails);
      if (result.success) {
        setStatus("sent");
        setOpen(false);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Failed to send.");
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setStatus("idle");
          setOpen((v) => !v);
        }}
      >
        {status === "sent" ? (
          <>
            <Check className="h-4 w-4 text-green-600" aria-hidden />
            Sent
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" aria-hidden />
            Email Report
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
          </>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Send to
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[color:var(--muted)]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium">Entire production</span>
            </label>

            <div className="my-1 border-t border-[color:var(--border)]" />

            {members.map((m) => (
              <label
                key={m.userId}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[color:var(--muted)]"
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

          {status === "error" && (
            <div className="flex items-center gap-2 border-t border-[color:var(--border)] px-3 py-2 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {errorMsg}
            </div>
          )}

          <div className="border-t border-[color:var(--border)] p-3">
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={selected.size === 0 || isPending}
              onClick={handleSend}
            >
              <Mail className="h-4 w-4" aria-hidden />
              {isPending
                ? "Sending..."
                : `Send to ${selected.size} ${selected.size === 1 ? "person" : "people"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
