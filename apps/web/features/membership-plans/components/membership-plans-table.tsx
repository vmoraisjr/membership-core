"use client";

import type {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import { useState } from "react";

import Link from "next/link";

import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
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

import { MembershipPlanRowActions } from "./membership-plan-row-actions";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
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
    >
      <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">
            {t("shared.filters.statusFilter")}
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-10 rounded-md border px-3"
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
          <label className="text-sm text-muted-foreground">
            {t("shared.filters.searchPlanOrBenefit")}
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={t(
              "shared.filters.searchPlanOrBenefit"
            )}
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shared.labels.plan")}</TableHead>
            <TableHead>{t("shared.labels.status")}</TableHead>
            <TableHead>{t("plans.dialog.monthlyPrice")}</TableHead>
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
                <div className="space-y-1">
                  <div className="font-medium">
                    {plan.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.description ||
                      t("shared.states.noDescription")}
                  </div>
                  <Link
                    href={`/dashboard/benefits?planId=${plan.id}`}
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {t("plans.table.openBenefitsSupport")}
                  </Link>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
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
                colSpan={6}
                className="p-0"
              >
                <EmptyState
                  title={t("plans.table.emptyTitle")}
                  description={t(
                    "plans.table.emptyDescription"
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
