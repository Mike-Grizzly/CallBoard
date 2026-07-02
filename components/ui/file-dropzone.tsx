"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type Props = {
  /** Accepted file types, forwarded to the native input (e.g. "application/pdf"). */
  accept?: string;
  /** Allow selecting/dropping more than one file. */
  multiple?: boolean;
  disabled?: boolean;
  /** Helper line shown when nothing is selected. */
  hint?: string;
  /** Single-file convenience callback (first file, or null when cleared). */
  onFile?: (file: File | null) => void;
  /** Multi-file callback (all dropped/picked files). */
  onFiles?: (files: File[]) => void;
  /** Name(s) to show once something is selected (caller-controlled). */
  selectedLabel?: string | null;
};

/**
 * A small drag-and-drop upload box that also clicks through to the native file
 * picker — so people who prefer either path are covered. Purely presentational:
 * it hands files back via onFile/onFiles and keeps no upload logic of its own,
 * so it can wrap any existing upload flow (documents, script, ground plan).
 */
export function FileDropzone({
  accept,
  multiple = false,
  disabled = false,
  hint,
  onFile,
  onFiles,
  selectedLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function emit(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    onFiles?.(arr);
    onFile?.(arr[0] ?? null);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(false);
        emit(e.dataTransfer.files);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        minHeight: 64,
        padding: "10px 12px",
        textAlign: "center",
        borderRadius: "var(--radius-s)",
        border: `1px dashed ${dragOver ? "var(--accent)" : "var(--border-strong)"}`,
        background: dragOver ? "var(--accent-soft)" : "var(--bg-elev)",
        color: "var(--ink-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "border-color .15s, background .15s",
        fontSize: 13,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          emit(e.target.files);
          // Reset so picking the same file again still fires onChange.
          e.currentTarget.value = "";
        }}
        style={{ display: "none" }}
      />
      <Upload size={16} aria-hidden style={{ flexShrink: 0 }} />
      <span style={{ color: selectedLabel ? "var(--ink)" : "var(--ink-3)" }}>
        {selectedLabel ? (
          <>
            <b style={{ fontWeight: 500 }}>{selectedLabel}</b>
            <span style={{ color: "var(--ink-4)" }}> — choose another</span>
          </>
        ) : (
          (hint ?? "Drag a file here, or click to browse")
        )}
      </span>
    </div>
  );
}
