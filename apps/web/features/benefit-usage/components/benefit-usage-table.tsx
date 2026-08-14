"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { BenefitUsageStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { cancelBenefitUsageAction } from "../actions/cancel-benefit-usage";

import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { atendimentosUrl, clienteUrl } from "@/lib/company-routes";
import {
  legendSection,
  BENEFIT_USAGE_STATUS_LEGEND,
} from "@/lib/legend-content";

type BenefitUsageHistoryItem = {
  id: string;
  quantity: number;
  usedBy: string;
  usedAt: Date;
  status: BenefitUsageStatus;
  canceledAt: Date | null;
  notes: string | null;
  subscription: {
    id: string;
    patientId: string;
    patient: {
      id: string;
      fullName: string;
    };
    membershipPlan: {
      id: string;
      name: string;
    };
  };
  membershipBenefit: {
    id: string;
    title: string;
  };
};

type Props = {
  usages: BenefitUsageHistoryItem[];
  canCancelBenefitUsage?: boolean;
  linkToPatient?: boolean;
};

const PERIOD_OPTIONS = [
  { value: "all", labelKey: "shared.filters.allPeriods" },
  { value: "30", labelKey: "shared.filters.last30Days" },
  { value: "90", labelKey: "shared.filters.last90Days" },
] as const;

type PeriodFilter =
  (typeof PERIOD_OPTIONS)[number]["value"];

function isWithinPeriod(
  usedAt: Date,
  period: PeriodFilter
) {
  if (period === "all") {
    return true;
  }

  const days = period === "30" ? 30 : 90;
  const cutoff = new Date(
    Date.now() -
      days * 24 * 60 * 60 * 1000
  );

  return new Date(usedAt) >= cutoff;
}

export function BenefitUsageTable({
  usages,
  canCancelBenefitUsage = false,
  linkToPatient = false,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(
    () =>
      (linkToPatient &&
        searchParams.get("query")) ||
      ""
  );
  const [statusFilter, setStatusFilter] =
    useState(
      () =>
        (linkToPatient &&
          searchParams.get("status")) ||
        "all"
    );
  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>(() => {
      const fromUrl =
        linkToPatient &&
        searchParams.get("period");
      return fromUrl &&
        PERIOD_OPTIONS.some(
          (option) => option.value === fromUrl
        )
        ? (fromUrl as PeriodFilter)
        : "all";
    });
  const [isPending, startTransition] =
    useTransition();

  const normalizedSearch =
    search.trim().toLowerCase();

  const currentAtendimentosUrl = useMemo(
    () =>
      atendimentosUrl({
        query:
          search.trim().length > 0
            ? search
            : undefined,
        status:
          statusFilter !== "all"
            ? statusFilter
            : undefined,
        period:
          periodFilter !== "all"
            ? periodFilter
            : undefined,
      }),
    [search, statusFilter, periodFilter]
  );

  const didMount = useRef(false);

  useEffect(() => {
    if (!linkToPatient) {
      return;
    }

    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const handle = setTimeout(() => {
      router.replace(
        currentAtendimentosUrl,
        { scroll: false }
      );
    }, 300);

    return () => clearTimeout(handle);
  }, [
    linkToPatient,
    currentAtendimentosUrl,
    router,
  ]);

  const visibleUsages = usages.filter(
    (usage) => {
      if (
        statusFilter === "active" &&
        usage.status !==
          BenefitUsageStatus.ACTIVE
      ) {
        return false;
      }

      if (
        statusFilter === "canceled" &&
        usage.status !==
          BenefitUsageStatus.CANCELED
      ) {
        return false;
      }

      if (
        !isWithinPeriod(
          usage.usedAt,
          periodFilter
        )
      ) {
        return false;
      }

      if (
        normalizedSearch.length === 0
      ) {
        return true;
      }

      return [
        usage.subscription.patient
          .fullName,
        usage.membershipBenefit.title,
        usage.usedBy,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(
            normalizedSearch
          )
      );
    }
  );

  const hasAnyFilterApplied =
    statusFilter !== "all" ||
    periodFilter !== "all" ||
    normalizedSearch.length > 0;

  function handleCancelUsage(
    usageId: string,
    reason: string
  ) {
    startTransition(async () => {
      try {
        const formData =
          new FormData();
        formData.set("usageId", usageId);
        formData.set("reason", reason);
        await cancelBenefitUsageAction(
          formData
        );
        toast.success(
          t(
            "benefitUsage.table.cancelSuccess"
          )
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t(
                "benefitUsage.table.cancelError"
              )
        );
      }
    });
  }

  return (
    <DataTableContainer
      title={t("benefitUsage.table.title")}
      description={t(
        "benefitUsage.table.description"
      )}
      helpLegend={[
        legendSection(
          "Status de uso",
          BENEFIT_USAGE_STATUS_LEGEND
        ),
        legendSection("Ações", [
          {
            label: "Cancelar uso",
            description:
              "Anula um uso registrado por engano — só OWNER e ADMIN podem cancelar.",
          },
        ]),
      ]}
      toolbar={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <option value="all">
                {t("shared.filters.all")}
              </option>
              <option value="active">
                {t("shared.states.active")}
              </option>
              <option value="canceled">
                {t(
                  "shared.states.canceled"
                )}
              </option>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "shared.filters.periodFilter"
              )}
            </label>
            <Select
              value={periodFilter}
              onChange={(event) =>
                setPeriodFilter(
                  event.target
                    .value as PeriodFilter
                )
              }
            >
              {PERIOD_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {t(option.labelKey)}
                  </option>
                )
              )}
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t(
                "benefitUsage.table.searchLabel"
              )}
            </label>
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "benefitUsage.table.searchLabel"
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
              {t("shared.labels.benefit")}
            </TableHead>
            <TableHead>
              {t(
                "benefitUsage.table.operator"
              )}
            </TableHead>
            <TableHead>
              {t("shared.labels.date")}
            </TableHead>
            <TableHead>
              {t(
                "shared.labels.quantity"
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
          {visibleUsages.map((usage) => (
            <TableRow key={usage.id}>
              <TableCell className="align-top">
                <div className="flex items-center gap-2.5">
                  <CompanyAvatarMark
                    name={
                      usage.subscription
                        .patient.fullName
                    }
                    seed={
                      usage.subscription
                        .patientId
                    }
                  />
                  {linkToPatient ? (
                    <Link
                      href={clienteUrl(
                        usage.subscription
                          .patient.id,
                        {
                          tab: "benefits",
                          returnTo:
                            currentAtendimentosUrl,
                        }
                      )}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {
                        usage.subscription
                          .patient.fullName
                      }
                    </Link>
                  ) : (
                    usage.subscription
                      .patient.fullName
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top">
                {
                  usage.membershipBenefit
                    .title
                }
              </TableCell>
              <TableCell className="align-top">
                {usage.usedBy}
              </TableCell>
              <TableCell className="align-top">
                {formatDate(usage.usedAt)}
              </TableCell>
              <TableCell className="align-top">
                {usage.quantity}
              </TableCell>
              <TableCell className="align-top">
                <StatusIndicator
                  tone={
                    usage.status ===
                    BenefitUsageStatus.CANCELED
                      ? "danger"
                      : "success"
                  }
                  label={
                    usage.status ===
                    BenefitUsageStatus.CANCELED
                      ? t(
                          "benefitUsage.table.canceledOn",
                          {
                            date: usage.canceledAt
                              ? formatDate(
                                  usage.canceledAt
                                )
                              : "",
                          }
                        )
                      : t(
                          "shared.states.active"
                        )
                  }
                />
              </TableCell>
              <TableCell className="align-top">
                {canCancelBenefitUsage &&
                usage.status ===
                  BenefitUsageStatus.ACTIVE ? (
                  <ConfirmDialog
                    title={t(
                      "benefitUsage.table.cancelTitle"
                    )}
                    description={t(
                      "benefitUsage.table.cancelDescription"
                    )}
                    actionLabel={t(
                      "benefitUsage.table.cancelAction"
                    )}
                    detailsLabel={t(
                      "benefitUsage.table.cancelReasonLabel"
                    )}
                    detailsPlaceholder={t(
                      "benefitUsage.table.cancelReasonPlaceholder"
                    )}
                    detailsRequired
                    detailsInput="textarea"
                    onConfirm={({
                      detailsValue,
                    }) =>
                      handleCancelUsage(
                        usage.id,
                        detailsValue
                      )
                    }
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          isPending
                        }
                      >
                        {t(
                          "benefitUsage.table.cancelUsage"
                        )}
                      </Button>
                    }
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {usage.status ===
                    BenefitUsageStatus.CANCELED
                      ? t(
                          "shared.states.historicalRecord"
                        )
                      : t(
                          "shared.states.noActions"
                        )}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}

          {visibleUsages.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title={t(
                    hasAnyFilterApplied
                      ? "benefitUsage.table.noResultsTitle"
                      : "benefitUsage.table.emptyTitle"
                  )}
                  description={t(
                    hasAnyFilterApplied
                      ? "benefitUsage.table.noResultsDescription"
                      : "benefitUsage.table.emptyDescription"
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
