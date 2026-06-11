"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTemplate } from "@/features/call-templates/actions";

export function DeleteTemplateButton({
  templateId,
  productionId,
}: {
  templateId: string;
  productionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    const fd = new FormData();
    fd.set("template_id", templateId);
    fd.set("production_id", productionId);
    startTransition(async () => {
      await deleteTemplate(fd);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-800"
      >
        <Icon name="Trash2" width={16} height={16} className="mr-1.5" />
        Delete template
      </Button>

      <ConfirmDialog
        open={open}
        title="Delete this template?"
        message="This won't change any calls already on the calendar — it just removes the saved template."
        confirmLabel="Delete"
        danger
        busy={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
