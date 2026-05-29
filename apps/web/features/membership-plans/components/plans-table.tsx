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
import { formatCurrency } from "@/lib/formatters";

import { MembershipBenefitRowActions } from "@/features/membership-benefits/components/membership-benefit-row-action";

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
  subscriptionPatients: Array<{
    id: string;
    fullName: string;
  }>;
};

export function PlansTable({
  plans,
  benefitPlans,
  subscriptionPatients,
}: Props) {
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

  return (
    <DataTableContainer
      title="Plans Catalog"
      description={`${activePlansCount} active plans available for subscriptions.`}
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
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
            <option value="all">
              All
            </option>
          </select>
        </div>

        <div className="grid gap-2 sm:min-w-80">
          <label className="text-sm text-muted-foreground">
            Search by plan or benefit
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search plan or benefit"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Monthly Price</TableHead>
            <TableHead>Benefits</TableHead>
            <TableHead>
              Active Subscriptions
            </TableHead>
            <TableHead>
              Actions
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
                      "No description."}
                  </div>
                  <Link
                    href={`/dashboard/benefits?planId=${plan.id}`}
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Open benefits support
                  </Link>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  {plan.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </TableCell>

              <TableCell className="align-top">
                {formatCurrency(
                  plan.monthlyPrice
                )}
              </TableCell>

              <TableCell className="align-top">
                <div className="space-y-3">
                  {plan.benefits.length ===
                  0 ? (
                    <div className="text-sm text-muted-foreground">
                      No benefits yet.
                    </div>
                  ) : (
                    plan.benefits.map(
                      (benefit) => (
                        <div
                          key={benefit.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {
                                  benefit.title
                                }
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {
                                  benefit.type
                                }{" "}
                                /{" "}
                                {benefit.active
                                  ? "Active"
                                  : "Inactive"}
                              </div>
                            </div>

                            <MembershipBenefitRowActions
                              benefit={
                                benefit
                              }
                              plans={
                                benefitPlans
                              }
                              planIsActive={
                                plan.active
                              }
                            />
                          </div>
                        </div>
                      )
                    )
                  )}
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
                  subscriptionPatients={
                    subscriptionPatients
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
                  title="No plans found"
                  description="Adjust the filters or create a new membership plan to continue."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
