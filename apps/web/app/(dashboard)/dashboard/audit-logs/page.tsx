import { redirect } from "next/navigation";

import type { AuditLogPageSize } from "@/features/audit-log/services/get-audit-logs";
import { AuditLogPage } from "@/features/audit-log/components/audit-log-page";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { administracaoUrl } from "@/lib/owner-routes";

type PageProps = {
  searchParams: Promise<{
    actor?: string;
    entity?: string;
    action?: string;
    date?: string;
    clinicId?: string;
    page?: string;
    pageSize?: string;
  }>;
};

function parsePageSize(
  value: string | undefined
): AuditLogPageSize | undefined {
  if (value === "all") {
    return "all";
  }

  const parsed = Number(value);

  return parsed === 5 ||
    parsed === 10 ||
    parsed === 30
    ? parsed
    : undefined;
}

// Shared route: platform owners get redirected to Administração > Auditoria
// global (UI-049); clinic-scoped OWNER/ADMIN keep this URL for their own
// audit trail.
export default async function Page({
  searchParams,
}: PageProps) {
  const [workspace, resolvedSearchParams] =
    await Promise.all([
      getCurrentWorkspace(),
      searchParams,
    ]);

  if (workspace.type === "platform") {
    redirect(
      administracaoUrl({
        tab: "audit",
        ...resolvedSearchParams,
      })
    );
  }

  return (
    <AuditLogPage
      filters={{
        actor:
          resolvedSearchParams.actor,
        entity:
          resolvedSearchParams.entity,
        action:
          resolvedSearchParams.action,
        date: resolvedSearchParams.date,
        clinicId:
          resolvedSearchParams.clinicId,
        page: resolvedSearchParams.page
          ? Number(
              resolvedSearchParams.page
            )
          : undefined,
        pageSize: parsePageSize(
          resolvedSearchParams.pageSize
        ),
      }}
    />
  );
}
