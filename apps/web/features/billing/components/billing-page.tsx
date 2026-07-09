import {
  ClinicSubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import { PageHeader } from "@/components/dashboard/page-header";
import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import {
  platformAssignClinicBillingPlanAction,
  platformMarkClinicInvoiceOverdueAction,
  platformMarkClinicInvoicePaidAction,
  platformUpdateClinicSubscriptionStatusAction,
} from "@/features/billing/actions/platform-manage-clinic-subscription";
import { saveClinicBillingPlanAction } from "@/features/modules/actions/save-clinic-billing-plan";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { PatientInvoiceActions } from "./patient-invoice-actions";
import {
  getBillingOverview,
  getPlatformClinicBillingOverview,
} from "../services/billing-foundation";

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

function getSubscriptionStatusClass(
  status:
    | SubscriptionStatus
    | ClinicSubscriptionStatus
) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "TRIAL":
    case "PENDING":
      return "bg-sky-100 text-sky-700";
    case "OVERDUE":
    case "PAST_DUE":
    case "SUSPENDED":
      return "bg-amber-100 text-amber-800";
    case "CANCELED":
    case "EXPIRED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPaymentStatusLabel(
  status: PaymentStatus
) {
  const t = getTranslations();
  return t(`billing.status.${status}`);
}

function getClinicSubscriptionStatusLabel(
  status:
    | SubscriptionStatus
    | ClinicSubscriptionStatus
) {
  const t = getTranslations();
  return t(`billing.status.${status}`);
}

function formatOptionalDate(
  value: Date | string | null | undefined
) {
  const t = getTranslations();
  if (!value) {
    return t("shared.states.notSet");
  }

  return new Date(value).toLocaleDateString();
}

function getPaymentMethodLabel(
  value: PaymentMethod | null | undefined
) {
  const t = getTranslations();
  switch (value) {
    case PaymentMethod.CARD:
      return t("billing.paymentMethod.CARD");
    case PaymentMethod.PIX:
      return t("billing.paymentMethod.PIX");
    case PaymentMethod.CASH:
      return t("billing.paymentMethod.CASH");
    case PaymentMethod.BANK_TRANSFER:
      return t("billing.paymentMethod.BANK_TRANSFER");
    case PaymentMethod.OTHER:
      return t("billing.paymentMethod.OTHER");
    default:
      return t("shared.states.notSet");
  }
}

export async function BillingPage() {
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

  if (!currentUser?.clinicId) {
    if (
      currentUser?.role !== "OWNER" &&
      currentUser?.role !== "ADMIN"
    ) {
      return (
        <DashboardPage>
          <ClinicAssignmentRequired />
        </DashboardPage>
      );
    }

    const overview =
      await getPlatformClinicBillingOverview();

    return (
      <DashboardPage>
        <PageHeader
          eyebrow="Receita e governança SaaS"
          title="Assinaturas SaaS da plataforma"
          description="Gerencie catálogo comercial, status das contas clientes e cobrança recorrente do Sheep."
        />

        <div className="page-section-grid md:grid-cols-2 xl:grid-cols-4">
          <SectionCard
            title={t("dashboard.platform.activeClinics")}
            description="Contas clientes ativas na plataforma."
          >
            <div className="p-5 text-3xl font-semibold">
              {
                overview
                  .platformMetrics
                  .activeClinics
              }
            </div>
          </SectionCard>
          <SectionCard
            title={t("dashboard.platform.trialClinics")}
            description="Contas clientes em período de teste."
          >
            <div className="p-5 text-3xl font-semibold">
              {
                overview
                  .platformMetrics
                  .trialClinics
              }
            </div>
          </SectionCard>
          <SectionCard
            title={t("dashboard.platform.pastDueClinics")}
            description="Contas clientes em atraso."
          >
            <div className="p-5 text-3xl font-semibold">
              {
                overview
                  .platformMetrics
                  .pastDueClinics
              }
            </div>
          </SectionCard>
          <SectionCard
            title={t("dashboard.platform.monthlySaasRevenue")}
            description="Receita SaaS recebida no mes."
          >
            <div className="p-5 text-3xl font-semibold">
              {formatCurrency(
                overview
                  .platformMetrics
                  .monthlySaasRevenue
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Catálogo comercial Sheep"
          description="Cadastre, edite, ative e desative os planos SaaS disponíveis para as contas clientes."
        >
          <div className="grid gap-4 border-b p-5 md:grid-cols-5">
            <form
              action={saveClinicBillingPlanAction}
              className="grid gap-4 md:col-span-5 md:grid-cols-5"
            >
              <input
                name="name"
                placeholder="Novo plano"
                className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
                required
              />
              <input
                name="monthlyPrice"
                type="number"
                step="0.01"
                placeholder="Mensal"
                className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
              />
              <input
                name="annualPrice"
                type="number"
                step="0.01"
                placeholder="Anual"
                className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
              />
              <input
                name="trialDays"
                type="number"
                min="0"
                defaultValue="14"
                className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Criar plano
              </button>
            </form>
          </div>
          <div className="divide-y">
            {overview.allPlans.map((plan) => (
              <form
                key={plan.id}
                action={saveClinicBillingPlanAction}
                className="grid gap-3 p-5 md:grid-cols-[minmax(0,1.2fr)_120px_120px_110px_auto_auto]"
              >
                <input
                  type="hidden"
                  name="planId"
                  value={plan.id}
                />
                <input
                  name="name"
                  defaultValue={plan.name}
                  className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
                />
                <input
                  name="monthlyPrice"
                  type="number"
                  step="0.01"
                  defaultValue={plan.monthlyPrice ?? ""}
                  className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
                />
                <input
                  name="annualPrice"
                  type="number"
                  step="0.01"
                  defaultValue={plan.annualPrice ?? ""}
                  className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
                />
                <input
                  name="trialDays"
                  type="number"
                  min="0"
                  defaultValue={plan.trialDays}
                  className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={plan.active}
                  />
                  Ativo
                </label>
                <button
                  type="submit"
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  Salvar
                </button>
              </form>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Assinaturas das contas clientes"
          description="O owner da plataforma aplica o plano e controla a liberação operacional de cada conta."
        >
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Empresa</th>
                  <th className="py-2">Plano</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Vigencia</th>
                  <th className="py-2">Ultimo vencimento</th>
                  <th className="py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {overview.clinicSubscriptions.map(
                  (subscription) => {
                    const latestInvoice =
                      subscription
                        .invoices[0];

                    return (
                      <tr
                        key={subscription.id}
                        className="border-b"
                      >
                        <td className="py-3">
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
                        </td>
                        <td className="py-3">
                          <form
                            action={
                              platformAssignClinicBillingPlanAction
                            }
                            className="flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="subscriptionId"
                              value={subscription.id}
                            />
                            <select
                              name="clinicBillingPlanId"
                              defaultValue={
                                subscription
                                  .clinicBillingPlanId
                              }
                              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                            >
                              {overview.availablePlans.map(
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
                            <button
                              type="submit"
                              className="rounded-md border px-3 py-1.5 text-xs"
                            >
                              Aplicar
                            </button>
                          </form>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                              subscription.status
                            )}`}
                          >
                            {getClinicSubscriptionStatusLabel(
                              subscription.status
                            )}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="text-xs">
                            <div>
                              Inicio:{" "}
                              {formatOptionalDate(
                                subscription.startedAt
                              )}
                            </div>
                            <div>
                              Expira:{" "}
                              {formatOptionalDate(
                                subscription.expiresAt
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {latestInvoice ? (
                            <div className="text-xs">
                              <div>
                                {formatOptionalDate(
                                  latestInvoice.dueDate
                                )}
                              </div>
                              <div>
                                {formatCurrency(
                                  latestInvoice.amount
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sem fatura
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {[
                              {
                                label:
                                  "Ativar",
                                status:
                                  ClinicSubscriptionStatus.ACTIVE,
                              },
                              {
                                label:
                                  "Teste",
                                status:
                                  ClinicSubscriptionStatus.TRIAL,
                              },
                              {
                                label:
                                  "Suspender",
                                status:
                                  ClinicSubscriptionStatus.SUSPENDED,
                              },
                              {
                                label:
                                  "Cancelar",
                                status:
                                  ClinicSubscriptionStatus.CANCELED,
                              },
                            ]
                              .filter(
                                (action) =>
                                  action.status !==
                                  subscription.status
                              )
                              .map(
                                (action) => (
                                  <form
                                    key={
                                      action.label
                                    }
                                    action={
                                      platformUpdateClinicSubscriptionStatusAction
                                    }
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
                                    <button
                                      type="submit"
                                      className="rounded-md border px-3 py-1.5 text-xs"
                                    >
                                      {
                                        action.label
                                      }
                                    </button>
                                  </form>
                                )
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Pagamentos SaaS"
          description="Acompanhe as faturas SaaS das contas clientes e a situação dos respectivos planos."
        >
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Empresa</th>
                  <th className="py-2">Descricao</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Vencimento</th>
                  <th className="py-2">Plano</th>
                  <th className="py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {overview.clinicSubscriptions.flatMap(
                  (subscription) =>
                    subscription.invoices.map(
                      (invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b"
                        >
                          <td className="py-3">
                            {subscription.clinic
                              .brandName ??
                              subscription.clinic
                                .name}
                          </td>
                          <td className="py-3">
                            {invoice.description ??
                              "-"}
                          </td>
                          <td className="py-3">
                            {formatCurrency(
                              invoice.amount
                            )}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                                invoice.status
                              )}`}
                            >
                              {getPaymentStatusLabel(
                                invoice.status
                              )}
                            </span>
                          </td>
                          <td className="py-3">
                            {formatOptionalDate(
                              invoice.dueDate
                            )}
                          </td>
                          <td className="py-3">
                            {
                              subscription
                                .clinicBillingPlan
                                .name
                            }
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {invoice.status !==
                              PaymentStatus.PAID ? (
                                <form
                                  action={
                                    platformMarkClinicInvoicePaidAction
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="invoiceId"
                                    value={invoice.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-md border px-3 py-1.5 text-xs"
                                  >
                                    Marcar pago
                                  </button>
                                </form>
                              ) : null}
                              {invoice.status ===
                              PaymentStatus.PENDING ? (
                                <form
                                  action={
                                    platformMarkClinicInvoiceOverdueAction
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="invoiceId"
                                    value={invoice.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-md border px-3 py-1.5 text-xs"
                                  >
                                    Marcar atraso
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    )
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </DashboardPage>
    );
  }

  const overview =
    await getBillingOverview();
  const canManageBilling =
    hasPermission(
      role,
      "billing",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Cobrança operacional"
        title={t("billing.title")}
        description={t("billing.description")}
      />

      <div className="page-section-grid md:grid-cols-3">
        <SectionCard
          title={t("billing.sections.overduePatientInvoices.title")}
          description={t("billing.sections.overduePatientInvoices.description")}
        >
          <div className="p-5 text-3xl font-semibold">
            {
              overview.overduePatientInvoiceCount
            }
          </div>
        </SectionCard>

        <SectionCard
          title={t("billing.sections.monthlyPatientRevenue.title")}
          description={t("billing.sections.monthlyPatientRevenue.description")}
        >
          <div className="p-5 text-3xl font-semibold">
            {formatCurrency(
              overview.monthlyPatientRevenue
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={t("billing.sections.platformSubscription.title")}
          description={t("billing.sections.platformSubscription.description")}
        >
          <div className="p-5">
            <div className="space-y-3">
              <div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                    overview
                      .clinicSubscription
                      ?.status ??
                      ClinicSubscriptionStatus.TRIAL
                  )}`}
                >
                  {overview
                    .clinicSubscription
                    ?.status
                    ? getClinicSubscriptionStatusLabel(
                        overview
                          .clinicSubscription
                          .status
                      )
                    : getClinicSubscriptionStatusLabel(
                        ClinicSubscriptionStatus.TRIAL
                      )}
                </span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {t("billing.sections.platformSubscription.plan")}:{" "}
                  {
                    overview
                      .clinicSubscription
                      ?.clinicBillingPlan
                      .name
                  }
                </p>
                <p>
                  {t("billing.sections.platformSubscription.trialEnds")}:{" "}
                  {formatOptionalDate(
                    overview
                      .clinicSubscription
                      ?.trialEndsAt
                  )}
                </p>
                <p>
                  {t("billing.sections.platformSubscription.expires")}:{" "}
                  {formatOptionalDate(
                    overview
                      .clinicSubscription
                      ?.expiresAt
                  )}
                </p>
                <p>
                  {t("billing.sections.platformSubscription.canceledAt")}:{" "}
                  {formatOptionalDate(
                    overview
                      .clinicSubscription
                      ?.canceledAt
                  )}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                A ativação, suspensão e cancelamento do plano da clínica são administrados pela plataforma.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t("billing.sections.patientInvoices.title")}
        description={t("billing.sections.patientInvoices.description")}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("patients.title")}
                </th>
                <th className="py-2">
                  {t("shared.labels.plan")}
                </th>
                <th className="py-2">
                  {t("shared.labels.amount")}
                </th>
                <th className="py-2">
                  {t("shared.labels.subscription")}
                </th>
                <th className="py-2">
                  {t("shared.labels.due")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("shared.labels.paymentDate")}
                </th>
                <th className="py-2">
                  {t("shared.labels.method")}
                </th>
                <th className="py-2">
                  {t("shared.labels.paymentHistory")}
                </th>
                <th className="py-2 text-right">
                  {t("shared.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.patientInvoices
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t("billing.sections.patientInvoices.empty")}
                  </td>
                </tr>
              ) : (
                overview.patientInvoices.map(
                  (invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {
                          invoice.patient
                            .fullName
                        }
                      </td>
                      <td className="py-3">
                        {invoice.subscription
                          ?.membershipPlan
                          ?.name ??
                          t("shared.states.detached")}
                      </td>
                      <td className="py-3">
                        {formatCurrency(
                          invoice.amount
                        )}
                      </td>
                      <td className="py-3">
                        {invoice.subscription ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {
                                invoice
                                  .subscription.id
                              }
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                                invoice
                                  .subscription
                                  .status
                              )}`}
                            >
                              {getClinicSubscriptionStatusLabel(
                                invoice
                                  .subscription
                                  .status
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.manualDetached")}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {new Date(
                          invoice.dueDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {getPaymentStatusLabel(
                            invoice.status
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="text-xs">
                            <div>
                              {new Date(
                                invoice
                                  .payments[0]
                                  .paidAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.notPaid")}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-xs">
                          {getPaymentMethodLabel(
                            invoice.payments[0]
                              ?.paymentMethod ??
                              invoice.paymentMethod
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {invoice.payments.map(
                              (payment) => (
                                <div
                                  key={
                                    payment.id
                                  }
                                >
                                  {[
                                    payment.status,
                                    getPaymentMethodLabel(
                                      payment.paymentMethod
                                    ),
                                    new Date(
                                      payment.paidAt
                                    ).toLocaleDateString(),
                                  ].join(
                                    " · "
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.noPaymentHistory")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {canManageBilling ? (
                          <PatientInvoiceActions
                            invoiceId={
                              invoice.id
                            }
                            status={
                              invoice.status
                            }
                            defaultPaymentMethod={
                              invoice.paymentMethod ??
                              invoice
                                .payments[0]
                                ?.paymentMethod
                            }
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.readOnly")}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title={t("billing.sections.clinicInvoices.title")}
        description={t("billing.sections.clinicInvoices.description")}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("shared.labels.description")}
                </th>
                <th className="py-2">
                  {t("shared.labels.amount")}
                </th>
                <th className="py-2">
                  {t("shared.labels.subscription")}
                </th>
                <th className="py-2">
                  {t("shared.labels.due")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("shared.labels.payment")}
                </th>
                <th className="py-2 text-right">
                  {t("shared.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.clinicInvoices
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t("billing.sections.clinicInvoices.empty")}
                  </td>
                </tr>
              ) : (
                overview.clinicInvoices.map(
                  (invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {invoice.description ??
                          t("billing.sections.clinicInvoices.defaultDescription")}
                      </td>
                      <td className="py-3">
                        {formatCurrency(
                          invoice.amount
                        )}
                      </td>
                      <td className="py-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {
                              invoice
                                .clinicSubscription
                                .id
                            }
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getSubscriptionStatusClass(
                              invoice
                                .clinicSubscription
                                .status
                            )}`}
                          >
                            {getClinicSubscriptionStatusLabel(
                              invoice
                                .clinicSubscription
                                .status
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {new Date(
                          invoice.dueDate
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {getPaymentStatusLabel(
                            invoice.status
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.payments
                          .length > 0 ? (
                          <div className="text-xs">
                            <div className="font-medium">
                              {t("billing.sections.clinicInvoices.lastPaid")}:
                            </div>
                            <div>
                              {new Date(
                                invoice
                                  .payments[0]
                                  .paidAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("billing.sections.clinicInvoices.noPaymentRecord")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          Acompanhamento pela plataforma
                        </span>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {overview.platformMetrics ? (
        <SectionCard
          title={t("billing.sections.platformMetrics.title")}
          description={t("billing.sections.platformMetrics.description")}
        >
          <div className="grid gap-4 p-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.platform.activeClinics")}
              </p>
              <p className="text-2xl font-semibold">
                {
                  overview
                    .platformMetrics
                    .activeClinics
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.platform.trialClinics")}
              </p>
              <p className="text-2xl font-semibold">
                {
                  overview
                    .platformMetrics
                    .trialClinics
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.platform.pastDueClinics")}
              </p>
              <p className="text-2xl font-semibold">
                {
                  overview
                    .platformMetrics
                    .pastDueClinics
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.platform.monthlySaasRevenue")}
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(
                  overview
                    .platformMetrics
                    .monthlySaasRevenue
                )}
              </p>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </DashboardPage>
  );
}
