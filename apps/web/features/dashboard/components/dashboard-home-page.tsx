import {
  BadgeDollarSign,
  Building2,
  ClipboardList,
  CreditCard,
  HeartPulse,
  MessageSquareMore,
  ReceiptText,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";

import Link from "next/link";

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
        eyebrow={
          metrics.scope === "clinic"
            ? "Workspace da empresa"
            : "Controle global Sheep"
        }
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
        meta={
          metrics.scope === "clinic" ? (
            <>
              <span className="workspace-kicker">
                Operação
              </span>
              <span className="workspace-kicker">
                Cobrança
              </span>
              <span className="workspace-kicker">
                Relacionamento
              </span>
            </>
          ) : (
            <>
              <span className="workspace-kicker">
                SaaS
              </span>
              <span className="workspace-kicker">
                Contas clientes
              </span>
              <span className="workspace-kicker">
                Governança
              </span>
            </>
          )
        }
      />

      {metrics.scope === "clinic" ? (
        <>
          <SectionCard
            title="O que merece atenção agora"
            description="Ações rápidas e leituras operacionais para reduzir esforço no dia a dia."
          >
            <div className="grid gap-4 p-5 md:grid-cols-3">
              {[
                {
                  href: "/dashboard/patients",
                  title: "Cadastrar cliente",
                  description:
                    "Abra novos cadastros sem sair do fluxo operacional.",
                  icon: Users,
                },
                {
                  href: "/dashboard/subscriptions",
                  title: "Criar assinatura",
                  description:
                    "Ative novas receitas recorrentes a partir dos planos vigentes.",
                  icon: CreditCard,
                },
                {
                  href: "/dashboard/payments",
                  title: "Cobranças pendentes",
                  description:
                    "Priorize pagamentos, atrasos e regularizações da empresa.",
                  icon: ReceiptText,
                },
              ].map((shortcut) => {
                const Icon = shortcut.icon;

                return (
                  <Link
                    key={shortcut.href}
                    href={shortcut.href}
                    className="group surface-subtle p-4 transition-colors hover:bg-background/95"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-border/70 bg-background p-3 text-muted-foreground shadow-[var(--shadow-xs)]">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {shortcut.title}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {shortcut.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <div className="page-section-grid md:grid-cols-2 xl:grid-cols-3">
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
        </>
      ) : null}

      {metrics.platformMetrics ? (
        <>
          <SectionCard
            title={t("dashboard.platform.title")}
            description={t(
              "dashboard.platform.description"
            )}
          >
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="surface-subtle p-4">
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

              <div className="surface-subtle p-4">
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

              <div className="surface-subtle p-4">
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

              <div className="surface-subtle p-4">
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

          </SectionCard>

          <SectionCard
            title="Atalhos da plataforma"
            description="Acesse rapidamente a operação global das contas clientes e a governança da plataforma."
          >
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  href: "/dashboard/clinics",
                  title: "Empresas clientes",
                  description:
                    "Gerencie status, plano, identidade e detalhes operacionais.",
                  icon: Building2,
                },
                {
                  href: "/dashboard/billing",
                  title: "Assinaturas e pagamentos",
                  description:
                    "Acompanhe assinaturas SaaS, faturas e vencimentos das clínicas.",
                  icon: ReceiptText,
                },
                {
                  href: "/dashboard/messages",
                  title: "Chamados",
                  description:
                    "Centralize solicitações, incidentes e conversas com as empresas clientes.",
                  icon: MessageSquareMore,
                },
                {
                  href: "/dashboard/users",
                  title: "Usuários da plataforma",
                  description:
                    "Gerencie apenas a equipe interna da plataforma, sem misturar usuários de clínica.",
                  icon: ShieldCheck,
                },
                {
                  href: "/dashboard/audit-logs",
                  title: "Auditoria",
                  description:
                    "Acompanhe eventos administrativos globais e ações críticas nas clínicas.",
                  icon: ClipboardList,
                },
              ].map((shortcut) => {
                const Icon = shortcut.icon;

                return (
                  <Link
                    key={shortcut.href}
                    href={shortcut.href}
                    className="group surface-subtle p-4 transition-colors hover:bg-background/90"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="rounded-full border border-border/60 bg-background p-3 text-muted-foreground">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {shortcut.title}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {shortcut.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>
        </>
      ) : null}
    </DashboardPage>
  );
}
