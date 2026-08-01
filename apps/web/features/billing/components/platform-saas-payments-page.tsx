import {
  AlertTriangle,
  CheckCheck,
  Filter,
  Search,
} from "lucide-react";
import { PaymentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { Input } from "@/components/ui/input";
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

import {
  platformMarkClinicInvoiceOverdueAction,
  platformMarkClinicInvoicePaidAction,
} from "../actions/platform-manage-clinic-subscription";
import { getPlatformClinicBillingOverview } from "../services/billing-foundation";
import { PaymentAttentionBar } from "./payment-attention-bar";

type Props = {
  filters: {
    clinicId?: string;
    planId?: string;
    status?: string;
    query?: string;
  };
};

function getStatusClass(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return "bg-emerald-100 text-emerald-700";
    case PaymentStatus.OVERDUE:
      return "bg-amber-100 text-amber-800";
    case PaymentStatus.CANCELED:
    case PaymentStatus.FAILED:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return "Pago";
    case PaymentStatus.OVERDUE:
      return "Em atraso";
    case PaymentStatus.CANCELED:
      return "Cancelado";
    case PaymentStatus.FAILED:
      return "Falhou";
    case PaymentStatus.PENDING:
      return "Pendente";
  }
}

export async function PlatformSaasPaymentsPage({
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
          description="Os pagamentos SaaS das contas clientes são acompanhados apenas pela plataforma."
        />
      </DashboardPage>
    );
  }

  const overview =
    await getPlatformClinicBillingOverview();
  const normalizedQuery =
    filters.query?.trim().toLowerCase() ??
    "";
  const invoiceRows =
    overview.clinicSubscriptions.flatMap(
      (subscription) =>
        subscription.invoices.map(
          (invoice) => ({
            invoice,
            subscription,
          })
        )
    );
  const filteredInvoices = invoiceRows.filter(
    ({ invoice, subscription }) => {
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
        invoice.status !== filters.status
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
          subscription.clinicBillingPlan.name,
          invoice.description ?? "",
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
  const overdueInvoices =
    invoiceRows.filter(
      ({ invoice }) =>
        invoice.status ===
        PaymentStatus.OVERDUE
    );
  const pendingInvoices =
    invoiceRows.filter(
      ({ invoice }) =>
        invoice.status ===
        PaymentStatus.PENDING
    );
  const paidInvoices =
    invoiceRows.filter(
      ({ invoice }) =>
        invoice.status ===
        PaymentStatus.PAID
    );

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Financeiro SaaS"
        title="Pagamentos SaaS"
        description="Acompanhe as cobrancas emitidas para cada empresa e execute as atualizacoes operacionais com acoes objetivas."
      />

      <PaymentAttentionBar
        overdueCount={overdueInvoices.length}
        paidCount={paidInvoices.length}
        pendingCount={pendingInvoices.length}
        totalCount={invoiceRows.length}
      />

      <DataTableContainer
        title="Faturas e recebimentos"
        description="Filtre a fila por empresa, plano ou status da cobranca para atualizar rapidamente o caixa da plataforma."
        toolbar={
          <form
            method="get"
            className="grid gap-4 lg:grid-cols-[220px_220px_220px_minmax(0,1fr)_auto]"
          >
            <label className="field-stack">
              <span className="field-label">
                Empresa
              </span>
              <select
                name="clinicId"
                defaultValue={
                  filters.clinicId ?? ""
                }
                className="field-select"
              >
                <option value="">
                  Todas as empresas
                </option>
                {clinicOptions.map((clinic) => (
                  <option
                    key={clinic.id}
                    value={clinic.id}
                  >
                    {clinic.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                Plano
              </span>
              <select
                name="planId"
                defaultValue={
                  filters.planId ?? ""
                }
                className="field-select"
              >
                <option value="">
                  Todos os planos
                </option>
                {overview.allPlans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                Status
              </span>
              <select
                name="status"
                defaultValue={
                  filters.status ?? ""
                }
                className="field-select"
              >
                <option value="">
                  Todos os status
                </option>
                {Object.values(PaymentStatus).map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {getStatusLabel(status)}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                Buscar cobrança
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="query"
                  defaultValue={
                    filters.query ?? ""
                  }
                  placeholder="Empresa, plano ou descrição"
                  className="pl-9"
                />
              </div>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">
                <Filter className="size-4" />
                Filtrar
              </Button>
              <Button
                type="button"
                asChild
                variant="outline"
              >
                <a href="/dashboard/billing/payments">
                  Limpar
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
                Empresa
              </TableHead>
              <TableHead>
                Plano
              </TableHead>
              <TableHead>
                Descrição
              </TableHead>
              <TableHead>
                Vencimento
              </TableHead>
              <TableHead>
                Valor
              </TableHead>
              <TableHead>
                Status
              </TableHead>
              <TableHead>
                Último pagamento
              </TableHead>
              <TableHead className="text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length ===
            0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="p-0"
                >
                  <EmptyState
                    title="Nenhuma cobrança SaaS encontrada"
                    description="Ajuste os filtros para localizar a fatura certa."
                    action={
                      <Button
                        type="button"
                        asChild
                        variant="outline"
                      >
                        <a href="/dashboard/billing/payments">
                          Limpar filtros
                        </a>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map(
                ({ invoice, subscription }) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="align-top">
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
                    </TableCell>
                    <TableCell className="align-top">
                      {
                        subscription
                          .clinicBillingPlan
                          .name
                      }
                    </TableCell>
                    <TableCell className="align-top">
                      {invoice.description ??
                        "Cobrança SaaS"}
                    </TableCell>
                    <TableCell className="align-top">
                      {new Date(
                        invoice.dueDate
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="align-top">
                      {formatCurrency(
                        invoice.amount
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                          invoice.status
                        )}`}
                      >
                        {getStatusLabel(
                          invoice.status
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      {invoice.payments[0] ? (
                        <div className="space-y-1 text-xs">
                          <div>
                            {new Date(
                              invoice
                                .payments[0]
                                .paidAt
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-muted-foreground">
                            Registrado
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem pagamento registrado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex justify-end gap-2">
                        {(invoice.status ===
                          PaymentStatus.PENDING ||
                          invoice.status ===
                            PaymentStatus.OVERDUE) && (
                          <form
                            action={platformMarkClinicInvoicePaidAction}
                          >
                            <input
                              type="hidden"
                              name="invoiceId"
                              value={invoice.id}
                            />
                            <Button
                              type="submit"
                              size="icon-sm"
                              variant="outline"
                              title="Marcar como pago"
                              aria-label="Marcar como pago"
                            >
                              <CheckCheck className="size-4" />
                            </Button>
                          </form>
                        )}

                        {invoice.status ===
                        PaymentStatus.PENDING ? (
                          <form
                            action={platformMarkClinicInvoiceOverdueAction}
                          >
                            <input
                              type="hidden"
                              name="invoiceId"
                              value={invoice.id}
                            />
                            <Button
                              type="submit"
                              size="icon-sm"
                              variant="outline"
                              title="Marcar em atraso"
                              aria-label="Marcar em atraso"
                            >
                              <AlertTriangle className="size-4" />
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </DataTableContainer>
    </DashboardPage>
  );
}
