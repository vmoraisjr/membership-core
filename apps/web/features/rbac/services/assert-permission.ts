import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";

import {
  hasPermission,
  RESOURCE_LABELS,
  type AppResource,
  type PermissionAction,
} from "../permissions";

export async function assertPermission(
  resource: AppResource,
  action: PermissionAction
) {
  const role = await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      resource,
      action
    )
  ) {
    throw new Error(
      `You do not have permission to ${action} ${RESOURCE_LABELS[resource].toLowerCase()}.`
    );
  }

  return role;
}
