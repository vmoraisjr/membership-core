"use client";

import { PencilLine } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/i18n/provider";

const BENEFIT_TYPE_KEYS = Object.values(
  BenefitType
);

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
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [editingEnabled, setEditingEnabled] =
    useState(mode === "create");

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

        usagePolicy: "UNLIMITED",

        usageLimit: undefined,

        resetPeriod: "",
      },
    });

  const getDefaultValues =
    useCallback(
      (): MembershipBenefitSchema => ({
        membershipPlanId:
          defaultMembershipPlanId ?? "",
        type:
          BenefitType.PERCENTAGE_DISCOUNT,
        title: "",
        description: "",
        discountPercentage: 0,
        discountAmount: 0,
        usagePolicy: "UNLIMITED",
        usageLimit: undefined,
        resetPeriod: "",
      }),
      [defaultMembershipPlanId]
    );

  const getInitialFormValues =
    useCallback(
      (): MembershipBenefitSchema => {
        if (
          mode === "edit" &&
          initialData
        ) {
          return {
            membershipPlanId:
              initialData.membershipPlanId,
            type: initialData.type,
            title: initialData.title,
            description:
              initialData.description ?? "",
            discountPercentage:
              initialData.discountPercentage ??
              0,
            discountAmount:
              initialData.discountAmount ??
              0,
            usagePolicy:
              initialData.resetPeriod ===
              ResetPeriod.MONTHLY
                ? "MONTHLY"
                : initialData.usageLimit != null
                  ? "TOTAL"
                  : "UNLIMITED",
            usageLimit:
              initialData.usageLimit ??
              undefined,
            resetPeriod:
              initialData.resetPeriod ?? "",
          };
        }

        return getDefaultValues();
      },
      [
        getDefaultValues,
        initialData,
        mode,
      ]
    );

  useEffect(() => {
    form.reset(getInitialFormValues());
  }, [
    defaultMembershipPlanId,
    form,
    getInitialFormValues,
    initialData,
    mode,
  ]);

  const type = useWatch({
    control: form.control,
    name: "type",
  });
  const usagePolicy = useWatch({
    control: form.control,
    name: "usagePolicy",
  });
  const title = useWatch({
    control: form.control,
    name: "title",
  });
  const membershipPlanId = useWatch({
    control: form.control,
    name: "membershipPlanId",
  });

  const selectedPlanName =
    plans.find(
      (plan) =>
        plan.id === membershipPlanId
    )?.name ?? "—";

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
          t("benefits.dialog.saveSuccess")
        );
      } else {
        await createMembershipBenefit(
          values
        );

        toast.success(
          t(
            "benefits.dialog.createSuccess"
          )
        );
      }

      form.reset();

      setOpen(false);
    } catch {
      toast.error(
        t("benefits.dialog.saveError")
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setEditingEnabled(
            mode === "create"
          );
          form.reset(
            getInitialFormValues()
          );
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {t("benefits.new")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t(
                  "benefits.dialog.editTitle"
                )
              : t(
                  "benefits.dialog.createTitle"
                )}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
        >
          <input
            type="hidden"
            {...form.register(
              "resetPeriod"
            )}
          />

          <FormSection
            title="Identificação"
            description="Plano, tipo e nome do benefício."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t(
                    "benefits.dialog.membershipPlan"
                  )}
                </label>
                <Select
                  disabled={!editingEnabled}
                  {...form.register(
                    "membershipPlanId"
                  )}
                >
                  <option value="">
                    {t(
                      "subscriptions.dialog.selectPlan"
                    )}
                  </option>

                  {plans.map((plan) => (
                    <option
                      key={plan.id}
                      value={plan.id}
                    >
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t(
                    "benefits.dialog.benefitType"
                  )}
                </label>
                <Select
                  disabled={!editingEnabled}
                  {...form.register(
                    "type"
                  )}
                >
                  {BENEFIT_TYPE_KEYS.map(
                    (benefitType) => (
                      <option
                        key={benefitType}
                        value={benefitType}
                      >
                        {t(
                          `benefits.dialog.types.${benefitType}`
                        )}
                      </option>
                    )
                  )}
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm text-muted-foreground">
                  {t(
                    "benefits.dialog.benefitTitle"
                  )}
                </label>
                <Input
                  placeholder={t(
                    "benefits.dialog.benefitTitle"
                  )}
                  disabled={!editingEnabled}
                  {...form.register("title")}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm text-muted-foreground">
                  {t(
                    "shared.labels.description"
                  )}
                </label>
                <Input
                  placeholder={t(
                    "shared.labels.description"
                  )}
                  disabled={!editingEnabled}
                  {...form.register(
                    "description"
                  )}
                />
              </div>
            </div>
          </FormSection>

          {type ===
            BenefitType.PERCENTAGE_DISCOUNT ||
          type ===
            BenefitType.FIXED_DISCOUNT ? (
            <FormSection
              title="Valor"
              description="Percentual ou valor fixo aplicado ao usar o benefício."
            >
              {type ===
              BenefitType.PERCENTAGE_DISCOUNT ? (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {t(
                      "benefits.dialog.discountPercentage"
                    )}
                  </label>
                  <Input
                    type="number"
                    placeholder={t(
                      "benefits.dialog.discountPercentage"
                    )}
                    disabled={
                      !editingEnabled
                    }
                    {...form.register(
                      "discountPercentage",
                      {
                        valueAsNumber: true,
                      }
                    )}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {t(
                      "benefits.dialog.discountAmount"
                    )}
                  </label>
                  <Input
                    type="number"
                    placeholder={t(
                      "benefits.dialog.discountAmount"
                    )}
                    disabled={
                      !editingEnabled
                    }
                    {...form.register(
                      "discountAmount",
                      {
                        valueAsNumber: true,
                      }
                    )}
                  />
                </div>
              )}
            </FormSection>
          ) : null}

          <FormSection
            title={t(
              "benefits.dialog.monthlyUsageMode"
            )}
            description="Defina se o benefício tem limite de uso e com que frequência ele renova."
          >
            <div className="space-y-4">
              <Select
                {...form.register(
                  "usagePolicy"
                )}
                value={usagePolicy}
                onChange={(event) => {
                  const value = event.target
                    .value as MembershipBenefitSchema["usagePolicy"];

                  form.setValue(
                    "usagePolicy",
                    value
                  );

                  if (value === "MONTHLY") {
                    form.setValue(
                      "usageLimit",
                      1
                    );
                    form.setValue(
                      "resetPeriod",
                      ResetPeriod.MONTHLY
                    );
                    return;
                  }

                  if (value === "TOTAL") {
                    form.setValue(
                      "usageLimit",
                      1
                    );
                    form.setValue(
                      "resetPeriod",
                      ""
                    );
                    return;
                  }

                  form.setValue(
                    "usageLimit",
                    undefined
                  );
                  form.setValue(
                    "resetPeriod",
                    ""
                  );
                }}
                disabled={!editingEnabled}
              >
                <option value="UNLIMITED">
                  {t(
                    "benefits.dialog.unlimitedMonthlyUsage"
                  )}
                </option>
                <option value="MONTHLY">
                  {t(
                    "benefits.dialog.limitedMonthlyUsage"
                  )}
                </option>
                <option value="TOTAL">
                  {t(
                    "benefits.table.monthlyLimit"
                  )}
                </option>
              </Select>

              {usagePolicy !==
              "UNLIMITED" ? (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {t(
                      "benefits.dialog.monthlyUsageLimit"
                    )}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    disabled={
                      !editingEnabled
                    }
                    {...form.register(
                      "usageLimit",
                      {
                        valueAsNumber: true,
                      }
                    )}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t(
                    "benefits.dialog.notUsageBased"
                  )}
                </p>
              )}
            </div>
          </FormSection>

          <FormSection
            title={t(
              "benefits.dialog.summaryTitle"
            )}
          >
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div className="detail-field">
                <p className="detail-field-label">
                  {t(
                    "shared.labels.plan"
                  )}
                </p>
                <p className="detail-field-value">
                  {selectedPlanName}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t(
                    "benefits.dialog.benefitTitle"
                  )}
                </p>
                <p className="detail-field-value">
                  {title || "—"}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t(
                    "benefits.dialog.renewalMode"
                  )}
                </p>
                <p className="detail-field-value">
                  {usagePolicy === "MONTHLY"
                    ? t(
                        "benefits.dialog.renewalMonthly"
                      )
                    : usagePolicy ===
                        "TOTAL"
                      ? t(
                          "benefits.dialog.renewalNone"
                        )
                      : t(
                          "benefits.dialog.renewalNotApplicable"
                        )}
                </p>
              </div>
            </div>
          </FormSection>

          {mode === "edit" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {!editingEnabled ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setEditingEnabled(true)
                  }
                >
                  <PencilLine className="mr-2 size-4" />
                  Habilitar edição
                </Button>
              ) : (
                <>
                  <ConfirmDialog
                    title={t(
                      "benefits.dialog.confirmEditTitle"
                    )}
                    description={t(
                      "benefits.dialog.confirmEditDescription"
                    )}
                    actionLabel={t(
                      "shared.actions.saveChanges"
                    )}
                    trigger={
                      <Button
                        type="button"
                        className="w-full"
                      >
                        {t(
                          "shared.actions.saveChanges"
                        )}
                      </Button>
                    }
                    onConfirm={() =>
                      void form.handleSubmit(
                        saveBenefit
                      )()
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingEnabled(
                        false
                      );
                      form.reset(
                        getInitialFormValues()
                      );
                    }}
                  >
                    Cancelar edição
                  </Button>
                </>
              )}
            </div>
          ) : (
            <ConfirmDialog
              title={t(
                "benefits.dialog.confirmCreateTitle"
              )}
              description={t(
                "benefits.dialog.confirmCreateDescription"
              )}
              actionLabel={t(
                "benefits.dialog.createAction"
              )}
              trigger={
                <Button type="button">
                  {t(
                    "benefits.dialog.createAction"
                  )}
                </Button>
              }
              onConfirm={() =>
                void form.handleSubmit(
                  saveBenefit
                )()
              }
            />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
