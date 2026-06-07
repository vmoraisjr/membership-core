import {
  BadgeDollarSign,
  CreditCard,
  HeartPulse,
  ReceiptText,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { getDashboardMetrics } from "../services/get-dashboard-metrics";

export async function DashboardHomePage() {
  const t = getTranslations();
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "dashboard",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t(
            "dashboard.accessDeniedTitle"
          )}
          description={t(
            "dashboard.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  const metrics =
    await getDashboardMetrics();

  return (
    <DashboardPage>
      <PageHeader
        title={t("dashboard.title")}
        description={
          metrics.scope === "clinic"
            ? t(
                "dashboard.clinicDescription",
                {
                  clinicName:
                    metrics.clinicName,
                }
              )
            : t(
                "dashboard.platformDescription"
              )
        }
      />

      {metrics.scope === "clinic" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label={t(
                "dashboard.metrics.activePatients.label"
              )}
              value={metrics.activePatients.toString()}
              hint={t(
                "dashboard.metrics.activePatients.hint"
              )}
              icon={<Users className="size-5" />}
            />

            <MetricCard
              label={t(
                "dashboard.metrics.activeSubscriptions.label"
              )}
              value={metrics.activeSubscriptionsCount.toString()}
              hint={t(
                "dashboard.metrics.activeSubscriptions.hint"
              )}
              icon={
                <CreditCard className="size-5" />
              }
            />

            <MetricCard
              label={t(
                "dashboard.metrics.overdueInvoices.label"
              )}
              value={metrics.overduePatientInvoices.toString()}
              hint={t(
                "dashboard.metrics.overdueInvoices.hint"
              )}
              icon={
                <ReceiptText className="size-5" />
              }
            />

            <MetricCard
              label={t(
                "dashboard.metrics.monthlyPatientRevenue.label"
              )}
              value={formatCurrency(
                metrics.monthlyPatientRevenue
              )}
              hint={t(
                "dashboard.metrics.monthlyPatientRevenue.hint"
              )}
              icon={
                <BadgeDollarSign className="size-5" />
              }
            />

            <MetricCard
              label={t(
                "dashboard.metrics.benefitsConsumed.label"
              )}
              value={metrics.benefitsConsumed.toString()}
              hint={t(
                "dashboard.metrics.benefitsConsumed.hint"
              )}
              icon={
                <HeartPulse className="size-5" />
              }
            />

            <MetricCard
              label={t(
                "dashboard.metrics.activePlans.label"
              )}
              value={metrics.activePlansCount.toString()}
              hint={t(
                "dashboard.metrics.activePlans.hint"
              )}
              icon={<CreditCard className="size-5" />}
            />
          </div>

          <SectionCard
            title={t("dashboard.snapshot.title")}
            description={t(
              "dashboard.snapshot.description"
            )}
          >
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  {t(
                    "dashboard.snapshot.revenueBaselineTitle"
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    "dashboard.snapshot.revenueBaselineDescription",
                    {
                      amount: formatCurrency(
                        metrics.monthlyPatientRevenue
                      ),
                    }
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  {t(
                    "dashboard.snapshot.billingAttentionTitle"
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    "dashboard.snapshot.billingAttentionDescription",
                    {
                      count:
                        metrics.overduePatientInvoices,
                    }
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  {t(
                    "dashboard.snapshot.benefitActivityTitle"
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    "dashboard.snapshot.benefitActivityDescription",
                    {
                      count:
                        metrics.benefitUsageEvents,
                    }
                  )}
                </p>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}

      {metrics.platformMetrics ? (
        <SectionCard
          title={t("dashboard.platform.title")}
          description={t(
            "dashboard.platform.description"
          )}
        >
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                {t(
                  "dashboard.platform.activeClinics"
                )}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  metrics
                    .platformMetrics
                    .activeClinics
                }
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                {t(
                  "dashboard.platform.trialClinics"
                )}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  metrics
                    .platformMetrics
                    .trialClinics
                }
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                {t(
                  "dashboard.platform.pastDueClinics"
                )}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {
                  metrics
                    .platformMetrics
                    .pastDueClinics
                }
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-medium">
                {t(
                  "dashboard.platform.monthlySaasRevenue"
                )}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(
                  metrics
                    .platformMetrics
                    .monthlySaasRevenue
                )}
              </p>
            </div>
          </div>

          <div className="border-t p-4">
            <p className="text-sm font-medium">
              {t(
                "dashboard.platform.activeModuleCounts"
              )}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metrics.platformMetrics.activeModuleCounts.map(
                (moduleMetric) => (
                  <div
                    key={moduleMetric.key}
                    className="rounded-xl border border-border/60 bg-muted/40 p-4"
                  >
                    <p className="text-sm font-medium">
                      {moduleMetric.name}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {
                        moduleMetric.enabledClinicCount
                      }
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {moduleMetric.isV1Active
                        ? t(
                            "dashboard.platform.activeModuleAssignments"
                          )
                        : t(
                            "dashboard.platform.futureModuleDormant"
                          )}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </SectionCard>
      ) : null}
    </DashboardPage>
  );
}
