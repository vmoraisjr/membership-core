"use client";

import { useRef } from "react";

import {
  Activity,
  CircleOff,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";

import Link from "next/link";
import { toast } from "sonner";
import { PatientKind } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { suspendPatient } from "../actions/suspend-patient";
import { reactivatePatient } from "../actions/reactivate-patient";
import { deletePatientPermanently } from "../actions/delete-patient-permanently";

import { PatientDialog } from "./patient-dialog";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";
import { ConsumeBenefitDialog } from "@/features/benefit-usage/components/consume-benefit-dialog";
import { useTranslations } from "@/i18n/provider";
import { clienteUrl } from "@/lib/company-routes";

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
  hasActiveSubscription?: boolean;
  returnTo?: string;
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
  hasActiveSubscription = false,
  returnTo,
  canManagePatients = true,
  canDeletePatientsPermanently = true,
  canManageSubscriptions = true,
  canManageBenefitUsage = true,
}: Props) {
  const t = useTranslations();

  const editTriggerRef =
    useRef<HTMLButtonElement>(null);
  const addDependentTriggerRef =
    useRef<HTMLButtonElement>(null);
  const subscriptionTriggerRef =
    useRef<HTMLButtonElement>(null);
  const consumeBenefitTriggerRef =
    useRef<HTMLButtonElement>(null);
  const deactivateTriggerRef =
    useRef<HTMLButtonElement>(null);
  const reactivateTriggerRef =
    useRef<HTMLButtonElement>(null);
  const deleteTriggerRef =
    useRef<HTMLButtonElement>(null);

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

  const canShowMenu =
    canManagePatients ||
    canManageSubscriptions ||
    canManageBenefitUsage;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        asChild
      >
        <Link
          href={clienteUrl(patient.id, {
            returnTo,
          })}
        >
          {t("patients.table.viewAction")}
        </Link>
      </Button>

      {canShowMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              title={t(
                "shared.labels.actions"
              )}
              aria-label={t(
                "shared.labels.actions"
              )}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {patient.status === "ACTIVE" ? (
              <>
                {canManagePatients ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      editTriggerRef.current?.click()
                    }
                  >
                    {t("shared.actions.edit")}
                  </DropdownMenuItem>
                ) : null}

                {canManagePatients &&
                patient.kind ===
                  PatientKind.TITULAR ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      addDependentTriggerRef.current?.click()
                    }
                  >
                    <Users className="size-4" />
                    Adicionar dependente
                  </DropdownMenuItem>
                ) : null}

                {canManageSubscriptions &&
                patient.kind ===
                  PatientKind.TITULAR &&
                !hasActiveSubscription ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      subscriptionTriggerRef.current?.click()
                    }
                  >
                    <Plus className="size-4" />
                    {t(
                      "subscriptions.dialog.createTitle"
                    )}
                  </DropdownMenuItem>
                ) : null}

                {canManageBenefitUsage ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      consumeBenefitTriggerRef.current?.click()
                    }
                  >
                    <Activity className="size-4" />
                    {t(
                      "patients.rowActions.useBenefit"
                    )}
                  </DropdownMenuItem>
                ) : null}

                {canManagePatients ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() =>
                        deactivateTriggerRef.current?.click()
                      }
                    >
                      <CircleOff className="size-4" />
                      {t(
                        "patients.rowActions.deactivateAction"
                      )}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </>
            ) : (
              <>
                {canManagePatients ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      reactivateTriggerRef.current?.click()
                    }
                  >
                    <RotateCcw className="size-4" />
                    {t(
                      "patients.rowActions.reactivateAction"
                    )}
                  </DropdownMenuItem>
                ) : null}

                {canManagePatients &&
                canDeletePatientsPermanently ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() =>
                      deleteTriggerRef.current?.click()
                    }
                  >
                    <Trash2 className="size-4" />
                    {t(
                      "shared.actions.deletePermanently"
                    )}
                  </DropdownMenuItem>
                ) : null}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Hidden triggers keep every dialog's existing behavior (validation,
          confirmation, toasts) while the visible surface is just the menu
          above — no icon bar to memorize (UI-061). */}
      {canManagePatients ? (
        <PatientDialog
          mode="edit"
          initialData={patient}
          responsibleOptions={responsibleOptions}
          trigger={
            <button
              ref={editTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          }
        />
      ) : null}

      {canManagePatients &&
      patient.kind === PatientKind.TITULAR ? (
        <PatientDialog
          defaultKind={PatientKind.DEPENDENT}
          defaultResponsiblePatientId={
            patient.id
          }
          responsibleOptions={
            responsibleOptions
          }
          trigger={
            <button
              ref={addDependentTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          }
        />
      ) : null}

      {canManageSubscriptions &&
      patient.kind === PatientKind.TITULAR ? (
        <SubscriptionDialog
          patients={[
            {
              id: patient.id,
              fullName: patient.fullName,
            },
          ]}
          plans={plans}
          defaultPatientId={patient.id}
          trigger={
            <button
              ref={subscriptionTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
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
            <button
              ref={consumeBenefitTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          }
        />
      ) : null}

      {canManagePatients &&
      patient.status === "ACTIVE" ? (
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
            <button
              ref={deactivateTriggerRef}
              type="button"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          }
        />
      ) : null}

      {canManagePatients &&
      patient.status !== "ACTIVE" ? (
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
              <button
                ref={reactivateTriggerRef}
                type="button"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
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
              onConfirm={() => handleDelete()}
              actionLabel={t(
                "shared.actions.deletePermanently"
              )}
              trigger={
                <button
                  ref={deleteTriggerRef}
                  type="button"
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
              }
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
