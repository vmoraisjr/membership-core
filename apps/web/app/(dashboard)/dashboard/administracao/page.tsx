import { RouteTabs } from "@/components/dashboard/route-tabs";
import type { AuditLogPageSize } from "@/features/audit-log/services/get-audit-logs";
import { AuditLogPage } from "@/features/audit-log/components/audit-log-page";
import { UsersPage } from "@/features/users/components/users-page";
import { administracaoUrl } from "@/lib/owner-routes";

type Props = {
  searchParams: Promise<{
    tab?: string;
    actor?: string;
    entity?: string;
    action?: string;
    date?: string;
    clinicId?: string;
    page?: string;
    pageSize?: string;
    inviteCreated?: string;
    inviteEmail?: string;
    inviteRole?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
    inviteError?: string;
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

export default async function AdministracaoRoute({
  searchParams,
}: Props) {
  const resolved = await searchParams;
  const tab =
    resolved.tab === "audit"
      ? "audit"
      : "team";

  return (
    <>
      <RouteTabs
        active={tab}
        tabs={[
          {
            id: "team",
            label: "Equipe Sheep",
            href: administracaoUrl({
              tab: "team",
            }),
          },
          {
            id: "audit",
            label: "Auditoria global",
            href: administracaoUrl({
              tab: "audit",
            }),
          },
        ]}
      />

      {tab === "team" ? (
        <UsersPage
          searchParams={{
            inviteCreated:
              resolved.inviteCreated,
            inviteEmail:
              resolved.inviteEmail,
            inviteRole:
              resolved.inviteRole,
            inviteToken:
              resolved.inviteToken,
            inviteExpiresAt:
              resolved.inviteExpiresAt,
            inviteError:
              resolved.inviteError,
          }}
        />
      ) : (
        <AuditLogPage
          filters={{
            actor: resolved.actor,
            entity: resolved.entity,
            action: resolved.action,
            date: resolved.date,
            clinicId: resolved.clinicId,
            page: resolved.page
              ? Number(resolved.page)
              : undefined,
            pageSize: parsePageSize(
              resolved.pageSize
            ),
          }}
          basePath="/dashboard/administracao"
          extraParams={{
            tab: "audit",
          }}
        />
      )}
    </>
  );
}
