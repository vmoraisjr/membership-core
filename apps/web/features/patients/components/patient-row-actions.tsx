"use client";

import {
  CircleOff,
  Pencil,
  RotateCcw,
  Trash2,
  Plus,
  Activity,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { suspendPatient } from "../actions/suspend-patient";
import { reactivatePatient } from "../actions/reactivate-patient";
import { deletePatientPermanently } from "../actions/delete-patient-permanently";

import { PatientDialog } from "./patient-dialog";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";
import { ConsumeBenefitDialog } from "@/features/benefit-usage/components/consume-benefit-dialog";
import { useTranslations } from "@/i18n/provider";

type PatientBenefitBalance = {
  subscriptionId: string;
  patientId: string;
  patientName: string;
  membershipPlanId: string;
  membershipPlanName: string;
  membershipBenefitId: string;
  membershipBenefitTitle: string;
  usageLimit: number | null;
  resetPeriod: "MONTHLY" | "YEARLY" | null;
  usedQuantity: number;
  remainingQuantity: number | null;
};

type Props = {
  patient: {
    id: string;

    fullName: string;

    email: string;

    phone: string;

    birthDate: Date;

    document: string;

    zipCode: string;

    city: string;

    state: string;

    address: string;

    status?: "ACTIVE" | "INACTIVE";
  };
  plans?: Array<{ id: string; name: string }>;
  benefitBalances?: PatientBenefitBalance[];
  canManagePatients?: boolean;
  canDeletePatientsPermanently?: boolean;
  canManageSubscriptions?: boolean;
  canManageBenefitUsage?: boolean;
};

export function PatientRowActions({
  patient,
  plans = [],
  benefitBalances = [],
  canManagePatients = true,
  canDeletePatientsPermanently = true,
  canManageSubscriptions = true,
  canManageBenefitUsage = true,
}: Props) {
  const t = useTranslations();
  async function handleSuspend({
    detailsValue,
  }: {
    typedValue: string;
    detailsValue: string;
  }) {
    try {
      await suspendPatient(
        patient.id,
        detailsValue
      );

      toast.success(
        t(
          "patients.rowActions.deactivateSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "patients.rowActions.deactivateError"
            )
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivatePatient(
        patient.id
      );

      toast.success(
        t(
          "patients.rowActions.reactivateSuccess"
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "patients.rowActions.reactivateError"
            )
      );
    }
  }

  async function handleDelete() {
    try {
      await deletePatientPermanently(
        patient.id
      );

      toast.success(
        t("patients.rowActions.deleteSuccess")
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("patients.rowActions.deleteError")
      );
    }
  }

  const canShowActions =
    canManagePatients ||
    canManageSubscriptions ||
    canManageBenefitUsage;

  if (!canShowActions) {
    return (
        <span className="text-xs text-muted-foreground">
        {t("shared.states.readOnly")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {patient.status === "ACTIVE" ? (
        <>
          {canManagePatients ? (
            <PatientDialog
              mode="edit"
              initialData={patient}
              trigger={
                <Button
                  size="icon"
                  variant="outline"
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />
          ) : null}

          {canManageSubscriptions ? (
            <SubscriptionDialog
              patients={[{ id: patient.id, fullName: patient.fullName }]}
              plans={plans}
              defaultPatientId={patient.id}
              trigger={
                <Button size="icon" variant="outline">
                  <Plus className="size-4" />
                </Button>
              }
            />
          ) : null}

          {canManageBenefitUsage ? (
            <ConsumeBenefitDialog
              balances={benefitBalances}
              title={t(
                "patients.rowActions.consumeTitle",
                { name: patient.fullName }
              )}
              trigger={
                <Button variant="outline">
                  <Activity className="size-4" />
                  {t("patients.rowActions.useBenefit")}
                </Button>
              }
            />
          ) : null}

          {canManagePatients ? (
            <ConfirmDialog
              title={t(
                "patients.rowActions.deactivateTitle"
              )}
              description={t(
                "patients.rowActions.deactivateDescription"
              )}
              onConfirm={handleSuspend}
              actionLabel={t(
                "patients.rowActions.deactivateAction"
              )}
              detailsLabel={t("shared.labels.reason")}
              detailsPlaceholder={t(
                "patients.rowActions.deactivatePlaceholder"
              )}
              detailsRequired
              detailsInput="textarea"
              trigger={
                <Button
                  size="icon"
                  variant="destructive"
                >
                  <CircleOff className="size-4" />
                </Button>
              }
            />
          ) : null}
        </>
      ) : (
        <>
          {canManagePatients ? (
            <>
              <ConfirmDialog
                title={t(
                  "patients.rowActions.reactivateTitle"
                )}
                description={t(
                  "patients.rowActions.reactivateDescription"
                )}
                onConfirm={() =>
                  handleReactivate()
                }
                actionLabel={t(
                  "patients.rowActions.reactivateAction"
                )}
                trigger={
                  <Button
                    size="icon"
                    variant="outline"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                }
              />

              {canDeletePatientsPermanently ? (
                <ConfirmDialog
                  title={t(
                    "patients.rowActions.deleteTitle"
                  )}
                  description={t(
                    "patients.rowActions.deleteDescription"
                  )}
                  onConfirm={() =>
                    handleDelete()
                  }
                  actionLabel={t(
                    "shared.actions.deletePermanently"
                  )}
                  trigger={
                    <Button
                      size="icon"
                      variant="destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
