"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  membershipPlanSchema,
  type MembershipPlanSchema,
} from "../schemas/membership-plan.schema";

import { createMembershipPlan } from "../actions/create-membership-plan";

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

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<MembershipPlanSchema>({
    resolver: zodResolver(
      membershipPlanSchema
    ),

    defaultValues: {
      name: "",
      description: "",
      monthlyPrice: 0,
    },
  });

  async function onSubmit(
    values: MembershipPlanSchema
  ) {
    try {
      await createMembershipPlan(values);

      toast.success(
        "Membership plan created."
      );

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to create membership plan."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>
          New Plan
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create Membership Plan
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
            placeholder="Monthly price"
            {...form.register(
              "monthlyPrice"
            )}
          />

          <Button type="submit">
            Create Plan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}