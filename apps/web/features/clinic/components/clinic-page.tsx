import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

import { getClinics } from "../services/get-clinics";

import { ClinicDialog } from "./clinic-dialog";
import { ClinicTable } from "./clinic-table";

export async function ClinicPage() {
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(role, "clinic", "view")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Clinic access denied"
          description="The current role cannot view clinic administration."
        />
      </DashboardPage>
    );
  }

  const clinics = await getClinics();
  const canManageClinic =
    hasPermission(
      role,
      "clinic",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title="Clinics"
        description="Manage clinic records independently as the platform moves toward multi-tenant operations."
        action={
          canManageClinic ? (
            <ClinicDialog />
          ) : undefined
        }
      />

      <ClinicTable
        clinics={clinics}
        canManageClinic={
          canManageClinic
        }
      />
    </DashboardPage>
  );
}
