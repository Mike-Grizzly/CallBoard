"use client";

import { useTransition } from "react";
import { deleteCall } from "@/features/calls/actions";

export function DeleteCallButton({
  callId,
  productionId,
}: {
  callId: string;
  productionId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this call?")) return;

    const formData = new FormData();
    formData.set("call_id", callId);
    formData.set("production_id", productionId);

    startTransition(async () => {
      await deleteCall(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete call"}
    </button>
  );
}
