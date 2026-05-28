import type {
  MembershipPlan,
  Patient,
  Subscription,
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

import { SubscriptionRowActions } from "./subscription-row-actions";

type SubscriptionWithRelations =
  Omit<
    Subscription,
    "startedAt" | "expiresAt"
  > & {
    startedAt:
      string | Date;

    expiresAt:
      string | Date;

    patient: Patient;

    membershipPlan: MembershipPlan;
  };

type Props = {
  subscriptions:
    SubscriptionWithRelations[];

  patients: Patient[];

  plans: MembershipPlan[];
};

export function SubscriptionsTable({
  subscriptions,
  patients,
  plans,
}: Props) {
  return (
    <DataTableContainer
      title="Subscriptions"
      description="Track active memberships and subscription lifecycle."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Patient
            </TableHead>

            <TableHead>
              Plan
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead>
              Expires At
            </TableHead>

            <TableHead>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {subscriptions.map(
            (subscription) => (
              <TableRow
                key={subscription.id}
              >
                <TableCell>
                  {
                    subscription.patient
                      .fullName
                  }
                </TableCell>

                <TableCell>
                  {
                    subscription
                      .membershipPlan.name
                  }
                </TableCell>

                <TableCell>
                  {subscription.status}
                </TableCell>

                <TableCell>
                  {new Date(
                    subscription.expiresAt
                  ).toLocaleDateString()}
                </TableCell>

                <TableCell className="text-right">
                  <SubscriptionRowActions
                    subscription={{
                      id: subscription.id,

                      patientId:
                        subscription.patientId,

                      membershipPlanId:
                        subscription.membershipPlanId,

                      startedAt:
                        subscription.startedAt,

                      expiresAt:
                        subscription.expiresAt,
                    }}
                    patients={patients}
                    plans={plans}
                  />
                </TableCell>
              </TableRow>
            )
          )}

          {subscriptions.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-muted-foreground"
              >
                No subscriptions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}