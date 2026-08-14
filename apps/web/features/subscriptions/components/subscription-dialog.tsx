"use client";

import { PencilLine } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/i18n/provider";
import { formatCurrency } from "@/lib/formatters";

type Props = {
  mode?: "create" | "edit";

  patients: Array<{
    id: string;
    fullName: string;
  }>;

  plans: Array<{
    id: string;
    name: string;
    monthlyPrice?: number | null;
    activeBenefitsCount?: number;
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

  /** Controlled open state — omit to let the dialog manage it internally. */
  open?: boolean;

  onOpenChange?: (open: boolean) => void;
};

export function SubscriptionDialog({
  mode = "create",
  patients,
  plans,
  initialData,
  defaultPatientId,
  defaultMembershipPlanId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: Props) {
  const t = useTranslations();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [editingEnabled, setEditingEnabled] =
    useState(mode === "create");

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

  const membershipPlanId = useWatch({
    control: form.control,
    name: "membershipPlanId",
  });

  const selectedPatient = patients.find(
    (p) => p.id === patientId
  );

  const selectedPlan = plans.find(
    (plan) =>
      plan.id === membershipPlanId
  );

  const getInitialFormValues =
    useCallback(() => {
      if (
        mode === "edit" &&
        initialData
      ) {
        return {
          patientId:
            initialData.patientId,
          membershipPlanId:
            initialData.membershipPlanId,
          startedAt:
            formatDateForInput(
              initialData.startedAt
            ),
          expiresAt:
            formatDateForInput(
              initialData.expiresAt
            ),
        };
      }

      return {
        patientId:
          defaultPatientId ?? "",
        membershipPlanId:
          defaultMembershipPlanId ??
          "",
        startedAt:
          defaultStartedAt,
        expiresAt:
          defaultExpiresAt,
      };
    }, [
      defaultExpiresAt,
      defaultMembershipPlanId,
      defaultPatientId,
      defaultStartedAt,
      initialData,
      mode,
    ]);

  useEffect(() => {
    form.reset(getInitialFormValues());
  }, [
    defaultMembershipPlanId,
    defaultPatientId,
    defaultStartedAt,
    defaultExpiresAt,
    form,
    getInitialFormValues,
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
      {trigger !== null ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              {t("subscriptions.new")}
            </Button>
          )}
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("subscriptions.dialog.editTitle")
              : t("subscriptions.dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4">
          <FormSection title="Identificação">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t("subscriptions.dialog.patient")}
                </label>
                {defaultPatientId ? (
                  <div className="rounded-md border px-3 py-2 bg-muted text-sm">
                    {selectedPatient?.fullName}
                  </div>
                ) : (
                  <Select
                    disabled={!editingEnabled}
                    {...form.register(
                      "patientId"
                    )}
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
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t("subscriptions.dialog.membershipPlan")}
                </label>
                <Select
                  disabled={!editingEnabled}
                  {...form.register(
                    "membershipPlanId"
                  )}
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
                </Select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Datas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t("shared.labels.startDate")}
                </label>
                <Input
                  type="date"
                  disabled={!editingEnabled}
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
            </div>
          </FormSection>

          {selectedPlan ? (
            <FormSection
              title={t(
                "subscriptions.summary.title"
              )}
            >
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="detail-field">
                  <p className="detail-field-label">
                    {t(
                      "subscriptions.summary.monthlyPrice"
                    )}
                  </p>
                  <p className="detail-field-value">
                    {formatCurrency(
                      selectedPlan.monthlyPrice ??
                        0
                    )}
                  </p>
                </div>
                <div className="detail-field">
                  <p className="detail-field-label">
                    {t(
                      "subscriptions.summary.activeBenefits"
                    )}
                  </p>
                  <p className="detail-field-value">
                    {selectedPlan.activeBenefitsCount ??
                      "—"}
                  </p>
                </div>
              </div>
            </FormSection>
          ) : null}

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
                      "subscriptions.dialog.confirmEditTitle"
                    )}
                    description={t(
                      "subscriptions.dialog.confirmEditDescription"
                    )}
                    actionLabel={t("shared.actions.saveChanges")}
                    trigger={
                      <Button
                        type="button"
                        className="w-full"
                      >
                        {t("shared.actions.saveChanges")}
                      </Button>
                    }
                    onConfirm={() =>
                      void form.handleSubmit(
                        onSubmit
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
                "subscriptions.dialog.confirmCreateTitle"
              )}
              description={t(
                "subscriptions.dialog.confirmCreateDescription"
              )}
              actionLabel={t("subscriptions.dialog.createAction")}
              trigger={
                <Button type="button">
                  {t("subscriptions.dialog.createAction")}
                </Button>
              }
              onConfirm={() =>
                void form.handleSubmit(
                  onSubmit
                )()
              }
            />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
