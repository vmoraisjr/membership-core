"use client";

import { useState } from "react";

<<<<<<< HEAD
import {
  SubscriptionStatus,
} from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
=======
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  subscriptionSchema,
  type SubscriptionSchema,
} from "../schemas/subscription.schema";

import { createSubscription } from "../actions/create-subscription";

import { Button } from "@/components/ui/button";

>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
<<<<<<< HEAD
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
=======

import { Input } from "@/components/ui/input";

type Props = {
  patients: any[];

  plans: any[];
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
};

export function CreateSubscriptionDialog({
  patients,
<<<<<<< HEAD
  membershipPlans,
}: CreateSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
=======
  plans,
}: Props) {
  const [open, setOpen] =
    useState(false);
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)

  const form =
    useForm<SubscriptionSchema>({
      resolver: zodResolver(
        subscriptionSchema
      ),
<<<<<<< HEAD
      defaultValues: {
        patientId: "",
        membershipPlanId: "",
        status:
          SubscriptionStatus.PENDING,
        startedAt: "",
=======

      defaultValues: {
        patientId: "",

        membershipPlanId: "",

        startedAt: "",

>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
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
<<<<<<< HEAD
=======

>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
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

<<<<<<< HEAD
      <DialogContent className="max-w-xl">
=======
      <DialogContent>
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
        <DialogHeader>
          <DialogTitle>
            Create Subscription
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
<<<<<<< HEAD
          className="grid gap-4 md:grid-cols-2"
        >
          <Select
            {...form.register("patientId")}
=======
          className="flex flex-col gap-4"
        >
          <select
            {...form.register(
              "patientId"
            )}
            className="border rounded-md h-10 px-3"
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
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
<<<<<<< HEAD
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
=======
          </select>

          <select
            {...form.register(
              "membershipPlanId"
            )}
            className="border rounded-md h-10 px-3"
          >
            <option value="">
              Select plan
            </option>

            {plans.map((plan) => (
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
              <option
                key={plan.id}
                value={plan.id}
              >
<<<<<<< HEAD
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
=======
                {plan.name}
              </option>
            ))}
          </select>
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)

          <Input
            type="date"
            {...form.register(
              "startedAt"
            )}
          />

<<<<<<< HEAD
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
=======
          <Input
            type="date"
            {...form.register(
              "expiresAt"
            )}
          />

          <Button type="submit">
            Create Subscription
          </Button>
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
        </form>
      </DialogContent>
    </Dialog>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
