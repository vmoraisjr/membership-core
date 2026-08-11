import { PageHeader } from "@/components/dashboard/page-header";
import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { resolveCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import {
  type AuditLogFilters,
  getAuditLogs,
} from "../services/get-audit-logs";

import { AuditLogTable } from "./audit-log-table";

type Props = {
  filters: AuditLogFilters;
};

export async function AuditLogPage({
  filters,
}: Props) {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);
  const workspace =
    currentUser
      ? resolveCurrentWorkspace(
          currentUser
        )
      : null;

  if (
    !hasPermission(
      role,
      "auditLogs",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("audit.accessDeniedTitle")}
          description={t(
            "audit.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  if (!workspace) {
    return (
      <DashboardPage>
        <ClinicAssignmentRequired />
      </DashboardPage>
    );
  }

  if (
    currentUser?.role !== "OWNER" &&
    currentUser?.role !== "ADMIN"
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("audit.accessDeniedTitle")}
          description="O registro de auditoria da clínica está disponível apenas para owner e administrador."
        />
      </DashboardPage>
    );
  }

  const {
    logs,
    actorOptions,
    entityOptions,
    actionOptions,
    clinicOptions,
    isPlatformView,
  } = await getAuditLogs(filters);

  return (
    <DashboardPage>
      <PageHeader
        title={
          isPlatformView
            ? t("audit.platformTitle")
            : t("audit.title")
        }
        description={
          isPlatformView
            ? t(
                "audit.platformDescription"
              )
            : t("audit.description")
        }
      />

      <AuditLogTable
        logs={logs}
        filters={filters}
        actorOptions={actorOptions}
        entityOptions={entityOptions}
        actionOptions={actionOptions}
        clinicOptions={clinicOptions}
        isPlatformView={isPlatformView}
      />
    </DashboardPage>
  );
}
