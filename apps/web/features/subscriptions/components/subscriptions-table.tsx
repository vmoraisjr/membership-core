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

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/formatters";

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
    monthlyPrice: number | null;
  };
  patientInvoices?: Array<{
    dueDate: Date;
  }>;
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

  const hasAnyFilterApplied =
    statusFilter !== "all" ||
    normalizedPatientSearch.length > 0 ||
    Boolean(selectedPlanId) ||
    Boolean(selectedPatientId);

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
      toolbar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("shared.filters.statusFilter")}
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
            </Select>
          </div>

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              {t("shared.filters.filterByPatientName")}
            </label>
            <Input
              value={patientSearch}
              onChange={(event) =>
                setPatientSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "shared.filters.filterByPatientName"
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
              {t("patients.table.patient")}
            </TableHead>

            <TableHead>
              {t("shared.labels.plan")}
            </TableHead>

            <TableHead>
              {t("shared.labels.amount")}
            </TableHead>

            <TableHead>
              {t("shared.labels.startDate")}
            </TableHead>

            <TableHead>
              {t("shared.labels.expiresAt")}
            </TableHead>

            <TableHead>
              {t(
                "subscriptions.table.nextPayment"
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
          {visibleSubscriptions.map(
            (subscription) => (
              <TableRow
                key={subscription.id}
              >
                <TableCell className="min-w-[14rem] align-top">
                  <div className="flex items-center gap-2.5">
                    <CompanyAvatarMark
                      name={
                        subscription.patient
                          .fullName
                      }
                      seed={
                        subscription.patientId
                      }
                    />
                    {
                      subscription.patient
                        .fullName
                    }
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  {
                    subscription
                      .membershipPlan.name
                  }
                </TableCell>

                <TableCell className="align-top">
                  {formatCurrency(
                    subscription
                      .membershipPlan
                      .monthlyPrice
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {formatDate(
                    subscription.startedAt
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {subscription.expiresAt
                    ? formatDate(
                        subscription.expiresAt
                      )
                    : t("shared.states.noExpiration")}
                </TableCell>

                <TableCell className="align-top text-sm text-muted-foreground">
                  {subscription
                    .patientInvoices?.[0]
                    ?.dueDate
                    ? formatDate(
                        subscription
                          .patientInvoices[0]
                          .dueDate
                      )
                    : "—"}
                </TableCell>

                <TableCell className="align-top">
                  <SubscriptionStatusBadge
                    status={
                      subscription.status
                    }
                  />
                </TableCell>

                <TableCell className="text-right align-top">
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
                colSpan={8}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    hasAnyFilterApplied
                      ? "subscriptions.table.noResultsTitle"
                      : "subscriptions.table.emptyTitle"
                  )}
                  description={t(
                    hasAnyFilterApplied
                      ? "subscriptions.table.noResultsDescription"
                      : "subscriptions.table.emptyDescription"
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
