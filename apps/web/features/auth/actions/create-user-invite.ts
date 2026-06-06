"use server";

import { AppUserRole } from "@prisma/client";

import { assertPermission } from "@/features/rbac/services/assert-permission";
import { canAssignRole } from "@/features/rbac/permissions";

import { requireCurrentAppUser } from "../services/get-current-app-user";
import { createUserInvite } from "../services/create-user-invite";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createUserInviteAction(
  formData: FormData
) {
  await assertPermission(
    "users",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  const email = normalizeEmail(
    String(
      formData.get("email") ?? ""
    )
  );
  const role = String(
    formData.get("role") ?? "STAFF"
  );

  if (
    !Object.values(
      AppUserRole
    ).includes(role as AppUserRole)
  ) {
    throw new Error("Invalid role.");
  }

  if (
    !canAssignRole(
      currentUser.role,
      role as AppUserRole
    )
  ) {
    throw new Error(
      "You do not have permission to assign this role."
    );
  }

  return createUserInvite({
    clinicId: currentUser.clinicId,
    email,
    role: role as AppUserRole,
    invitedByUserId: currentUser.id,
  });
}
