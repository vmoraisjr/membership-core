import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { PatientKind, PatientStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getPatientProfile } from "../services/get-patient-profile";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";
import { getPatientBenefitBalance } from "@/features/benefit-usage/services/get-patient-benefit-balance";
import { PatientDialog } from "./patient-dialog";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";
import { SubscriptionRowActions } from "@/features/subscriptions/components/subscription-row-actions";
import { SubscriptionStatusBadge } from "@/features/subscriptions/components/subscription-status-badge";
import { ConsumeBenefitDialog } from "@/features/benefit-usage/components/consume-benefit-dialog";
import { PatientPaymentsTable } from "@/features/billing/components/patient-payments-table";
import { clienteUrl, clientesUrl, type CustomerTab } from "@/lib/company-routes";
import {
  legendSection,
  SUBSCRIPTION_STATUS_LEGEND,
  PATIENT_INVOICE_STATUS_LEGEND,
  BENEFIT_USAGE_STATUS_LEGEND,
} from "@/lib/legend-content";

type Props = {
  patientId: string;
  tab?: string;
  returnTo?: string;
};

const CUSTOMER_TABS: CustomerTab[] = [
  "overview",
  "membership",
  "benefits",
  "billing",
  "history",
];

function resolveTab(
  tab: string | undefined
): CustomerTab {
  return CUSTOMER_TABS.some(
    (candidate) => candidate === tab
  )
    ? (tab as CustomerTab)
    : "overview";
}

function resolveReturnTo(returnTo?: string) {
  return returnTo &&
    returnTo.startsWith("/dashboard/")
    ? returnTo
    : clientesUrl();
}

function resolveBackLabelKey(
  backHref: string
) {
  if (
    backHref.startsWith(
      "/dashboard/cobrancas"
    )
  ) {
    return "patients.profile.backToBilling";
  }

  if (
    backHref.startsWith(
      "/dashboard/atendimentos"
    )
  ) {
    return "patients.profile.backToService";
  }

  return "patients.profile.backToList";
}

function formatDateTime(
  value: Date | null | undefined
) {
  const t = getTranslations();
  if (!value) {
    return t("shared.states.notRecorded");
  }

  return new Date(value).toLocaleString();
}

function formatDateOnly(
  value: Date | null | undefined
) {
  const t = getTranslations();
  if (!value) {
    return t("shared.states.notRecorded");
  }

  return new Date(value).toLocaleDateString();
}

export async function PatientProfilePage({
  patientId,
  tab,
  returnTo,
}: Props) {
  const t = getTranslations();
  const role =
    await getCurrentUserRole();
  const backHref = resolveReturnTo(returnTo);
  const activeTab = resolveTab(tab);

  if (
    !hasPermission(
      role,
      "patients",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t(
            "patients.profile.accessDeniedTitle"
          )}
          description={t(
            "patients.profile.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  const [
    profile,
    membershipPlans,
    benefitBalances,
  ] = await Promise.all([
    getPatientProfile(patientId),
    getMembershipPlans(),
    getPatientBenefitBalance(),
  ]);

  const isDependent =
    profile.patient.kind === "DEPENDENT";
  const canManagePatients = hasPermission(
    role,
    "patients",
    "manage"
  );

  const responsibleOptions =
    canManagePatients && isDependent
      ? await prisma.patient.findMany({
          where: {
            clinicId:
              profile.patient.clinicId,
            kind: PatientKind.TITULAR,
            status: PatientStatus.ACTIVE,
          },
          select: {
            id: true,
            fullName: true,
            document: true,
            kind: true,
            status: true,
          },
        })
      : [];
  const canManageSubscriptions = hasPermission(
    role,
    "subscriptions",
    "manage"
  );
  const canManageBenefitUsage = hasPermission(
    role,
    "benefitUsage",
    "manage"
  );
  const canManageBilling = hasPermission(
    role,
    "billing",
    "manage"
  );

  const benefitUsages =
    profile.patient.subscriptions.flatMap(
      (subscription) =>
        subscription.benefitUsages
    );

  const subscriptionPatients = [
    {
      id: profile.subscriptionSourcePatient
        .id,
      fullName:
        profile.subscriptionSourcePatient
          .fullName,
    },
  ];

  const planOptions = membershipPlans.map(
    (plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      activeBenefitsCount:
        plan.benefits.filter(
          (benefit) => benefit.active
        ).length,
    })
  );

  const ownBenefitBalances =
    benefitBalances.filter(
      (balance) =>
        balance.patientId ===
        profile.patient.id
    );

  const currentSubscription =
    profile.visibleSubscriptions[0] ??
    null;
  const pendingInvoicesCount =
    profile.visibleInvoices.filter(
      (invoice) =>
        invoice.status === "PENDING"
    ).length;
  const overdueInvoicesCount =
    profile.visibleInvoices.filter(
      (invoice) =>
        invoice.status === "OVERDUE"
    ).length;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Cliente"
        title={profile.patient.fullName}
        description={t(
          "patients.profile.description"
        )}
        meta={
          <>
            <span className="workspace-kicker">
              {profile.patient.kind ===
              "DEPENDENT"
                ? "Dependente"
                : "Titular"}
            </span>
            <span className="workspace-kicker">
              {profile.patient.status ===
              "ACTIVE"
                ? t("shared.states.active")
                : t(
                    "shared.states.inactive"
                  )}
            </span>
            <span className="workspace-kicker">
              {profile.patient.phone}
            </span>
          </>
        }
        action={
          <Button asChild variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              {t(
                resolveBackLabelKey(backHref)
              )}
            </Link>
          </Button>
        }
      />

      <Tabs
        key={activeTab}
        defaultValue={activeTab}
      >
        <TabsList>
          <TabsTrigger value="overview">
            {t("patients.profile.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="membership">
            {t(
              "patients.profile.tabs.subscriptions"
            )}
          </TabsTrigger>
          <TabsTrigger value="benefits">
            {t("patients.profile.tabs.benefits")}
          </TabsTrigger>
          <TabsTrigger value="billing">
            {t("patients.profile.tabs.payments")}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t("patients.profile.tabs.history")}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="space-y-5"
        >
          <SectionCard
            title={t(
              "patients.profile.currentStatusTitle"
            )}
            description={t(
              "patients.profile.currentStatusDescription"
            )}
          >
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.plan")}
                </p>
                {currentSubscription ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="detail-field-value">
                      {
                        currentSubscription
                          .membershipPlan
                          .name
                      }
                    </p>
                    <SubscriptionStatusBadge
                      status={
                        currentSubscription.status
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="detail-field-value text-muted-foreground">
                      {t(
                        "patients.profile.noSubscriptionNextStep"
                      )}
                    </p>
                    {!isDependent &&
                    canManageSubscriptions ? (
                      <SubscriptionDialog
                        patients={
                          subscriptionPatients
                        }
                        plans={planOptions}
                        defaultPatientId={
                          profile
                            .subscriptionSourcePatient
                            .id
                        }
                        trigger={
                          <Button size="sm">
                            {t(
                              "patients.profile.newSubscriptionAction"
                            )}
                          </Button>
                        }
                      />
                    ) : null}
                  </div>
                )}
              </div>

              <div className="detail-field">
                <p className="detail-field-label">
                  {t(
                    "patients.table.financialStatus"
                  )}
                </p>
                <div className="space-y-2">
                  <p className="detail-field-value">
                    {overdueInvoicesCount > 0
                      ? t(
                          "patients.table.financialStatusOverdue",
                          {
                            count: overdueInvoicesCount,
                          }
                        )
                      : pendingInvoicesCount > 0
                        ? t(
                            "patients.table.financialStatusPending",
                            {
                              count: pendingInvoicesCount,
                            }
                          )
                        : t(
                            "patients.table.financialStatusUpToDate"
                          )}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <Link
                      href={clienteUrl(
                        patientId,
                        {
                          tab: "billing",
                          returnTo,
                        }
                      )}
                    >
                      {t(
                        "patients.profile.openBillingTabAction"
                      )}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.benefit")}
                </p>
                <div className="space-y-2">
                  <p className="detail-field-value">
                    {ownBenefitBalances.length}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <Link
                      href={clienteUrl(
                        patientId,
                        {
                          tab: "benefits",
                          returnTo,
                        }
                      )}
                    >
                      {t(
                        "patients.profile.openBenefitsTabAction"
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t(
              "patients.profile.overviewTitle"
            )}
            description={t(
              "patients.profile.overviewDescription"
            )}
            action={
              canManagePatients ? (
                <PatientDialog
                  mode="edit"
                  initialData={{
                    id: profile.patient.id,
                    fullName:
                      profile.patient
                        .fullName,
                    email:
                      profile.patient.email,
                    phone:
                      profile.patient.phone,
                    birthDate:
                      profile.patient
                        .birthDate,
                    document:
                      profile.patient
                        .document,
                    zipCode:
                      profile.patient
                        .zipCode,
                    city: profile.patient
                      .city,
                    state:
                      profile.patient.state,
                    address:
                      profile.patient
                        .address,
                    kind: profile.patient
                      .kind,
                    responsiblePatientId:
                      profile.patient
                        .responsiblePatientId,
                    responsiblePatientDocument:
                      profile.patient
                        .responsiblePatient
                        ?.document ?? null,
                    responsiblePatientName:
                      profile.patient
                        .responsiblePatient
                        ?.fullName ?? null,
                  }}
                  responsibleOptions={
                    responsibleOptions
                  }
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      {t(
                        "shared.actions.edit"
                      )}
                    </Button>
                  }
                />
              ) : undefined
            }
          >
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.email")}
                </p>
                <p className="detail-field-value break-all">
                  {profile.patient.email}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.phone")}
                </p>
                <p className="detail-field-value">
                  {profile.patient.phone}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  Tipo
                </p>
                <p className="detail-field-value">
                  {profile.patient.kind ===
                  "DEPENDENT"
                    ? "Dependente"
                    : "Titular"}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.status")}
                </p>
                <p className="detail-field-value">
                  {profile.patient.status ===
                  "ACTIVE"
                    ? t(
                        "shared.states.active"
                      )
                    : t(
                        "shared.states.inactive"
                      )}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t(
                    "shared.labels.registrationDate"
                  )}
                </p>
                <p className="detail-field-value">
                  {formatDateOnly(
                    profile.patient.createdAt
                  )}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.birthDate")}
                </p>
                <p className="detail-field-value">
                  {formatDateOnly(
                    profile.patient.birthDate
                  )}
                </p>
              </div>
              <div className="detail-field">
                <p className="detail-field-label">
                  {t("shared.labels.document")}
                </p>
                <p className="detail-field-value">
                  {profile.patient.document}
                </p>
              </div>
              {profile.patient.kind ===
                "DEPENDENT" &&
              profile.patient
                .responsiblePatient ? (
                <div className="detail-field">
                  <p className="detail-field-label">
                    Responsável atual
                  </p>
                  <p className="detail-field-value">
                    {
                      profile.patient
                        .responsiblePatient
                        .fullName
                    }
                  </p>
                </div>
              ) : null}
            </div>
          </SectionCard>

          {profile.patient.patientContracts
            .length > 0 ? (
            <SectionCard
              title={t(
                "patients.profile.contractHistoryTitle"
              )}
              description={t(
                "patients.profile.contractHistoryDescription"
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("shared.labels.title")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.status")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.created")}
                    </TableHead>
                    <TableHead>
                      {t(
                        "patients.profile.accepted"
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.patient.patientContracts.map(
                    (contract) => (
                      <TableRow
                        key={contract.id}
                      >
                        <TableCell>
                          {contract.title}
                        </TableCell>
                        <TableCell>
                          {contract.status}
                        </TableCell>
                        <TableCell>
                          {formatDateOnly(
                            contract.createdAt
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(
                            contract.acceptedAt
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </SectionCard>
          ) : null}
        </TabsContent>

        <TabsContent value="membership">
          <SectionCard
            title={t(
              "patients.profile.subscriptionsTitle"
            )}
            description={
              isDependent
                ? `Assinatura herdada de ${profile.subscriptionSourcePatient.fullName}. Gerencie pelo cadastro do titular.`
                : t(
                    "patients.profile.subscriptionsDescription"
                  )
            }
            helpLegend={[
              legendSection(
                "Status da assinatura",
                SUBSCRIPTION_STATUS_LEGEND
              ),
            ]}
            action={
              !isDependent &&
              canManageSubscriptions ? (
                <SubscriptionDialog
                  patients={
                    subscriptionPatients
                  }
                  plans={planOptions}
                  defaultPatientId={
                    profile
                      .subscriptionSourcePatient
                      .id
                  }
                  trigger={
                    <Button size="sm">
                      {t(
                        "patients.profile.newSubscriptionAction"
                      )}
                    </Button>
                  }
                />
              ) : undefined
            }
          >
            {profile.visibleSubscriptions
              .length === 0 ? (
              <EmptyState
                title={t(
                  "patients.profile.noSubscriptions"
                )}
                description=""
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("shared.labels.plan")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.status")}
                    </TableHead>
                    <TableHead>
                      {t(
                        "patients.profile.started"
                      )}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.expires")}
                    </TableHead>
                    {!isDependent ? (
                      <TableHead className="text-right">
                        {t(
                          "shared.labels.actions"
                        )}
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.visibleSubscriptions.map(
                    (subscription) => (
                      <TableRow
                        key={subscription.id}
                      >
                        <TableCell>
                          {
                            subscription
                              .membershipPlan
                              .name
                          }
                        </TableCell>
                        <TableCell>
                          <SubscriptionStatusBadge
                            status={
                              subscription.status
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {formatDateOnly(
                            subscription.startedAt
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateOnly(
                            subscription.expiresAt
                          )}
                        </TableCell>
                        {!isDependent ? (
                          <TableCell className="text-right">
                            <SubscriptionRowActions
                              subscription={{
                                id: subscription.id,
                                patientId:
                                  subscription.patientId,
                                membershipPlanId:
                                  subscription.membershipPlanId,
                                startedAt:
                                  subscription.startedAt,
                                expiresAt:
                                  subscription.expiresAt ??
                                  subscription.startedAt,
                                status:
                                  subscription.status,
                              }}
                              patients={
                                subscriptionPatients
                              }
                              plans={planOptions}
                              canManageSubscriptions={
                                canManageSubscriptions
                              }
                            />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="benefits">
          <SectionCard
            title={t(
              "patients.profile.benefitHistoryTitle"
            )}
            description={
              isDependent
                ? `Benefícios herdados de ${profile.subscriptionSourcePatient.fullName}.`
                : t(
                    "patients.profile.benefitHistoryDescription"
                  )
            }
            helpLegend={[
              legendSection(
                "Status de uso",
                BENEFIT_USAGE_STATUS_LEGEND
              ),
            ]}
            action={
              canManageBenefitUsage &&
              ownBenefitBalances.length > 0 ? (
                <ConsumeBenefitDialog
                  balances={ownBenefitBalances}
                  title={t(
                    "patients.rowActions.consumeTitle",
                    {
                      name: profile.patient
                        .fullName,
                    }
                  )}
                  trigger={
                    <Button size="sm">
                      {t(
                        "patients.rowActions.useBenefit"
                      )}
                    </Button>
                  }
                />
              ) : undefined
            }
          >
            {benefitUsages.length === 0 ? (
              <EmptyState
                title={t(
                  "patients.profile.noBenefitUsage"
                )}
                description=""
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("shared.labels.benefit")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.status")}
                    </TableHead>
                    <TableHead>
                      {t(
                        "shared.labels.quantity"
                      )}
                    </TableHead>
                    <TableHead>
                      {t(
                        "patients.profile.usedBy"
                      )}
                    </TableHead>
                    <TableHead>
                      {t(
                        "patients.profile.usedAt"
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefitUsages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>
                        {
                          usage.membershipBenefit
                            .title
                        }
                      </TableCell>
                      <TableCell>
                        {usage.status}
                      </TableCell>
                      <TableCell>
                        {usage.quantity}
                      </TableCell>
                      <TableCell>
                        {usage.usedBy}
                      </TableCell>
                      <TableCell>
                        {usage.status ===
                          "CANCELED" &&
                        usage.canceledAt
                          ? `${formatDateTime(
                              usage.usedAt
                            )} (${t(
                              "patients.profile.canceledAt",
                              {
                                date: formatDateTime(
                                  usage.canceledAt
                                ),
                              }
                            )})`
                          : formatDateTime(
                              usage.usedAt
                            )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="billing">
          <SectionCard
            title={t(
              "patients.profile.paymentHistoryTitle"
            )}
            description={
              isDependent
                ? `Cobranças e vigência refletidas a partir de ${profile.subscriptionSourcePatient.fullName}.`
                : t(
                    "patients.profile.paymentHistoryDescription"
                  )
            }
            helpLegend={[
              legendSection(
                "Status da cobrança",
                PATIENT_INVOICE_STATUS_LEGEND
              ),
            ]}
          >
            {profile.visibleInvoices.length ===
            0 ? (
              <EmptyState
                title={t(
                  "patients.profile.noInvoices"
                )}
                description=""
              />
            ) : (
              <PatientPaymentsTable
                invoices={profile.visibleInvoices.map(
                  (invoice) => ({
                    ...invoice,
                    patient: {
                      fullName:
                        profile.patient
                          .fullName,
                    },
                  })
                )}
                canManageBilling={
                  canManageBilling
                }
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="history">
          <SectionCard
            title={t(
              "patients.profile.timelineTitle"
            )}
            description={t(
              "patients.profile.timelineDescription"
            )}
          >
            <div className="divide-y">
              {profile.timeline.length === 0 ? (
                <EmptyState
                  title={t(
                    "patients.profile.timelineEmpty"
                  )}
                  description=""
                />
              ) : (
                profile.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="space-y-1 p-4"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="font-medium">
                        {entry.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(
                          entry.occurredAt
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "patients.profile.actor"
                      )}
                      : {entry.actor}
                    </p>
                    {entry.entityLabel ? (
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "patients.profile.label"
                        )}
                        : {entry.entityLabel}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </DashboardPage>
  );
}
