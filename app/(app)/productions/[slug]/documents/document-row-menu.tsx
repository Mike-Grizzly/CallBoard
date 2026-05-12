"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MoreVertical, Download, Link2, Trash2, Check } from "lucide-react";
import { deleteDocument, getDocumentDownloadUrl } from "@/features/documents/actions";
import { useRouter } from "next/navigation";

interface Props {
  documentId: string;
  storagePath: string;
  fileName: string;
  slug: string;
}

export function DocumentRowMenu({
  documentId,
  storagePath,
  fileName,
  slug,
}: Props) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isOpen = pos !== null;

  function open(e: React.MouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setPos(null);
      return;
    }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPos(null);
    }
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setPos(null);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [isOpen]);

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setPos(null);
    startTransition(async () => {
      const url = await getDocumentDownloadUrl(storagePath, fileName);
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
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setPos(null);
      }, 1500);
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
          color: "var(--ink-3)",
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

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: pos!.top,
            right: pos!.right,
            zIndex: 400,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.14)",
            minWidth: 160,
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
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <MenuItem
            icon={<Trash2 size={14} />}
            label="Delete"
            onClick={handleDelete}
            danger
          />
        </div>
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
