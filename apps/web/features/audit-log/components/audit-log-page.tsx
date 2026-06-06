import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";

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
  const role =
    await getCurrentUserRole();

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
          title="Audit log access denied"
          description="The current role cannot view operational history."
        />
      </DashboardPage>
    );
  }

  const {
    logs,
    actorOptions,
    entityOptions,
  } = await getAuditLogs(filters);

  return (
    <DashboardPage>
      <PageHeader
        title="Audit Log"
        description="Review the operational history for critical membership actions."
      />

      <AuditLogTable
        logs={logs}
        filters={filters}
        actorOptions={actorOptions}
        entityOptions={entityOptions}
      />
    </DashboardPage>
  );
}
