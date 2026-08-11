"use client";

import {
  CircleOff,
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
  Plus,
  Activity,
  Users,
} from "lucide-react";

import Link from "next/link";
import { toast } from "sonner";
import { PatientKind } from "@prisma/client";

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
    kind: PatientKind;
    responsiblePatientId?: string | null;
    responsiblePatientDocument?: string | null;
    responsiblePatientName?: string | null;

    status?: "ACTIVE" | "INACTIVE";
  };
  plans?: Array<{ id: string; name: string }>;
  benefitBalances?: PatientBenefitBalance[];
  responsibleOptions?: Array<{
    id: string;
    fullName: string;
    document: string;
    kind: PatientKind;
    status: "ACTIVE" | "INACTIVE";
  }>;
  canManagePatients?: boolean;
  canDeletePatientsPermanently?: boolean;
  canManageSubscriptions?: boolean;
  canManageBenefitUsage?: boolean;
};

export function PatientRowActions({
  patient,
  plans = [],
  benefitBalances = [],
  responsibleOptions = [],
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon-sm"
          variant="ghost"
          asChild
          title={t("shared.actions.view")}
        >
          <Link
            href={`/dashboard/patients/${patient.id}`}
          >
            <Eye className="size-4" />
          </Link>
        </Button>

        <span className="text-xs text-muted-foreground">
          {t("shared.states.readOnly")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="icon-sm"
        variant="ghost"
        asChild
        title={t("shared.actions.view")}
      >
        <Link
          href={`/dashboard/patients/${patient.id}`}
        >
          <Eye className="size-4" />
        </Link>
      </Button>

      {patient.status === "ACTIVE" ? (
        <>
          {canManagePatients ? (
            <PatientDialog
              mode="edit"
              initialData={patient}
              responsibleOptions={responsibleOptions}
              trigger={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title={t(
                    "shared.actions.edit"
                  )}
                  aria-label={t(
                    "shared.actions.edit"
                  )}
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />
          ) : null}

          {canManagePatients &&
          patient.kind ===
            PatientKind.TITULAR ? (
            <PatientDialog
              defaultKind={
                PatientKind.DEPENDENT
              }
              defaultResponsiblePatientId={
                patient.id
              }
              responsibleOptions={
                responsibleOptions
              }
              trigger={
                <Button
                  variant="outline"
                >
                  <Users className="size-4" />
                  Adicionar dependente
                </Button>
              }
            />
          ) : null}

          {canManageSubscriptions &&
          patient.kind ===
            PatientKind.TITULAR ? (
            <SubscriptionDialog
              patients={[{ id: patient.id, fullName: patient.fullName }]}
              plans={plans}
              defaultPatientId={patient.id}
              trigger={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title={t(
                    "subscriptions.dialog.createTitle"
                  )}
                  aria-label={t(
                    "subscriptions.dialog.createTitle"
                  )}
                >
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
                  size="icon-sm"
                  variant="ghost"
                  className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
                  title={t(
                    "patients.rowActions.deactivateAction"
                  )}
                  aria-label={t(
                    "patients.rowActions.deactivateAction"
                  )}
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
                    size="icon-sm"
                    variant="ghost"
                    title={t(
                      "patients.rowActions.reactivateAction"
                    )}
                    aria-label={t(
                      "patients.rowActions.reactivateAction"
                    )}
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
                      size="icon-sm"
                      variant="ghost"
                      className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
                      title={t(
                        "shared.actions.deletePermanently"
                      )}
                      aria-label={t(
                        "shared.actions.deletePermanently"
                      )}
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
