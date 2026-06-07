"use client";

import {
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/messages";

import { cancelPatientInvoiceAction } from "../actions/cancel-patient-invoice";
import { markPatientInvoiceOverdueAction } from "../actions/mark-patient-invoice-overdue";
import { markPatientInvoicePaidAction } from "../actions/mark-patient-invoice-paid";
import { updatePatientInvoicePaymentMethodAction } from "../actions/update-patient-invoice-payment-method";

function getPaymentMethodLabel(
  value: PaymentMethod
) {
  const t = getTranslations();
  switch (value) {
    case PaymentMethod.CARD:
      return t("billing.paymentMethod.CARD");
    case PaymentMethod.PIX:
      return t("billing.paymentMethod.PIX");
    case PaymentMethod.CASH:
      return t("billing.paymentMethod.CASH");
    case PaymentMethod.BANK_TRANSFER:
      return t("billing.paymentMethod.BANK_TRANSFER");
    case PaymentMethod.OTHER:
      return t("billing.paymentMethod.OTHER");
  }
}

type Props = {
  invoiceId: string;
  status: PaymentStatus;
  defaultPaymentMethod:
    | PaymentMethod
    | null
    | undefined;
};

export function PatientInvoiceActions({
  invoiceId,
  status,
  defaultPaymentMethod,
}: Props) {
  const t = getTranslations();
  const router = useRouter();
  const [isPending, startTransition] =
    useTransition();
  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>(
    defaultPaymentMethod ??
      PaymentMethod.PIX
  );

  function buildFormData() {
    const formData =
      new FormData();
    formData.set("invoiceId", invoiceId);
    formData.set(
      "paymentMethod",
      paymentMethod
    );
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
    <div className="grid justify-items-end gap-2">
      <select
        value={paymentMethod}
        onChange={(event) =>
          setPaymentMethod(
            event.target.value as PaymentMethod
          )
        }
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        disabled={isPending}
      >
        {Object.values(
          PaymentMethod
        ).map((currentMethod) => (
          <option
            key={currentMethod}
            value={currentMethod}
          >
            {getPaymentMethodLabel(
              currentMethod
            )}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap justify-end gap-2">
        <ConfirmDialog
          title={t("billing.saveMethodTitle")}
          description={t("billing.saveMethodDescription")}
          actionLabel={t("billing.actions.saveMethod")}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              {t("billing.actions.saveMethod")}
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                updatePatientInvoicePaymentMethodAction(
                  buildFormData()
                ),
              t("billing.saveMethodSuccess"),
              t("billing.saveMethodError")
            )
          }
        />

        {status === PaymentStatus.PENDING ||
        status ===
          PaymentStatus.OVERDUE ? (
          <ConfirmDialog
            title={t("billing.markPatientPaidTitle")}
            description={t("billing.markPatientPaidDescription")}
            actionLabel={t("billing.actions.markPaid")}
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                {t("billing.actions.markPaid")}
              </Button>
            }
            onConfirm={() =>
              runAction(
                () =>
                  markPatientInvoicePaidAction(
                    buildFormData()
                  ),
                t("billing.markPatientPaidSuccess"),
                t("billing.markPatientPaidError")
              )
            }
          />
        ) : null}

        {status ===
        PaymentStatus.PENDING ? (
          <ConfirmDialog
            title={t("billing.markPatientOverdueTitle")}
            description={t("billing.markPatientOverdueDescription")}
            actionLabel={t("billing.actions.markOverdue")}
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                {t("billing.actions.markOverdue")}
              </Button>
            }
            onConfirm={() =>
              runAction(
                () =>
                  markPatientInvoiceOverdueAction(
                    buildFormData()
                  ),
                t("billing.markPatientOverdueSuccess"),
                t("billing.markPatientOverdueError")
              )
            }
          />
        ) : null}

        {status === PaymentStatus.PENDING ||
        status ===
          PaymentStatus.OVERDUE ? (
          <ConfirmDialog
            title={t("billing.cancelInvoiceTitle")}
            description={t("billing.cancelInvoiceDescription")}
            actionLabel={t("billing.actions.cancelInvoice")}
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                {t("billing.actions.cancelInvoice")}
              </Button>
            }
            onConfirm={() =>
              runAction(
                () =>
                  cancelPatientInvoiceAction(
                    buildFormData()
                  ),
                t("billing.cancelInvoiceSuccess"),
                t("billing.cancelInvoiceError")
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
    </div>
  );
}
