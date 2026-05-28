"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";

import { createSubscription } from "../actions/create-subscription";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

type Props = {
  patients: any[];

  plans: any[];
};

export function CreateSubscriptionDialog({
  patients,
  plans,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const form =
    useForm<SubscriptionSchema>({
      resolver: zodResolver(
        subscriptionSchema
      ),

      defaultValues: {
        patientId: "",

        membershipPlanId: "",

        startedAt: "",

        expiresAt: "",
      },
    });

  async function onSubmit(
    values: SubscriptionSchema
  ) {
    try {
      await createSubscription(values);

      toast.success(
        "Subscription created."
      );

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to create subscription."
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
          New Subscription
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create Subscription
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="flex flex-col gap-4"
        >
          <select
            {...form.register(
              "patientId"
            )}
            className="h-10 rounded-md border px-3"
          >
            <option value="">
              Select patient
            </option>

            {patients.map((patient) => (
              <option
                key={patient.id}
                value={patient.id}
              >
                {patient.fullName}
              </option>
            ))}
          </select>

          <select
            {...form.register(
              "membershipPlanId"
            )}
            className="h-10 rounded-md border px-3"
          >
            <option value="">
              Select plan
            </option>

            {plans.map((plan) => (
              <option
                key={plan.id}
                value={plan.id}
              >
                {plan.name}
              </option>
            ))}
          </select>

          <Input
            type="date"
            {...form.register(
              "startedAt"
            )}
          />

          <Input
            type="date"
            {...form.register(
              "expiresAt"
            )}
          />

          <Button type="submit">
            Create Subscription
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}