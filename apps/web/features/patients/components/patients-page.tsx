import { getPatients } from "../services/get-patients";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";
import { getPatientBenefitBalance } from "@/features/benefit-usage/services/get-patient-benefit-balance";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { PatientsTable } from "./patients-table";
import { PatientDialog } from "./patient-dialog";
import { PatientKind } from "@prisma/client";

export async function PatientsPage() {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);

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
            "patients.accessDeniedTitle"
          )}
          description={t(
            "patients.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  if (!currentUser?.clinicId) {
    return (
      <DashboardPage>
        <ClinicAssignmentRequired />
      </DashboardPage>
    );
  }

  const [patients, plans, benefitBalances] =
    await Promise.all([
    getPatients(),
    getMembershipPlans(),
    getPatientBenefitBalance(),
  ]);

  const canManagePatients =
    hasPermission(
      role,
      "patients",
      "manage"
    );
  const canDeletePatientsPermanently =
    hasPermission(
      role,
      "patients",
      "deletePermanent"
    );
  const canManageSubscriptions =
    hasPermission(
      role,
      "subscriptions",
      "manage"
    );
  const canManageBenefitUsage =
    hasPermission(
      role,
      "benefitUsage",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title={t("patients.title")}
        description={t("patients.description")}
        meta={
          <span className="workspace-kicker">
            {t("patients.table.totalLabel", {
              count: patients.length,
            })}
          </span>
        }
        action={
          canManagePatients ? (
            <PatientDialog
              responsibleOptions={patients
                .filter(
                  (patient) =>
                    patient.kind ===
                      PatientKind.TITULAR &&
                    patient.status ===
                      "ACTIVE"
                )
                .map((patient) => ({
                  id: patient.id,
                  fullName:
                    patient.fullName,
                  document:
                    patient.document,
                  kind: patient.kind,
                  status:
                    patient.status,
                }))}
            />
          ) : undefined
        }
      />

      <PatientsTable
        patients={patients}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
        benefitBalances={
          benefitBalances
        }
        responsibleOptions={patients
          .filter(
            (patient) =>
              patient.kind ===
                PatientKind.TITULAR &&
              patient.status ===
                "ACTIVE"
          )
          .map((patient) => ({
            id: patient.id,
            fullName: patient.fullName,
            document: patient.document,
            kind: patient.kind,
            status: patient.status,
          }))}
        canManagePatients={
          canManagePatients
        }
        canDeletePatientsPermanently={
          canDeletePatientsPermanently
        }
        canManageSubscriptions={
          canManageSubscriptions
        }
        canManageBenefitUsage={
          canManageBenefitUsage
        }
      />
    </DashboardPage>
  );
}
