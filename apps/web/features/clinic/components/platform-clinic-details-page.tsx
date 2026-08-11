import Link from "next/link";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { ModuleStatus } from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
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
import {
  getUserStatusLabel,
  getUserStatusTone,
} from "@/features/users/utils/user-display";
import { isModuleV1Active } from "@/features/modules/services/module-policy";

import {
  getClinicSubscriptionStatusTone,
  getPaymentStatusTone,
} from "../utils/clinic-status";
import { getPlatformClinicDetails } from "../services/get-platform-clinic-details";

type Props = {
  clinicId: string;
  activeTab?: string;
};

export async function PlatformClinicDetailsPage({
  clinicId,
  activeTab = "overview",
}: Props) {
  const t = getTranslations();
  const {
    clinic,
    metrics,
    auditLogs,
    clinicModules,
  } = await getPlatformClinicDetails(
    clinicId
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
      label: "Visão geral",
    },
    {
      id: "subscription",
      label: "Assinatura SaaS",
    },
    {
      id: "payments",
      label: "Pagamentos",
    },
    {
      id: "users",
      label: "Usuários",
    },
    {
      id: "modules",
      label: "Módulos",
    },
    {
      id: "audit",
      label: "Auditoria",
    },
    {
      id: "identity",
      label: "Identidade",
    },
  ] as const;

  function tabHref(tab: string) {
    return `/dashboard/clinics/${clinicId}?tab=${tab}`;
  }

  const latestSubscription =
    clinic.clinicSubscriptions[0] ?? null;

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

      <div className="grid gap-3 rounded-2xl border bg-background/90 p-3 md:grid-cols-3 xl:grid-cols-7">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tabHref(tab.id)}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-[color:var(--color-surface-subtle)] text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {(activeTab === "overview" ||
        activeTab === "identity") && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Plano atual"
            value={metrics.platformPlan}
            hint={`Status atual: ${t(`billing.status.${metrics.platformStatus}`)}`}
            icon={<CreditCard className="size-5" />}
          />
          <MetricCard
            label="Próximo vencimento"
            value={formatDate(
              metrics.nextDueDate
            )}
            hint="Baseado na cobrança SaaS mais recente."
            icon={<WalletCards className="size-5" />}
          />
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
      )}

      {(activeTab === "overview" ||
        activeTab === "identity") && (
        <SectionCard
          title="Identidade da conta"
          description="Dados cadastrais e posicionamento principal desta empresa cliente."
        >
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="detail-field">
              <p className="detail-field-label">
                Razão social
              </p>
              <p className="detail-field-value">
                {clinic.name}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Nome de exibição
              </p>
              <p className="detail-field-value">
                {clinic.brandName ??
                  "Não definido"}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Documento
              </p>
              <p className="detail-field-value">
                {formatBrazilianCnpj(
                  clinic.document
                )}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Slug
              </p>
              <p className="detail-field-value">
                {clinic.slug}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                E-mail principal
              </p>
              <p className="detail-field-value">
                {clinic.email}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Telefone
              </p>
              <p className="detail-field-value">
                {formatBrazilianPhone(
                  clinic.phone
                )}
              </p>
            </div>
            <div className="detail-field md:col-span-2">
              <p className="detail-field-label">
                Endereço
              </p>
              <p className="detail-field-value">
                {clinic.address}, {clinic.city} - {formatBrazilianState(clinic.state)}, {formatBrazilianZipCode(clinic.zipCode)}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {(activeTab === "overview" ||
        activeTab === "users") && (
        <SectionCard
          title="Master da empresa"
          description="Acompanhe o usuário principal e eventos de credencial."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t(
                    "shared.labels.fullName"
                  )}
                </TableHead>
                <TableHead>
                  {t("shared.labels.email")}
                </TableHead>
                <TableHead>
                  {t(
                    "shared.labels.status"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "shared.labels.lastLogin"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "clinics.details.mustChangePassword"
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.appUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.name}
                  </TableCell>
                  <TableCell>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <StatusIndicator
                      tone={getUserStatusTone(
                        user.status
                      )}
                      label={getUserStatusLabel(
                        user.status
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(
                      user.lastLoginAt
                    )}
                  </TableCell>
                  <TableCell>
                    {user.mustChangePassword
                      ? "Sim"
                      : "Não"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      {(activeTab === "overview" ||
        activeTab === "modules") && (
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
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      {(activeTab === "overview" ||
        activeTab === "subscription") && (
        <SectionCard
          title="Assinatura SaaS"
          description="Plano, vigência e status comercial da conta cliente."
        >
          <div className="grid gap-4 p-5">
            <div className="surface-subtle p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">
                    {latestSubscription
                      ?.clinicBillingPlan.name ??
                      "Sem plano"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Início:{" "}
                    {formatDate(
                      latestSubscription?.startedAt
                    )}{" "}
                    · Expira:{" "}
                    {formatDate(
                      latestSubscription?.expiresAt
                    )}
                  </p>
                </div>
                <StatusIndicator
                  tone={getClinicSubscriptionStatusTone(
                    metrics.platformStatus
                  )}
                  label={t(
                    `billing.status.${metrics.platformStatus}`
                  )}
                />
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {(activeTab === "overview" ||
        activeTab === "payments") && (
        <SectionCard
          title="Pagamentos"
          description="Histórico recente de faturas e registros de pagamento ligados à assinatura SaaS."
        >
          <div className="space-y-4 p-5">
            {clinic.clinicSubscriptions.map(
              (subscription) => (
                <div
                  key={subscription.id}
                  className="surface-subtle p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">
                        {
                          subscription
                            .clinicBillingPlan
                            .name
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Início:{" "}
                        {formatDate(
                          subscription.startedAt
                        )}{" "}
                        · Expira:{" "}
                        {formatDate(
                          subscription.expiresAt
                        )}
                      </p>
                    </div>
                    <StatusIndicator
                      tone={getClinicSubscriptionStatusTone(
                        subscription.status
                      )}
                      label={t(
                        `billing.status.${subscription.status}`
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            {t(
                              "shared.labels.description"
                            )}
                          </TableHead>
                          <TableHead>
                            {t(
                              "shared.labels.amount"
                            )}
                          </TableHead>
                          <TableHead>
                            {t(
                              "shared.labels.dueDate"
                            )}
                          </TableHead>
                          <TableHead>
                            {t(
                              "shared.labels.status"
                            )}
                          </TableHead>
                          <TableHead>
                            {t(
                              "shared.labels.paymentHistory"
                            )}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscription.invoices.map(
                          (invoice) => (
                            <TableRow
                              key={invoice.id}
                            >
                              <TableCell>
                                {invoice.description ??
                                  invoice.id}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  invoice.amount
                                )}
                              </TableCell>
                              <TableCell>
                                {formatDate(
                                  invoice.dueDate
                                )}
                              </TableCell>
                              <TableCell>
                                <StatusIndicator
                                  tone={getPaymentStatusTone(
                                    invoice.status
                                  )}
                                  label={t(
                                    `billing.status.${invoice.status}`
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                {invoice.payments
                                  .length === 0 ? (
                                  <span className="text-xs text-muted-foreground">
                                    {t(
                                      "clinics.details.noPaymentRecorded"
                                    )}
                                  </span>
                                ) : (
                                  <div className="space-y-1 text-xs">
                                    {invoice.payments.map(
                                      (payment) => (
                                        <div
                                          key={
                                            payment.id
                                          }
                                        >
                                          {t(
                                            `billing.status.${payment.status}`
                                          )}
                                          {" · "}
                                          {formatDate(
                                            payment.paidAt
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )
            )}
          </div>
        </SectionCard>
      )}

      {(activeTab === "overview" ||
        activeTab === "audit") && (
        <SectionCard
          title="Timeline administrativa"
          description="Eventos recentes de assinatura, pagamentos, módulos e credenciais."
        >
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
      )}
    </DashboardPage>
  );
}
