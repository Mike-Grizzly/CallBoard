"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { CountedTextarea } from "@/components/ui/counted-textarea";
import {
  createTemplate,
  updateTemplate,
  type TemplateResult,
} from "@/features/call-templates/actions";
import type { CallTemplate } from "@/db/schema";

export function TemplateForm({
  productionId,
  slug,
  existingTemplate,
}: {
  productionId: string;
  slug: string;
  existingTemplate?: CallTemplate;
}) {
  const router = useRouter();
  const isEdit = !!existingTemplate;
  const action = isEdit ? updateTemplate : createTemplate;
  const [state, formAction, pending] = useActionState<
    TemplateResult | undefined,
    FormData
  >(action, undefined);

  useEffect(() => {
    if (!state?.success) return;
    router.push(`/productions/${slug}/calls/templates`);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="cform">
      <input type="hidden" name="production_id" value={productionId} />
      {isEdit && (
        <input type="hidden" name="template_id" value={existingTemplate.id} />
      )}

      {state?.error && (
        <div className="cform-err">
          <Icon name="AlertTriangle" width={16} height={16} />
          <span>{state.error}</span>
        </div>
      )}

      <div className="cform-card">
        <div className="cform-card-h">Template</div>
        <label className="cform-row" htmlFor="name">
          <Icon name="Tag" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">
            Name<em>*</em>
          </span>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={existingTemplate?.name ?? ""}
            placeholder="Standard weeknight"
            className="cform-control grow"
          />
        </label>

        <div className="cform-row">
          <Icon name="Clock" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Default time</span>
          <div className="cform-timepair">
            <input
              name="call_time"
              type="time"
              aria-label="Call time"
              defaultValue={existingTemplate?.callTime ?? ""}
              className="cform-control"
            />
            <Icon
              name="ChevronRight"
              className="cform-arrow"
              width={15}
              height={15}
            />
            <input
              name="end_time"
              type="time"
              aria-label="End time"
              defaultValue={existingTemplate?.endTime ?? ""}
              className="cform-control"
            />
          </div>
        </div>

        <label className="cform-row" htmlFor="location">
          <Icon name="MapPin" className="cform-ico" width={18} height={18} />
          <span className="cform-row-label">Location</span>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={150}
            defaultValue={existingTemplate?.location ?? ""}
            placeholder="Studio A"
            className="cform-control grow"
          />
        </label>
      </div>

      <div className="cform-card">
        <div className="cform-card-h">Defaults</div>
        <p className="cform-card-sub">
          Every field is optional — fill in only what stays the same each time.
          Anything left blank can be added per-call later.
        </p>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="PenLine" className="cform-ico" width={18} height={18} />
            <label htmlFor="focus">Focus</label>
          </div>
          <input
            id="focus"
            name="focus"
            type="text"
            maxLength={200}
            defaultValue={existingTemplate?.focus ?? ""}
            placeholder="Music review"
            className="cform-field"
          />
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="FileText" className="cform-ico" width={18} height={18} />
            <label htmlFor="scenes">Scenes / numbers</label>
          </div>
          <CountedTextarea
            id="scenes"
            name="scenes"
            rows={2}
            maxLength={500}
            defaultValue={existingTemplate?.scenes ?? ""}
            className="cform-field"
          />
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon name="Users" className="cform-ico" width={18} height={18} />
            <label htmlFor="cast_called">Cast called</label>
          </div>
          <input
            id="cast_called"
            name="cast_called"
            type="text"
            maxLength={300}
            defaultValue={existingTemplate?.castCalled ?? ""}
            placeholder="Full Cast"
            className="cform-field"
          />
          <p className="cform-hint">e.g. Full Cast, Principals, Full Ensemble</p>
        </div>

        <div className="cform-row col">
          <div className="cform-row-head">
            <Icon
              name="CalendarDays"
              className="cform-ico"
              width={18}
              height={18}
            />
            <label htmlFor="schedule">Schedule breakdown</label>
          </div>
          <CountedTextarea
            id="schedule"
            name="schedule"
            rows={4}
            maxLength={1500}
            defaultValue={existingTemplate?.schedule ?? ""}
            placeholder={"7:00 – 7:15  warmups\n7:15 – 9:00  work scenes"}
            className="cform-field"
          />
        </div>
      </div>

      <div className="cform-card">
        <div className="cform-card-h">Notes</div>
        <div className="cform-row col">
          <CountedTextarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={1000}
            defaultValue={existingTemplate?.notes ?? ""}
            className="cform-field"
          />
        </div>
      </div>

      <div className="cform-actions">
        <Link href={`/productions/${slug}/calls/templates`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Create template"}
        </Button>
      </div>
    </form>
  );
}
