"use client";

import { FlaskConical } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  formId: string;
  title: string;
  description: string;
  actionLabel: string;
  defaultTrialEndsAt: string;
};

export function ActivateTrialSubmitButton({
  formId,
  title,
  description,
  actionLabel,
  defaultTrialEndsAt,
}: Props) {
  return (
    <ConfirmDialog
      title={title}
      description={description}
      actionLabel={actionLabel}
      detailsLabel="Data de encerramento do período de testes"
      detailsInput="input"
      detailsType="date"
      detailsRequired
      detailsDefaultValue={
        defaultTrialEndsAt
      }
      trigger={
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={actionLabel}
          aria-label={actionLabel}
        >
          <FlaskConical className="size-4" />
        </Button>
      }
      onConfirm={({ detailsValue }) => {
        const form =
          document.getElementById(
            formId
          ) as HTMLFormElement | null;
        const trialEndsAtInput =
          form?.elements.namedItem(
            "trialEndsAt"
          ) as HTMLInputElement | null;

        if (trialEndsAtInput) {
          trialEndsAtInput.value =
            detailsValue;
        }

        form?.requestSubmit();
      }}
    />
  );
}
