"use client";

import { PaymentStatus } from "@prisma/client";
import {
  AlertTriangle,
  CircleCheckBig,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/messages";

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
  const t = getTranslations();
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
          title={t("billing.markClinicPaidTitle")}
          description={t("billing.markClinicPaidDescription")}
          actionLabel={t("billing.actions.markPaid")}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={isPending}
              title={t("billing.actions.markPaid")}
              aria-label={t(
                "billing.actions.markPaid"
              )}
            >
              <CircleCheckBig className="size-4" />
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                markClinicInvoicePaidAction(
                  buildFormData()
                ),
              t("billing.markClinicPaidSuccess"),
              t("billing.markClinicPaidError")
            )
          }
        />
      ) : null}

      {status ===
      PaymentStatus.PENDING ? (
        <ConfirmDialog
          title={t("billing.markClinicOverdueTitle")}
          description={t("billing.markClinicOverdueDescription")}
          actionLabel={t("billing.actions.markOverdue")}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={isPending}
              title={t("billing.actions.markOverdue")}
              aria-label={t(
                "billing.actions.markOverdue"
              )}
            >
              <AlertTriangle className="size-4" />
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                markClinicInvoiceOverdueAction(
                  buildFormData()
                ),
              t("billing.markClinicOverdueSuccess"),
              t("billing.markClinicOverdueError")
            )
          }
        />
      ) : null}

      {status !== PaymentStatus.PENDING &&
      status !==
        PaymentStatus.OVERDUE ? (
        <span className="text-xs text-muted-foreground">
          {t("billing.lockedStatus")}
        </span>
      ) : null}
    </div>
  );
}
