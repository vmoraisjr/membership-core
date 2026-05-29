"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import { createSubscription } from "../actions/create-subscription";

import { updateSubscription } from "../actions/update-subscription";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";
import { formatDateForInput } from "@/features/shared/utils/format-date-for-input";

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
  mode?: "create" | "edit";

  patients: Array<{
    id: string;
    fullName: string;
  }>;

  plans: Array<{
    id: string;
    name: string;
  }>;

  initialData?: {
    id: string;

    patientId: string;

    membershipPlanId: string;

    startedAt: Date | string;

    expiresAt: Date | string;
  };

  defaultPatientId?: string;

  defaultMembershipPlanId?: string;

  trigger?: React.ReactNode;
};

export function SubscriptionDialog({
  mode = "create",
  patients,
  plans,
  initialData,
  defaultPatientId,
  defaultMembershipPlanId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const form = useForm<SubscriptionSchema>({
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

  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.reset({
        patientId: initialData.patientId,
        membershipPlanId:
          initialData.membershipPlanId,
        startedAt: formatDateForInput(
          initialData.startedAt
        ),
        expiresAt: formatDateForInput(
          initialData.expiresAt
        ),
      });

      return;
    }

    form.reset({
      patientId: defaultPatientId ?? "",
      membershipPlanId:
        defaultMembershipPlanId ?? "",
      startedAt: "",
      expiresAt: "",
    });
  }, [
    defaultMembershipPlanId,
    defaultPatientId,
    form,
    initialData,
    mode,
  ]);

  async function onSubmit(
    values: SubscriptionSchema
  ) {
    try {
      if (mode === "edit" && initialData) {
        await updateSubscription(
          initialData.id,
          values
        );

        toast.success(
          "Subscription updated."
        );
      } else {
        await createSubscription(
          values
        );

        toast.success(
          "Subscription created."
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to save subscription."
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
            New Subscription
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Subscription"
              : "Create Subscription"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="flex flex-col gap-4"
        >
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Patient
            </label>
            <select
              {...form.register(
                "patientId"
              )}
              className="h-10 rounded-md border px-3"
            >
              <option value="">
                Select patient
              </option>

              {patients.map(
                (patient) => (
                  <option
                    key={patient.id}
                    value={patient.id}
                  >
                    {patient.fullName}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Membership plan
            </label>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Start date
            </label>
            <Input
              type="date"
              {...form.register(
                "startedAt"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Expiration date
            </label>
            <Input
              type="date"
              {...form.register(
                "expiresAt"
              )}
            />
          </div>

          <Button type="submit">
            {mode === "edit"
              ? "Save Changes"
              : "Create Subscription"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
