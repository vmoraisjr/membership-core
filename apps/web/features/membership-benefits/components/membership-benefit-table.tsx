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

import { MembershipBenefitRowActions } from "./membership-benefit-row-action";

type BenefitWithPlan =
  MembershipBenefit & {
    membershipPlan: MembershipPlan;
  };

type Props = {
  benefits: BenefitWithPlan[];

  plans: MembershipPlan[];
};

export function MembershipBenefitsTable({
  benefits,
  plans,
}: Props) {
  return (
    <DataTableContainer
      title="Benefits Catalog"
      description="Plan-linked benefits."
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
              Type
            </TableHead>

            <TableHead>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {benefits.map((benefit) => (
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
                {benefit.type}
              </TableCell>

              <TableCell>
                <MembershipBenefitRowActions
                  benefit={benefit}
                  plans={plans}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}