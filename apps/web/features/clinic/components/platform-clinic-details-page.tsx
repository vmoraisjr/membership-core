import {
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { formatCurrency } from "@/lib/formatters";

import { getPlatformClinicDetails } from "../services/get-platform-clinic-details";

type Props = {
  clinicId: string;
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
}: Props) {
  const { clinic, metrics, auditLogs } =
    await getPlatformClinicDetails(
      clinicId
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

      <div className="page-section-grid md:grid-cols-2 xl:grid-cols-4">
        <SectionCard
          title="Plano atual"
          description="Assinatura SaaS ativa da conta cliente."
        >
          <div className="space-y-3 p-5">
            <p className="font-semibold">
              {metrics.platformPlan}
            </p>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                metrics.platformStatus
              )}`}
            >
              {metrics.platformStatus}
            </span>
          </div>
        </SectionCard>
        <SectionCard
          title="Proximo vencimento"
          description="Baseado na ultima fatura SaaS."
        >
          <div className="p-5 text-2xl font-semibold">
            {formatDate(
              metrics.nextDueDate
            )}
          </div>
        </SectionCard>
        <SectionCard
          title="Pacientes e planos"
          description="Volume operacional da empresa."
        >
          <div className="space-y-2 p-5">
            <p>
              {metrics.patients} clientes
            </p>
            <p>
              {metrics.plans} planos
            </p>
          </div>
        </SectionCard>
        <SectionCard
          title="Equipe"
          description="Usuarios vinculados ao tenant."
        >
          <div className="space-y-2 p-5">
            <p>{metrics.users} usuarios</p>
            <p>
              Pagamento:{" "}
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                  metrics.latestPaymentStatus
                )}`}
              >
                {
                  metrics.latestPaymentStatus
                }
              </span>
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Master da empresa"
        description="Acompanhe o usuario principal e eventos de credencial."
      >
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Nome</th>
                <th className="py-2">E-mail</th>
                <th className="py-2">Status</th>
                <th className="py-2">Ultimo acesso</th>
                <th className="py-2">Troca obrigatoria</th>
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
                    {user.status}
                  </td>
                  <td className="py-3">
                    {formatDate(
                      user.lastLoginAt
                    )}
                  </td>
                  <td className="py-3">
                    {user.mustChangePassword
                      ? "Sim"
                      : "Nao"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Assinaturas e pagamentos"
        description="Histórico recente de assinatura da plataforma e respectivas faturas."
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
                      Inicio:{" "}
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
                    {subscription.status}
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">
                          Descricao
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
                          Historico
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
                                {invoice.status}
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
                                        {payment.status}
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

      <SectionCard
        title="Timeline administrativa"
        description="Eventos recentes de assinatura, pagamentos, modulos e credenciais."
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
                    {entry.action} ·{" "}
                    {entry.entity}
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
                    Referencia:{" "}
                    {entry.entityLabel}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
