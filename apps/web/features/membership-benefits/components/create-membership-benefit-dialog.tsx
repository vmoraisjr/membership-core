"use client";

import { useState } from "react";

import {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
} from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { formatEnumLabel } from "@/lib/formatters";

import { createMembershipBenefit } from "../actions/create-membership-benefit";
import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

type PlanOption = {
  id: string;
  name: string;
};

type CreateMembershipBenefitDialogProps = {
  membershipPlans: PlanOption[];
};

export function CreateMembershipBenefitDialog({
  membershipPlans,
}: CreateMembershipBenefitDialogProps) {
  const [open, setOpen] = useState(false);

  const form =
    useForm<MembershipBenefitSchema>({
      resolver: zodResolver(
        membershipBenefitSchema
      ),
      defaultValues: {
        membershipPlanId: "",
        type: BenefitType.FREE,
        title: "",
        description: "",
        discountPercentage:
          undefined,
        discountAmount:
          undefined,
        usageLimit: undefined,
        resetPeriod: "",
      },
    });

  const selectedType = useWatch({
    control: form.control,
    name: "type",
  });

  async function onSubmit(
    values: MembershipBenefitSchema
  ) {
    try {
      await createMembershipBenefit(
        values
      );

      toast.success(
        "Membership benefit created."
      );

      form.reset();
      setOpen(false);
    } catch {
      toast.error(
        "Failed to create membership benefit."
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
          New Benefit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Create Membership Benefit
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="grid gap-4 md:grid-cols-2"
        >
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
                {plan.name}
              </option>
            ))}
          </Select>

          <Select
            {...form.register("type")}
          >
            {Object.values(BenefitType).map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {formatEnumLabel(type)}
                </option>
              )
            )}
          </Select>

          <Input
            placeholder="Benefit title"
            {...form.register("title")}
          />

          <Input
            placeholder="Usage limit"
            type="number"
            {...form.register(
              "usageLimit"
            )}
          />

          <div className="md:col-span-2">
            <Textarea
              placeholder="Description"
              {...form.register(
                "description"
              )}
            />
          </div>

          <Input
            placeholder="Discount percentage"
            type="number"
            step="0.01"
            disabled={
              selectedType !==
              BenefitType.PERCENTAGE_DISCOUNT
            }
            {...form.register(
              "discountPercentage"
            )}
          />

          <Input
            placeholder="Discount amount"
            type="number"
            step="0.01"
            disabled={
              selectedType !==
              BenefitType.FIXED_DISCOUNT
            }
            {...form.register(
              "discountAmount"
            )}
          />

          <div className="md:col-span-2">
            <Select
              {...form.register(
                "resetPeriod"
              )}
            >
              <option value="">
                Select reset period
              </option>

              {Object.values(ResetPeriod).map(
                (period) => (
                  <option
                    key={period}
                    value={period}
                  >
                    {formatEnumLabel(
                      period
                    )}
                  </option>
                )
              )}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full"
            >
              Create Benefit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
