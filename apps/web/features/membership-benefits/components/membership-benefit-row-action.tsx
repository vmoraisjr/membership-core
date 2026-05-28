"use client";

import {
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  MembershipBenefit,
  MembershipPlan,
} from "@prisma/client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deleteMembershipBenefit } from "../actions/delete-membership-benefit";

import { MembershipBenefitDialog } from "./membership-benefit-dialog";

type Props = {
  benefit: MembershipBenefit;

  plans: MembershipPlan[];
};

export function MembershipBenefitRowActions({
  benefit,
  plans,
}: Props) {
  async function handleDelete() {
    try {
      await deleteMembershipBenefit(
        benefit.id
      );

      toast.success(
        "Benefit deleted."
      );
    } catch {
      toast.error(
        "Failed to delete benefit."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
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
        title="Delete benefit?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        trigger={
          <Button
            size="icon"
            variant="destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
    </div>
  );
}