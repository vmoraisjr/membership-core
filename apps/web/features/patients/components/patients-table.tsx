"use client";

import { useState } from "react";
import { PatientKind } from "@prisma/client";

import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n/provider";

import { PatientRowActions } from "./patient-row-actions";

type PatientWithCurrentSubscription = {
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
  responsiblePatientId: string | null;
  responsiblePatient: {
    id: string;
    fullName: string;
    document: string;
  } | null;
  status: "ACTIVE" | "INACTIVE";
  subscriptionSourcePatientId: string;
  currentSubscription:
    | {
        patientId: string;
        status: string;
        membershipPlan: {
          name: string;
        };
      }
    | null;
};

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
  patients: PatientWithCurrentSubscription[];
  plans: Array<{ id: string; name: string }>;
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

function maskDocument(doc: string) {
  if (!doc) return "";
  const cleaned = String(doc);
  if (cleaned.length <= 4) return cleaned;
  const middle = "*".repeat(
    Math.max(0, cleaned.length - 4)
  );
  return `${cleaned.slice(0, 2)}${middle}${cleaned.slice(-2)}`;
}

function formatBirthDate(
  value: Date | string
) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString();
}

export function PatientsTable({
  patients,
  plans,
  benefitBalances = [],
  responsibleOptions = [],
  canManagePatients = true,
  canDeletePatientsPermanently = true,
  canManageSubscriptions = true,
  canManageBenefitUsage = true,
}: Props) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] =
    useState("active");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visiblePatients =
    patients.filter((patient) => {
      const matchesStatus =
        statusFilter === "all" ||
        patient.status ===
          statusFilter.toUpperCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        patient.fullName
          .toLowerCase()
          .includes(
            normalizedSearch
          ) ||
        patient.document
          .toLowerCase()
          .includes(
            normalizedSearch
          );

      return (
        matchesStatus &&
        matchesSearch
      );
    });

  const activePatientsCount =
    patients.filter(
      (patient) =>
        patient.status === "ACTIVE"
    ).length;

  return (
    <DataTableContainer
      title={t("patients.table.title")}
      description={t(
        "patients.table.description",
        { count: activePatientsCount }
      )}
      toolbar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("shared.filters.statusFilter")}
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-xl border border-input bg-background px-3"
            >
              <option value="active">
                {t("shared.states.active")}
              </option>
              <option value="inactive">
                {t("shared.states.inactive")}
              </option>
              <option value="all">
                {t("shared.filters.all")}
              </option>
            </select>
          </div>

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              {t("patients.table.searchLabel")}
            </label>
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "shared.filters.searchNameOrDocument"
              )}
              className="h-10 rounded-xl border border-input bg-background px-3"
            />
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("patients.table.patient")}
            </TableHead>
            <TableHead>
              {t("shared.labels.birthDate")}
            </TableHead>
            <TableHead>
              {t("shared.labels.document")}
            </TableHead>
            <TableHead>
              Tipo
            </TableHead>
            <TableHead>
              {t("shared.labels.status")}
            </TableHead>
            <TableHead>
              {t("patients.table.currentPlan")}
            </TableHead>
            <TableHead>
              {t("shared.labels.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visiblePatients.map(
            (patient) => (
              <TableRow key={patient.id}>
                <TableCell className="min-w-[16rem] align-top">
                  <div className="space-y-1">
                    <div className="font-medium">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {
                          patient.fullName
                        }
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {patient.email}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  {formatBirthDate(patient.birthDate)}
                </TableCell>

                <TableCell className="align-top">
                  {maskDocument(patient.document)}
                </TableCell>

                <TableCell className="align-top">
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      {patient.kind ===
                      PatientKind.DEPENDENT
                        ? "Dependente"
                        : "Titular"}
                    </div>
                    {patient.responsiblePatient ? (
                      <div className="text-xs text-muted-foreground">
                        Responsável:{" "}
                        {
                          patient
                            .responsiblePatient
                            .fullName
                        }
                      </div>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {patient.status === "ACTIVE"
                      ? t(
                          "shared.states.active"
                        )
                      : t(
                          "shared.states.inactive"
                        )}
                  </span>
                </TableCell>

                <TableCell className="align-top">
                  {patient.currentSubscription ? (
                    <div className="space-y-1">
                      <Link
                        href={`/dashboard/subscriptions?patientId=${patient.subscriptionSourcePatientId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {patient.currentSubscription.membershipPlan.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {patient.currentSubscription.status}
                        {patient.kind ===
                        PatientKind.DEPENDENT
                          ? " · herdado do titular"
                          : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t(
                        "patients.table.noSubscription"
                      )}
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right align-top">
                  <PatientRowActions
                    patient={{
                      id: patient.id,
                      fullName:
                        patient.fullName,
                      email:
                        patient.email,
                      phone:
                        patient.phone,
                      birthDate:
                        patient.birthDate,
                      document:
                        patient.document,
                      zipCode:
                        patient.zipCode,
                      city: patient.city,
                      state:
                        patient.state,
                      address:
                        patient.address,
                      kind:
                        patient.kind,
                      responsiblePatientId:
                        patient.responsiblePatientId,
                      responsiblePatientDocument:
                        patient
                          .responsiblePatient
                          ?.document ?? null,
                      responsiblePatientName:
                        patient
                          .responsiblePatient
                          ?.fullName ?? null,
                      status:
                        patient.status,
                    }}
                    plans={plans}
                    benefitBalances={benefitBalances.filter(
                      (balance) =>
                        balance.patientId ===
                        patient.id
                    )}
                    responsibleOptions={
                      responsibleOptions
                    }
                    canManagePatients={
                      canManagePatients
                    }
                    canDeletePatientsPermanently={
                      canDeletePatientsPermanently
                    }
                    canManageSubscriptions={
                      canManageSubscriptions
                    }
                    canManageBenefitUsage={
                      canManageBenefitUsage &&
                      patient.status ===
                        "ACTIVE"
                    }
                  />
                </TableCell>
              </TableRow>
            )
          )}

          {visiblePatients.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    "patients.table.emptyTitle"
                  )}
                  description={t(
                    "patients.table.emptyDescription"
                  )}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
