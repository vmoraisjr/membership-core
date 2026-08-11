import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { resolveCurrentWorkspace } from "@/features/auth/services/get-current-workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import {
  getAssignableRoles,
  hasPermission,
} from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { getClinicUsersOverview } from "../services/get-clinic-users-overview";
import { getPlatformUsersOverview } from "../services/get-platform-users-overview";

import { PlatformUsersOverviewPanel } from "./platform-users-overview-panel";
import { UsersOverviewPanel } from "./users-overview-panel";

type Props = {
  searchParams?: {
    inviteCreated?: string;
    inviteEmail?: string;
    inviteRole?: string;
    inviteToken?: string;
    inviteExpiresAt?: string;
    inviteError?: string;
  };
};

export async function UsersPage({
  searchParams,
}: Props = {}) {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      requireCurrentAppUser(),
    ]);
  const workspace =
    resolveCurrentWorkspace(
      currentUser
    );
  const hasPlatformUsersAccess =
    workspace.type === "platform" &&
    workspace.canManagePlatform;

  if (
    !hasPlatformUsersAccess &&
    !hasPermission(
      role,
      "users",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("users.accessDeniedTitle")}
          description={t(
            "users.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  if (workspace.type === "platform") {
    if (!workspace.canManagePlatform) {
      return (
        <DashboardPage>
          <ClinicAssignmentRequired />
        </DashboardPage>
      );
    }

    const overview =
      await getPlatformUsersOverview();

    return (
      <DashboardPage>
        <PageHeader
          eyebrow="Governança interna"
          title="Usuários da plataforma"
          description="Gerencie apenas os usuários internos do Sheep."
        />

        <PlatformUsersOverviewPanel
          assignableRoles={[
            ...getAssignableRoles(role),
          ]}
          canManageUsers
          currentUserId={currentUser.id}
          overview={overview}
        />
      </DashboardPage>
    );
  }

  const overview =
    await getClinicUsersOverview();

  const inviteFeedback =
    searchParams?.inviteToken &&
    searchParams.inviteEmail &&
    searchParams.inviteRole &&
    searchParams.inviteExpiresAt
      ? {
          email:
            searchParams.inviteEmail,
          role: searchParams.inviteRole,
          token: searchParams.inviteToken,
          expiresAt:
            searchParams.inviteExpiresAt,
        }
      : null;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Administração da empresa"
        title={t("users.title")}
        description="Gerencie apenas os usuários locais da empresa atual."
      />

      <UsersOverviewPanel
        assignableRoles={[
          ...getAssignableRoles(role),
        ]}
        canManageUsers={hasPermission(
          role,
          "users",
          "manage"
        )}
        currentUserId={currentUser.id}
        overview={overview}
        inviteFeedback={inviteFeedback}
        inviteError={
          searchParams?.inviteError ??
          null
        }
      />
    </DashboardPage>
  );
}
