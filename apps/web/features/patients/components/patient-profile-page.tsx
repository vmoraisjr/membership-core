import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { formatCurrency } from "@/lib/formatters";

import { getPatientProfile } from "../services/get-patient-profile";

type Props = {
  patientId: string;
};

function formatDateTime(
  value: Date | null | undefined
) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString();
}

function formatDateOnly(
  value: Date | null | undefined
) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleDateString();
}

export async function PatientProfilePage({
  patientId,
}: Props) {
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
          title="Patient access denied"
          description="The current role cannot view patient operational history."
        />
      </DashboardPage>
    );
  }

  const profile =
    await getPatientProfile(patientId);

  return (
    <DashboardPage>
      <PageHeader
        title={profile.patient.fullName}
        description="Full operational profile, billing records, benefit usage history, and patient-related audit trail."
      />

      <SectionCard
        title="Patient overview"
        description="Current registration and status snapshot."
      >
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Email
            </p>
            <p>{profile.patient.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Phone
            </p>
            <p>{profile.patient.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Status
            </p>
            <p>{profile.patient.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Registration date
            </p>
            <p>
              {formatDateOnly(
                profile.patient.createdAt
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Birth date
            </p>
            <p>
              {formatDateOnly(
                profile.patient.birthDate
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Document
            </p>
            <p>
              {profile.patient.document}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Subscriptions"
        description="Current and historical subscriptions for this patient."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Plan
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Started
                </th>
                <th className="py-2">
                  Expires
                </th>
                <th className="py-2">
                  Link
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.patient.subscriptions.map(
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
                        href={`/dashboard/subscriptions?patientId=${profile.patient.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Open
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
        title="Benefit usage history"
        description="Includes active and canceled benefit usage records."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Benefit
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Quantity
                </th>
                <th className="py-2">
                  Used by
                </th>
                <th className="py-2">
                  Used at
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
                              )} (canceled ${formatDateTime(
                                usage.canceledAt
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
        title="Payment history"
        description="Invoices, payment records, and overdue history for this patient."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Invoice
                </th>
                <th className="py-2">
                  Plan
                </th>
                <th className="py-2">
                  Amount
                </th>
                <th className="py-2">
                  Due date
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Payment history
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.patient.invoices.map(
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
                        "Detached"}
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
                          No payments recorded
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
                                  "Unspecified"}
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
          title="Patient contract history"
          description="Historical contract records linked to this patient."
        >
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">
                    Title
                  </th>
                  <th className="py-2">
                    Status
                  </th>
                  <th className="py-2">
                    Created
                  </th>
                  <th className="py-2">
                    Accepted
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
        title="Transaction timeline"
        description="Chronological operational history tied to this patient."
      >
        <div className="divide-y">
          {profile.timeline.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No patient-related timeline entries found.
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
                  Actor: {entry.actor}
                </p>
                {entry.entityLabel ? (
                  <p className="text-sm text-muted-foreground">
                    Label:{" "}
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
