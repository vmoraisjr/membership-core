"use client";

import { useEffect, useState } from "react";

import {
  useForm,
  useWatch,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  BenefitType,
  ResetPeriod,
  type MembershipBenefit,
} from "@prisma/client";

import { toast } from "sonner";

import { createMembershipBenefit } from "../actions/create-membership-benefit";

import { updateMembershipBenefit } from "../actions/update-membership-benefit";

import {
  membershipBenefitSchema,
  type MembershipBenefitSchema,
} from "../schemas/membership-benefit.schema";

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

  plans: Array<{
    id: string;
    name: string;
  }>;

  initialData?: MembershipBenefit;

  defaultMembershipPlanId?: string;

  trigger?: React.ReactNode;
};

export function MembershipBenefitDialog({
  mode = "create",
  plans,
  initialData,
  defaultMembershipPlanId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const form =
    useForm<MembershipBenefitSchema>({
      resolver: zodResolver(
        membershipBenefitSchema
      ),

      defaultValues: {
        membershipPlanId: "",

        type:
          BenefitType.PERCENTAGE_DISCOUNT,

        title: "",

        description: "",

        discountPercentage: 0,

        discountAmount: 0,

        usageLimit: 1,

        resetPeriod: "",
      },
    });

  useEffect(() => {
    if (
      mode === "edit" &&
      initialData
    ) {
      form.reset({
        membershipPlanId:
          initialData.membershipPlanId,

        type: initialData.type,

        title: initialData.title,

        description:
          initialData.description ??
          "",

        discountPercentage:
          initialData.discountPercentage ??
          0,

        discountAmount:
          initialData.discountAmount ??
          0,

        usageLimit:
          initialData.usageLimit ??
          1,

        resetPeriod:
          initialData.resetPeriod ??
          "",
      });

      return;
    }

    form.reset({
      membershipPlanId:
        defaultMembershipPlanId ?? "",
      type:
        BenefitType.PERCENTAGE_DISCOUNT,
      title: "",
      description: "",
      discountPercentage: 0,
      discountAmount: 0,
      usageLimit: 1,
      resetPeriod: "",
    });
  }, [
    defaultMembershipPlanId,
    form,
    initialData,
    mode,
  ]);

  const type = useWatch({
    control: form.control,
    name: "type",
  });

  async function onSubmit(
    values: MembershipBenefitSchema
  ) {
    try {
      if (
        mode === "edit" &&
        initialData
      ) {
        await updateMembershipBenefit(
          initialData.id,
          values
        );

        toast.success(
          "Benefit updated."
        );
      } else {
        await createMembershipBenefit(
          values
        );

        toast.success(
          "Benefit created."
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        "Failed to save benefit."
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
            New Benefit
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Benefit"
              : "Create Benefit"}
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
              Benefit type
            </label>
            <select
              {...form.register("type")}
              className="h-10 rounded-md border px-3"
            >
              {Object.values(
                BenefitType
              ).map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Benefit title
            </label>
            <Input
              placeholder="Benefit title"
              {...form.register("title")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Description
            </label>
            <Input
              placeholder="Description"
              {...form.register(
                "description"
              )}
            />
          </div>

          {type ===
            BenefitType.PERCENTAGE_DISCOUNT && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Discount percentage
              </label>
              <Input
                type="number"
                placeholder="Discount percentage"
                {...form.register(
                  "discountPercentage",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>
          )}

          {type ===
            BenefitType.FIXED_DISCOUNT && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Discount amount
              </label>
              <Input
                type="number"
                placeholder="Discount amount"
                {...form.register(
                  "discountAmount",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>
          )}

          {type ===
            BenefitType.LIMITED && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Usage limit
                </label>
                <Input
                  type="number"
                  placeholder="Usage limit"
                  {...form.register(
                    "usageLimit",
                    {
                      valueAsNumber: true,
                    }
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Reset period
                </label>
                <select
                  {...form.register(
                    "resetPeriod"
                  )}
                  className="h-10 rounded-md border px-3"
                >
                  <option value="">
                    Select reset period
                  </option>

                  {Object.values(
                    ResetPeriod
                  ).map((period) => (
                    <option
                      key={period}
                      value={period}
                    >
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Button type="submit">
            {mode === "edit"
              ? "Save Changes"
              : "Create Benefit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
