"use client";

import { toast } from "sonner";
import {
  Copy,
  Pencil,
  Plus,
  UserPlus,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deactivateMembershipPlan } from "../actions/deactivate-membership-plan";
import { cloneMembershipPlan } from "../actions/clone-membership-plan";
import { MembershipBenefitDialog } from "@/features/membership-benefits/components/membership-benefit-dialog";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";

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

  subscriptionPatients: Array<{
    id: string;
    fullName: string;
  }>;
};

export function MembershipPlanRowActions({
  plan,
  benefitPlans,
  subscriptionPatients,
}: Props) {
  async function handleDeactivate(
    typedValue?: string
  ) {
    try {
      await deactivateMembershipPlan(
        plan.id,
        typedValue ?? ""
      );

      toast.success(
        "Plan canceled and related records updated."
      );
    } catch {
      toast.error(
        "Failed to cancel plan."
      );
    }
  }

  async function handleClone() {
    try {
      await cloneMembershipPlan(plan.id);

      toast.success(
        "Plan cloned as a new active plan."
      );
    } catch {
      toast.error(
        "Failed to clone plan."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {plan.active && (
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

          <SubscriptionDialog
            patients={
              subscriptionPatients
            }
            plans={benefitPlans}
            defaultMembershipPlanId={
              plan.id
            }
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <UserPlus className="size-4" />
              </Button>
            }
          />
        </>
      )}

      <Button
        size="icon"
        variant="outline"
        onClick={handleClone}
      >
        <Copy className="size-4" />
      </Button>

      {plan.active && (
        <ConfirmDialog
          title="Cancel membership plan?"
          description="Canceling this plan deactivates all related benefits and cancels active subscriptions. This action cannot be undone."
          confirmValue={plan.name}
          confirmLabel="Type the plan name exactly"
          confirmPlaceholder={plan.name}
          actionLabel="Cancel plan"
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
      )}
    </div>
  );
}
