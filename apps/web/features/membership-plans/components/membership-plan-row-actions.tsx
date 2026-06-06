"use client";

import {
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deactivateMembershipPlan } from "../actions/deactivate-membership-plan";
import { reactivateMembershipPlan } from "../actions/reactivate-membership-plan";
import { deleteMembershipPlanPermanently } from "../actions/delete-membership-plan-permanently";
import { MembershipBenefitDialog } from "@/features/membership-benefits/components/membership-benefit-dialog";

import { MembershipPlanDialog } from "./membership-plan-dialog";

type Props = {
  plan: {
    id: string;

    name: string;

    description: string | null;

    monthlyPrice: number;

    active: boolean;
  };

  benefitPlans: Array<{
    id: string;
    name: string;
  }>;
  canManagePlans?: boolean;
  canDeletePlansPermanently?: boolean;
  canManageBenefits?: boolean;
};

export function MembershipPlanRowActions({
  plan,
  benefitPlans,
  canManagePlans = true,
  canDeletePlansPermanently = true,
  canManageBenefits = true,
}: Props) {
  if (!canManagePlans) {
    return (
      <span className="text-xs text-muted-foreground">
        Read only
      </span>
    );
  }

  async function handleDeactivate({
    typedValue,
  }: {
    typedValue: string;
    detailsValue: string;
  }) {
    try {
      await deactivateMembershipPlan(
        plan.id,
        typedValue
      );

      toast.success(
        "Plan deactivated and related records updated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to deactivate plan."
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateMembershipPlan(
        plan.id
      );

      toast.success(
        "Plan reactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate plan."
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteMembershipPlanPermanently(
        plan.id
      );

      toast.success(
        "Plan permanently deleted."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to permanently delete plan."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {plan.active ? (
        <>
          <MembershipPlanDialog
            mode="edit"
            initialData={{
              id: plan.id,
              name: plan.name,
              description:
                plan.description,
              monthlyPrice: Number(
                plan.monthlyPrice
              ),
            }}
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <Pencil className="size-4" />
              </Button>
            }
          />

          {canManageBenefits ? (
            <MembershipBenefitDialog
              plans={benefitPlans}
              defaultMembershipPlanId={
                plan.id
              }
              trigger={
                <Button
                  size="icon"
                  variant="outline"
                >
                  <Plus className="size-4" />
                </Button>
              }
            />
          ) : null}

          <ConfirmDialog
            title="Deactivate membership plan?"
            description="Deactivating this plan also deactivates related benefits and cancels active subscriptions."
            confirmValue={plan.name}
            confirmLabel="Type the plan name exactly"
            confirmPlaceholder={plan.name}
            actionLabel="Deactivate plan"
            onConfirm={handleDeactivate}
            trigger={
              <Button
                size="icon"
                variant="destructive"
              >
                <XCircle className="size-4" />
              </Button>
            }
          />
        </>
      ) : (
        <>
          <ConfirmDialog
            title="Reactivate membership plan?"
            description="The plan will become available again for benefits and new subscriptions."
            onConfirm={() =>
              handleReactivate()
            }
            actionLabel="Reactivate plan"
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <RotateCcw className="size-4" />
              </Button>
            }
          />

          {canDeletePlansPermanently ? (
            <ConfirmDialog
              title="Delete plan permanently?"
              description="This permanently removes the inactive plan record. This action cannot be undone."
              onConfirm={() =>
                handleDelete()
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
          ) : null}
        </>
      )}
    </div>
  );
}
