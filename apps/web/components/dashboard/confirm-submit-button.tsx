"use client";

import type { ReactNode } from "react";

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
  size?:
    | "default"
    | "xs"
    | "sm"
    | "lg"
    | "icon"
    | "icon-xs"
    | "icon-sm"
    | "icon-lg";
  /** Icon-only trigger: pass an icon and omit `label` text. */
  icon?: ReactNode;
  /** Hover tooltip for the trigger button, useful when `icon` is used without visible text. */
  tooltip?: string;
};

export function ConfirmSubmitButton({
  formId,
  title,
  description,
  actionLabel,
  label,
  variant = "outline",
  size = "default",
  icon,
  tooltip,
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
          size={size}
          title={tooltip}
          aria-label={
            tooltip ?? label
          }
        >
          {icon}
          {label ? label : null}
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
