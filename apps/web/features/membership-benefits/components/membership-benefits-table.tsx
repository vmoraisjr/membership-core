"use client";

import { useState } from "react";

import type {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useTranslations } from "@/i18n/provider";

import { MembershipBenefitRowActions } from "./membership-benefit-row-actions";

type BenefitWithPlan = {
  id: string;
  title: string;
  description?: string | null;
  active: boolean;
  type: BenefitType;
  discountPercentage?: number | null;
  membershipPlanId: string;
  membershipPlan: {
    id: string;
    name: string;
    active: boolean;
  };
  discountAmount?: number | null;
  usageLimit?: number | null;
  resetPeriod?: ResetPeriod | null;
  usedThisMonth?: number;
};

type Props = {
  benefits: BenefitWithPlan[];

  plans: Array<{
    id: string;
    name: string;
  }>;

  selectedPlanId?: string;
  canManageBenefits?: boolean;
  canDeleteBenefitsPermanently?: boolean;
};

export function MembershipBenefitsTable({
  benefits,
  plans,
  selectedPlanId,
  canManageBenefits = true,
  canDeleteBenefitsPermanently = true,
}: Props) {
  const t = useTranslations();

  function getUsagePolicyLabel(
    benefit: BenefitWithPlan
  ) {
    if (
      benefit.resetPeriod === "MONTHLY"
    ) {
      return benefit.usageLimit == null
        ? t(
            "benefits.table.limitedUnlimitedMonth"
          )
        : t(
            "benefits.table.limitedPerMonth",
            {
              count: benefit.usageLimit,
            }
          );
    }

    if (benefit.usageLimit != null) {
      return `${t("benefits.table.monthlyLimit")} · ${benefit.usageLimit}`;
    }

    return t("benefits.table.noLimit");
  }

  const [statusFilter, setStatusFilter] =
    useState("all");
  const [planFilter, setPlanFilter] =
    useState(selectedPlanId ?? "all");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleBenefits = benefits.filter(
    (benefit) => {
      if (
        planFilter &&
        planFilter !== "all" &&
        benefit.membershipPlanId !==
          planFilter
      ) {
        return false;
      }

      if (
        statusFilter === "active" &&
        !benefit.active
      ) {
        return false;
      }

      if (
        statusFilter ===
          "inactive" &&
        benefit.active
      ) {
        return false;
      }

      if (
        normalizedSearch.length > 0 &&
        !benefit.title
          .toLowerCase()
          .includes(
            normalizedSearch
          )
      ) {
        return false;
      }

      return true;
    }
  );

  const hasAnyFilterApplied =
    statusFilter !== "all" ||
    planFilter !== "all" ||
    normalizedSearch.length > 0;

  return (
    <DataTableContainer
      title={t("benefits.table.title")}
      description={
        selectedPlanId
          ? t(
              "benefits.table.filteredDescription"
            )
          : t(
              "benefits.table.description"
            )
      }
      toolbar={
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
              <option value="all">
                {t("shared.filters.all")}
              </option>
              <option value="active">
                {t("shared.states.active")}
              </option>
              <option value="inactive">
                {t(
                  "shared.states.inactive"
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
              onChange={(e) =>
                setPlanFilter(
                  e.target.value
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

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "shared.filters.filterByBenefitName"
              )}
            </label>
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "shared.filters.searchBenefitName"
              )}
            />
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("shared.labels.benefit")}
            </TableHead>

            <TableHead>
              {t("shared.labels.plan")}
            </TableHead>

            <TableHead>
              {t("benefits.table.type")}
            </TableHead>

            <TableHead>
              {t(
                "benefits.table.monthlyLimit"
              )}
            </TableHead>

            <TableHead>
              {t(
                "benefits.table.usedThisMonth"
              )}
            </TableHead>

            <TableHead>
              {t("shared.labels.status")}
            </TableHead>

            <TableHead>
              {t("shared.labels.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleBenefits.map((benefit) => (
            <TableRow
              key={benefit.id}
            >
              <TableCell className="min-w-[14rem] align-top">
                <div className="flex items-start gap-3">
                  <CompanyAvatarMark
                    name={benefit.title}
                    seed={benefit.id}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <div className="font-medium">
                      {benefit.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {benefit.description ||
                        t(
                          "shared.states.noDescription"
                        )}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                {
                  benefit.membershipPlan
                    .name
                }
              </TableCell>

              <TableCell className="align-top">
                {t(
                  `benefits.dialog.types.${benefit.type}`
                )}
              </TableCell>

              <TableCell className="align-top">
                {getUsagePolicyLabel(
                  benefit
                )}
              </TableCell>

              <TableCell className="align-top">
                {benefit.usedThisMonth ??
                  0}
              </TableCell>

              <TableCell className="align-top">
                <StatusIndicator
                  tone={
                    benefit.active
                      ? "success"
                      : "neutral"
                  }
                  label={
                    benefit.active
                      ? t(
                          "shared.states.active"
                        )
                      : t(
                          "shared.states.inactive"
                        )
                  }
                />
              </TableCell>

              <TableCell className="align-top">
                <MembershipBenefitRowActions
                  benefit={benefit}
                  plans={plans}
                  planIsActive={
                    benefit.membershipPlan
                      .active
                  }
                  canManageBenefits={
                    canManageBenefits
                  }
                  canDeleteBenefitsPermanently={
                    canDeleteBenefitsPermanently
                  }
                />
              </TableCell>
            </TableRow>
          ))}

          {visibleBenefits.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    hasAnyFilterApplied
                      ? "benefits.table.noResultsTitle"
                      : "benefits.table.emptyTitle"
                  )}
                  description={t(
                    hasAnyFilterApplied
                      ? "benefits.table.noResultsDescription"
                      : "benefits.table.emptyDescription"
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
