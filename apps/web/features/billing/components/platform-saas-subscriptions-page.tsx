import {
  ArrowRightLeft,
  Ban,
  CircleCheckBig,
  Filter,
  FlaskConical,
  PauseCircle,
  Search,
  ShieldAlert,
  WalletCards,
  XCircle,
} from "lucide-react";
import { ClinicSubscriptionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { CompanyAvatarMark } from "@/components/dashboard/company-avatar-mark";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
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
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";
import { getClinicSubscriptionStatusTone } from "@/features/clinic/utils/clinic-status";

import {
  platformAssignClinicBillingPlanAction,
  platformUpdateClinicSubscriptionStatusAction,
} from "../actions/platform-manage-clinic-subscription";
import {
  canTransitionClinicSubscriptionStatus,
  getPlatformClinicBillingOverview,
} from "../services/billing-foundation";
import { SaasSubscriptionDetailsPanel } from "./saas-subscription-details-panel";

type Props = {
  filters: {
    clinicId?: string;
    planId?: string;
    status?: string;
    query?: string;
  };
};

function formatOptionalDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "Não definido";
  }

  return new Date(value).toLocaleDateString(
    "pt-BR"
  );
}

export async function PlatformSaasSubscriptionsPage({
  filters,
}: Props) {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);

  if (
    !hasPermission(
      role,
      "billing",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("billing.accessDeniedTitle")}
          description={t("billing.accessDeniedDescription")}
        />
      </DashboardPage>
    );
  }

  if (
    currentUser?.clinicId ||
    (currentUser?.role !== "OWNER" &&
      currentUser?.role !== "ADMIN")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Área exclusiva da plataforma"
          description="As assinaturas SaaS das contas clientes são administradas apenas pela equipe da plataforma."
        />
      </DashboardPage>
    );
  }

  const overview =
    await getPlatformClinicBillingOverview();
  const normalizedQuery =
    filters.query?.trim().toLowerCase() ??
    "";
  const filteredSubscriptions =
    overview.clinicSubscriptions.filter(
      (subscription) => {
        if (
          filters.clinicId &&
          subscription.clinicId !==
            filters.clinicId
        ) {
          return false;
        }

        if (
          filters.planId &&
          subscription.clinicBillingPlanId !==
            filters.planId
        ) {
          return false;
        }

        if (
          filters.status &&
          subscription.status !==
            filters.status
        ) {
          return false;
        }

        if (
          normalizedQuery &&
          ![
            subscription.clinic.brandName ??
              "",
            subscription.clinic.name,
            subscription.clinic.email,
            subscription.clinicBillingPlan
              .name,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        ) {
          return false;
        }

        return true;
      }
    );
  const clinicOptions = Array.from(
    new Map(
      overview.clinicSubscriptions.map(
        (subscription) => [
          subscription.clinicId,
          {
            id: subscription.clinicId,
            name:
              subscription.clinic
                .brandName ??
              subscription.clinic.name,
          },
        ]
      )
    ).values()
  );

  const availableStatusActions: Array<{
    status: ClinicSubscriptionStatus;
    labelKey: string;
    icon: typeof CircleCheckBig;
    variant:
      | "outline"
      | "destructive";
  }> = [
    {
      status: ClinicSubscriptionStatus.ACTIVE,
      labelKey: "billing.actions.markActive",
      icon: CircleCheckBig,
      variant: "outline",
    },
    {
      status: ClinicSubscriptionStatus.TRIAL,
      labelKey: "billing.actions.sendToTrial",
      icon: FlaskConical,
      variant: "outline",
    },
    {
      status: ClinicSubscriptionStatus.SUSPENDED,
      labelKey: "billing.actions.suspend",
      icon: PauseCircle,
      variant: "outline",
    },
    {
      status: ClinicSubscriptionStatus.CANCELED,
      labelKey: "billing.actions.cancelSubscription",
      icon: Ban,
      variant: "destructive",
    },
  ];
  const activeCount =
    overview.clinicSubscriptions.filter(
      (subscription) =>
        subscription.status ===
        ClinicSubscriptionStatus.ACTIVE
    ).length;
  const trialCount =
    overview.clinicSubscriptions.filter(
      (subscription) =>
        subscription.status ===
        ClinicSubscriptionStatus.TRIAL
    ).length;
  const pastDueCount =
    overview.clinicSubscriptions.filter(
      (subscription) =>
        subscription.status ===
          ClinicSubscriptionStatus.PAST_DUE ||
        subscription.status ===
          ClinicSubscriptionStatus.SUSPENDED
    ).length;
  const canceledCount =
    overview.clinicSubscriptions.filter(
      (subscription) =>
        subscription.status ===
        ClinicSubscriptionStatus.CANCELED
    ).length;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Receita recorrente"
        title={t(
          "billing.subscriptionsPage.title"
        )}
        description={t(
          "billing.subscriptionsPage.description"
        )}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label={t(
            "billing.subscriptionsPage.metrics.active"
          )}
          value={String(activeCount)}
          hint={t(
            "billing.subscriptionsPage.metrics.activeHint"
          )}
          icon={
            <CircleCheckBig className="size-5" />
          }
          tone="success"
        />
        <MetricCard
          label={t(
            "billing.subscriptionsPage.metrics.trial"
          )}
          value={String(trialCount)}
          hint={t(
            "billing.subscriptionsPage.metrics.trialHint"
          )}
          icon={<FlaskConical className="size-5" />}
          tone="info"
        />
        <MetricCard
          label={t(
            "billing.subscriptionsPage.metrics.pastDue"
          )}
          value={String(pastDueCount)}
          hint={t(
            "billing.subscriptionsPage.metrics.pastDueHint"
          )}
          icon={<ShieldAlert className="size-5" />}
          tone="warning"
        />
        <MetricCard
          label={t(
            "billing.subscriptionsPage.metrics.canceled"
          )}
          value={String(canceledCount)}
          hint={t(
            "billing.subscriptionsPage.metrics.canceledHint"
          )}
          icon={<XCircle className="size-5" />}
          tone="danger"
        />
        <MetricCard
          label={t(
            "billing.subscriptionsPage.metrics.mrr"
          )}
          value={formatCurrency(
            overview.platformMetrics
              .monthlySaasRevenue
          )}
          hint={t(
            "billing.subscriptionsPage.metrics.mrrHint"
          )}
          icon={<WalletCards className="size-5" />}
          tone="brand"
        />
      </div>

      <DataTableContainer
        title="Fila de assinaturas"
        description="Cada linha mostra a empresa, o plano vigente, o vencimento mais recente e as ações disponíveis."
        toolbar={
          <form
            method="get"
            className="grid gap-4 lg:grid-cols-[220px_220px_220px_minmax(0,1fr)_auto]"
          >
            <label className="field-stack">
              <span className="field-label">
                {t(
                  "billing.subscriptionsPage.filters.company"
                )}
              </span>
              <Select
                name="clinicId"
                defaultValue={
                  filters.clinicId ?? ""
                }
              >
                <option value="">
                  {t(
                    "billing.subscriptionsPage.filters.allCompanies"
                  )}
                </option>
                {clinicOptions.map((clinic) => (
                  <option
                    key={clinic.id}
                    value={clinic.id}
                  >
                    {clinic.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                {t(
                  "billing.subscriptionsPage.filters.plan"
                )}
              </span>
              <Select
                name="planId"
                defaultValue={
                  filters.planId ?? ""
                }
              >
                <option value="">
                  {t("shared.filters.allPlans")}
                </option>
                {overview.allPlans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                {t("shared.filters.statusFilter")}
              </span>
              <Select
                name="status"
                defaultValue={
                  filters.status ?? ""
                }
              >
                <option value="">
                  {t("shared.filters.all")}
                </option>
                {Object.values(
                  ClinicSubscriptionStatus
                ).map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {t(
                      `billing.status.${status}`
                    )}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                {t(
                  "billing.subscriptionsPage.filters.searchLabel"
                )}
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="query"
                  defaultValue={
                    filters.query ?? ""
                  }
                  placeholder={t(
                    "billing.subscriptionsPage.filters.searchPlaceholder"
                  )}
                  className="pl-9"
                />
              </div>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">
                <Filter className="size-4" />
                {t("shared.actions.applyFilters")}
              </Button>
              <Button
                type="button"
                asChild
                variant="outline"
              >
                <a href="/dashboard/billing/subscriptions">
                  {t("shared.actions.clear")}
                </a>
              </Button>
            </div>
          </form>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t(
                  "billing.subscriptionsPage.table.company"
                )}
              </TableHead>
              <TableHead>
                {t(
                  "billing.subscriptionsPage.table.planApplied"
                )}
              </TableHead>
              <TableHead>
                {t("shared.labels.status")}
              </TableHead>
              <TableHead>
                {t(
                  "billing.subscriptionsPage.table.validity"
                )}
              </TableHead>
              <TableHead>
                {t(
                  "billing.subscriptionsPage.table.lastCharge"
                )}
              </TableHead>
              <TableHead className="text-right">
                {t("shared.labels.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length ===
            0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="p-0"
                >
                  <EmptyState
                    title={t(
                      "billing.subscriptionsPage.empty.title"
                    )}
                    description={t(
                      "billing.subscriptionsPage.empty.description"
                    )}
                    action={
                      <Button
                        type="button"
                        asChild
                        variant="outline"
                      >
                        <a href="/dashboard/billing/subscriptions">
                          {t(
                            "shared.actions.clear"
                          )}
                        </a>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map(
                (subscription) => {
                  const latestInvoice =
                    subscription.invoices[0];

                  return (
                    <TableRow
                      key={subscription.id}
                    >
                      <TableCell className="align-top">
                        <div className="flex items-start gap-3">
                          <CompanyAvatarMark
                            name={
                              subscription
                                .clinic
                                .brandName ??
                              subscription
                                .clinic.name
                            }
                            seed={
                              subscription.clinicId
                            }
                            className="mt-0.5"
                          />
                          <div className="space-y-1">
                            <div className="font-medium">
                              {subscription
                                .clinic
                                .brandName ??
                                subscription
                                  .clinic.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {
                                subscription
                                  .clinic.email
                              }
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[18rem] align-top">
                        <form
                          action={platformAssignClinicBillingPlanAction}
                          className="grid gap-2"
                        >
                          <input
                            type="hidden"
                            name="subscriptionId"
                            value={subscription.id}
                          />
                          <Select
                            name="clinicBillingPlanId"
                            defaultValue={
                              subscription.clinicBillingPlanId
                            }
                            className="h-10"
                          >
                            {overview.allPlans.map(
                              (plan) => (
                                <option
                                  key={plan.id}
                                  value={plan.id}
                                >
                                  {plan.name}
                                </option>
                              )
                            )}
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {t(
                              "billing.subscriptionsPage.table.changePlanHint"
                            )}
                          </p>
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="justify-start"
                          >
                            <ArrowRightLeft className="size-4" />
                            {t(
                              "billing.subscriptionsPage.table.changePlan"
                            )}
                          </Button>
                        </form>
                      </TableCell>

                      <TableCell className="align-top">
                        <StatusIndicator
                          tone={getClinicSubscriptionStatusTone(
                            subscription.status
                          )}
                          label={t(
                            `billing.status.${subscription.status}`
                          )}
                        />
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>
                            {t(
                              "billing.subscriptionsPage.table.start"
                            )}
                            :{" "}
                            {formatOptionalDate(
                              subscription.startedAt
                            )}
                          </div>
                          <div>
                            {t(
                              "billing.subscriptionsPage.table.trialUntil"
                            )}
                            :{" "}
                            {formatOptionalDate(
                              subscription.trialEndsAt
                            )}
                          </div>
                          <div>
                            {t(
                              "billing.subscriptionsPage.table.expiresAt"
                            )}
                            :{" "}
                            {formatOptionalDate(
                              subscription.expiresAt
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        {latestInvoice ? (
                          <div className="space-y-1 text-xs">
                            <div>
                              {formatOptionalDate(
                                latestInvoice.dueDate
                              )}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(
                                latestInvoice.amount
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t(
                              "billing.subscriptionsPage.table.noChargeIssued"
                            )}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="align-top text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <SaasSubscriptionDetailsPanel
                            clinicName={
                              subscription
                                .clinic
                                .brandName ??
                              subscription
                                .clinic.name
                            }
                            clinicEmail={
                              subscription
                                .clinic.email
                            }
                            currentPlan={
                              subscription
                                .clinicBillingPlan
                                .name
                            }
                            currentStatus={t(
                              `billing.status.${subscription.status}`
                            )}
                            startedAt={
                              subscription.startedAt
                            }
                            trialEndsAt={
                              subscription.trialEndsAt
                            }
                            expiresAt={
                              subscription.expiresAt
                            }
                            latestInvoice={
                              latestInvoice
                                ? {
                                    dueDate:
                                      latestInvoice.dueDate,
                                    amount:
                                      latestInvoice.amount,
                                  }
                                : null
                            }
                          />
                          {availableStatusActions
                            .filter(
                              (action) =>
                                canTransitionClinicSubscriptionStatus(
                                  subscription.status,
                                  action.status
                                )
                            )
                            .map((action) => {
                              const Icon =
                                action.icon;
                              const label = t(
                                action.labelKey
                              );

                              return (
                                <form
                                  key={
                                    action.status
                                  }
                                  action={platformUpdateClinicSubscriptionStatusAction}
                                >
                                  <input
                                    type="hidden"
                                    name="clinicId"
                                    value={
                                      subscription.clinicId
                                    }
                                  />
                                  <input
                                    type="hidden"
                                    name="subscriptionId"
                                    value={
                                      subscription.id
                                    }
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value={
                                      action.status
                                    }
                                  />
                                  <Button
                                    type="submit"
                                    size="icon-sm"
                                    variant={
                                      action.variant
                                    }
                                    title={label}
                                    aria-label={
                                      label
                                    }
                                  >
                                    <Icon className="size-4" />
                                  </Button>
                                </form>
                              );
                            })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </DataTableContainer>
    </DashboardPage>
  );
}
