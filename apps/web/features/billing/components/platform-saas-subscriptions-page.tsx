import {
  ArrowRightLeft,
  Ban,
  CircleCheckBig,
  Filter,
  FlaskConical,
  PauseCircle,
  Search,
  ShieldAlert,
} from "lucide-react";
import { ClinicSubscriptionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
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
  platformAssignClinicBillingPlanAction,
  platformUpdateClinicSubscriptionStatusAction,
} from "../actions/platform-manage-clinic-subscription";
import {
  canTransitionClinicSubscriptionStatus,
  getPlatformClinicBillingOverview,
} from "../services/billing-foundation";
import { SaasSubscriptionDetailsPanel } from "./saas-subscription-details-panel";

type Props = {
  filters: {
    clinicId?: string;
    planId?: string;
    status?: string;
    query?: string;
  };
};

function getStatusClass(
  status: ClinicSubscriptionStatus
) {
  switch (status) {
    case ClinicSubscriptionStatus.ACTIVE:
      return "bg-emerald-100 text-emerald-700";
    case ClinicSubscriptionStatus.TRIAL:
    case ClinicSubscriptionStatus.PENDING:
      return "bg-sky-100 text-sky-700";
    case ClinicSubscriptionStatus.PAST_DUE:
    case ClinicSubscriptionStatus.SUSPENDED:
      return "bg-amber-100 text-amber-800";
    case ClinicSubscriptionStatus.CANCELED:
      return "bg-rose-100 text-rose-700";
  }
}

function getStatusLabel(
  status: ClinicSubscriptionStatus
) {
  switch (status) {
    case ClinicSubscriptionStatus.ACTIVE:
      return "Ativa";
    case ClinicSubscriptionStatus.TRIAL:
      return "Trial";
    case ClinicSubscriptionStatus.PENDING:
      return "Pendente";
    case ClinicSubscriptionStatus.PAST_DUE:
      return "Em atraso";
    case ClinicSubscriptionStatus.SUSPENDED:
      return "Suspensa";
    case ClinicSubscriptionStatus.CANCELED:
      return "Cancelada";
  }
}

function formatOptionalDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "Nao definido";
  }

  return new Date(value).toLocaleDateString();
}

export async function PlatformSaasSubscriptionsPage({
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
          description="As assinaturas SaaS das contas clientes são administradas apenas pela equipe da plataforma."
        />
      </DashboardPage>
    );
  }

  const overview =
    await getPlatformClinicBillingOverview();
  const normalizedQuery =
    filters.query?.trim().toLowerCase() ??
    "";
  const filteredSubscriptions =
    overview.clinicSubscriptions.filter(
      (subscription) => {
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
          subscription.status !==
            filters.status
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
            subscription.clinicBillingPlan
              .name,
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

  const availableStatusActions: Array<{
    status: ClinicSubscriptionStatus;
    label: string;
    icon: typeof CircleCheckBig;
    variant:
      | "outline"
      | "destructive";
  }> = [
    {
      status: ClinicSubscriptionStatus.ACTIVE,
      label: "Ativar",
      icon: CircleCheckBig,
      variant: "outline",
    },
    {
      status: ClinicSubscriptionStatus.TRIAL,
      label: "Enviar para trial",
      icon: FlaskConical,
      variant: "outline",
    },
    {
      status: ClinicSubscriptionStatus.SUSPENDED,
      label: "Suspender",
      icon: PauseCircle,
      variant: "outline",
    },
    {
      status: ClinicSubscriptionStatus.CANCELED,
      label: "Cancelar",
      icon: Ban,
      variant: "destructive",
    },
  ];
  const trialCount =
    overview.clinicSubscriptions.filter(
      (subscription) =>
        subscription.status ===
        ClinicSubscriptionStatus.TRIAL
    ).length;
  const overdueCount =
    overview.clinicSubscriptions.filter(
      (subscription) =>
        subscription.status ===
          ClinicSubscriptionStatus.PAST_DUE ||
        subscription.status ===
          ClinicSubscriptionStatus.SUSPENDED
    ).length;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Receita recorrente"
        title="Assinaturas SaaS"
        description="Filtre as contas clientes, ajuste o plano aplicado e mude o status com ações mais diretas e visuais."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Assinaturas monitoradas"
          value={String(
            overview.clinicSubscriptions.length
          )}
          hint="Base total de contas clientes com recorrência SaaS."
          icon={
            <CircleCheckBig className="size-5" />
          }
        />
        <MetricCard
          label="Em trial"
          value={String(trialCount)}
          hint="Empresas em período de ativação comercial."
          icon={<FlaskConical className="size-5" />}
        />
        <MetricCard
          label="Precisam de atenção"
          value={String(overdueCount)}
          hint="Assinaturas em atraso ou suspensas com maior risco operacional."
          icon={<ShieldAlert className="size-5" />}
        />
      </div>

      <DataTableContainer
        title="Fila de assinaturas"
        description="Cada linha mostra a empresa, o plano vigente, o vencimento mais recente e as ações disponíveis."
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
                {Object.values(
                  ClinicSubscriptionStatus
                ).map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span className="field-label">
                Buscar conta
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="query"
                  defaultValue={
                    filters.query ?? ""
                  }
                  placeholder="Empresa, e-mail ou plano"
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
                <a href="/dashboard/billing/subscriptions">
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
                Plano aplicado
              </TableHead>
              <TableHead>
                Status
              </TableHead>
              <TableHead>
                Vigência
              </TableHead>
              <TableHead>
                Última cobrança
              </TableHead>
              <TableHead className="text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length ===
            0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="p-0"
                >
                  <EmptyState
                    title="Nenhuma assinatura SaaS encontrada"
                    description="Ajuste os filtros para localizar a conta cliente certa."
                    action={
                      <Button
                        type="button"
                        asChild
                        variant="outline"
                      >
                        <a href="/dashboard/billing/subscriptions">
                          Limpar filtros
                        </a>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map(
                (subscription) => {
                  const latestInvoice =
                    subscription.invoices[0];

                  return (
                    <TableRow
                      key={subscription.id}
                    >
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

                      <TableCell className="min-w-[18rem] align-top">
                        <form
                          action={platformAssignClinicBillingPlanAction}
                          className="grid gap-2"
                        >
                          <input
                            type="hidden"
                            name="subscriptionId"
                            value={subscription.id}
                          />
                          <select
                            name="clinicBillingPlanId"
                            defaultValue={
                              subscription.clinicBillingPlanId
                            }
                            className="field-select h-10"
                          >
                            {overview.allPlans.map(
                              (plan) => (
                                <option
                                  key={plan.id}
                                  value={plan.id}
                                >
                                  {plan.name}
                                </option>
                              )
                            )}
                          </select>
                          <p className="text-xs text-muted-foreground">
                            Ajuste o plano comercial vinculado a esta empresa.
                          </p>
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="justify-start"
                          >
                            <ArrowRightLeft className="size-4" />
                            Trocar plano
                          </Button>
                        </form>
                      </TableCell>

                      <TableCell className="align-top">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                            subscription.status
                          )}`}
                        >
                          {getStatusLabel(
                            subscription.status
                          )}
                        </span>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>
                            Início:{" "}
                            {formatOptionalDate(
                              subscription.startedAt
                            )}
                          </div>
                          <div>
                            Trial até:{" "}
                            {formatOptionalDate(
                              subscription.trialEndsAt
                            )}
                          </div>
                          <div>
                            Expira em:{" "}
                            {formatOptionalDate(
                              subscription.expiresAt
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        {latestInvoice ? (
                          <div className="space-y-1 text-xs">
                            <div>
                              {formatOptionalDate(
                                latestInvoice.dueDate
                              )}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(
                                latestInvoice.amount
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem cobrança emitida
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="align-top text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <SaasSubscriptionDetailsPanel
                            clinicName={
                              subscription
                                .clinic
                                .brandName ??
                              subscription
                                .clinic.name
                            }
                            clinicEmail={
                              subscription
                                .clinic.email
                            }
                            currentPlan={
                              subscription
                                .clinicBillingPlan
                                .name
                            }
                            currentStatus={getStatusLabel(
                              subscription.status
                            )}
                            startedAt={
                              subscription.startedAt
                            }
                            trialEndsAt={
                              subscription.trialEndsAt
                            }
                            expiresAt={
                              subscription.expiresAt
                            }
                            latestInvoice={
                              latestInvoice
                                ? {
                                    dueDate:
                                      latestInvoice.dueDate,
                                    amount:
                                      latestInvoice.amount,
                                  }
                                : null
                            }
                          />
                          {availableStatusActions
                            .filter(
                              (action) =>
                                canTransitionClinicSubscriptionStatus(
                                  subscription.status,
                                  action.status
                                )
                            )
                            .map((action) => {
                              const Icon =
                                action.icon;

                              return (
                                <form
                                  key={
                                    action.status
                                  }
                                  action={platformUpdateClinicSubscriptionStatusAction}
                                >
                                  <input
                                    type="hidden"
                                    name="clinicId"
                                    value={
                                      subscription.clinicId
                                    }
                                  />
                                  <input
                                    type="hidden"
                                    name="subscriptionId"
                                    value={
                                      subscription.id
                                    }
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value={
                                      action.status
                                    }
                                  />
                                  <Button
                                    type="submit"
                                    size="icon-sm"
                                    variant={
                                      action.variant
                                    }
                                    title={
                                      action.label
                                    }
                                    aria-label={
                                      action.label
                                    }
                                  >
                                    <Icon className="size-4" />
                                  </Button>
                                </form>
                              );
                            })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </DataTableContainer>
    </DashboardPage>
  );
}
