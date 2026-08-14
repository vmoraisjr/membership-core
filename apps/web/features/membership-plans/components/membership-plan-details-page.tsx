import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { clienteUrl, planosUrl, planoUrl } from "@/lib/company-routes";
import { MembershipBenefitDialog } from "@/features/membership-benefits/components/membership-benefit-dialog";
import { MembershipBenefitRowActions } from "@/features/membership-benefits/components/membership-benefit-row-actions";
import { SubscriptionStatusBadge } from "@/features/subscriptions/components/subscription-status-badge";
import {
  legendSection,
  BENEFIT_STATUS_LEGEND,
  SUBSCRIPTION_STATUS_LEGEND,
} from "@/lib/legend-content";

import { getMembershipPlanById } from "../services/get-membership-plan-by-id";

type Props = {
  planId: string;
};

export async function MembershipPlanDetailsPage({
  planId,
}: Props) {
  const t = getTranslations();
  const role = await getCurrentUserRole();

  if (
    !hasPermission(role, "plans", "view")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t(
            "plans.accessDeniedTitle"
          )}
          description={t(
            "plans.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  const {
    plan,
    activeSubscriptions,
    estimatedMonthlyRevenue,
    timeline,
  } = await getMembershipPlanById(planId);

  const canManageBenefits = hasPermission(
    role,
    "benefits",
    "manage"
  );
  const canDeleteBenefitsPermanently =
    hasPermission(
      role,
      "benefits",
      "deletePermanent"
    );
  const planOption = [
    { id: plan.id, name: plan.name },
  ];

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={t("shared.labels.plan")}
        title={plan.name}
        description={
          plan.description ||
          t("shared.states.noDescription")
        }
        meta={
          <StatusIndicator
            tone={
              plan.active
                ? "success"
                : "neutral"
            }
            label={
              plan.active
                ? t("shared.states.active")
                : t(
                    "shared.states.inactive"
                  )
            }
          />
        }
        action={
          <Button asChild variant="outline">
            <Link href={planosUrl()}>
              <ArrowLeft className="size-4" />
              {t(
                "plans.details.backToList"
              )}
            </Link>
          </Button>
        }
      />

      <SectionCard
        title={t(
          "plans.details.overviewTitle"
        )}
        description={t(
          "plans.details.overviewDescription"
        )}
      >
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="detail-field">
            <p className="detail-field-label">
              {t(
                "plans.dialog.monthlyPrice"
              )}
            </p>
            <p className="detail-field-value">
              {formatCurrency(
                plan.monthlyPrice
              )}
            </p>
          </div>
          <div className="detail-field">
            <p className="detail-field-label">
              {t("plans.table.annualPrice")}
            </p>
            <p className="detail-field-value">
              {plan.annualPrice
                ? formatCurrency(
                    plan.annualPrice
                  )
                : "—"}
            </p>
          </div>
          <div className="detail-field">
            <p className="detail-field-label">
              {t(
                "plans.table.activeSubscriptions"
              )}
            </p>
            <p className="detail-field-value">
              {activeSubscriptions.length}
            </p>
          </div>
          <div className="detail-field">
            <p className="detail-field-label">
              {t(
                "shared.labels.registrationDate"
              )}
            </p>
            <p className="detail-field-value">
              {formatDate(plan.createdAt)}
            </p>
          </div>
        </div>
      </SectionCard>

      <MetricGrid columns="four">
        <MetricCard
          label={t(
            "plans.details.estimatedRevenue"
          )}
          value={formatCurrency(
            estimatedMonthlyRevenue
          )}
          hint={t(
            "plans.details.estimatedRevenueHint"
          )}
        />
      </MetricGrid>

      <SectionCard
        title={t(
          "plans.details.benefitsTitle"
        )}
        description={t(
          "plans.details.benefitsDescription"
        )}
        helpLegend={[
          legendSection(
            "Status do benefício",
            BENEFIT_STATUS_LEGEND
          ),
        ]}
        action={
          canManageBenefits &&
          plan.active ? (
            <MembershipBenefitDialog
              plans={planOption}
              defaultMembershipPlanId={
                plan.id
              }
              trigger={
                <Button size="sm">
                  {t("benefits.new")}
                </Button>
              }
            />
          ) : undefined
        }
      >
        {plan.benefits.length === 0 ? (
          <EmptyState
            title={t(
              "plans.details.noBenefits"
            )}
            description=""
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("shared.labels.benefit")}
                </TableHead>
                <TableHead>
                  {t("shared.labels.status")}
                </TableHead>
                <TableHead>
                  {t(
                    "shared.labels.quantity"
                  )}
                </TableHead>
                <TableHead className="text-right">
                  {t("shared.labels.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.benefits.map(
                (benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell>
                      {benefit.title}
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        tone={
                          benefit.active
                            ? "success"
                            : "neutral"
                        }
                        label={
                          benefit.active
                            ? t(
                                "shared.states.active"
                              )
                            : t(
                                "shared.states.inactive"
                              )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {benefit.usageLimit ??
                        "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MembershipBenefitRowActions
                        benefit={{
                          id: benefit.id,
                          membershipPlanId:
                            benefit.membershipPlanId,
                          active:
                            benefit.active,
                          type: benefit.type,
                          title: benefit.title,
                          description:
                            benefit.description,
                          discountPercentage:
                            benefit.discountPercentage,
                          discountAmount:
                            benefit.discountAmount,
                          usageLimit:
                            benefit.usageLimit,
                          resetPeriod:
                            benefit.resetPeriod,
                          membershipPlan: {
                            active: plan.active,
                          },
                        }}
                        plans={planOption}
                        planIsActive={
                          plan.active
                        }
                        canManageBenefits={
                          canManageBenefits
                        }
                        canDeleteBenefitsPermanently={
                          canDeleteBenefitsPermanently
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard
        title={t(
          "plans.details.subscribersTitle"
        )}
        description={t(
          "plans.details.subscribersDescription"
        )}
        helpLegend={[
          legendSection(
            "Status da assinatura",
            SUBSCRIPTION_STATUS_LEGEND
          ),
        ]}
      >
        {activeSubscriptions.length === 0 ? (
          <EmptyState
            title={t(
              "plans.details.noSubscribers"
            )}
            description=""
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("patients.table.patient")}
                </TableHead>
                <TableHead>
                  {t("shared.labels.status")}
                </TableHead>
                <TableHead>
                  {t(
                    "patients.profile.started"
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSubscriptions.map(
                (subscription) => (
                  <TableRow
                    key={subscription.id}
                  >
                    <TableCell>
                      <Link
                        href={clienteUrl(
                          subscription.patient
                            .id,
                          {
                            tab: "membership",
                            returnTo:
                              planoUrl(planId),
                          }
                        )}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {
                          subscription.patient
                            .fullName
                        }
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge
                        status={
                          subscription.status
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(
                        subscription.startedAt
                      )}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard
        title={t(
          "plans.details.historyTitle"
        )}
        description={t(
          "plans.details.historyDescription"
        )}
      >
        <div className="divide-y">
          {timeline.length === 0 ? (
            <EmptyState
              title={t(
                "plans.details.historyEmpty"
              )}
              description=""
            />
          ) : (
            timeline.map((entry) => (
              <div
                key={entry.id}
                className="space-y-1 p-4"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="font-medium">
                    {entry.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(
                      entry.occurredAt
                    )}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "patients.profile.actor"
                  )}
                  : {entry.actor}
                </p>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
