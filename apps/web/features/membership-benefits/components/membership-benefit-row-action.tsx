"use client";

import {
  Pencil,
  XCircle,
} from "lucide-react";

import type {
  MembershipBenefit,
} from "@prisma/client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deactivateMembershipBenefit } from "../actions/deactivate-membership-benefit";

import { MembershipBenefitDialog } from "./membership-benefit-dialog";

type Props = {
  benefit: MembershipBenefit & {
    membershipPlanId: string;
  };

  plans: Array<{
    id: string;
    name: string;
  }>;

  planIsActive?: boolean;
};

export function MembershipBenefitRowActions({
  benefit,
  plans,
  planIsActive = true,
}: Props) {
  async function handleDeactivate() {
    try {
      await deactivateMembershipBenefit(
        benefit.id
      );

      toast.success(
        "Benefit canceled."
      );
    } catch {
      toast.error(
        "Failed to cancel benefit."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {benefit.active && planIsActive && (
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
            title="Cancel benefit?"
            description="The benefit will be removed from active flows and remain only for history."
            onConfirm={handleDeactivate}
            actionLabel="Cancel benefit"
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
      )}
    </div>
  );
}
