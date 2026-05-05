"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "@/features/documents/actions";

export function DocumentDeleteButton({ documentId }: { documentId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this document?")) return;

    const formData = new FormData();
    formData.set("document_id", documentId);

    startTransition(async () => {
      await deleteDocument(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-600"
      title="Delete document"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
