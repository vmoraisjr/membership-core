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

type Props = {
  trigger: React.ReactNode;

  title: string;

  description: string;

  onConfirm: (typedValue?: string) => void;

  confirmValue?: string;

  confirmLabel?: string;

  confirmPlaceholder?: string;

  actionLabel?: string;
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
}: Props) {
  const [typedValue, setTypedValue] =
    useState("");

  const requiresExactMatch =
    Boolean(confirmValue);

  const canConfirm =
    !requiresExactMatch ||
    typedValue === confirmValue;

  return (
    <AlertDialog>
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
                  "Type to confirm"}
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
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={() =>
              onConfirm(typedValue)
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
