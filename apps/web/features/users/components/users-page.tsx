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
          title="Users access denied"
          description="The current role cannot view clinic users or invites."
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
        title="Users"
        description="Review clinic members, track pending invites, and keep role assignments under owner control."
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
          title="Invite created"
          description="Share this one-time onboarding link with the invited clinic user."
        >
          <div className="space-y-3 p-4 text-sm">
            <p>
              Invite ready for{" "}
              <span className="font-medium">
                {feedback.inviteEmail}
              </span>{" "}
              as{" "}
              <span className="font-medium">
                {getRoleLabelFromValue(
                  feedback.inviteRole
                )}
              </span>
              .
            </p>
            <div className="rounded-lg border bg-background px-3 py-2 font-mono text-xs break-all">
              /invite?token=
              {feedback.inviteToken}
            </div>
            <p className="text-muted-foreground">
              Expires on{" "}
              {formatDate(
                feedback.inviteExpiresAt
              )}
              .
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
          {feedback.updatedUserName} is now{" "}
          {getRoleLabelFromValue(
            feedback.updatedRole
          )}
          .
        </div>
      ) : null}

      {canManageUsers ? (
        <SectionCard
          title="Invite clinic user"
          description="Invite a new operator and assign the role before they set their password."
        >
          <form
            action={submitUserInviteAction}
            id="create-user-invite-form"
            className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.6fr)_220px_auto]"
          >
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                Email
              </span>
              <Input
                name="email"
                type="email"
                required
                placeholder="new.user@clinic.com"
                defaultValue={
                  feedback?.inviteError
                    ? feedback.inviteEmail
                    : ""
                }
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                Role
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
                title="Create user invite?"
                description="This will create a new invite for the selected email and role."
                actionLabel="Create invite"
                label="Create invite"
              />
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Clinic roster"
        description="Only users assigned to the current clinic appear here."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  User
                </th>
                <th className="py-2">
                  Role
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Created
                </th>
                <th className="py-2">
                  Last login
                </th>
                <th className="py-2 text-right">
                  Actions
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
                    No clinic users found.
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
                            ? " · Current session"
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
                              title="Update user role?"
                              description={`This will change ${user.name}'s role.`}
                              actionLabel="Save role"
                              label="Save"
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
                          {user.status}
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
                            Manage your own account outside this screen
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
                                    ? "Deactivate user?"
                                    : "Reactivate user?"
                                }
                                description={`This will update ${user.name}'s account status.`}
                                actionLabel={
                                  user.status ===
                                  AppUserStatus.ACTIVE
                                    ? "Deactivate"
                                    : "Reactivate"
                                }
                                label={
                                  user.status ===
                                  AppUserStatus.ACTIVE
                                    ? "Deactivate"
                                    : "Reactivate"
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
                                title="Remove user from clinic?"
                                description={`This will remove ${user.name} from the clinic roster.`}
                                actionLabel="Remove user"
                                label="Remove"
                              />
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Read only
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
        title="Invite history"
        description="Pending, accepted, and expired clinic invites remain scoped to the current clinic."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Email
                </th>
                <th className="py-2">
                  Role
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  Invited by
                </th>
                <th className="py-2">
                  Created
                </th>
                <th className="py-2">
                  Expires
                </th>
                <th className="py-2 text-right">
                  Actions
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
                    No clinic invites found.
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
                          {invite.status}
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
                              title="Revoke invite?"
                              description={`This will revoke the pending invite for ${invite.email}.`}
                              actionLabel="Revoke invite"
                              label="Revoke"
                            />
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {invite.status ===
                            "REVOKED"
                              ? "Revoked"
                              : "Read only"}
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
