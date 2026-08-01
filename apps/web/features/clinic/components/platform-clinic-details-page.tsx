import {
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { formatCurrency, formatEnumLabel } from "@/lib/formatters";
import {
  formatBrazilianCnpj,
  formatBrazilianPhone,
  formatBrazilianState,
  formatBrazilianZipCode,
} from "@/lib/br-formats";

import { getPlatformClinicDetails } from "../services/get-platform-clinic-details";

type Props = {
  clinicId: string;
  activeTab?: string;
};

function getStatusBadgeClass(
  status:
    | ClinicSubscriptionStatus
    | PaymentStatus
) {
  switch (status) {
    case ClinicSubscriptionStatus.ACTIVE:
    case PaymentStatus.PAID:
      return "bg-emerald-100 text-emerald-700";
    case ClinicSubscriptionStatus.TRIAL:
    case ClinicSubscriptionStatus.PENDING:
      return "bg-sky-100 text-sky-700";
    case ClinicSubscriptionStatus.PAST_DUE:
    case ClinicSubscriptionStatus.SUSPENDED:
    case PaymentStatus.OVERDUE:
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

function formatDate(
  value: Date | null | undefined
) {
  if (!value) {
    return "Nao informado";
  }

  return new Date(value).toLocaleDateString();
}

export async function PlatformClinicDetailsPage({
  clinicId,
  activeTab = "overview",
}: Props) {
  const { clinic, metrics, auditLogs } =
    await getPlatformClinicDetails(
      clinicId
    );
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

      <div className="grid gap-3 rounded-2xl border bg-background/90 p-3 md:grid-cols-3 xl:grid-cols-6">
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
            hint={`Status atual: ${formatEnumLabel(metrics.platformStatus)}`}
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
            hint={`Pagamento mais recente: ${formatEnumLabel(metrics.latestPaymentStatus)}`}
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
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Nome</th>
                  <th className="py-2">E-mail</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Último acesso</th>
                  <th className="py-2">Troca obrigatória</th>
                </tr>
              </thead>
              <tbody>
                {clinic.appUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-3">
                      {user.name}
                    </td>
                    <td className="py-3">
                      {user.email}
                    </td>
                    <td className="py-3">
                      {formatEnumLabel(
                        user.status
                      )}
                    </td>
                    <td className="py-3">
                      {formatDate(
                        user.lastLoginAt
                      )}
                    </td>
                    <td className="py-3">
                      {user.mustChangePassword
                        ? "Sim"
                        : "Não"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                    metrics.platformStatus
                  )}`}
                >
                  {formatEnumLabel(
                    metrics.platformStatus
                  )}
                </span>
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
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                        subscription.status
                      )}`}
                    >
                      {formatEnumLabel(
                        subscription.status
                      )}
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2">
                            Descrição
                          </th>
                          <th className="py-2">
                            Valor
                          </th>
                          <th className="py-2">
                            Vencimento
                          </th>
                          <th className="py-2">
                            Status
                          </th>
                          <th className="py-2">
                            Histórico
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscription.invoices.map(
                          (invoice) => (
                            <tr
                              key={invoice.id}
                              className="border-b last:border-b-0"
                            >
                              <td className="py-3">
                                {invoice.description ??
                                  invoice.id}
                              </td>
                              <td className="py-3">
                                {formatCurrency(
                                  invoice.amount
                                )}
                              </td>
                              <td className="py-3">
                                {formatDate(
                                  invoice.dueDate
                                )}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                                    invoice.status
                                  )}`}
                                >
                                  {formatEnumLabel(
                                    invoice.status
                                  )}
                                </span>
                              </td>
                              <td className="py-3">
                                {invoice.payments
                                  .length === 0 ? (
                                  <span className="text-xs text-muted-foreground">
                                    Sem pagamento registrado
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
                                          {formatEnumLabel(
                                            payment.status
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
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
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
                Nenhum evento operacional encontrado.
              </div>
            ) : (
              auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-1 p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="font-medium">
                      {formatEnumLabel(
                        entry.action
                      )}{" "}
                      ·{" "}
                      {formatEnumLabel(
                        entry.entity
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        entry.createdAt
                      ).toLocaleString()}
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
