"use client";

import { useState } from "react";

import { SubscriptionStatus } from "@prisma/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { useTranslations } from "@/i18n/provider";

import { SubscriptionRowActions } from "./subscription-row-actions";
import { SubscriptionStatusBadge } from "./subscription-status-badge";

type SubscriptionWithRelations = {
  id: string;
  patientId: string;
  membershipPlanId: string;
  status: SubscriptionStatus;
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
  canManageSubscriptions?: boolean;
};

export function SubscriptionsTable({
  subscriptions,
  patients,
  plans,
  selectedPlanId,
  selectedPatientId,
  canManageSubscriptions = true,
}: Props) {
  const t = useTranslations();
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
      title={t("subscriptions.title")}
      description={
        selectedPlanId ||
        selectedPatientId
          ? t(
              "subscriptions.table.filteredDescription"
            )
          : t("subscriptions.table.description")
      }
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
            <option value="all">
              {t("shared.filters.all")}
            </option>
            <option value="ACTIVE">
              {t("subscriptions.statuses.ACTIVE")}
            </option>
          <option value="PENDING">
              {t("subscriptions.statuses.PENDING")}
            </option>
            <option value="PAUSED">
              {t("subscriptions.statuses.PAUSED")}
            </option>
            <option value="OVERDUE">
              {t("subscriptions.statuses.OVERDUE")}
            </option>
            <option value="CANCELED">
              {t("subscriptions.statuses.CANCELED")}
            </option>
            <option value="EXPIRED">
              {t("subscriptions.statuses.EXPIRED")}
            </option>
          </select>
        </div>

        <div className="grid gap-2 sm:min-w-80">
          <label className="text-sm text-muted-foreground">
            {t("shared.filters.filterByPatientName")}
          </label>
          <input
            value={patientSearch}
            onChange={(event) =>
              setPatientSearch(
                event.target.value
              )
            }
            placeholder={t(
              "shared.filters.filterByPatientName"
            )}
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t("patients.table.patient")}
            </TableHead>

            <TableHead>
              {t("shared.labels.plan")}
            </TableHead>

            <TableHead>
              {t("shared.labels.status")}
            </TableHead>

            <TableHead>
              {t("shared.labels.expiresAt")}
            </TableHead>

            <TableHead>
              {t("shared.labels.actions")}
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
                  <SubscriptionStatusBadge
                    status={
                      subscription.status
                    }
                  />
                </TableCell>

                <TableCell>
                  {subscription.expiresAt
                    ? new Date(
                        subscription.expiresAt
                      ).toLocaleDateString()
                    : t("shared.states.noExpiration")}
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
                    canManageSubscriptions={
                      canManageSubscriptions
                    }
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
                {t("subscriptions.table.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
