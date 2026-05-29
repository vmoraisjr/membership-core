"use client";

import type {
  MembershipBenefit,
  MembershipPlan,
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

import { MembershipBenefitRowActions } from "./membership-benefit-row-action";

type BenefitWithPlan =
  MembershipBenefit & {
    membershipPlan: MembershipPlan;
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
  const visibleBenefits =
    selectedPlanId
      ? benefits.filter(
          (benefit) =>
            benefit.membershipPlanId ===
            selectedPlanId
        )
      : benefits;

  return (
    <DataTableContainer
      title="Benefits Catalog"
      description={
        selectedPlanId
          ? "Showing only benefits from the selected plan."
          : "Plan-linked benefits kept for support and history."
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Benefit
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
                colSpan={5}
                className="p-0"
              >
                <EmptyState
                  title="No benefits found"
                  description="No benefits match the current plan context."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
