import {
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  ClipboardList,
  CreditCard,
  HeartPulse,
  MessageSquareMore,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ActionCard } from "@/components/dashboard/action-card";
import { MetricDelta } from "@/components/dashboard/metric-delta";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MetricGrid } from "@/components/dashboard/metric-grid";
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

          <MetricGrid columns="six">
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
              delta={
                <MetricDelta
                  direction="up"
                  label="Receita recorrente"
                />
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
          </MetricGrid>

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
            title="O que precisa de atenção hoje"
            description="A visão Plataforma deve responder primeiro onde agir, antes de virar relatório."
          >
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "Empresas em teste",
                  value:
                    metrics.platformMetrics.trialClinics.toString(),
                  description:
                    "Acompanhe tenants que ainda precisam converter para receita recorrente.",
                  icon: Building2,
                  href: "/dashboard/billing/subscriptions?status=TRIAL",
                },
                {
                  title: "Empresas em atraso",
                  value:
                    metrics.platformMetrics.pastDueClinics.toString(),
                  description:
                    "Priorize contas com risco operacional e financeiro.",
                  icon: AlertTriangle,
                  href: "/dashboard/billing/payments?status=OVERDUE",
                },
                {
                  title: "Chamados aguardando plataforma",
                  value:
                    metrics.platformMetrics.openSupportThreads.toString(),
                  description:
                    "Centralize incidentes, solicitações e respostas pendentes.",
                  icon: MessageSquareMore,
                  href: "/dashboard/messages?status=WAITING_PLATFORM",
                },
                {
                  title: "Convites pendentes",
                  value:
                    metrics.platformMetrics.pendingInvites.toString(),
                  description:
                    "Monitore acessos internos ainda não ativados.",
                  icon: ShieldCheck,
                  href: "/dashboard/users",
                },
                {
                  title: "Eventos críticos recentes",
                  value:
                    metrics.platformMetrics.criticalAuditEvents.toString(),
                  description:
                    "Acompanhe exclusões e desativações registradas nos últimos sete dias.",
                  icon: ClipboardList,
                  href: "/dashboard/audit-logs",
                },
              ].map((item) => (
                <ActionCard
                  key={item.title}
                  href={item.href}
                  title={`${item.title}: ${item.value}`}
                  description={item.description}
                  icon={item.icon}
                  emphasis="attention"
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Panorama da plataforma"
            description="Depois das prioridades, acompanhe os principais sinais de saúde comercial e cobertura da operação SaaS."
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
                delta={
                  <MetricDelta
                    direction="up"
                    label="Receita corrente"
                  />
                }
              />
            </MetricGrid>
          </SectionCard>

          <div className="page-section-grid xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <SectionCard
              title="Atalhos da plataforma"
              description="Acesse rapidamente a operação global das contas clientes e a governança da plataforma."
            >
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-2">
              {[
                {
                  href: "/dashboard/clinics",
                  title: "Empresas clientes",
                  description:
                    "Gerencie status, plano, identidade e detalhes operacionais.",
                  icon: Building2,
                },
                {
                  href: "/dashboard/billing/subscriptions",
                  title: "Assinaturas SaaS",
                  description:
                    "Acompanhe aplicação de planos, status de contas e vencimentos.",
                  icon: CreditCard,
                },
                {
                  href: "/dashboard/billing/payments",
                  title: "Pagamentos SaaS",
                  description:
                    "Monitore faturas, atrasos e recebimentos das empresas clientes.",
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
              title="Cobertura por módulo"
              description="Mostra onde a plataforma já está habilitada para operação em clientes ativos."
            >
              <div className="space-y-3 p-5">
                {metrics.platformMetrics.activeModuleCounts.map(
                  (module) => (
                    <div
                      key={module.key}
                      className="surface-subtle p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {module.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {module.isV1Active
                              ? "Liberado para a operação atual."
                              : "Reservado para fases futuras."}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {module.enabledClinicCount}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </DashboardPage>
  );
}
