"use client";

import {
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deactivateMembershipBenefit } from "../actions/deactivate-membership-benefit";
import { reactivateMembershipBenefit } from "../actions/reactivate-membership-benefit";
import { deleteMembershipBenefitPermanently } from "../actions/delete-membership-benefit-permanently";

import { MembershipBenefitDialog } from "./membership-benefit-dialog";

type MembershipBenefitRowActionDTO = {
  id: string;
  membershipPlanId: string;
  active: boolean;
  type: BenefitType;
  title: string;
  description?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  usageLimit?: number | null;
  resetPeriod?: ResetPeriod | null;
  membershipPlan: {
    active: boolean;
  };
};

type Props = {
  benefit: MembershipBenefitRowActionDTO;

  plans: Array<{
    id: string;
    name: string;
  }>;

  planIsActive?: boolean;
  canManageBenefits?: boolean;
  canDeleteBenefitsPermanently?: boolean;
};

export function MembershipBenefitRowActions({
  benefit,
  plans,
  planIsActive = true,
  canManageBenefits = true,
  canDeleteBenefitsPermanently = true,
}: Props) {
  if (!canManageBenefits) {
    return (
      <span className="text-xs text-muted-foreground">
        Read only
      </span>
    );
  }

  async function handleDeactivate() {
    try {
      await deactivateMembershipBenefit(
        benefit.id
      );

      toast.success(
        "Benefit deactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to deactivate benefit."
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateMembershipBenefit(
        benefit.id
      );

      toast.success(
        "Benefit reactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate benefit."
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteMembershipBenefitPermanently(
        benefit.id
      );

      toast.success(
        "Benefit permanently deleted."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to permanently delete benefit."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {benefit.active &&
      planIsActive ? (
        <>
          <MembershipBenefitDialog
            mode="edit"
            initialData={benefit}
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
            title="Deactivate benefit?"
            description="The benefit will be removed from active flows and remain only for history."
            onConfirm={() =>
              handleDeactivate()
            }
            actionLabel="Deactivate benefit"
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
            title="Reactivate benefit?"
            description="The benefit will become active again for its plan."
            onConfirm={() =>
              handleReactivate()
            }
            actionLabel="Reactivate benefit"
            trigger={
              <Button
                size="icon"
                variant="outline"
                disabled={!planIsActive}
              >
                <RotateCcw className="size-4" />
              </Button>
            }
          />

          {canDeleteBenefitsPermanently ? (
            <ConfirmDialog
              title="Delete benefit permanently?"
              description="This permanently removes the inactive benefit record. This action cannot be undone."
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
