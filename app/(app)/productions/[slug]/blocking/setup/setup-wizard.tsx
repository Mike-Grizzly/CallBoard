"use client";

import { useRef, useState, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveStageConfiguration } from "@/features/blocking/actions";
import { getDocumentUrl } from "@/features/documents/actions";
import type { DocumentWithUploader } from "@/features/documents/queries";
import type { StageConfiguration } from "@/db/schema";

type Props = {
  productionId: string;
  productionSlug: string;
  pdfDocuments: DocumentWithUploader[];
  existingConfig: StageConfiguration | null;
};

type CalibrationPoint = { xPercent: number; yPercent: number };

export function SetupWizard({
  productionId,
  productionSlug,
  pdfDocuments,
  existingConfig,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [selectedDocId, setSelectedDocId] = useState<string>(
    existingConfig?.groundPlanDocumentId ?? "",
  );
  const [widthFt, setWidthFt] = useState<string>(
    existingConfig?.prosceniumWidthFt?.toString() ?? "",
  );
  const [depthFt, setDepthFt] = useState<string>(
    existingConfig?.stageDepthFt?.toString() ?? "",
  );

  // Step 2 state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [calibPoints, setCalibPoints] = useState<CalibrationPoint[]>(
    existingConfig?.calibrationX1 != null
      ? [
          {
            xPercent: existingConfig.calibrationX1!,
            yPercent: existingConfig.calibrationY1!,
          },
          {
            xPercent: existingConfig.calibrationX2!,
            yPercent: existingConfig.calibrationY2!,
          },
        ]
      : [],
  );
  const [selectedPage, setSelectedPage] = useState<number>(
    existingConfig?.groundPlanPage ?? 1,
  );
  const [numPages, setNumPages] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 });

  async function loadPdfUrl(docId: string): Promise<string | null> {
    const doc = pdfDocuments.find((d) => d.id === docId);
    if (!doc) return null;
    return getDocumentUrl(doc.storagePath);
  }

  async function goToCalibration() {
    setError(null);
    if (!widthFt || isNaN(parseFloat(widthFt)) || parseFloat(widthFt) <= 0) {
      setError("Enter a valid proscenium width.");
      return;
    }
    if (!depthFt || isNaN(parseFloat(depthFt)) || parseFloat(depthFt) <= 0) {
      setError("Enter a valid stage depth.");
      return;
    }

    if (selectedDocId) {
      const url = await loadPdfUrl(selectedDocId);
      setPdfUrl(url);
    }

    setStep(2);
  }

  async function goToRecalibrate() {
    setError(null);
    if (selectedDocId) {
      const url = await loadPdfUrl(selectedDocId);
      setPdfUrl(url);
    }
    setStep(2);
  }

  useEffect(() => {
    if (step !== 2 || !pdfUrl || !canvasRef.current) return;

    let cancelled = false;
    async function renderPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const loadingTask = pdfjsLib.getDocument(pdfUrl!);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setNumPages(pdf.numPages);
        const page = await pdf.getPage(selectedPage);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setCanvasDims({ width: viewport.width, height: viewport.height });

        await page.render({ canvas, viewport }).promise;
      } catch {
        if (!cancelled) setError("Failed to render PDF. Try selecting a different file.");
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
    };
  }, [step, pdfUrl, selectedPage]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (calibPoints.length >= 2) {
        setCalibPoints([]);
        return;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setCalibPoints((prev) => [...prev, { xPercent: x, yPercent: y }]);
    },
    [calibPoints.length],
  );

  function computePixelsPerFoot(): number | null {
    if (calibPoints.length < 2 || !canvasDims.width) return null;
    const dx =
      ((calibPoints[1].xPercent - calibPoints[0].xPercent) / 100) *
      canvasDims.width;
    const dy =
      ((calibPoints[1].yPercent - calibPoints[0].yPercent) / 100) *
      canvasDims.height;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    return pixelDist / parseFloat(widthFt);
  }

  function handleSave() {
    setError(null);
    const pixelsPerFoot = computePixelsPerFoot();

    const formData = new FormData();
    formData.set("production_id", productionId);
    formData.set("proscenium_width_ft", widthFt);
    formData.set("stage_depth_ft", depthFt);
    if (selectedDocId) formData.set("ground_plan_document_id", selectedDocId);
    formData.set("ground_plan_page", selectedPage.toString());
    if (calibPoints.length === 2) {
      formData.set("calibration_x1", calibPoints[0].xPercent.toString());
      formData.set("calibration_y1", calibPoints[0].yPercent.toString());
      formData.set("calibration_x2", calibPoints[1].xPercent.toString());
      formData.set("calibration_y2", calibPoints[1].yPercent.toString());
    }
    if (pixelsPerFoot !== null) {
      formData.set("pixels_per_foot", pixelsPerFoot.toString());
    }

    startTransition(async () => {
      const result = await saveStageConfiguration(undefined, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/productions/${productionSlug}/blocking`);
      }
    });
  }

  if (step === 1) {
    return (
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ground Plan PDF{" "}
              <span className="text-[color:var(--muted-foreground)]">
                (optional)
              </span>
            </label>
            {pdfDocuments.length === 0 ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No PDFs uploaded yet. You can add one in the Documents section
                and come back, or proceed without a ground plan.
              </p>
            ) : (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
              >
                <option value="">— No ground plan —</option>
                {pdfDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Proscenium Width (ft)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={widthFt}
                onChange={(e) => setWidthFt(e.target.value)}
                placeholder="e.g. 40"
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Stage Depth (ft)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={depthFt}
                onChange={(e) => setDepthFt(e.target.value)}
                placeholder="e.g. 30"
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/productions/${productionSlug}/blocking`)
              }
            >
              Cancel
            </Button>
            {existingConfig && selectedDocId && (
              <Button variant="outline" onClick={goToRecalibrate}>
                Recalibrate Only
              </Button>
            )}
            <Button onClick={goToCalibration}>
              {selectedDocId ? "Next: Calibrate" : "Save & Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Calibration
  const ppf = computePixelsPerFoot();
  const hasTwoPoints = calibPoints.length === 2;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium">Calibrate Stage Scale</p>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            {calibPoints.length === 0
              ? "Click on the Stage Right edge of the proscenium opening."
              : calibPoints.length === 1
                ? "Now click on the Stage Left edge of the proscenium opening."
                : `Scale set: 1 foot ≈ ${ppf?.toFixed(1)} px. Click anywhere to reset.`}
          </p>
        </CardContent>
      </Card>

      {!pdfUrl ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-[color:var(--muted-foreground)]">
            No ground plan selected — click Save below to proceed without one.
          </CardContent>
        </Card>
      ) : (
        <>
          {numPages > 1 && (
            <div className="flex items-center gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm">
              <span className="font-medium">Page:</span>
              {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPage(p);
                    setCalibPoints([]);
                  }}
                  className={`rounded px-2 py-0.5 text-sm ${
                    selectedPage === p
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                      : "hover:bg-[color:var(--muted)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <div
            ref={containerRef}
            className="relative cursor-crosshair overflow-hidden rounded-lg border border-[color:var(--border)]"
            onClick={handleCanvasClick}
          >
            <canvas ref={canvasRef} className="block w-full" />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 100 100`}
              preserveAspectRatio="none"
            >
              {calibPoints.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.xPercent}
                  cy={pt.yPercent}
                  r="1.2"
                  fill={i === 0 ? "#ef4444" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="0.4"
                />
              ))}
              {hasTwoPoints && (
                <line
                  x1={calibPoints[0].xPercent}
                  y1={calibPoints[0].yPercent}
                  x2={calibPoints[1].xPercent}
                  y2={calibPoints[1].yPercent}
                  stroke="#f59e0b"
                  strokeWidth="0.5"
                  strokeDasharray="2 1"
                />
              )}
            </svg>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Stage Setup"}
        </Button>
      </div>
    </div>
  );
}
