"use client";

import { useState } from "react";

import {
  SubscriptionStatus,
} from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  formatCurrency,
  formatEnumLabel,
} from "@/lib/formatters";

import { createSubscription } from "../actions/create-subscription";
import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";

type PatientOption = {
  id: string;
  fullName: string;
};

type MembershipPlanOption = {
  id: string;
  name: string;
  monthlyPrice: number | null;
};

type CreateSubscriptionDialogProps = {
  patients: PatientOption[];
  membershipPlans: MembershipPlanOption[];
};

export function CreateSubscriptionDialog({
  patients,
  membershipPlans,
}: CreateSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);

  const form =
    useForm<SubscriptionSchema>({
      resolver: zodResolver(
        subscriptionSchema
      ),
      defaultValues: {
        patientId: "",
        membershipPlanId: "",
        status:
          SubscriptionStatus.PENDING,
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

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Create Subscription
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="grid gap-4 md:grid-cols-2"
        >
          <Select
            {...form.register("patientId")}
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
          </Select>

          <Select
            {...form.register(
              "membershipPlanId"
            )}
          >
            <option value="">
              Select membership plan
            </option>

            {membershipPlans.map((plan) => (
              <option
                key={plan.id}
                value={plan.id}
              >
                {plan.name} {" - "}
                {formatCurrency(
                  plan.monthlyPrice
                )}
              </option>
            ))}
          </Select>

          <Select
            {...form.register("status")}
          >
            {Object.values(
              SubscriptionStatus
            ).map((status) => (
              <option
                key={status}
                value={status}
              >
                {formatEnumLabel(status)}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            {...form.register(
              "startedAt"
            )}
          />

          <div className="md:col-span-2">
            <Input
              type="date"
              {...form.register(
                "expiresAt"
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full"
            >
              Create Subscription
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
