"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  ClinicStatus,
  ClinicSubscriptionStatus,
} from "@prisma/client";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  StatusIndicator,
} from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/i18n/provider";
import { formatCurrency } from "@/lib/formatters";

import {
  getClinicStatusTone,
  getClinicSubscriptionStatusTone,
} from "../utils/clinic-status";

import { ClinicRowActions } from "./clinic-row-actions";
import {
  legendSection,
  CLINIC_STATUS_LEGEND,
  CLINIC_SUBSCRIPTION_STATUS_LEGEND,
} from "@/lib/legend-content";

type ClinicTableItem = {
  id: string;
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  slug: string;
  document: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  address: string;
  status: ClinicStatus;
  createdAt: Date;
  monthlyRevenue: number;
  _count: {
    patients: number;
    membershipPlans: number;
    appUsers: number;
  };
  clinicSubscriptions: Array<{
    id: string;
    status: ClinicSubscriptionStatus;
    clinicBillingPlanId: string;
    trialEndsAt: Date | null;
    cancelAtPeriodEnd: boolean;
    syncStatus: string;
    clinicBillingPlan: {
      name: string;
    };
  }>;
};

const TRIAL_ENDING_SOON_DAYS = 7;

function matchesBillingSituation(
  situation: string,
  subscription:
    | ClinicTableItem["clinicSubscriptions"][number]
    | null
) {
  if (situation === "all") {
    return true;
  }

  if (!subscription) {
    return false;
  }

  switch (situation) {
    case "trialEnding": {
      if (
        subscription.status !==
          "TRIAL" ||
        !subscription.trialEndsAt
      ) {
        return false;
      }

      const daysLeft =
        (new Date(
          subscription.trialEndsAt
        ).getTime() -
          Date.now()) /
        (1000 * 60 * 60 * 24);

      return (
        daysLeft <=
        TRIAL_ENDING_SOON_DAYS
      );
    }
    case "pastDue":
      return (
        subscription.status ===
        "PAST_DUE"
      );
    case "paused":
      return (
        subscription.status ===
        "PAUSED"
      );
    case "cancelPending":
      return (
        subscription.cancelAtPeriodEnd
      );
    case "diverged":
      return (
        subscription.syncStatus ===
        "DIVERGED"
      );
    default:
      return true;
  }
}

type Props = {
  clinics: ClinicTableItem[];
  canManageClinic?: boolean;
  isPlatformView?: boolean;
  /** Full commercial plan list for the filter dropdown — includes plans with zero subscribers. */
  plans?: Array<{ id: string; name: string }>;
  /** Pre-selects the plan filter (e.g. arriving from "Ver empresas neste plano"). */
  initialPlanId?: string;
};

export function ClinicTable({
  clinics,
  canManageClinic = true,
  isPlatformView = false,
  plans = [],
  initialPlanId,
}: Props) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] =
    useState("active");
  const [planFilter, setPlanFilter] =
    useState(initialPlanId ?? "all");
  const [
    billingSituationFilter,
    setBillingSituationFilter,
  ] = useState("all");
  const [search, setSearch] =
    useState("");

  const planOptions = useMemo(
    () =>
      [...plans].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [plans]
  );

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleClinics =
    clinics.filter((clinic) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          clinic.status ===
            ClinicStatus.ACTIVE) ||
        (statusFilter ===
          "inactive" &&
          clinic.status ===
            ClinicStatus.INACTIVE);

      const matchesPlan =
        planFilter === "all" ||
        clinic.clinicSubscriptions[0]
          ?.clinicBillingPlanId ===
          planFilter;

      const matchesBilling =
        matchesBillingSituation(
          billingSituationFilter,
          clinic
            .clinicSubscriptions[0] ??
            null
        );

      const matchesSearch =
        normalizedSearch.length === 0 ||
        clinic.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (clinic.brandName ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        clinic.slug
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesStatus &&
        matchesPlan &&
        matchesBilling &&
        matchesSearch
      );
    });

  const activeClinicsCount =
    clinics.filter(
      (clinic) =>
        clinic.status ===
        ClinicStatus.ACTIVE
    ).length;

  return (
    <DataTableContainer
      title={
        isPlatformView
          ? t(
              "clinics.table.platformTitle"
            )
          : t(
              "clinics.table.clinicTitle"
            )
      }
      description={t(
        "clinics.table.activeCountDescription",
        { count: activeClinicsCount }
      )}
      helpLegend={[
        legendSection(
          "Status da empresa",
          CLINIC_STATUS_LEGEND
        ),
        legendSection(
          "Status da Assinatura Sheep",
          CLINIC_SUBSCRIPTION_STATUS_LEGEND
        ),
        legendSection("Ações da linha", [
          {
            label: "Visão rápida",
            description:
              "Painel resumido com dados e status principais, sem sair da lista.",
          },
          {
            label: "Abrir workspace completo",
            description:
              "Abre o perfil completo da empresa, com abas de assinatura, equipe e suporte.",
          },
          {
            label: "Editar",
            description:
              "Atualiza identidade e dados cadastrais da empresa.",
          },
          {
            label: "Desativar / Reativar",
            description:
              "Bloqueia ou libera o acesso da empresa à plataforma.",
          },
        ]),
      ]}
      toolbar={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "shared.filters.statusFilter"
              )}
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
                {t(
                  "clinics.table.filters.statusActive"
                )}
              </option>
              <option value="inactive">
                {t(
                  "clinics.table.filters.statusInactive"
                )}
              </option>
              <option value="all">
                {t(
                  "clinics.table.filters.statusAll"
                )}
              </option>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "shared.filters.planFilter"
              )}
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
              {planOptions.map(
                (plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name}
                  </option>
                )
              )}
            </Select>
          </div>

          {isPlatformView ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t(
                  "clinics.table.filters.billingSituationLabel"
                )}
              </label>
              <Select
                value={
                  billingSituationFilter
                }
                onChange={(event) =>
                  setBillingSituationFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  {t(
                    "clinics.table.filters.billingSituationAll"
                  )}
                </option>
                <option value="trialEnding">
                  {t(
                    "clinics.table.filters.billingSituationTrialEnding"
                  )}
                </option>
                <option value="pastDue">
                  {t(
                    "clinics.table.filters.billingSituationPastDue"
                  )}
                </option>
                <option value="paused">
                  {t(
                    "clinics.table.filters.billingSituationPaused"
                  )}
                </option>
                <option value="cancelPending">
                  {t(
                    "clinics.table.filters.billingSituationCancelPending"
                  )}
                </option>
                <option value="diverged">
                  {t(
                    "clinics.table.filters.billingSituationDiverged"
                  )}
                </option>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "clinics.table.filters.searchLabel"
              )}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={t(
                  "clinics.table.filters.searchPlaceholder"
                )}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t(
                "clinics.table.columns.company"
              )}
            </TableHead>
            <TableHead>
              {t("shared.labels.status")}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.plan"
              )}
            </TableHead>
            <TableHead>
              {t(
                "shared.labels.subscription"
              )}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.users"
              )}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.patients"
              )}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.revenue"
              )}
            </TableHead>
            <TableHead>
              {t(
                "shared.labels.actions"
              )}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleClinics.map((clinic) => {
            const subscription =
              clinic
                .clinicSubscriptions[0] ??
              null;

            return (
              <TableRow key={clinic.id}>
                <TableCell className="min-w-[16rem] align-top">
                  <div className="flex items-start gap-3">
                    <CompanyAvatarMark
                      name={
                        clinic.brandName ||
                        clinic.name
                      }
                      seed={clinic.id}
                      logoUrl={clinic.logoUrl}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="font-medium">
                        {clinic.brandName ||
                          clinic.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {clinic.slug}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <StatusIndicator
                    tone={getClinicStatusTone(
                      clinic.status
                    )}
                    label={t(
                      `clinics.status.${clinic.status}`
                    )}
                  />
                </TableCell>

                <TableCell className="align-top">
                  {subscription ? (
                    subscription
                      .clinicBillingPlan.name
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "clinics.table.noPlan"
                      )}
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {subscription ? (
                    <StatusIndicator
                      tone={getClinicSubscriptionStatusTone(
                        subscription.status
                      )}
                      label={t(
                        `billing.status.${subscription.status}`
                      )}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "clinics.table.noPlan"
                      )}
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {clinic._count.appUsers}
                </TableCell>

                <TableCell className="align-top">
                  {clinic._count.patients}
                </TableCell>

                <TableCell className="align-top">
                  {formatCurrency(
                    clinic.monthlyRevenue
                  )}
                </TableCell>

                <TableCell className="align-top">
                  <ClinicRowActions
                    clinic={clinic}
                    canManageClinic={
                      canManageClinic
                    }
                    isPlatformView={
                      isPlatformView
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}

          {visibleClinics.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    "clinics.table.empty.title"
                  )}
                  description={t(
                    "clinics.table.empty.description"
                  )}
                  action={
                    canManageClinic &&
                    isPlatformView ? (
                      <div className="pt-2">
                        <span className="workspace-kicker">
                          {t(
                            "clinics.table.empty.actionHint"
                          )}
                        </span>
                      </div>
                    ) : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
