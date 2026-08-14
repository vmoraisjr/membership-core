import Link from "next/link";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { ModuleKey, ModuleStatus } from "@prisma/client";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";
import {
  formatBrazilianCnpj,
  formatBrazilianPhone,
  formatBrazilianState,
  formatBrazilianZipCode,
} from "@/lib/br-formats";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "@/features/audit-log/services/get-audit-logs";
import { isModuleV1Active } from "@/features/modules/services/module-policy";
import { getModuleKeyLabel } from "@/features/modules/utils/module-labels";
import { platformSetClinicModuleStatusAction } from "@/features/modules/actions/platform-set-clinic-module-status";

import { getClinicSubscriptionStatusTone } from "../utils/clinic-status";
import { CompanyBillingTab } from "@/features/billing/components/company-billing-tab";
import { CompanyPeopleTab } from "./company-people-tab";
import { CompanyChamadosTab } from "./company-chamados-tab";
import { getPlatformClinicDetails } from "../services/get-platform-clinic-details";

type Props = {
  clinicId: string;
  activeTab?: string;
  auditFilters?: {
    actor?: string;
    from?: string;
    to?: string;
  };
  chamadosFilters?: {
    threadId?: string;
    category?: string;
    status?: string;
  };
};

export async function PlatformClinicDetailsPage({
  clinicId,
  activeTab = "overview",
  auditFilters = {},
  chamadosFilters = {},
}: Props) {
  const t = getTranslations();
  const {
    clinic,
    metrics,
    auditLogs,
    clinicModules,
  } = await getPlatformClinicDetails(
    clinicId,
    auditFilters
  );

  function formatDate(
    value: Date | null | undefined
  ) {
    if (!value) {
      return t(
        "clinics.details.notInformed"
      );
    }

    return new Date(value).toLocaleDateString(
      "pt-BR"
    );
  }

  const tabs = [
    {
      id: "overview",
      label: "Resumo",
    },
    {
      id: "billing",
      label: "Plano e cobrança",
    },
    {
      id: "users",
      label: "Pessoas",
    },
    {
      id: "modules",
      label: "Módulos",
    },
    {
      id: "chamados",
      label: "Chamados",
    },
    {
      id: "audit",
      label: "Auditoria",
    },
  ] as const;

  function tabHref(tab: string) {
    return `/dashboard/empresas/${clinicId}?tab=${tab}`;
  }

  const latestSubscription =
    clinic.clinicSubscriptions[0] ?? null;
  const latestInvoice =
    latestSubscription?.invoices[0] ??
    null;
  const hasAuditFilters = Boolean(
    auditFilters.actor ||
      auditFilters.from ||
      auditFilters.to
  );

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Conta cliente"
        title={clinic.brandName ?? clinic.name}
        description="Histórico operacional da conta cliente para suporte e administração SaaS."
        meta={
          <>
            <span>{clinic.email}</span>
            <span>•</span>
            <span>
              {clinic.city}, {clinic.state}
            </span>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tabHref(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-ink)]"
                : "text-muted-foreground hover:bg-[color:var(--color-surface-subtle)] hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href={tabHref("billing")}
              className="rounded-[0.875rem] transition-opacity hover:opacity-90"
            >
              <MetricCard
                label="Plano atual"
                value={metrics.platformPlan}
                hint={`Status atual: ${t(`billing.status.${metrics.platformStatus}`)}`}
                icon={<CreditCard className="size-5" />}
              />
            </Link>
            <Link
              href={tabHref("billing")}
              className="rounded-[0.875rem] transition-opacity hover:opacity-90"
            >
              <MetricCard
                label="Próximo vencimento"
                value={formatDate(
                  metrics.nextDueDate
                )}
                hint="Baseado na cobrança SaaS mais recente."
                icon={<WalletCards className="size-5" />}
              />
            </Link>
            <MetricCard
              label="Pacientes"
              value={String(metrics.patients)}
              hint={`${metrics.plans} plano(s) local(is) em operação.`}
              icon={<Building2 className="size-5" />}
            />
            <MetricCard
              label="Equipe local"
              value={String(metrics.users)}
              hint={`Pagamento mais recente: ${t(`billing.status.${metrics.latestPaymentStatus}`)}`}
              icon={<ShieldCheck className="size-5" />}
            />
          </div>

          <SectionCard
            title="Identidade da conta"
            description="Dados cadastrais principais desta empresa cliente."
          >
            <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Razão social
                </p>
                <p className="mt-0.5 text-foreground">
                  {clinic.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Nome de exibição
                </p>
                <p className="mt-0.5 text-foreground">
                  {clinic.brandName ??
                    "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Documento
                </p>
                <p className="mt-0.5 text-foreground">
                  {formatBrazilianCnpj(
                    clinic.document
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Slug
                </p>
                <p className="mt-0.5 text-foreground">
                  {clinic.slug}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Telefone
                </p>
                <p className="mt-0.5 text-foreground">
                  {formatBrazilianPhone(
                    clinic.phone
                  )}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Endereço
                </p>
                <p className="mt-0.5 text-foreground">
                  {clinic.address}, {clinic.city} - {formatBrazilianState(clinic.state)}, {formatBrazilianZipCode(clinic.zipCode)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Cobrança"
            description="Resumo rápido — o histórico completo de assinatura e faturas vive na aba Plano e cobrança."
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <StatusIndicator
                  tone={getClinicSubscriptionStatusTone(
                    metrics.platformStatus
                  )}
                  label={t(
                    `billing.status.${metrics.platformStatus}`
                  )}
                />
                <span>
                  {latestInvoice
                    ? `Última cobrança: ${formatCurrency(latestInvoice.amount)} · ${t(`billing.status.${latestInvoice.status}`)}`
                    : "Nenhuma cobrança registrada."}
                </span>
              </div>
              <Link
                href={tabHref("billing")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver plano e cobrança →
              </Link>
            </div>
          </SectionCard>
        </>
      ) : null}

      {activeTab === "billing" ? (
        <CompanyBillingTab
          clinicId={clinicId}
          clinicName={
            clinic.brandName ?? clinic.name
          }
        />
      ) : null}

      {activeTab === "users" ? (
        <CompanyPeopleTab
          clinicId={clinicId}
        />
      ) : null}

      {activeTab === "modules" ? (
        <SectionCard
          title={t(
            "clinics.details.modulesTitle"
          )}
          description={t(
            "clinics.details.modulesDescription"
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t(
                    "clinics.details.moduleColumn"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "shared.labels.status"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "clinics.details.moduleV1Column"
                  )}
                </TableHead>
                <TableHead className="text-right">
                  {t(
                    "shared.labels.actions"
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicModules.map(
                (clinicModule) => (
                  <TableRow
                    key={clinicModule.id}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {
                          clinicModule
                            .module.name
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {
                          clinicModule
                            .module
                            .description
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        tone={
                          clinicModule.status ===
                          ModuleStatus.ENABLED
                            ? "success"
                            : "neutral"
                        }
                        label={t(
                          clinicModule.status ===
                          ModuleStatus.ENABLED
                            ? "shared.states.active"
                            : "shared.states.inactive"
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {isModuleV1Active(
                        clinicModule.module
                          .key
                      )
                        ? t(
                            "clinics.details.moduleAvailable"
                          )
                        : t(
                            "clinics.details.moduleFuture"
                          )}
                    </TableCell>
                    <TableCell className="text-right">
                      {clinicModule.module
                        .key ===
                      ModuleKey.MEMBERSHIP ? (
                        <span className="text-xs text-muted-foreground">
                          {t(
                            "modules.coreModule"
                          )}
                        </span>
                      ) : !isModuleV1Active(
                          clinicModule.module
                            .key
                        ) ? (
                        <span className="text-xs text-muted-foreground">
                          {t("modules.v2Only")}
                        </span>
                      ) : clinicModule.status ===
                        ModuleStatus.ENABLED ? (
                        <form
                          action={
                            platformSetClinicModuleStatusAction
                          }
                          id={`disable-module-${clinicModule.id}`}
                          className="inline-flex"
                        >
                          <input
                            type="hidden"
                            name="clinicId"
                            value={clinicId}
                          />
                          <input
                            type="hidden"
                            name="moduleKey"
                            value={
                              clinicModule
                                .module.key
                            }
                          />
                          <input
                            type="hidden"
                            name="nextStatus"
                            value={
                              ModuleStatus.DISABLED
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`disable-module-${clinicModule.id}`}
                            title={t(
                              "modules.disableTitle"
                            )}
                            description={t(
                              "modules.disableDescription",
                              {
                                name: getModuleKeyLabel(
                                  clinicModule
                                    .module
                                    .key
                                ),
                              }
                            )}
                            actionLabel={t(
                              "modules.disableAction"
                            )}
                            label={t(
                              "shared.actions.disable"
                            )}
                          />
                        </form>
                      ) : (
                        <form
                          action={
                            platformSetClinicModuleStatusAction
                          }
                          id={`enable-module-${clinicModule.id}`}
                          className="inline-flex"
                        >
                          <input
                            type="hidden"
                            name="clinicId"
                            value={clinicId}
                          />
                          <input
                            type="hidden"
                            name="moduleKey"
                            value={
                              clinicModule
                                .module.key
                            }
                          />
                          <input
                            type="hidden"
                            name="nextStatus"
                            value={
                              ModuleStatus.ENABLED
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`enable-module-${clinicModule.id}`}
                            title={t(
                              "modules.enableTitle"
                            )}
                            description={t(
                              "modules.enableDescription",
                              {
                                name: getModuleKeyLabel(
                                  clinicModule
                                    .module
                                    .key
                                ),
                              }
                            )}
                            actionLabel={t(
                              "modules.enableAction"
                            )}
                            label={t(
                              "shared.actions.enable"
                            )}
                          />
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </SectionCard>
      ) : null}

      {activeTab === "chamados" ? (
        <CompanyChamadosTab
          clinicId={clinicId}
          clinicName={
            clinic.brandName ?? clinic.name
          }
          filters={chamadosFilters}
        />
      ) : null}

      {activeTab === "audit" ? (
        <SectionCard
          title="Timeline administrativa"
          description="Eventos recentes de assinatura, pagamentos, módulos e credenciais."
        >
          <form
            method="get"
            className="flex flex-wrap items-end gap-3 border-b border-border/60 p-4"
          >
            <input
              type="hidden"
              name="tab"
              value="audit"
            />
            <label className="grid gap-1 text-xs">
              <span className="font-medium text-foreground">
                Usuário
              </span>
              <Input
                name="auditActor"
                defaultValue={
                  auditFilters.actor ?? ""
                }
                placeholder="Nome do ator"
                className="h-8 w-44 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="font-medium text-foreground">
                De
              </span>
              <Input
                type="date"
                name="auditFrom"
                defaultValue={
                  auditFilters.from ?? ""
                }
                className="h-8 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="font-medium text-foreground">
                Até
              </span>
              <Input
                type="date"
                name="auditTo"
                defaultValue={
                  auditFilters.to ?? ""
                }
                className="h-8 text-sm"
              />
            </label>
            <Button type="submit" size="sm">
              Filtrar
            </Button>
            {hasAuditFilters ? (
              <Link
                href={tabHref("audit")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar
              </Link>
            ) : null}
          </form>

          <div className="divide-y divide-border/60">
            {auditLogs.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                {t(
                  "clinics.details.auditEmpty"
                )}
              </div>
            ) : (
              auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-1 p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="font-medium">
                      {AUDIT_ACTION_LABELS[
                        entry.action
                      ] ?? entry.action}{" "}
                      ·{" "}
                      {AUDIT_ENTITY_LABELS[
                        entry.entity
                      ] ?? entry.entity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        entry.createdAt
                      ).toLocaleString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ator: {entry.actor}
                  </p>
                  {entry.entityLabel ? (
                    <p className="text-sm text-muted-foreground">
                      Referência:{" "}
                      {entry.entityLabel}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </SectionCard>
      ) : null}
    </DashboardPage>
  );
}
