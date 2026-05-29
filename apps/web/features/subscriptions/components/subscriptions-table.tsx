"use client";

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
      string | Date | null;

    patient: Patient;

    membershipPlan: MembershipPlan;
  };

type Props = {
  subscriptions:
    SubscriptionWithRelations[];

  patients: Array<{
    id: string;
    fullName: string;
  }>;

  plans: Array<{
    id: string;
    name: string;
  }>;

  selectedPlanId?: string;

  selectedPatientId?: string;
};

export function SubscriptionsTable({
  subscriptions,
  patients,
  plans,
  selectedPlanId,
  selectedPatientId,
}: Props) {
  const visibleSubscriptions =
    subscriptions.filter(
      (subscription) => {
        if (
          selectedPlanId &&
          subscription.membershipPlanId !==
            selectedPlanId
        ) {
          return false;
        }

        if (
          selectedPatientId &&
          subscription.patientId !==
            selectedPatientId
        ) {
          return false;
        }

        return true;
      }
    );

  return (
    <DataTableContainer
      title="Subscriptions"
      description={
        selectedPlanId ||
        selectedPatientId
          ? "Showing subscriptions for the selected context."
          : "Track active, pending, overdue, canceled, and expired memberships."
      }
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
          {visibleSubscriptions.map(
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
                  {subscription.expiresAt
                    ? new Date(
                        subscription.expiresAt
                      ).toLocaleDateString()
                    : "No expiration"}
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
                        subscription.expiresAt ??
                        subscription.startedAt,
                    }}
                    patients={patients}
                    plans={plans}
                  />
                </TableCell>
              </TableRow>
            )
          )}

          {visibleSubscriptions.length ===
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
