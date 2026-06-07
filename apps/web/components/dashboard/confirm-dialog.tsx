"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n/provider";

type Props = {
  trigger: React.ReactNode;

  title: string;

  description: string;

  confirmValue?: string;

  confirmLabel?: string;

  confirmPlaceholder?: string;

  actionLabel?: string;

  detailsLabel?: string;

  detailsPlaceholder?: string;

  detailsRequired?: boolean;

  detailsInput?: "input" | "textarea";

  onConfirm: (values: {
    typedValue: string;
    detailsValue: string;
  }) => void;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmValue,
  confirmLabel,
  confirmPlaceholder,
  actionLabel = "Continue",
  detailsLabel,
  detailsPlaceholder,
  detailsRequired = false,
  detailsInput = "input",
}: Props) {
  const t = useTranslations();
  const [open, setOpen] =
    useState(false);
  const [typedValue, setTypedValue] =
    useState("");
  const [detailsValue, setDetailsValue] =
    useState("");

  const requiresExactMatch =
    Boolean(confirmValue);
  const requiresDetails =
    detailsRequired ||
    Boolean(detailsLabel) ||
    Boolean(detailsPlaceholder);

  const canConfirm =
    (!requiresExactMatch ||
      typedValue === confirmValue) &&
    (!detailsRequired ||
      detailsValue.trim().length > 0);

  const DetailsField =
    detailsInput === "textarea"
      ? Textarea
      : Input;

  function handleOpenChange(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setTypedValue("");
      setDetailsValue("");
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>

          {requiresExactMatch && (
            <div className="mt-4 w-full space-y-2">
              <label className="block text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {confirmLabel ??
                  t(
                    "confirmDialog.typeToConfirm"
                  )}
              </label>

              <Input
                value={typedValue}
                onChange={(event) =>
                  setTypedValue(
                    event.target.value
                  )
                }
                placeholder={
                  confirmPlaceholder ??
                  confirmValue
                }
              />
            </div>
          )}

          {requiresDetails && (
            <div className="mt-4 w-full space-y-2">
              <label className="block text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {detailsLabel ??
                  t("shared.labels.details")}
              </label>

              <DetailsField
                value={detailsValue}
                onChange={(event) =>
                  setDetailsValue(
                    event.target.value
                  )
                }
                placeholder={
                  detailsPlaceholder
                }
              />
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("shared.actions.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={() =>
              onConfirm({
                typedValue,
                detailsValue,
              })
            }
            disabled={!canConfirm}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
