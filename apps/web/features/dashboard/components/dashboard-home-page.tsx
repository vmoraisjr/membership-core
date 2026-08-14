import Link from "next/link";

import {
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  ClipboardList,
  CreditCard,
  MessageSquareMore,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ActionCard } from "@/components/dashboard/action-card";
import { AttentionList } from "@/components/dashboard/attention-list";
import { MetricDelta } from "@/components/dashboard/metric-delta";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { SubscriptionStatusBadge } from "@/features/subscriptions/components/subscription-status-badge";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  administracaoUrl,
  chamadosUrl,
  empresasUrl,
} from "@/lib/owner-routes";
import { cobrancasUrl, clientesUrl } from "@/lib/company-routes";

import { getDashboardMetrics } from "../services/get-dashboard-metrics";

function getGreeting(
  t: ReturnType<typeof getTranslations>
) {
  const hour = new Date().getHours();
  const key =
    hour < 12
      ? "morning"
      : hour < 18
        ? "afternoon"
        : "evening";

  return t(`dashboard.greeting.${key}`);
}

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

  const greetingName =
    metrics.currentUserName?.split(" ")[0] ?? "";
  const greetingTitle = greetingName
    ? t("dashboard.greeting.withName", {
        greeting: getGreeting(t),
        name: greetingName,
      })
    : t("dashboard.title");
  const todayLabel = new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());
  const canManagePatients = hasPermission(
    role,
    "patients",
    "manage"
  );
  const canViewBilling = hasPermission(
    role,
    "billing",
    "view"
  );

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={
          metrics.scope === "clinic"
            ? "Workspace da empresa"
            : "Controle global Sheep"
        }
        title={greetingTitle}
        description={
          metrics.scope === "clinic"
            ? t("dashboard.clinicDescription", {
                clinicName: metrics.clinicName,
              })
            : t("dashboard.platformDescription")
        }
        meta={<span>{todayLabel}</span>}
        action={
          metrics.scope === "clinic" &&
          canManagePatients ? (
            <Button asChild size="sm">
              <Link href={clientesUrl()}>
                <Users className="size-4" />
                Novo cliente
              </Link>
            </Button>
          ) : undefined
        }
      />

      {metrics.scope === "clinic" ? (
        <>
          <MetricGrid columns="four">
            <MetricCard
              label={t(
                "dashboard.metrics.activePatients.label"
              )}
              value={metrics.activePatients.toString()}
              hint={t(
                "dashboard.metrics.activePatients.hint"
              )}
              icon={<Users className="size-5" />}
              delta={
                <MetricDelta
                  direction="up"
                  label="Base ativa"
                />
              }
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
              tone="info"
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
              tone="warning"
              delta={
                <MetricDelta
                  direction={
                    metrics.overduePatientInvoices >
                    0
                      ? "down"
                      : "neutral"
                  }
                  label={
                    metrics.overduePatientInvoices >
                    0
                      ? "Pede ação"
                      : "Sem alerta"
                  }
                />
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
              tone="success"
              trend={metrics.revenueTrend.map(
                (month) => month.total
              )}
              delta={
                <MetricDelta
                  direction="up"
                  label="Receita recorrente"
                />
              }
            />

          </MetricGrid>

          <SectionCard
            title="O que merece atenção agora"
            description="Comece pela tarefa que precisa de atenção agora."
          >
            <div className="grid gap-4 p-5 md:grid-cols-3">
              {[
                ...(canManagePatients
                  ? [
                      {
                        href: clientesUrl(),
                        title: "Cadastrar cliente",
                        description:
                          "Cadastre o cliente e siga para a assinatura no mesmo contexto.",
                        icon: Users,
                      },
                    ]
                  : []),
                ...(canViewBilling
                  ? [
                      {
                        href: cobrancasUrl({
                          status: "OVERDUE",
                        }),
                        title:
                          "Cobranças pendentes",
                        description:
                          "Priorize atrasos e regularizações financeiras.",
                        icon: ReceiptText,
                      },
                    ]
                  : []),
              ].map((shortcut) => (
                <ActionCard
                  key={shortcut.href}
                  href={shortcut.href}
                  title={shortcut.title}
                  description={shortcut.description}
                  icon={shortcut.icon}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={t("dashboard.snapshot.title")}
            description={t(
              "dashboard.snapshot.description"
            )}
          >
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="surface-subtle p-4">
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

              <div className="surface-subtle p-4">
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

              <div className="surface-subtle p-4">
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

          <div className="page-section-grid xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <SectionCard
              title={t("dashboard.revenueTrend.title")}
              description={t(
                "dashboard.revenueTrend.description"
              )}
            >
              {metrics.revenueTrend.some(
                (month) => month.total > 0
              ) ? (
                <div className="flex items-end gap-3 p-5 pt-2">
                  {(() => {
                    const maxTotal = Math.max(
                      ...metrics.revenueTrend.map(
                        (month) => month.total
                      ),
                      1
                    );

                    return metrics.revenueTrend.map(
                      (month) => (
                        <div
                          key={month.date.toISOString()}
                          className="flex flex-1 flex-col items-center gap-2"
                        >
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatCurrency(
                              month.total
                            )}
                          </span>
                          <div className="flex h-32 w-full items-end overflow-hidden rounded-lg bg-[color:var(--color-surface-subtle)]">
                            <div
                              className="w-full rounded-lg bg-primary transition-all"
                              style={{
                                height: `${Math.max((month.total / maxTotal) * 100, month.total > 0 ? 6 : 0)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs capitalize text-muted-foreground">
                            {new Intl.DateTimeFormat(
                              "pt-BR",
                              { month: "short" }
                            ).format(month.date)}
                          </span>
                        </div>
                      )
                    );
                  })()}
                </div>
              ) : (
                <p className="p-5 pt-2 text-sm text-muted-foreground">
                  {t("dashboard.revenueTrend.empty")}
                </p>
              )}
            </SectionCard>

            <SectionCard
              title={t(
                "dashboard.subscriptionsByStatus.title"
              )}
              description={t(
                "dashboard.subscriptionsByStatus.description"
              )}
            >
              <div className="space-y-2 p-5 pt-2">
                {metrics.subscriptionStatusBreakdown.map(
                  (entry) => (
                    <div
                      key={entry.status}
                      className="flex items-center justify-between rounded-lg bg-[color:var(--color-surface-subtle)] px-3 py-2"
                    >
                      <SubscriptionStatusBadge
                        status={entry.status}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {entry.count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </SectionCard>
          </div>

          <div className="page-section-grid xl:grid-cols-2">
            <SectionCard
              title={t(
                "dashboard.upcomingRenewals.title"
              )}
              description={t(
                "dashboard.upcomingRenewals.description"
              )}
            >
              {metrics.upcomingRenewals.length > 0 ? (
                <div className="space-y-2 p-5 pt-2">
                  {metrics.upcomingRenewals.map(
                    (renewal) => (
                      <div
                        key={renewal.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--color-surface-subtle)] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {renewal.patientName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {renewal.planName}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {formatDate(
                            renewal.expiresAt
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="p-5 pt-2 text-sm text-muted-foreground">
                  {t(
                    "dashboard.upcomingRenewals.empty"
                  )}
                </p>
              )}
            </SectionCard>

            <SectionCard
              title={t(
                "dashboard.recentActivity.title"
              )}
              description={t(
                "dashboard.recentActivity.description"
              )}
            >
              {!metrics.canViewRecentActivity ? (
                <p className="p-5 pt-2 text-sm text-muted-foreground">
                  {t(
                    "dashboard.recentActivity.accessRestricted"
                  )}
                </p>
              ) : metrics.recentActivity.length > 0 ? (
                <div className="space-y-2 p-5 pt-2">
                  {metrics.recentActivity.map(
                    (activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--color-surface-subtle)] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {activity.actionLabel}{" "}
                            · {activity.entityLabel}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {activity.actor}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {formatDate(
                            activity.createdAt
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="p-5 pt-2 text-sm text-muted-foreground">
                  {t(
                    "dashboard.recentActivity.empty"
                  )}
                </p>
              )}
            </SectionCard>
          </div>
        </>
      ) : null}

      {metrics.platformMetrics ? (
        <>
          <SectionCard
            title="Panorama da plataforma"
            description="Sinais de saúde comercial e cobertura da operação SaaS."
            contentClassName="p-4"
          >
            <MetricGrid columns="four">
              <MetricCard
                label={t(
                  "dashboard.platform.activeClinics"
                )}
                value={
                  metrics.platformMetrics.activeClinics.toString()
                }
                hint="Contas clientes ativas e aptas para operar na plataforma."
                icon={<Building2 className="size-5" />}
                delta={
                  <MetricDelta
                    direction="up"
                    label="Base ativa"
                  />
                }
              />
              <MetricCard
                label={t(
                  "dashboard.platform.trialClinics"
                )}
                value={
                  metrics.platformMetrics.trialClinics.toString()
                }
                hint="Empresas avaliando o produto antes da cobrança recorrente."
                icon={<CreditCard className="size-5" />}
                tone="info"
              />
              <MetricCard
                label={t(
                  "dashboard.platform.pastDueClinics"
                )}
                value={
                  metrics.platformMetrics.pastDueClinics.toString()
                }
                hint="Contas com pendências financeiras que merecem acompanhamento."
                icon={<ReceiptText className="size-5" />}
                tone="warning"
                delta={
                  <MetricDelta
                    direction={
                      metrics.platformMetrics.pastDueClinics >
                      0
                        ? "down"
                        : "neutral"
                    }
                    label={
                      metrics.platformMetrics.pastDueClinics >
                      0
                        ? "Pede ação"
                        : "Sem alerta"
                    }
                  />
                }
              />
              <MetricCard
                label={t(
                  "dashboard.platform.monthlySaasRevenue"
                )}
                value={formatCurrency(
                  metrics.platformMetrics.monthlySaasRevenue
                )}
                hint="Receita SaaS efetivamente recebida no mês corrente."
                icon={<BadgeDollarSign className="size-5" />}
                tone="success"
                delta={
                  <MetricDelta
                    direction="up"
                    label="Receita corrente"
                  />
                }
              />
            </MetricGrid>
          </SectionCard>

          <SectionCard
            title="O que precisa de atenção hoje"
            description="A visão Plataforma deve responder primeiro onde agir, antes de virar relatório."
          >
            <AttentionList
              items={[
                {
                  title: "Empresas em teste",
                  value:
                    metrics.platformMetrics.trialClinics.toString(),
                  description:
                    "Acompanhe tenants que ainda precisam converter para receita recorrente.",
                  icon: Building2,
                  href: empresasUrl(),
                  tone: "info",
                },
                {
                  title: "Empresas em atraso",
                  value:
                    metrics.platformMetrics.pastDueClinics.toString(),
                  description:
                    "Priorize contas com risco operacional e financeiro.",
                  icon: AlertTriangle,
                  href: empresasUrl(),
                  tone: "warning",
                },
                {
                  title: "Chamados aguardando plataforma",
                  value:
                    metrics.platformMetrics.openSupportThreads.toString(),
                  description:
                    "Centralize incidentes, solicitações e respostas pendentes.",
                  icon: MessageSquareMore,
                  href: chamadosUrl({
                    status: "WAITING_PLATFORM",
                  }),
                  tone: "warning",
                },
                {
                  title: "Convites pendentes",
                  value:
                    metrics.platformMetrics.pendingInvites.toString(),
                  description:
                    "Monitore acessos internos ainda não ativados.",
                  icon: ShieldCheck,
                  href: administracaoUrl({
                    tab: "team",
                  }),
                  tone: "info",
                },
                {
                  title: "Eventos críticos recentes",
                  value:
                    metrics.platformMetrics.criticalAuditEvents.toString(),
                  description:
                    "Acompanhe exclusões e desativações registradas nos últimos sete dias.",
                  icon: ClipboardList,
                  href: administracaoUrl({
                    tab: "audit",
                  }),
                  tone: "danger",
                },
              ]}
            />
          </SectionCard>

        </>
      ) : null}
    </DashboardPage>
  );
}
