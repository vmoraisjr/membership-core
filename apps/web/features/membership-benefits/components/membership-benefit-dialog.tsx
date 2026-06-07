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
} from "@prisma/client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

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

type MembershipBenefitDialogInitialData = {
  id: string;
  membershipPlanId: string;
  type: BenefitType;
  title: string;
  description?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  usageLimit?: number | null;
  resetPeriod?: ResetPeriod | null;
};

type Props = {
  mode?: "create" | "edit";

  plans: Array<{
    id: string;
    name: string;
  }>;

  initialData?: MembershipBenefitDialogInitialData;

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

        usageLimit: undefined,

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
          undefined,

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
      usageLimit: undefined,
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
  const usageLimit = useWatch({
    control: form.control,
    name: "usageLimit",
  });
  const hasMonthlyUsageLimit =
    usageLimit != null;
  const monthlyUsageMode =
    type === BenefitType.LIMITED
      ? hasMonthlyUsageLimit
        ? "limited"
        : "unlimited"
      : "not-applicable";

  async function saveBenefit(
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

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Monthly usage mode
            </label>
            <select
              value={monthlyUsageMode}
              onChange={(event) => {
                if (
                  type !==
                  BenefitType.LIMITED
                ) {
                  return;
                }

                if (
                  event.target.value ===
                  "limited"
                ) {
                  form.setValue(
                    "usageLimit",
                    1
                  );
                  return;
                }

                form.setValue(
                  "usageLimit",
                  undefined
                );
              }}
              className="h-10 rounded-md border px-3"
              disabled={
                type !== BenefitType.LIMITED
              }
            >
              {type === BenefitType.LIMITED ? (
                <>
                  <option value="unlimited">
                    Unlimited monthly usage
                  </option>
                  <option value="limited">
                    Limited monthly usage
                  </option>
                </>
              ) : (
                <option value="not-applicable">
                  Not usage-based for this benefit type
                </option>
              )}
            </select>
          </div>

          {type === BenefitType.LIMITED &&
          hasMonthlyUsageLimit ? (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Monthly usage limit
              </label>
              <Input
                type="number"
                placeholder="Monthly usage limit"
                {...form.register(
                  "usageLimit",
                  {
                    valueAsNumber: true,
                  }
                )}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Reset period
            </label>
            <Input
              value={
                type === BenefitType.LIMITED
                  ? "MONTHLY"
                  : "Not applicable"
              }
              readOnly
            />
          </div>

          <ConfirmDialog
            title={
              mode === "edit"
                ? "Save benefit changes?"
                : "Create benefit?"
            }
            description={
              mode === "edit"
                ? "This will update the benefit configuration for the selected plan."
                : "This will create a new benefit for the selected plan."
            }
            actionLabel={
              mode === "edit"
                ? "Save changes"
                : "Create benefit"
            }
            trigger={
              <Button type="button">
                {mode === "edit"
                  ? "Save Changes"
                  : "Create Benefit"}
              </Button>
            }
            onConfirm={() =>
              void form.handleSubmit(
                saveBenefit
              )()
            }
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
