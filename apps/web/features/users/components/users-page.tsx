import { AppUserStatus } from "@prisma/client";

import {
  getRoleLabel,
  isAppRole,
} from "@/features/auth/constants/roles";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getAssignableRoles, hasPermission } from "@/features/rbac/permissions";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { formatDate } from "@/lib/formatters";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { SectionCard } from "@/components/dashboard/section-card";
import { Input } from "@/components/ui/input";

import { submitUserInviteAction } from "../actions/submit-user-invite";
import { removeClinicUserAction } from "../actions/remove-clinic-user";
import { revokeUserInviteAction } from "../actions/revoke-user-invite";
import { submitClinicUserRoleAction } from "../actions/update-clinic-user-role";
import { updateClinicUserStatusAction } from "../actions/update-clinic-user-status";
import { getClinicUsersOverview } from "../services/get-clinic-users-overview";
import { getTranslations } from "@/i18n/messages";

type UsersPageFeedback = {
  inviteError?: string;
  inviteCreated?: boolean;
  inviteEmail?: string;
  inviteRole?: string;
  inviteToken?: string;
  inviteExpiresAt?: string;
  userRoleError?: string;
  userRoleUpdated?: boolean;
  updatedUserId?: string;
  updatedUserName?: string;
  updatedRole?: string;
};

function getInviteStatusClass(
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REVOKED"
    | "EXPIRED"
) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-700";
    case "REVOKED":
      return "bg-slate-200 text-slate-700";
    case "EXPIRED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

function getUserStatusClass(
  status: AppUserStatus
) {
  switch (status) {
    case AppUserStatus.ACTIVE:
      return "bg-emerald-100 text-emerald-700";
    case AppUserStatus.INACTIVE:
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

function getFeedbackBannerClass(
  kind: "error" | "success"
) {
  if (kind === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

type Props = {
  feedback?: UsersPageFeedback;
};

function getRoleLabelFromValue(
  role: string | undefined
) {
  if (!role || !isAppRole(role)) {
    return "-";
  }

  return getRoleLabel(role);
}

export async function UsersPage({
  feedback,
}: Props) {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      requireCurrentAppUser(),
    ]);

  if (
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

  const overview =
    await getClinicUsersOverview();
  const canManageUsers =
    hasPermission(
      role,
      "users",
      "manage"
    );
  const assignableRoles =
    getAssignableRoles(role);

  return (
    <DashboardPage>
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
      />

      {feedback?.inviteError ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${getFeedbackBannerClass(
            "error"
          )}`}
        >
          {feedback.inviteError}
        </div>
      ) : null}

      {feedback?.userRoleError ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${getFeedbackBannerClass(
            "error"
          )}`}
        >
          {feedback.userRoleError}
        </div>
      ) : null}

      {feedback?.inviteCreated &&
      feedback.inviteToken ? (
        <SectionCard
          title={t("users.inviteCreatedCardTitle")}
          description={t("users.inviteCreatedCardDescription")}
        >
          <div className="space-y-3 p-4 text-sm">
            <p>
              {t("users.inviteReady", {
                email: feedback.inviteEmail,
                role: getRoleLabelFromValue(
                  feedback.inviteRole
                ),
              })}
            </p>
            <div className="rounded-lg border bg-background px-3 py-2 font-mono text-xs break-all">
              /invite?token=
              {feedback.inviteToken}
            </div>
            <p className="text-muted-foreground">
              {t("users.expiresOn", {
                date: formatDate(
                  feedback.inviteExpiresAt
                ),
              })}
            </p>
          </div>
        </SectionCard>
      ) : null}

      {feedback?.userRoleUpdated &&
      feedback.updatedUserName &&
      feedback.updatedRole ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${getFeedbackBannerClass(
            "success"
          )}`}
        >
          {t("users.roleUpdated", {
            name: feedback.updatedUserName,
            role: getRoleLabelFromValue(
              feedback.updatedRole
            ),
          })}
        </div>
      ) : null}

      {canManageUsers ? (
        <SectionCard
          title={t("users.inviteUserCardTitle")}
          description={t("users.inviteUserCardDescription")}
        >
          <form
            action={submitUserInviteAction}
            id="create-user-invite-form"
            className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.6fr)_220px_auto]"
          >
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                {t("shared.labels.email")}
              </span>
              <Input
                name="email"
                type="email"
                required
                placeholder={t("users.newUserPlaceholder")}
                defaultValue={
                  feedback?.inviteError
                    ? feedback.inviteEmail
                    : ""
                }
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                {t("shared.labels.role")}
              </span>
              <select
                name="role"
                defaultValue={
                  feedback?.inviteError &&
                  feedback.inviteRole
                    ? feedback.inviteRole
                    : assignableRoles[0] ??
                      "STAFF"
                }
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {assignableRoles.map(
                  (assignableRole) => (
                    <option
                      key={assignableRole}
                      value={
                        assignableRole
                      }
                    >
                      {getRoleLabel(
                        assignableRole
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <div className="flex items-end">
              <ConfirmSubmitButton
                formId="create-user-invite-form"
                title={t("users.createInviteTitle")}
                description={t("users.createInviteDescription")}
                actionLabel={t("users.createInviteAction")}
                label={t("users.createInvite")}
              />
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title={t("users.rosterCardTitle")}
        description={t("users.rosterCardDescription")}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("shared.labels.user")}
                </th>
                <th className="py-2">
                  {t("shared.labels.role")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("shared.labels.created")}
                </th>
                <th className="py-2">
                  {t("shared.labels.lastLogin")}
                </th>
                <th className="py-2 text-right">
                  {t("shared.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t("users.emptyClinicUsers")}
                  </td>
                </tr>
              ) : (
                overview.users.map((user) => {
                  const isCurrentUser =
                    user.id ===
                    currentUser.id;
                  const canUpdateThisUser =
                    canManageUsers &&
                    !isCurrentUser;

                  return (
                    <tr
                      key={user.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        <div className="font-medium">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                          {isCurrentUser
                            ? ` · ${t("users.currentSession")}`
                            : ""}
                        </div>
                      </td>
                      <td className="py-3">
                        {canUpdateThisUser ? (
                          <form
                            action={
                              submitClinicUserRoleAction
                            }
                            id={`update-user-role-${user.id}`}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <select
                              name="role"
                              defaultValue={
                                user.role
                              }
                              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                            >
                              {assignableRoles.map(
                                (
                                  assignableRole
                                ) => (
                                  <option
                                    key={
                                      assignableRole
                                    }
                                    value={
                                      assignableRole
                                    }
                                  >
                                    {getRoleLabel(
                                      assignableRole
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                            <ConfirmSubmitButton
                              formId={`update-user-role-${user.id}`}
                              title={t("users.updateRoleTitle")}
                              description={t("users.updateRoleDescription", { name: user.name })}
                              actionLabel={t("shared.actions.saveRole")}
                              label={t("users.save")}
                            />
                          </form>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                            {getRoleLabel(
                              user.role
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getUserStatusClass(
                            user.status
                          )}`}
                        >
                          {t(`users.status.${user.status}`)}
                        </span>
                      </td>
                      <td className="py-3">
                        {formatDate(
                          user.createdAt
                        )}
                      </td>
                      <td className="py-3">
                        {formatDate(
                          user.lastLoginAt
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isCurrentUser ? (
                          <span className="text-xs text-muted-foreground">
                            {t("users.manageOwnAccount")}
                          </span>
                        ) : canManageUsers ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <form
                              action={
                                updateClinicUserStatusAction
                              }
                              id={`update-user-status-${user.id}`}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value={
                                  user.status ===
                                  AppUserStatus.ACTIVE
                                    ? AppUserStatus.INACTIVE
                                    : AppUserStatus.ACTIVE
                                }
                              />
                              <ConfirmSubmitButton
                                formId={`update-user-status-${user.id}`}
                                title={
                                  user.status ===
                                  AppUserStatus.ACTIVE
                                    ? t("users.deactivateTitle")
                                    : t("users.reactivateTitle")
                                }
                                description={t("users.updateUserStatusDescription", { name: user.name })}
                                actionLabel={
                                  user.status ===
                                  AppUserStatus.ACTIVE
                                    ? t("shared.actions.deactivate")
                                    : t("shared.actions.reactivate")
                                }
                                label={
                                  user.status ===
                                  AppUserStatus.ACTIVE
                                    ? t("shared.actions.deactivate")
                                    : t("shared.actions.reactivate")
                                }
                              />
                            </form>

                            <form
                              action={
                                removeClinicUserAction
                              }
                              id={`remove-user-${user.id}`}
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <ConfirmSubmitButton
                                formId={`remove-user-${user.id}`}
                                title={t("users.removeTitle")}
                                description={t("users.removeDescription", { name: user.name })}
                                actionLabel={t("users.removeUserAction")}
                                label={t("users.remove")}
                              />
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("shared.states.readOnly")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title={t("users.inviteHistoryCardTitle")}
        description={t("users.inviteHistoryCardDescription")}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("shared.labels.email")}
                </th>
                <th className="py-2">
                  {t("shared.labels.role")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  {t("users.invitedBy")}
                </th>
                <th className="py-2">
                  {t("shared.labels.created")}
                </th>
                <th className="py-2">
                  {t("shared.labels.expires")}
                </th>
                <th className="py-2 text-right">
                  {t("shared.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.invites.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t("users.emptyClinicInvites")}
                  </td>
                </tr>
              ) : (
                overview.invites.map(
                  (invite) => (
                    <tr
                      key={invite.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {invite.email}
                      </td>
                      <td className="py-3">
                        {getRoleLabel(
                          invite.role
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getInviteStatusClass(
                            invite.status
                          )}`}
                        >
                          {t(`users.status.${invite.status}`)}
                        </span>
                      </td>
                      <td className="py-3">
                        {invite.invitedByName ??
                          "-"}
                      </td>
                      <td className="py-3">
                        {formatDate(
                          invite.createdAt
                        )}
                      </td>
                      <td className="py-3">
                        {formatDate(
                          invite.expiresAt
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {canManageUsers &&
                        invite.status ===
                          "PENDING" ? (
                          <form
                            action={
                              revokeUserInviteAction
                            }
                            id={`revoke-invite-${invite.id}`}
                            className="inline-flex"
                          >
                            <input
                              type="hidden"
                              name="inviteId"
                              value={invite.id}
                            />
                            <ConfirmSubmitButton
                              formId={`revoke-invite-${invite.id}`}
                              title={t("users.revokeTitle")}
                              description={t("users.revokeDescription", { email: invite.email })}
                              actionLabel={t("users.revokeAction")}
                              label={t("users.revoke")}
                            />
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {invite.status ===
                            "REVOKED"
                              ? "Revoked"
                              : t("shared.states.readOnly")}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
