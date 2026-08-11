"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  ClinicStatus,
  ClinicSubscriptionStatus,
} from "@prisma/client";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  StatusIndicator,
} from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/i18n/provider";
import { formatCurrency } from "@/lib/formatters";

import {
  getClinicStatusTone,
  getClinicSubscriptionStatusTone,
} from "../utils/clinic-status";

import { ClinicRowActions } from "./clinic-row-actions";

type ClinicTableItem = {
  id: string;
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  slug: string;
  document: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  address: string;
  status: ClinicStatus;
  createdAt: Date;
  monthlyRevenue: number;
  _count: {
    patients: number;
    membershipPlans: number;
    appUsers: number;
  };
  clinicSubscriptions: Array<{
    id: string;
    status: ClinicSubscriptionStatus;
    clinicBillingPlan: {
      name: string;
    };
  }>;
};

type Props = {
  clinics: ClinicTableItem[];
  canManageClinic?: boolean;
  isPlatformView?: boolean;
};

export function ClinicTable({
  clinics,
  canManageClinic = true,
  isPlatformView = false,
}: Props) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] =
    useState("active");
  const [planFilter, setPlanFilter] =
    useState("all");
  const [search, setSearch] =
    useState("");

  const planOptions = useMemo(() => {
    const names = new Set<string>();

    clinics.forEach((clinic) => {
      const planName =
        clinic.clinicSubscriptions[0]
          ?.clinicBillingPlan.name;

      if (planName) {
        names.add(planName);
      }
    });

    return Array.from(names).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [clinics]);

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleClinics =
    clinics.filter((clinic) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          clinic.status ===
            ClinicStatus.ACTIVE) ||
        (statusFilter ===
          "inactive" &&
          clinic.status ===
            ClinicStatus.INACTIVE);

      const matchesPlan =
        planFilter === "all" ||
        clinic.clinicSubscriptions[0]
          ?.clinicBillingPlan.name ===
          planFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        clinic.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (clinic.brandName ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        clinic.slug
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesStatus &&
        matchesPlan &&
        matchesSearch
      );
    });

  const activeClinicsCount =
    clinics.filter(
      (clinic) =>
        clinic.status ===
        ClinicStatus.ACTIVE
    ).length;

  return (
    <DataTableContainer
      title={
        isPlatformView
          ? t(
              "clinics.table.platformTitle"
            )
          : t(
              "clinics.table.clinicTitle"
            )
      }
      description={t(
        "clinics.table.activeCountDescription",
        { count: activeClinicsCount }
      )}
      toolbar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-4 sm:grid-cols-2">
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
                <option value="active">
                  {t(
                    "clinics.table.filters.statusActive"
                  )}
                </option>
                <option value="inactive">
                  {t(
                    "clinics.table.filters.statusInactive"
                  )}
                </option>
                <option value="all">
                  {t(
                    "clinics.table.filters.statusAll"
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
                onChange={(event) =>
                  setPlanFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  {t(
                    "shared.filters.allPlans"
                  )}
                </option>
                {planOptions.map(
                  (planName) => (
                    <option
                      key={planName}
                      value={planName}
                    >
                      {planName}
                    </option>
                  )
                )}
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "clinics.table.filters.searchLabel"
              )}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={t(
                  "clinics.table.filters.searchPlaceholder"
                )}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {t(
                "clinics.table.columns.company"
              )}
            </TableHead>
            <TableHead>
              {t("shared.labels.status")}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.plan"
              )}
            </TableHead>
            <TableHead>
              {t(
                "shared.labels.subscription"
              )}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.users"
              )}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.patients"
              )}
            </TableHead>
            <TableHead>
              {t(
                "clinics.table.columns.revenue"
              )}
            </TableHead>
            <TableHead>
              {t(
                "shared.labels.actions"
              )}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleClinics.map((clinic) => {
            const subscription =
              clinic
                .clinicSubscriptions[0] ??
              null;

            return (
              <TableRow key={clinic.id}>
                <TableCell className="min-w-[16rem] align-top">
                  <div className="flex items-start gap-3">
                    <CompanyAvatarMark
                      name={
                        clinic.brandName ||
                        clinic.name
                      }
                      seed={clinic.id}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="font-medium">
                        {clinic.brandName ||
                          clinic.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {clinic.slug}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <StatusIndicator
                    tone={getClinicStatusTone(
                      clinic.status
                    )}
                    label={t(
                      `clinics.status.${clinic.status}`
                    )}
                  />
                </TableCell>

                <TableCell className="align-top">
                  {subscription ? (
                    subscription
                      .clinicBillingPlan.name
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "clinics.table.noPlan"
                      )}
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {subscription ? (
                    <StatusIndicator
                      tone={getClinicSubscriptionStatusTone(
                        subscription.status
                      )}
                      label={t(
                        `billing.status.${subscription.status}`
                      )}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "clinics.table.noPlan"
                      )}
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {clinic._count.appUsers}
                </TableCell>

                <TableCell className="align-top">
                  {clinic._count.patients}
                </TableCell>

                <TableCell className="align-top">
                  {formatCurrency(
                    clinic.monthlyRevenue
                  )}
                </TableCell>

                <TableCell className="align-top">
                  <ClinicRowActions
                    clinic={clinic}
                    canManageClinic={
                      canManageClinic
                    }
                    isPlatformView={
                      isPlatformView
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}

          {visibleClinics.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    "clinics.table.empty.title"
                  )}
                  description={t(
                    "clinics.table.empty.description"
                  )}
                  action={
                    canManageClinic &&
                    isPlatformView ? (
                      <div className="pt-2">
                        <span className="workspace-kicker">
                          {t(
                            "clinics.table.empty.actionHint"
                          )}
                        </span>
                      </div>
                    ) : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
