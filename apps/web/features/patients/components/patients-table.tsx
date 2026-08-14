"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PatientKind } from "@prisma/client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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
import { clienteUrl, clientesUrl } from "@/lib/company-routes";
import {
  legendSection,
  CLIENT_STATUS_LEGEND,
  CLIENT_FINANCIAL_STATUS_LEGEND,
} from "@/lib/legend-content";

import { PatientRowActions } from "./patient-row-actions";
import type { PatientFinancialSummary } from "../services/get-patient-financial-summaries";

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
  financialSummaries?: PatientFinancialSummary[];
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

function isValidPeriod(
  value: string | null
): value is PeriodFilter {
  return PERIOD_OPTIONS.some(
    (option) => option.value === value
  );
}

export function PatientsTable({
  patients,
  plans,
  benefitBalances = [],
  financialSummaries = [],
  responsibleOptions = [],
  canManagePatients = true,
  canDeletePatientsPermanently = true,
  canManageSubscriptions = true,
  canManageBenefitUsage = true,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] =
    useState(
      searchParams.get("status") ?? "active"
    );
  const [planFilter, setPlanFilter] =
    useState(
      searchParams.get("planId") ?? "all"
    );
  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>(() => {
      const fromUrl = searchParams.get(
        "period"
      );
      return isValidPeriod(fromUrl)
        ? fromUrl
        : "all";
    });
  const [search, setSearch] = useState(
    searchParams.get("query") ?? ""
  );

  const normalizedSearch =
    search.trim().toLowerCase();

  // Keep the address bar in sync so leaving to a client workspace and
  // coming back (or sharing the link) restores the same filtered view
  // (UI-061 "preservando filtros/retorno da lista"). Skips the initial
  // mount: a soft-navigation replace here would re-fetch the server
  // component tree and reset any dialog the user already has open (e.g.
  // "Novo cliente") via its prop-driven form reset.
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const handle = setTimeout(() => {
      const nextUrl = clientesUrl({
        query:
          normalizedSearch.length > 0
            ? search
            : undefined,
        status:
          statusFilter !== "active"
            ? statusFilter
            : undefined,
        planId:
          planFilter !== "all"
            ? planFilter
            : undefined,
        period:
          periodFilter !== "all"
            ? periodFilter
            : undefined,
      });

      router.replace(nextUrl, {
        scroll: false,
      });
    }, 300);

    return () => clearTimeout(handle);
  }, [
    search,
    normalizedSearch,
    statusFilter,
    planFilter,
    periodFilter,
    router,
  ]);

  const currentListUrl = useMemo(
    () =>
      clientesUrl({
        query:
          normalizedSearch.length > 0
            ? search
            : undefined,
        status:
          statusFilter !== "active"
            ? statusFilter
            : undefined,
        planId:
          planFilter !== "all"
            ? planFilter
            : undefined,
        period:
          periodFilter !== "all"
            ? periodFilter
            : undefined,
      }),
    [
      search,
      normalizedSearch,
      statusFilter,
      planFilter,
      periodFilter,
    ]
  );

  const financialSummaryByPatientId = useMemo(
    () =>
      new Map(
        financialSummaries.map(
          (summary) => [
            summary.patientId,
            summary,
          ]
        )
      ),
    [financialSummaries]
  );

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

  function renderIdentification(
    patient: PatientWithCurrentSubscription
  ) {
    return (
      <div className="flex items-start gap-3">
        <CompanyAvatarMark
          name={patient.fullName}
          seed={patient.id}
          className="mt-0.5"
        />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={clienteUrl(patient.id, {
                returnTo: currentListUrl,
              })}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {patient.fullName}
            </Link>
            {patient.status !== "ACTIVE" ? (
              <Badge variant="outline">
                {t("shared.states.inactive")}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {patient.kind ===
            PatientKind.DEPENDENT
              ? `Dependente de ${patient.responsiblePatient?.fullName ?? "-"}`
              : "Titular"}
            {" · "}
            {maskDocument(patient.document)}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {patient.email}
          </div>
        </div>
      </div>
    );
  }

  function renderPlan(
    patient: PatientWithCurrentSubscription
  ) {
    if (!patient.currentSubscription) {
      return (
        <span className="text-sm text-muted-foreground">
          {t(
            "patients.table.noSubscription"
          )}
        </span>
      );
    }

    return (
      <div className="space-y-1">
        <Link
          href={clienteUrl(
            patient.subscriptionSourcePatientId,
            {
              tab: "membership",
              returnTo: currentListUrl,
            }
          )}
          className="text-primary underline-offset-4 hover:underline"
        >
          {
            patient.currentSubscription
              .membershipPlan.name
          }
        </Link>
        <div className="text-xs text-muted-foreground">
          {patient.currentSubscription.status}
          {patient.kind ===
          PatientKind.DEPENDENT
            ? " · herdado do titular"
            : ""}
        </div>
      </div>
    );
  }

  function renderFinancialStatus(
    patient: PatientWithCurrentSubscription
  ) {
    const summary =
      financialSummaryByPatientId.get(
        patient.subscriptionSourcePatientId
      );

    if (!patient.currentSubscription) {
      return (
        <span className="text-sm text-muted-foreground">
          —
        </span>
      );
    }

    const href = clienteUrl(
      patient.subscriptionSourcePatientId,
      {
        tab: "billing",
        returnTo: currentListUrl,
      }
    );

    if (!summary || summary.overdueCount === 0) {
      if (!summary || summary.pendingCount === 0) {
        return (
          <Link href={href}>
            <Badge variant="success">
              {t(
                "patients.table.financialStatusUpToDate"
              )}
            </Badge>
          </Link>
        );
      }

      return (
        <Link href={href}>
          <Badge variant="warning">
            {t(
              "patients.table.financialStatusPending",
              { count: summary.pendingCount }
            )}
          </Badge>
        </Link>
      );
    }

    return (
      <Link href={href}>
        <Badge variant="danger">
          {t(
            "patients.table.financialStatusOverdue",
            { count: summary.overdueCount }
          )}
        </Badge>
      </Link>
    );
  }

  function renderActions(
    patient: PatientWithCurrentSubscription
  ) {
    return (
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
        returnTo={currentListUrl}
        hasActiveSubscription={Boolean(
          patient.currentSubscription
        )}
        benefitBalances={benefitBalances.filter(
          (balance) =>
            balance.patientId === patient.id
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
    );
  }

  return (
    <DataTableContainer
      title={t("patients.table.title")}
      description={t(
        "patients.table.description",
        { count: activePatientsCount }
      )}
      helpLegend={[
        legendSection(
          "Status do cliente",
          CLIENT_STATUS_LEGEND
        ),
        legendSection(
          "Situação financeira",
          CLIENT_FINANCIAL_STATUS_LEGEND
        ),
        legendSection("Ações da linha", [
          {
            label: "Ver cliente",
            description:
              "Abre o cadastro completo: dados, assinatura, benefícios, cobranças e histórico.",
          },
          {
            label: "Ações",
            description:
              "Menu com editar, adicionar dependente, nova assinatura, usar benefício e desativar/reativar/excluir.",
          },
        ]),
      ]}
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
                {t("patients.table.currentPlan")}
              </TableHead>
              <TableHead>
                {t(
                  "patients.table.financialStatus"
                )}
              </TableHead>
              <TableHead className="text-right">
                {t("shared.labels.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visiblePatients.map(
              (patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="min-w-[16rem] align-top">
                    {renderIdentification(
                      patient
                    )}
                  </TableCell>

                  <TableCell className="align-top">
                    {renderPlan(patient)}
                  </TableCell>

                  <TableCell className="align-top">
                    {renderFinancialStatus(
                      patient
                    )}
                  </TableCell>

                  <TableCell className="text-right align-top">
                    {renderActions(patient)}
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
            {renderIdentification(patient)}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("patients.table.currentPlan")}
                </p>
                <div className="font-medium">
                  {renderPlan(patient)}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "patients.table.financialStatus"
                  )}
                </p>
                <div className="font-medium">
                  {renderFinancialStatus(
                    patient
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              {renderActions(patient)}
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
