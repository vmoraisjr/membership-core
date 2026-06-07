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

import { cancelPatientInvoiceAction } from "../actions/cancel-patient-invoice";
import { markPatientInvoiceOverdueAction } from "../actions/mark-patient-invoice-overdue";
import { markPatientInvoicePaidAction } from "../actions/mark-patient-invoice-paid";
import { updatePatientInvoicePaymentMethodAction } from "../actions/update-patient-invoice-payment-method";

function getPaymentMethodLabel(
  value: PaymentMethod
) {
  switch (value) {
    case PaymentMethod.CARD:
      return "Card";
    case PaymentMethod.PIX:
      return "Pix";
    case PaymentMethod.CASH:
      return "Cash";
    case PaymentMethod.BANK_TRANSFER:
      return "Bank transfer";
    case PaymentMethod.OTHER:
      return "Other";
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
          title="Save payment method?"
          description="This updates the manual payment method for this patient invoice."
          actionLabel="Save method"
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Save method
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                updatePatientInvoicePaymentMethodAction(
                  buildFormData()
                ),
              "Payment method updated.",
              "Failed to update payment method."
            )
          }
        />

        {status === PaymentStatus.PENDING ||
        status ===
          PaymentStatus.OVERDUE ? (
          <ConfirmDialog
            title="Mark invoice as paid?"
            description="This confirms manual payment for the patient invoice."
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
                  markPatientInvoicePaidAction(
                    buildFormData()
                  ),
                "Invoice marked as paid.",
                "Failed to mark invoice as paid."
              )
            }
          />
        ) : null}

        {status ===
        PaymentStatus.PENDING ? (
          <ConfirmDialog
            title="Mark invoice as overdue?"
            description="This moves the patient invoice to overdue status."
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
                  markPatientInvoiceOverdueAction(
                    buildFormData()
                  ),
                "Invoice marked as overdue.",
                "Failed to mark invoice as overdue."
              )
            }
          />
        ) : null}

        {status === PaymentStatus.PENDING ||
        status ===
          PaymentStatus.OVERDUE ? (
          <ConfirmDialog
            title="Cancel invoice?"
            description="This cancels the patient invoice and keeps the historical record."
            actionLabel="Cancel invoice"
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                Cancel invoice
              </Button>
            }
            onConfirm={() =>
              runAction(
                () =>
                  cancelPatientInvoiceAction(
                    buildFormData()
                  ),
                "Invoice canceled.",
                "Failed to cancel invoice."
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
    </div>
  );
}
