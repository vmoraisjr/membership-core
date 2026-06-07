import { getPatients } from "../services/get-patients";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";
import { getPatientBenefitBalance } from "@/features/benefit-usage/services/get-patient-benefit-balance";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { PatientsTable } from "./patients-table";
import { PatientDialog } from "./patient-dialog";

export async function PatientsPage() {
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
            "patients.accessDeniedTitle"
          )}
          description={t(
            "patients.accessDeniedDescription"
          )}
        />
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
        action={
          canManagePatients ? (
            <PatientDialog />
          ) : undefined
        }
      />

      <PatientsTable
        patients={patients}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
        benefitBalances={
          benefitBalances
        }
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
