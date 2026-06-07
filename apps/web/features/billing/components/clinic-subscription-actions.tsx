"use client";

import { ClinicSubscriptionStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/messages";

import { activateClinicSubscriptionAction } from "../actions/activate-clinic-subscription";
import { cancelClinicSubscriptionAction } from "../actions/cancel-clinic-subscription";
import { suspendClinicSubscriptionAction } from "../actions/suspend-clinic-subscription";

type Props = {
  subscriptionId: string;
  status: ClinicSubscriptionStatus;
};

export function ClinicSubscriptionActions({
  subscriptionId,
  status,
}: Props) {
  const t = getTranslations();
  const router = useRouter();
  const [isPending, startTransition] =
    useTransition();

  function buildFormData() {
    const formData =
      new FormData();
    formData.set(
      "subscriptionId",
      subscriptionId
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
    <div className="flex flex-wrap gap-2">
      {status !==
      ClinicSubscriptionStatus.ACTIVE ? (
        <ConfirmDialog
          title={t("billing.markSubscriptionActiveTitle")}
          description={t("billing.markSubscriptionActiveDescription")}
          actionLabel={t("billing.actions.markActive")}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              {t("billing.actions.markActive")}
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                activateClinicSubscriptionAction(
                  buildFormData()
                ),
              t("billing.markSubscriptionActiveSuccess"),
              t("billing.markSubscriptionActiveError")
            )
          }
        />
      ) : null}

      {status !==
        ClinicSubscriptionStatus.SUSPENDED &&
      status !==
        ClinicSubscriptionStatus.CANCELED ? (
        <ConfirmDialog
          title={t("billing.suspendSubscriptionTitle")}
          description={t("billing.suspendSubscriptionDescription")}
          actionLabel={t("billing.actions.suspend")}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              {t("billing.actions.suspend")}
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                suspendClinicSubscriptionAction(
                  buildFormData()
                ),
              t("billing.suspendSubscriptionSuccess"),
              t("billing.suspendSubscriptionError")
            )
          }
        />
      ) : null}

      {status !==
      ClinicSubscriptionStatus.CANCELED ? (
        <ConfirmDialog
          title={t("billing.cancelSubscriptionTitle")}
          description={t("billing.cancelSubscriptionDescription")}
          actionLabel={t("billing.actions.cancelSubscription")}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              {t("billing.actions.cancelSubscription")}
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                cancelClinicSubscriptionAction(
                  buildFormData()
                ),
              t("billing.cancelSubscriptionSuccess"),
              t("billing.cancelSubscriptionError")
            )
          }
        />
      ) : (
        <span className="text-xs text-muted-foreground">
          {t("billing.canceledHistoryNote")}
        </span>
      )}
    </div>
  );
}
