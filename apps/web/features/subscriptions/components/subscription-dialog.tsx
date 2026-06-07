"use client";

import { useEffect, useMemo, useState } from "react";

import { useForm, useWatch } from "react-hook-form";

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
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/provider";

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

    startedAt: Date;

    expiresAt: Date;
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
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const defaultStartedAt = useMemo(
    () => formatDateForInput(today),
    [today]
  );
  const defaultExpiresAt = useMemo(
    () =>
      formatDateForInput(
        new Date(
          today.getTime() +
            30 * 24 * 60 * 60 * 1000
        )
      ),
    [today]
  );

  const form = useForm<SubscriptionSchema>({
    resolver: zodResolver(
      subscriptionSchema
    ),
    defaultValues: {
      patientId: defaultPatientId ?? "",
      membershipPlanId: defaultMembershipPlanId ?? "",
      startedAt: defaultStartedAt,
      expiresAt: defaultExpiresAt,
    },
  });

  const filteredPatients = patients;

  const patientId = useWatch({
    control: form.control,
    name: "patientId",
  });

  const startedAt = useWatch({
    control: form.control,
    name: "startedAt",
  });

  const selectedPatient = patients.find(
    (p) => p.id === patientId
  );

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
      startedAt: defaultStartedAt,
      expiresAt: defaultExpiresAt,
    });
  }, [
    defaultMembershipPlanId,
    defaultPatientId,
    defaultStartedAt,
    defaultExpiresAt,
    form,
    initialData,
    mode,
  ]);

  // Auto-calculate expiration date when start date changes
  useEffect(() => {
    if (startedAt) {
      const startDate = new Date(startedAt);
      const expirationDate = new Date(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      form.setValue(
        "expiresAt",
        formatDateForInput(expirationDate)
      );
    }
  }, [form, startedAt]);


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
          t("subscriptions.dialog.saveSuccess")
        );
      } else {
        await createSubscription(
          values
        );

        toast.success(
          t("subscriptions.dialog.createSuccess")
        );
      }

      form.reset({
        patientId: defaultPatientId ?? "",
        membershipPlanId:
          defaultMembershipPlanId ?? "",
        startedAt: defaultStartedAt,
        expiresAt: defaultExpiresAt,
      });

      setOpen(false);
    } catch {
      toast.error(
        t("subscriptions.dialog.saveError")
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
            {t("subscriptions.new")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("subscriptions.dialog.editTitle")
              : t("subscriptions.dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("subscriptions.dialog.patient")}
            </label>
            {defaultPatientId ? (
              <div className="rounded-md border px-3 py-2 bg-muted text-sm">
                {selectedPatient?.fullName}
              </div>
            ) : (
              <select
                {...form.register(
                  "patientId"
                )}
                className="h-10 rounded-md border px-3"
              >
                <option value="">
                  {t("subscriptions.dialog.selectPatient")}
                </option>

                {filteredPatients.map(
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
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t("subscriptions.dialog.membershipPlan")}
            </label>
            <select
              {...form.register(
                "membershipPlanId"
              )}
              className="h-10 rounded-md border px-3"
            >
              <option value="">
                {t("subscriptions.dialog.selectPlan")}
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
              {t("shared.labels.startDate")}
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
              {t("subscriptions.dialog.expirationDate")}
            </label>
            <Input
              type="date"
              {...form.register(
                "expiresAt"
              )}
              readOnly
              className="cursor-not-allowed bg-muted"
            />
          </div>

          <ConfirmDialog
            title={
              mode === "edit"
                ? t(
                    "subscriptions.dialog.confirmEditTitle"
                  )
                : t(
                    "subscriptions.dialog.confirmCreateTitle"
                  )
            }
            description={
              mode === "edit"
                ? t(
                    "subscriptions.dialog.confirmEditDescription"
                  )
                : t(
                    "subscriptions.dialog.confirmCreateDescription"
                  )
            }
            actionLabel={
              mode === "edit"
                ? t("shared.actions.saveChanges")
                : t("subscriptions.dialog.createAction")
            }
            trigger={
              <Button type="button">
                {mode === "edit"
                  ? t("shared.actions.saveChanges")
                  : t("subscriptions.dialog.createAction")}
              </Button>
            }
            onConfirm={() =>
              void form.handleSubmit(
                onSubmit
              )()
            }
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
