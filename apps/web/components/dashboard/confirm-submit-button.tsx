"use client";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "./confirm-dialog";

type Props = {
  formId: string;
  title: string;
  description: string;
  actionLabel: string;
  label: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
};

export function ConfirmSubmitButton({
  formId,
  title,
  description,
  actionLabel,
  label,
  variant = "outline",
}: Props) {
  return (
    <ConfirmDialog
      title={title}
      description={description}
      actionLabel={actionLabel}
      trigger={
        <Button
          type="button"
          variant={variant}
        >
          {label}
        </Button>
      }
      onConfirm={() => {
        const form =
          document.getElementById(
            formId
          ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    />
  );
}
