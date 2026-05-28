"use client";



import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deleteMembershipPlan } from "../actions/delete-membership-plan";

import { MembershipPlanDialog } from "./membership-plan-dialog";


import type {
  MembershipPlan,
} from "@prisma/client";

import {
  Pencil,
  Trash2,
} from "lucide-react";

type Props = {
  plan: {
    id: string;

    name: string;

    description: string | null;

    monthlyPrice: number;
  };
};
export function MembershipPlanRowActions({
  plan,
}: Props) {
  async function handleDelete() {
    try {
      await deleteMembershipPlan(
        plan.id
      );

      toast.success(
        "Plan deleted."
      );
    } catch {
      toast.error(
        "Failed to delete."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
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

  <ConfirmDialog
    title="Delete membership plan?"
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