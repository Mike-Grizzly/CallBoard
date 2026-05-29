"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import {
  finalizeWorkspaceLogoUpload,
  removeWorkspaceLogo,
  requestWorkspaceLogoUpload,
} from "@/features/workspace/actions";

const ACCEPT = "image/svg+xml,image/png,image/jpeg";
const MAX_BYTES = 2 * 1024 * 1024;
const SQUARE_TOLERANCE = 0.05; // allow up to 5% off-square so a 500×501 image still counts

function isSquare(width: number, height: number) {
  if (!width || !height) return false;
  return Math.abs(width - height) / Math.max(width, height) <= SQUARE_TOLERANCE;
}

/**
 * Reads the picked file enough to confirm it's roughly square. SVGs
 * can ship without intrinsic dimensions, so we accept SVG without the
 * shape check — the user is presumed to know what they uploaded.
 */
async function validateImageShape(file: File): Promise<string | null> {
  if (file.type === "image/svg+xml") return null;

  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      if (!isSquare(img.width, img.height)) {
        resolve(
          `Logo needs to be square. This one is ${img.width}×${img.height}.`,
        );
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve("That file doesn't look like a valid image.");
    img.src = dataUrl;
  });
}

export function WorkspaceLogoUploader({
  currentLogoUrl,
}: {
  currentLogoUrl: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onPick = () => fileInputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(false);

    if (!["image/svg+xml", "image/png", "image/jpeg"].includes(file.type)) {
      setError("Logo must be an SVG, PNG, or JPG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Logo must be 2MB or smaller.");
      e.target.value = "";
      return;
    }

    const shapeError = await validateImageShape(file);
    if (shapeError) {
      setError(shapeError);
      e.target.value = "";
      return;
    }

    startTransition(async () => {
      const signed = await requestWorkspaceLogoUpload(
        file.name,
        file.type,
        file.size,
      );
      if (signed.error || !signed.path || !signed.token) {
        setError(signed.error ?? "Could not start upload.");
        return;
      }

      const upload = await uploadFileToSignedUrl(signed.path, signed.token, file);
      if (upload.error) {
        setError(upload.error);
        return;
      }

      const finalize = await finalizeWorkspaceLogoUpload(signed.path);
      if (finalize.error) {
        setError(finalize.error);
        return;
      }

      setSuccess(true);
      router.refresh();
    });

    // Reset so the same file can be re-picked after an error/refresh.
    e.target.value = "";
  };

  const onRemove = () => {
    if (!window.confirm("Remove the workspace logo?")) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await removeWorkspaceLogo();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
        Workspace logo
      </h3>
      <p
        className="muted"
        style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}
      >
        SVG, PNG, or JPG. Square. Up to 2MB. Shows in the rail, settings, and
        any future emails or share pages.
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && (
        <div style={{ color: "var(--c-sage)", fontSize: 13, marginBottom: 10 }}>
          Logo updated.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {currentLogoUrl ? (
            // Signed URLs change every render; next/image's optimizer
            // can't reuse anything across requests, so a plain <img>
            // keeps things simple here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentLogoUrl}
              alt="Workspace logo"
              width={72}
              height={72}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Icon
              name="Building2"
              size={28}
              aria-hidden
              style={{ color: "var(--ink-4)" }}
            />
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            onClick={onPick}
            disabled={pending}
          >
            <Icon name="Upload" size={14} aria-hidden />
            {pending ? "Uploading..." : currentLogoUrl ? "Replace" : "Upload"}
          </button>
          {currentLogoUrl && (
            <button
              type="button"
              className="btn"
              onClick={onRemove}
              disabled={pending}
            >
              <Icon name="Trash2" size={14} aria-hidden /> Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
