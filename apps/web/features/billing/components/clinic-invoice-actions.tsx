"use client";

import { PaymentStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";

import { markClinicInvoiceOverdueAction } from "../actions/mark-clinic-invoice-overdue";
import { markClinicInvoicePaidAction } from "../actions/mark-clinic-invoice-paid";

type Props = {
  invoiceId: string;
  status: PaymentStatus;
};

export function ClinicInvoiceActions({
  invoiceId,
  status,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] =
    useTransition();

  function buildFormData() {
    const formData =
      new FormData();
    formData.set("invoiceId", invoiceId);
    return formData;
  }

  function runAction(
    callback: () => Promise<void>,
    successMessage: string,
    errorMessage: string
  ) {
    startTransition(async () => {
      try {
        await callback();
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : errorMessage
        );
      }
    });
  }

  return (
    <div className="flex justify-end gap-2">
      {status === PaymentStatus.PENDING ||
      status ===
        PaymentStatus.OVERDUE ? (
        <ConfirmDialog
          title="Mark clinic invoice as paid?"
          description="This confirms manual payment for the clinic SaaS invoice."
          actionLabel="Mark paid"
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Mark paid
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                markClinicInvoicePaidAction(
                  buildFormData()
                ),
              "Clinic invoice marked as paid.",
              "Failed to mark clinic invoice as paid."
            )
          }
        />
      ) : null}

      {status ===
      PaymentStatus.PENDING ? (
        <ConfirmDialog
          title="Mark clinic invoice as overdue?"
          description="This moves the clinic SaaS invoice to overdue status."
          actionLabel="Mark overdue"
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Mark overdue
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                markClinicInvoiceOverdueAction(
                  buildFormData()
                ),
              "Clinic invoice marked as overdue.",
              "Failed to mark clinic invoice as overdue."
            )
          }
        />
      ) : null}

      {status !== PaymentStatus.PENDING &&
      status !==
        PaymentStatus.OVERDUE ? (
        <span className="text-xs text-muted-foreground">
          Locked status
        </span>
      ) : null}
    </div>
  );
}
