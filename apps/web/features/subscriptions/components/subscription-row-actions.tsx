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
  if (!canManageSubscriptions) {
    return (
      <span className="text-xs text-muted-foreground">
        Read only
      </span>
    );
  }

  async function handleCancel() {
    try {
      await cancelSubscription(
        subscription.id
      );

      toast.success(
        "Subscription canceled."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription."
      );
    }
  }

  async function handlePause() {
    try {
      await pauseSubscription(
        subscription.id
      );

      toast.success(
        "Subscription paused."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to pause subscription."
      );
    }
  }

  async function handleResume() {
    try {
      await resumeSubscription(
        subscription.id
      );

      toast.success(
        "Subscription resumed."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to resume subscription."
      );
    }
  }

  async function handleExpire() {
    try {
      await expireSubscription(
        subscription.id
      );

      toast.success(
        "Subscription expired."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to expire subscription."
      );
    }
  }

  async function handleRenew() {
    try {
      await renewSubscription(
        subscription.id
      );

      toast.success(
        "Subscription renewed for 30 days."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to renew subscription."
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
            title="Pause subscription?"
            description="Benefits stay linked to the subscription, but they become unavailable until the subscription is resumed."
            onConfirm={() =>
              handlePause()
            }
            actionLabel="Pause subscription"
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
            title="Expire subscription?"
            description="This immediately marks the subscription as expired and keeps its history intact."
            onConfirm={() =>
              handleExpire()
            }
            actionLabel="Expire subscription"
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
          title="Resume subscription?"
          description="This restores the subscription to its evaluated active lifecycle state."
          onConfirm={() =>
            handleResume()
          }
          actionLabel="Resume subscription"
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
          title="Renew subscription?"
          description="This extends the expiration date by 30 days and restores the subscription to active."
          onConfirm={() =>
            handleRenew()
          }
          actionLabel="Renew subscription"
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
          title="Cancel subscription?"
          description="The subscription record is kept for history and will become inactive."
          onConfirm={() =>
            handleCancel()
          }
          actionLabel="Cancel subscription"
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
