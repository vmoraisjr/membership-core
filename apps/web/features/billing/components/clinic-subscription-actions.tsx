"use client";

import { ClinicSubscriptionStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";

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
          title="Mark platform subscription as active?"
          description="This reactivates the clinic's manual SaaS subscription state."
          actionLabel="Mark active"
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Mark active
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                activateClinicSubscriptionAction(
                  buildFormData()
                ),
              "Platform subscription marked as active.",
              "Failed to activate platform subscription."
            )
          }
        />
      ) : null}

      {status !==
        ClinicSubscriptionStatus.SUSPENDED &&
      status !==
        ClinicSubscriptionStatus.CANCELED ? (
        <ConfirmDialog
          title="Suspend platform subscription?"
          description="This suspends the clinic's manual SaaS subscription state."
          actionLabel="Suspend"
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Suspend
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                suspendClinicSubscriptionAction(
                  buildFormData()
                ),
              "Platform subscription suspended.",
              "Failed to suspend platform subscription."
            )
          }
        />
      ) : null}

      {status !==
      ClinicSubscriptionStatus.CANCELED ? (
        <ConfirmDialog
          title="Cancel platform subscription?"
          description="This cancels the clinic's manual SaaS subscription state."
          actionLabel="Cancel"
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
            >
              Cancel
            </Button>
          }
          onConfirm={() =>
            runAction(
              () =>
                cancelClinicSubscriptionAction(
                  buildFormData()
                ),
              "Platform subscription canceled.",
              "Failed to cancel platform subscription."
            )
          }
        />
      ) : (
        <span className="text-xs text-muted-foreground">
          Canceled subscriptions stay visible for history and are not auto-recreated.
        </span>
      )}
    </div>
  );
}
