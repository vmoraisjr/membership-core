"use client";

import {
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { cancelSubscription } from "../actions/cancel-subscription";
import { deleteSubscriptionPermanently } from "../actions/delete-subscription-permanently";
import { reactivateSubscription } from "../actions/reactivate-subscription";

import { SubscriptionDialog } from "./subscription-dialog";

type Props = {
  subscription: {
    id: string;

    patientId: string;

    membershipPlanId: string;

    startedAt: Date;

    expiresAt: Date;

    status: string;
  };

  patients: Array<{
    id: string;
    fullName: string;
  }>;

  plans: Array<{
    id: string;
    name: string;
  }>;
};

export function SubscriptionRowActions({
  subscription,
  patients,
  plans,
}: Props) {
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

  async function handleReactivate() {
    try {
      await reactivateSubscription(
        subscription.id
      );

      toast.success(
        "Subscription reactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate subscription."
      );
    }
  }

  async function handleDeletePermanently() {
    try {
      await deleteSubscriptionPermanently(
        subscription.id
      );

      toast.success(
        "Subscription permanently deleted."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to permanently delete subscription."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
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

      {subscription.status === "ACTIVE" ? (
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
      ) : subscription.status === "CANCELED" ? (
        <ConfirmDialog
          title="Delete subscription permanently?"
          description="This permanently removes the canceled subscription record. This action cannot be undone."
          onConfirm={() =>
            handleDeletePermanently()
          }
          actionLabel="Delete permanently"
          trigger={
            <Button
              size="icon"
              variant="destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          }
        />
      ) : (
        <ConfirmDialog
          title="Reactivate subscription?"
          description="This will restore the subscription and set it as active."
          onConfirm={() =>
            handleReactivate()
          }
          actionLabel="Reactivate subscription"
          trigger={
            <Button
              size="icon"
              variant="outline"
            >
              <RotateCcw className="size-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}
