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
import { formatCurrency } from "@/lib/formatters";

import { getPatientProfile } from "../services/get-patient-profile";

type Props = {
  patientId: string;
};

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
}: Props) {
  const t = getTranslations();
  const role =
    await getCurrentUserRole();

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

  const profile =
    await getPatientProfile(patientId);

  const benefitUsages =
    profile.patient.subscriptions.flatMap(
      (subscription) =>
        subscription.benefitUsages
    );

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
            <Link href="/dashboard/patients">
              <ArrowLeft className="size-4" />
              {t(
                "patients.profile.backToList"
              )}
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            {t("patients.profile.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            {t(
              "patients.profile.tabs.subscriptions"
            )}
          </TabsTrigger>
          <TabsTrigger value="benefits">
            {t("patients.profile.tabs.benefits")}
          </TabsTrigger>
          <TabsTrigger value="payments">
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
              "patients.profile.overviewTitle"
            )}
            description={t(
              "patients.profile.overviewDescription"
            )}
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

        <TabsContent value="subscriptions">
          <SectionCard
            title={t(
              "patients.profile.subscriptionsTitle"
            )}
            description={
              profile.patient.kind ===
              "DEPENDENT"
                ? `Assinaturas herdadas de ${profile.subscriptionSourcePatient.fullName}.`
                : t(
                    "patients.profile.subscriptionsDescription"
                  )
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
                    <TableHead>
                      {t("patients.profile.link")}
                    </TableHead>
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
                          {subscription.status}
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
                        <TableCell>
                          <Link
                            href={`/dashboard/subscriptions?patientId=${profile.subscriptionSourcePatient.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {t(
                              "shared.actions.open"
                            )}
                          </Link>
                        </TableCell>
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
            description={t(
              "patients.profile.benefitHistoryDescription"
            )}
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

        <TabsContent value="payments">
          <SectionCard
            title={t(
              "patients.profile.paymentHistoryTitle"
            )}
            description={
              profile.patient.kind ===
              "DEPENDENT"
                ? `Cobranças e vigência refletidas a partir de ${profile.subscriptionSourcePatient.fullName}.`
                : t(
                    "patients.profile.paymentHistoryDescription"
                  )
            }
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t(
                        "patients.profile.invoice"
                      )}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.plan")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.amount")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.dueDate")}
                    </TableHead>
                    <TableHead>
                      {t("shared.labels.status")}
                    </TableHead>
                    <TableHead>
                      {t(
                        "shared.labels.paymentHistory"
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.visibleInvoices.map(
                    (invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {invoice.description ??
                            invoice.id}
                        </TableCell>
                        <TableCell>
                          {invoice.subscription
                            ?.membershipPlan
                            ?.name ??
                            t(
                              "patients.profile.detached"
                            )}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            invoice.amount
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateOnly(
                            invoice.dueDate
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.status}
                        </TableCell>
                        <TableCell>
                          {invoice.payments
                            .length === 0 ? (
                            <span className="text-muted-foreground">
                              {t(
                                "patients.profile.noPaymentsRecorded"
                              )}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {invoice.payments.map(
                                (payment) => (
                                  <div
                                    key={
                                      payment.id
                                    }
                                  >
                                    {
                                      payment.status
                                    }
                                    {" · "}
                                    {payment.paymentMethod ??
                                      t(
                                        "patients.profile.unspecified"
                                      )}
                                    {" · "}
                                    {formatDateTime(
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
