"use client";

import {
  Pencil,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { cancelSubscription } from "../actions/cancel-subscription";

import { SubscriptionDialog } from "./subscription-dialog";

type Props = {
  subscription: {
    id: string;

    patientId: string;

    membershipPlanId: string;

    startedAt: string | Date;

    expiresAt: string | Date;
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
    } catch {
      toast.error(
        "Failed to cancel subscription."
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

      <ConfirmDialog
        title="Cancel subscription?"
        description="The subscription record is kept for history and will become inactive."
        onConfirm={handleCancel}
        trigger={
          <Button
            size="icon"
            variant="destructive"
          >
            <XCircle className="size-4" />
          </Button>
        }
      />
    </div>
  );
}
