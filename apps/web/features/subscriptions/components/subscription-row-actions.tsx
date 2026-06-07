"use client";

import {
  Pencil,
  Pause,
  Play,
  RefreshCw,
  XCircle,
  Clock3,
} from "lucide-react";

import { SubscriptionStatus } from "@prisma/client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { cancelSubscription } from "../actions/cancel-subscription";
import { expireSubscription } from "../actions/expire-subscription";
import { pauseSubscription } from "../actions/pause-subscription";
import { renewSubscription } from "../actions/renew-subscription";
import { resumeSubscription } from "../actions/resume-subscription";
import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "../constants/manageable-subscription-statuses";
import { useTranslations } from "@/i18n/provider";

import { SubscriptionDialog } from "./subscription-dialog";

type Props = {
  subscription: {
    id: string;

    patientId: string;

    membershipPlanId: string;

    startedAt: Date;

    expiresAt: Date;

    status: SubscriptionStatus;
  };

  patients: Array<{
    id: string;
    fullName: string;
  }>;

  plans: Array<{
    id: string;
    name: string;
  }>;
  canManageSubscriptions?: boolean;
};

export function SubscriptionRowActions({
  subscription,
  patients,
  plans,
  canManageSubscriptions = true,
}: Props) {
  const t = useTranslations();
  if (!canManageSubscriptions) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("shared.states.readOnly")}
      </span>
    );
  }

  async function handleCancel() {
    try {
      await cancelSubscription(
        subscription.id
      );

      toast.success(
        t("subscriptions.rowActions.cancelSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "subscriptions.rowActions.cancelError"
            )
      );
    }
  }

  async function handlePause() {
    try {
      await pauseSubscription(
        subscription.id
      );

      toast.success(
        t("subscriptions.rowActions.pauseSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "subscriptions.rowActions.pauseError"
            )
      );
    }
  }

  async function handleResume() {
    try {
      await resumeSubscription(
        subscription.id
      );

      toast.success(
        t("subscriptions.rowActions.resumeSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "subscriptions.rowActions.resumeError"
            )
      );
    }
  }

  async function handleExpire() {
    try {
      await expireSubscription(
        subscription.id
      );

      toast.success(
        t("subscriptions.rowActions.expireSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "subscriptions.rowActions.expireError"
            )
      );
    }
  }

  async function handleRenew() {
    try {
      await renewSubscription(
        subscription.id
      );

      toast.success(
        t("subscriptions.rowActions.renewSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "subscriptions.rowActions.renewError"
            )
      );
    }
  }

  const canEdit =
    MANAGEABLE_SUBSCRIPTION_STATUSES.includes(
      subscription.status
    );

  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <SubscriptionDialog
          mode="edit"
          initialData={{
            id: subscription.id,
            patientId: subscription.patientId,
            membershipPlanId:
              subscription.membershipPlanId,
            startedAt: subscription.startedAt,
            expiresAt: subscription.expiresAt,
          }}
          patients={patients}
          plans={plans}
          trigger={
            <Button
              size="icon"
              variant="outline"
            >
              <Pencil className="size-4" />
            </Button>
          }
        />
      ) : null}

      {subscription.status ===
      SubscriptionStatus.ACTIVE ? (
        <>
          <ConfirmDialog
            title={t(
              "subscriptions.rowActions.pauseTitle"
            )}
            description={t(
              "subscriptions.rowActions.pauseDescription"
            )}
            onConfirm={() =>
              handlePause()
            }
            actionLabel={t(
              "subscriptions.rowActions.pauseAction"
            )}
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <Pause className="size-4" />
              </Button>
            }
          />
          <ConfirmDialog
            title={t(
              "subscriptions.rowActions.expireTitle"
            )}
            description={t(
              "subscriptions.rowActions.expireDescription"
            )}
            onConfirm={() =>
              handleExpire()
            }
            actionLabel={t(
              "subscriptions.rowActions.expireAction"
            )}
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <Clock3 className="size-4" />
              </Button>
            }
          />
        </>
      ) : null}

      {subscription.status ===
      SubscriptionStatus.PAUSED ? (
        <ConfirmDialog
          title={t(
            "subscriptions.rowActions.resumeTitle"
          )}
          description={t(
            "subscriptions.rowActions.resumeDescription"
          )}
          onConfirm={() =>
            handleResume()
          }
          actionLabel={t(
            "subscriptions.rowActions.resumeAction"
          )}
          trigger={
            <Button
              size="icon"
              variant="outline"
            >
              <Play className="size-4" />
            </Button>
          }
        />
      ) : null}

      {(subscription.status ===
        SubscriptionStatus.OVERDUE ||
        subscription.status ===
          SubscriptionStatus.EXPIRED) && (
        <ConfirmDialog
          title={t(
            "subscriptions.rowActions.renewTitle"
          )}
          description={t(
            "subscriptions.rowActions.renewDescription"
          )}
          onConfirm={() =>
            handleRenew()
          }
          actionLabel={t(
            "subscriptions.rowActions.renewAction"
          )}
          trigger={
            <Button
              size="icon"
              variant="outline"
            >
              <RefreshCw className="size-4" />
            </Button>
          }
        />
      )}

      {subscription.status !==
      SubscriptionStatus.CANCELED ? (
        <ConfirmDialog
          title={t(
            "subscriptions.rowActions.cancelTitle"
          )}
          description={t(
            "subscriptions.rowActions.cancelDescription"
          )}
          onConfirm={() =>
            handleCancel()
          }
          actionLabel={t(
            "subscriptions.rowActions.cancelAction"
          )}
          trigger={
            <Button
              size="icon"
              variant="destructive"
            >
              <XCircle className="size-4" />
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
