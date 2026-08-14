"use client";

import type {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import { useState } from "react";

import Link from "next/link";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
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
import { formatCurrency } from "@/lib/formatters";
import { planoUrl } from "@/lib/company-routes";

import { MembershipPlanRowActions } from "./membership-plan-row-actions";
import {
  legendSection,
  PLAN_STATUS_LEGEND,
} from "@/lib/legend-content";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
  annualPrice: number | null;
  active: boolean;
  benefits: Array<{
    id: string;
    membershipPlanId: string;
    title: string;
    type: BenefitType;
    active: boolean;
    description: string | null;
    discountPercentage: number | null;
    discountAmount: number | null;
    usageLimit: number | null;
    resetPeriod: ResetPeriod | null;
    createdAt: Date;
  }>;
  subscriptions: Array<{
    id: string;
    patientId: string;
    status: string;
  }>;
};

type Props = {
  plans: Plan[];
  benefitPlans: Array<{
    id: string;
    name: string;
  }>;
  canManagePlans?: boolean;
  canDeletePlansPermanently?: boolean;
  canManageBenefits?: boolean;
};

export function MembershipPlansTable({
  plans,
  benefitPlans,
  canManagePlans = true,
  canDeletePlansPermanently = true,
  canManageBenefits = true,
}: Props) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] =
    useState("active");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visiblePlans = plans.filter((plan) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" &&
        plan.active) ||
      (statusFilter ===
        "inactive" &&
        !plan.active);

    const matchesSearch =
      normalizedSearch.length === 0 ||
      plan.name
        .toLowerCase()
        .includes(normalizedSearch) ||
      plan.benefits.some((benefit) =>
        benefit.title
          .toLowerCase()
          .includes(normalizedSearch)
      );

    return (
      matchesStatus &&
      matchesSearch
    );
  });

  const activePlansCount =
    plans.filter((plan) => plan.active)
      .length;

  const hasAnyFilterApplied =
    statusFilter !== "active" ||
    normalizedSearch.length > 0;

  function getActiveBenefitsCount(
    plan: Plan
  ) {
    return plan.benefits.filter(
      (benefit) => benefit.active
    ).length;
  }

  return (
    <DataTableContainer
      title={t("plans.table.title")}
      description={t(
        "plans.table.description",
        { count: activePlansCount }
      )}
      helpLegend={[
        legendSection(
          "Status do plano",
          PLAN_STATUS_LEGEND
        ),
        legendSection("Ações da linha", [
          {
            label: "Ver plano",
            description:
              "Abre o plano com benefícios, assinantes e histórico.",
          },
          {
            label: "Ações",
            description:
              "Menu com editar, duplicar, criar benefício e desativar/reativar/excluir.",
          },
        ]),
      ]}
      toolbar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              {t("shared.filters.searchPlanOrBenefit")}
            </label>
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "shared.filters.searchPlanOrBenefit"
              )}
            />
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shared.labels.plan")}</TableHead>
            <TableHead>{t("shared.labels.status")}</TableHead>
            <TableHead>{t("plans.dialog.monthlyPrice")}</TableHead>
            <TableHead>{t("plans.table.annualPrice")}</TableHead>
            <TableHead>{t("plans.table.benefits")}</TableHead>
            <TableHead>
              {t("plans.table.activeSubscriptions")}
            </TableHead>
            <TableHead>
              {t("shared.labels.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visiblePlans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="align-top">
                <div className="flex items-start gap-3">
                  <CompanyAvatarMark
                    name={plan.name}
                    seed={plan.id}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <div className="font-medium">
                      <Link
                        href={planoUrl(plan.id)}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {plan.name}
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.description ||
                        t("shared.states.noDescription")}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {plan.active
                    ? t("shared.states.active")
                    : t("shared.states.inactive")}
                </span>
              </TableCell>

              <TableCell className="align-top">
                {formatCurrency(
                  plan.monthlyPrice
                )}
              </TableCell>

              <TableCell className="align-top text-sm text-muted-foreground">
                {plan.annualPrice
                  ? formatCurrency(
                      plan.annualPrice
                    )
                  : "—"}
              </TableCell>

              <TableCell className="align-top">
                <div className="space-y-1">
                  <div className="font-medium">
                    {getActiveBenefitsCount(
                      plan
                    )}{" "}
                    {t(
                      "plans.table.activeBenefitsCount",
                      {
                        count:
                          getActiveBenefitsCount(plan),
                      }
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t(
                      "plans.table.totalRegistered",
                      {
                        count:
                          plan.benefits.length,
                      }
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                {plan.subscriptions.length}
              </TableCell>

              <TableCell className="align-top">
                <MembershipPlanRowActions
                  plan={{
                    id: plan.id,
                    name: plan.name,
                    description:
                      plan.description,
                    monthlyPrice: Number(
                      plan.monthlyPrice
                    ),
                    annualPrice:
                      plan.annualPrice,
                    active: plan.active,
                  }}
                  benefitPlans={benefitPlans}
                  canManagePlans={
                    canManagePlans
                  }
                  canDeletePlansPermanently={
                    canDeletePlansPermanently
                  }
                  canManageBenefits={
                    canManageBenefits
                  }
                />
              </TableCell>
            </TableRow>
          ))}

          {visiblePlans.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    hasAnyFilterApplied
                      ? "plans.table.noResultsTitle"
                      : "plans.table.emptyTitle"
                  )}
                  description={t(
                    hasAnyFilterApplied
                      ? "plans.table.noResultsDescription"
                      : "plans.table.emptyDescription"
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
