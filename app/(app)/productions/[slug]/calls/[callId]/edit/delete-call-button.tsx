"use client";

import { useState, useTransition } from "react";
import { deleteCall } from "@/features/calls/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCallButton({
  callId,
  productionId,
}: {
  callId: string;
  productionId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    setConfirming(false);
    const formData = new FormData();
    formData.set("call_id", callId);
    formData.set("production_id", productionId);

    startTransition(async () => {
      await deleteCall(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="text-sm text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete call"}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete call?"
        message="This call and its confirmations will be deleted for everyone."
        confirmLabel="Delete call"
        danger
        busy={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
