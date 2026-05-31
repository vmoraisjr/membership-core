"use client";

import { useState } from "react";

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

type SubscriptionWithRelations = {
  id: string;
  patientId: string;
  membershipPlanId: string;
  status: string;
  startedAt: Date;
  expiresAt: Date | null;
  patient: {
    id: string;
    fullName: string;
  };
  membershipPlan: {
    id: string;
    name: string;
  };
};

type Props = {
  subscriptions: SubscriptionWithRelations[];

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
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [patientSearch, setPatientSearch] =
    useState("");

  const normalizedPatientSearch =
    patientSearch.trim().toLowerCase();

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

        if (
          statusFilter !== "all" &&
          subscription.status !==
            statusFilter
        ) {
          return false;
        }

        if (
          normalizedPatientSearch.length >
            0 &&
          !subscription.patient.fullName
            .toLowerCase()
            .includes(
              normalizedPatientSearch
            )
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
            <option value="ACTIVE">
              Active
            </option>
            <option value="PENDING">
              Pending
            </option>
            <option value="OVERDUE">
              Overdue
            </option>
            <option value="CANCELED">
              Canceled
            </option>
            <option value="EXPIRED">
              Expired
            </option>
          </select>
        </div>

        <div className="grid gap-2 sm:min-w-80">
          <label className="text-sm text-muted-foreground">
            Filter by patient name
          </label>
          <input
            value={patientSearch}
            onChange={(event) =>
              setPatientSearch(
                event.target.value
              )
            }
            placeholder="Search patient name"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

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
                      status: subscription.status,
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
