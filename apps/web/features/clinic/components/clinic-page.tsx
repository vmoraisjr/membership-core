import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

import {
  getClinicBillingPlanOptions,
  getClinics,
} from "../services/get-clinics";

import { ClinicDialog } from "./clinic-dialog";
import { ClinicTable } from "./clinic-table";

type Props = {
  planId?: string;
};

export async function ClinicPage({
  planId,
}: Props = {}) {
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      requireCurrentAppUser(),
    ]);

  if (
    !hasPermission(role, "clinic", "view")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Acesso às clínicas negado"
          description="O perfil atual não pode visualizar a administração de clínicas."
        />
      </DashboardPage>
    );
  }

  const [clinics, planOptions] =
    await Promise.all([
      getClinics(),
      getClinicBillingPlanOptions(),
    ]);
  const canManageClinic =
    hasPermission(
      role,
      "clinic",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title={
          currentUser.clinicId
            ? "Empresa"
            : "Empresas clientes"
        }
        description={
          currentUser.clinicId
            ? "Gerencie a identidade, credenciais e dados operacionais da empresa atual."
            : "Gerencie contas clientes, identidade, plano SaaS e bootstrap operacional de cada tenant."
        }
        action={
          canManageClinic &&
          (currentUser.role ===
            "OWNER" ||
            currentUser.role ===
              "ADMIN") &&
          !currentUser.clinicId ? (
            <ClinicDialog />
          ) : undefined
        }
      />

      <ClinicTable
        clinics={clinics}
        canManageClinic={
          canManageClinic
        }
        isPlatformView={
          !currentUser.clinicId
        }
        plans={planOptions}
        initialPlanId={planId}
      />
    </DashboardPage>
  );
}
