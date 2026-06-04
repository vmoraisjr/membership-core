import { getPatients } from "../services/get-patients";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

import { PatientsTable } from "./patients-table";
import { PatientDialog } from "./patient-dialog";

export async function PatientsPage() {
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
          title="Patients access denied"
          description="The current role cannot view patient records."
        />
      </DashboardPage>
    );
  }

  const [patients, plans] = await Promise.all([
    getPatients(),
    getMembershipPlans(),
  ]);

  const canManagePatients =
    hasPermission(
      role,
      "patients",
      "manage"
    );
  const canManageSubscriptions =
    hasPermission(
      role,
      "subscriptions",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title="Patients"
        description="Manage active and inactive patients, review their current plan, and create subscriptions from the patient roster."
        action={
          canManagePatients ? (
            <PatientDialog />
          ) : undefined
        }
      />

      <PatientsTable
        patients={patients}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
        canManagePatients={
          canManagePatients
        }
        canManageSubscriptions={
          canManageSubscriptions
        }
      />
    </DashboardPage>
  );
}
