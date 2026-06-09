"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Download, Link2, Trash2, Check, Star, Sparkles } from "lucide-react";
import { deleteDocument, getDocumentDownloadUrl } from "@/features/documents/actions";
import { setDefaultScript, startScriptParse } from "@/features/scripts/actions";
import { useRouter } from "next/navigation";

interface Props {
  documentId: string;
  fileName: string;
  slug: string;
  productionId: string;
  documentType: string;
  isDefaultScript: boolean;
}

interface MenuPos {
  top: number;
  right: number;
}

export function DocumentRowMenu({
  documentId,
  fileName,
  slug,
  productionId,
  documentType,
  isDefaultScript,
}: Props) {
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isOpen = pos !== null;

  function open(e: React.MouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setPos(null);
      return;
    }
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPos(null);
    }
    function onMouseDown(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setPos(null);
      }
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [isOpen]);

  // Reposition if the user scrolls while the menu is open
  useEffect(() => {
    if (!isOpen) return;
    function reposition() {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      }
    }
    window.addEventListener("scroll", reposition, true);
    return () => window.removeEventListener("scroll", reposition, true);
  }, [isOpen]);

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setPos(null);
    startTransition(async () => {
      const url = await getDocumentDownloadUrl(documentId, fileName);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/productions/${slug}/documents?doc=${documentId}`;
    const finish = () => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setPos(null);
      }, 1500);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(finish).catch(() => fallback(url, finish));
    } else {
      fallback(url, finish);
    }
  }

  function handleSetDefault(e: React.MouseEvent) {
    e.stopPropagation();
    setPos(null);
    const formData = new FormData();
    formData.set("document_id", documentId);
    formData.set("production_id", productionId);
    startTransition(async () => {
      await setDefaultScript(formData);
      router.refresh();
    });
  }

  function handleAnalyze(e: React.MouseEvent) {
    e.stopPropagation();
    setPos(null);
    const formData = new FormData();
    formData.set("document_id", documentId);
    formData.set("production_id", productionId);
    startTransition(async () => {
      const res = await startScriptParse(formData);
      if (res.error || !res.parseId) {
        alert(res.error ?? "Could not start analysis.");
        return;
      }
      // Kick the background run; the route returns immediately and continues
      // the work via after(), so we don't await it.
      fetch(`/api/scripts/${res.parseId}/run`, { method: "POST" }).catch(() => {});
      router.push(`/productions/${slug}/script/ai`);
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setPos(null);
    if (!confirm("Delete this document? This cannot be undone.")) return;
    const formData = new FormData();
    formData.set("document_id", documentId);
    startTransition(async () => {
      await deleteDocument(formData);
      router.refresh();
    });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={open}
        disabled={isPending}
        title="Options"
        style={{
          display: "grid",
          placeItems: "center",
          width: 28,
          height: 28,
          border: "none",
          borderRadius: "var(--radius-s)",
          background: isOpen ? "var(--bg-muted)" : "transparent",
          color: isOpen ? "var(--ink)" : "var(--ink-3)",
          cursor: "pointer",
          transition: "background .1s, color .1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-muted)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-3)";
          }
        }}
      >
        <MoreVertical size={15} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos!.top,
              right: pos!.right,
              zIndex: 9999,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,.16)",
              minWidth: 168,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem icon={<Download size={14} />} label="Download" onClick={handleDownload} />
            <MenuItem
              icon={copied ? <Check size={14} /> : <Link2 size={14} />}
              label={copied ? "Copied!" : "Copy share link"}
              onClick={handleShare}
            />
            {documentType === "script" && !isDefaultScript && (
              <MenuItem
                icon={<Star size={14} />}
                label="Set as default script"
                onClick={handleSetDefault}
              />
            )}
            {documentType === "script" && (
              <MenuItem
                icon={<Sparkles size={14} />}
                label="Analyze with AI"
                onClick={handleAnalyze}
              />
            )}
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <MenuItem
              icon={<Trash2 size={14} />}
              label="Delete"
              onClick={handleDelete}
              danger
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 14px",
        fontSize: 13,
        border: "none",
        background: "transparent",
        color: danger ? "var(--c-clay)" : "var(--ink)",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = danger
          ? "color-mix(in oklch, var(--c-clay) 10%, transparent)"
          : "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// Clipboard fallback using a hidden textarea + execCommand for older browsers / HTTP
function fallback(text: string, onDone: () => void) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    onDone();
  } finally {
    document.body.removeChild(ta);
  }
}
