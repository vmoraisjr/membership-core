import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
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
            <span>
              {profile.patient.kind ===
              "DEPENDENT"
                ? "Dependente"
                : "Titular"}
            </span>
            <span>•</span>
            <span>{profile.patient.status}</span>
          </>
        }
      />

      <SectionCard
        title={t("patients.profile.overviewTitle")}
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
              {profile.patient.status}
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
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("shared.labels.plan")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("patients.profile.started")}
                </th>
                <th className="py-2">
                  {t("shared.labels.expires")}
                </th>
                <th className="py-2">
                  {t("patients.profile.link")}
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.visibleSubscriptions.map(
                (subscription) => (
                  <tr
                    key={subscription.id}
                    className="border-b"
                  >
                    <td className="py-3">
                      {
                        subscription
                          .membershipPlan
                          .name
                      }
                    </td>
                    <td className="py-3">
                      {subscription.status}
                    </td>
                    <td className="py-3">
                      {formatDateOnly(
                        subscription.startedAt
                      )}
                    </td>
                    <td className="py-3">
                      {formatDateOnly(
                        subscription.expiresAt
                      )}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/dashboard/subscriptions?patientId=${profile.subscriptionSourcePatient.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {t("shared.actions.open")}
                      </Link>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title={t(
          "patients.profile.benefitHistoryTitle"
        )}
        description={t(
          "patients.profile.benefitHistoryDescription"
        )}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("shared.labels.benefit")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("shared.labels.quantity")}
                </th>
                <th className="py-2">
                  {t("patients.profile.usedBy")}
                </th>
                <th className="py-2">
                  {t("patients.profile.usedAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.patient.subscriptions.flatMap(
                (subscription) =>
                  subscription.benefitUsages.map(
                    (usage) => (
                      <tr
                        key={usage.id}
                        className="border-b"
                      >
                        <td className="py-3">
                          {
                            usage
                              .membershipBenefit
                              .title
                          }
                        </td>
                        <td className="py-3">
                          {usage.status}
                        </td>
                        <td className="py-3">
                          {usage.quantity}
                        </td>
                        <td className="py-3">
                          {usage.usedBy}
                        </td>
                        <td className="py-3">
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
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("patients.profile.invoice")}
                </th>
                <th className="py-2">
                  {t("shared.labels.plan")}
                </th>
                <th className="py-2">
                  {t("shared.labels.amount")}
                </th>
                <th className="py-2">
                  {t("shared.labels.dueDate")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("shared.labels.paymentHistory")}
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.visibleInvoices.map(
                (invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b"
                  >
                    <td className="py-3">
                      {invoice.description ??
                        invoice.id}
                    </td>
                    <td className="py-3">
                      {invoice.subscription
                        ?.membershipPlan
                        ?.name ??
                        t("patients.profile.detached")}
                    </td>
                    <td className="py-3">
                      {formatCurrency(
                        invoice.amount
                      )}
                    </td>
                    <td className="py-3">
                      {formatDateOnly(
                        invoice.dueDate
                      )}
                    </td>
                    <td className="py-3">
                      {invoice.status}
                    </td>
                    <td className="py-3">
                      {invoice.payments.length ===
                      0 ? (
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
                                key={payment.id}
                              >
                                {payment.status}
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
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
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
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">
                    {t("shared.labels.title")}
                  </th>
                  <th className="py-2">
                    {t("shared.labels.status")}
                  </th>
                  <th className="py-2">
                    {t("shared.labels.created")}
                  </th>
                  <th className="py-2">
                    {t("patients.profile.accepted")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {profile.patient.patientContracts.map(
                  (contract) => (
                    <tr
                      key={contract.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {contract.title}
                      </td>
                      <td className="py-3">
                        {contract.status}
                      </td>
                      <td className="py-3">
                        {formatDateOnly(
                          contract.createdAt
                        )}
                      </td>
                      <td className="py-3">
                        {formatDateTime(
                          contract.acceptedAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title={t("patients.profile.timelineTitle")}
        description={t(
          "patients.profile.timelineDescription"
        )}
      >
        <div className="divide-y">
          {profile.timeline.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {t("patients.profile.timelineEmpty")}
            </div>
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
                  {t("patients.profile.actor")}:{" "}
                  {entry.actor}
                </p>
                {entry.entityLabel ? (
                  <p className="text-sm text-muted-foreground">
                    {t("patients.profile.label")}:{" "}
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
