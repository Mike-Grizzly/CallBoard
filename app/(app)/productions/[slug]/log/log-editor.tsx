"use client";

import { useState, useTransition } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { saveProductionLog } from "@/features/logs/actions";
import { Save, Check } from "lucide-react";

export function LogEditor({
  productionId,
  initialContent,
}: {
  productionId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    setError(null);

    const formData = new FormData();
    formData.set("production_id", productionId);
    formData.set("content", content);

    startTransition(async () => {
      const result = await saveProductionLog(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-4">
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Start typing your daily notes here..."
        minHeight="400px"
      />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            "Saving..."
          ) : saved ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden />
              Save log
            </>
          )}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="text-sm text-green-600">Log saved successfully.</p>
        )}
      </div>
    </div>
  );
}
