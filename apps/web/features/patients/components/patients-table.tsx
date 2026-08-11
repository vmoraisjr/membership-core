"use client";

import { useMemo, useState } from "react";
import { PatientKind } from "@prisma/client";

import Link from "next/link";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n/provider";
import { formatDate } from "@/lib/formatters";

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
  createdAt: Date;
  subscriptions: Array<{
    startedAt: Date;
  }>;
  subscriptionSourcePatientId: string;
  currentSubscription:
    | {
        patientId: string;
        status: string;
        membershipPlan: {
          id: string;
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

const PERIOD_OPTIONS = [
  { value: "all", labelKey: "shared.filters.allPeriods" },
  { value: "30", labelKey: "shared.filters.last30Days" },
  { value: "90", labelKey: "shared.filters.last90Days" },
  { value: "year", labelKey: "shared.filters.thisYear" },
] as const;

type PeriodFilter =
  (typeof PERIOD_OPTIONS)[number]["value"];

function isWithinPeriod(
  createdAt: Date,
  period: PeriodFilter
) {
  if (period === "all") {
    return true;
  }

  const now = new Date();

  if (period === "year") {
    return (
      createdAt.getFullYear() ===
      now.getFullYear()
    );
  }

  const days = period === "30" ? 30 : 90;
  const cutoff = new Date(
    now.getTime() -
      days * 24 * 60 * 60 * 1000
  );

  return createdAt >= cutoff;
}

function maskDocument(doc: string) {
  if (!doc) return "";
  const cleaned = String(doc);
  if (cleaned.length <= 4) return cleaned;
  const middle = "*".repeat(
    Math.max(0, cleaned.length - 4)
  );
  return `${cleaned.slice(0, 2)}${middle}${cleaned.slice(-2)}`;
}

function getLastActivity(
  patient: PatientWithCurrentSubscription
) {
  return (
    patient.subscriptions[0]?.startedAt ??
    patient.createdAt
  );
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
  const [planFilter, setPlanFilter] =
    useState("all");
  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>("all");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visiblePatients = useMemo(
    () =>
      patients.filter((patient) => {
        const matchesStatus =
          statusFilter === "all" ||
          patient.status ===
            statusFilter.toUpperCase();

        const matchesSearch =
          normalizedSearch.length === 0 ||
          patient.fullName
            .toLowerCase()
            .includes(normalizedSearch) ||
          patient.document
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesPlan =
          planFilter === "all" ||
          patient.currentSubscription
            ?.membershipPlan.id ===
            planFilter;

        const matchesPeriod =
          isWithinPeriod(
            patient.createdAt,
            periodFilter
          );

        return (
          matchesStatus &&
          matchesSearch &&
          matchesPlan &&
          matchesPeriod
        );
      }),
    [
      patients,
      statusFilter,
      normalizedSearch,
      planFilter,
      periodFilter,
    ]
  );

  const activePatientsCount =
    patients.filter(
      (patient) =>
        patient.status === "ACTIVE"
    ).length;

  const hasAnyFilterApplied =
    statusFilter !== "active" ||
    planFilter !== "all" ||
    periodFilter !== "all" ||
    normalizedSearch.length > 0;

  return (
    <DataTableContainer
      title={t("patients.table.title")}
      description={t(
        "patients.table.description",
        { count: activePatientsCount }
      )}
      toolbar={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("shared.filters.statusFilter")}
            </label>
            <Select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
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
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("shared.filters.planFilter")}
            </label>
            <Select
              value={planFilter}
              onChange={(event) =>
                setPlanFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                {t(
                  "shared.filters.allPlans"
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

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "shared.filters.periodFilter"
              )}
            </label>
            <Select
              value={periodFilter}
              onChange={(event) =>
                setPeriodFilter(
                  event.target
                    .value as PeriodFilter
                )
              }
            >
              {PERIOD_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {t(option.labelKey)}
                  </option>
                )
              )}
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("patients.table.searchLabel")}
            </label>
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "shared.filters.searchNameOrDocument"
              )}
            />
          </div>
        </div>
      }
    >
      {/* Desktop/tablet: tabela */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("patients.table.patient")}
              </TableHead>
              <TableHead>
                {t("shared.labels.contact")}
              </TableHead>
              <TableHead>
                {t("shared.labels.document")}
              </TableHead>
              <TableHead>
                {t("patients.table.currentPlan")}
              </TableHead>
              <TableHead>
                {t("shared.labels.status")}
              </TableHead>
              <TableHead>
                {t(
                  "shared.labels.lastActivity"
                )}
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
                  <TableCell className="min-w-[14rem] align-top">
                    <div className="flex items-start gap-3">
                      <CompanyAvatarMark
                        name={patient.fullName}
                        seed={patient.id}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <div className="font-medium">
                          <Link
                            href={`/dashboard/patients/${patient.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {patient.fullName}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {patient.kind ===
                          PatientKind.DEPENDENT
                            ? `Dependente de ${patient.responsiblePatient?.fullName ?? "-"}`
                            : "Titular"}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="space-y-0.5 text-sm">
                      <div>{patient.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {patient.phone}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    {maskDocument(patient.document)}
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

                  <TableCell className="align-top">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {patient.status === "ACTIVE"
                        ? t("shared.states.active")
                        : t(
                            "shared.states.inactive"
                          )}
                    </span>
                  </TableCell>

                  <TableCell className="align-top text-sm text-muted-foreground">
                    {formatDate(
                      getLastActivity(patient)
                    )}
                  </TableCell>

                  <TableCell className="text-right align-top">
                    <PatientRowActions
                      patient={{
                        id: patient.id,
                        fullName: patient.fullName,
                        email: patient.email,
                        phone: patient.phone,
                        birthDate: patient.birthDate,
                        document: patient.document,
                        zipCode: patient.zipCode,
                        city: patient.city,
                        state: patient.state,
                        address: patient.address,
                        kind: patient.kind,
                        responsiblePatientId:
                          patient.responsiblePatientId,
                        responsiblePatientDocument:
                          patient.responsiblePatient
                            ?.document ?? null,
                        responsiblePatientName:
                          patient.responsiblePatient
                            ?.fullName ?? null,
                        status: patient.status,
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
                        patient.status === "ACTIVE"
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>

        {visiblePatients.length === 0 ? (
          <EmptyState
            title={t(
              hasAnyFilterApplied
                ? "patients.table.noResultsTitle"
                : "patients.table.emptyTitle"
            )}
            description={t(
              hasAnyFilterApplied
                ? "patients.table.noResultsDescription"
                : "patients.table.emptyDescription"
            )}
          />
        ) : null}
      </div>

      {/* Mobile: alternativa em cartões */}
      <div className="grid gap-3 p-4 md:hidden">
        {visiblePatients.map((patient) => (
          <div
            key={patient.id}
            className="surface-subtle space-y-3 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/patients/${patient.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {patient.fullName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {patient.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {patient.phone}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {patient.status === "ACTIVE"
                  ? t("shared.states.active")
                  : t("shared.states.inactive")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("patients.table.currentPlan")}
                </p>
                <p className="font-medium">
                  {patient.currentSubscription
                    ?.membershipPlan.name ??
                    t(
                      "patients.table.noSubscription"
                    )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "shared.labels.lastActivity"
                  )}
                </p>
                <p className="font-medium">
                  {formatDate(
                    getLastActivity(patient)
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <PatientRowActions
                patient={{
                  id: patient.id,
                  fullName: patient.fullName,
                  email: patient.email,
                  phone: patient.phone,
                  birthDate: patient.birthDate,
                  document: patient.document,
                  zipCode: patient.zipCode,
                  city: patient.city,
                  state: patient.state,
                  address: patient.address,
                  kind: patient.kind,
                  responsiblePatientId:
                    patient.responsiblePatientId,
                  responsiblePatientDocument:
                    patient.responsiblePatient
                      ?.document ?? null,
                  responsiblePatientName:
                    patient.responsiblePatient
                      ?.fullName ?? null,
                  status: patient.status,
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
                  patient.status === "ACTIVE"
                }
              />
            </div>
          </div>
        ))}

        {visiblePatients.length === 0 ? (
          <EmptyState
            title={t(
              hasAnyFilterApplied
                ? "patients.table.noResultsTitle"
                : "patients.table.emptyTitle"
            )}
            description={t(
              hasAnyFilterApplied
                ? "patients.table.noResultsDescription"
                : "patients.table.emptyDescription"
            )}
          />
        ) : null}
      </div>
    </DataTableContainer>
  );
}
