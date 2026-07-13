"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "@/features/documents/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DocumentDeleteButton({ documentId }: { documentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    setConfirming(false);
    const formData = new FormData();
    formData.set("document_id", documentId);

    startTransition(async () => {
      await deleteDocument(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="rounded p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-600"
        title="Delete document"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete document?"
        message="This document will be moved to the production trash."
        confirmLabel="Delete document"
        danger
        busy={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
