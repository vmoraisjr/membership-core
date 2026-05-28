"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

import { createMembershipPlan } from "../actions/create-membership-plan";

import { updateMembershipPlan } from "../actions/update-membership-plan";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import type {
  Prisma,
} from "@prisma/client";


type Props = {
  mode?: "create" | "edit";

  initialData?: {
    id: string;

    name: string;

    description: string | null;

    monthlyPrice: Prisma.Decimal | number;
  };

  trigger?: React.ReactNode;
};

export function MembershipPlanDialog({
  mode = "create",

  initialData,

  trigger,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const form =
    useForm<MembershipPlanSchema>({
      resolver: zodResolver(
        membershipPlanSchema
      ),

      defaultValues: {
        name: "",

        description: "",

        monthlyPrice: 0,
      },
    });

  useEffect(() => {
    if (
      mode === "edit" &&
      initialData
    ) {
      form.reset({
        name: initialData.name,

        description:
          initialData.description ??
          "",

        monthlyPrice: Number(
  initialData.monthlyPrice),
      });
    }
  }, [
    form,
    initialData,
    mode,
  ]);

  async function onSubmit(
    values: MembershipPlanSchema
  ) {
    try {
      if (
        mode === "edit" &&
        initialData
      ) {
        await updateMembershipPlan(
          initialData.id,
          values
        );

        toast.success(
          "Membership plan updated."
        );
      } else {
        await createMembershipPlan(
          values
        );

        toast.success(
          "Membership plan created."
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to save membership plan."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            New Plan
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Membership Plan"
              : "Create Membership Plan"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="flex flex-col gap-4"
        >
          <Input
            placeholder="Plan name"
            {...form.register("name")}
          />

          <Textarea
            placeholder="Description"
            {...form.register(
              "description"
            )}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Monthly price"
            {...form.register(
              "monthlyPrice",
              {
                valueAsNumber: true,
              }
            )}
          />

          <Button type="submit">
            {mode === "edit"
              ? "Save Changes"
              : "Create Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}