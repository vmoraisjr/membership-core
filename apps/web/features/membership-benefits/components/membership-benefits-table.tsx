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

import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";

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
};

type Props = {
  benefits: BenefitWithPlan[];

  plans: Array<{
    id: string;
    name: string;
  }>;

  selectedPlanId?: string;
};

export function MembershipBenefitsTable({
  benefits,
  plans,
  selectedPlanId,
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [planFilter, setPlanFilter] = useState(selectedPlanId ?? 'all');
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleBenefits = benefits.filter(
    (benefit) => {
      if (planFilter && planFilter !== 'all' && benefit.membershipPlanId !== planFilter) {
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

  return (
    <DataTableContainer
      title="Benefits Catalog"
      description={
        selectedPlanId
          ? "Showing only benefits from the selected plan."
          : "Plan-linked benefits kept for support and history."
      }
    >
      <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">
            Status filter
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
            <option value="all">
              All
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">Plan filter</label>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 rounded-md border px-3"
          >
            <option value="all">All plans</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:min-w-80">
          <label className="text-sm text-muted-foreground">
            Filter by benefit name
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search benefit name"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Benefit
            </TableHead>

            <TableHead>
              Description
            </TableHead>

            <TableHead>
              Percentage
            </TableHead>

            <TableHead>
              Plan
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead>
              Type
            </TableHead>

            <TableHead>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleBenefits.map((benefit) => (
            <TableRow
              key={benefit.id}
            >
              <TableCell>
                {benefit.title}
              </TableCell>

              <TableCell>
                {benefit.description ||
                  "No description"}
              </TableCell>

              <TableCell>
                {benefit.discountPercentage !=
                null
                  ? `${benefit.discountPercentage}%`
                  : "-"}
              </TableCell>

              <TableCell>
                {
                  benefit.membershipPlan
                    .name
                }
              </TableCell>

              <TableCell>
                {benefit.active
                  ? "Active"
                  : "Inactive"}
              </TableCell>

              <TableCell>
                {benefit.type}
              </TableCell>

              <TableCell>
                <MembershipBenefitRowActions
                  benefit={benefit}
                  plans={plans}
                  planIsActive={
                    benefit.membershipPlan
                      .active
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
                  title="No benefits found"
                  description="No benefits match the current filters."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
