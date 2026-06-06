"use server";

import { redirect } from "next/navigation";

import { AppUserRole } from "@prisma/client";

import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { canAssignRole } from "@/features/rbac/permissions";
import { assertPermission } from "@/features/rbac/services/assert-permission";
import { safeRevalidatePath } from "@/lib/revalidation";
import prisma from "@/lib/prisma";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update the user role.";
}

export async function updateClinicUserRoleAction(
  formData: FormData
) {
  await assertPermission(
    "users",
    "manage"
  );

  const currentUser =
    await requireCurrentAppUser();
  const userId = String(
    formData.get("userId") ?? ""
  );
  const nextRole = String(
    formData.get("role") ?? ""
  );

  if (
    !Object.values(
      AppUserRole
    ).includes(nextRole as AppUserRole)
  ) {
    throw new Error("Invalid role.");
  }

  if (
    !currentUser.clinicId
  ) {
    throw new Error(
      "The current user is not assigned to a clinic."
    );
  }

  if (userId === currentUser.id) {
    throw new Error(
      "You cannot change your own role from this screen."
    );
  }

  if (
    !canAssignRole(
      currentUser.role,
      nextRole as AppUserRole
    )
  ) {
    throw new Error(
      "You do not have permission to assign this role."
    );
  }

  const targetUser =
    await prisma.appUser.findFirst({
      where: {
        id: userId,
        clinicId: currentUser.clinicId,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

  if (!targetUser) {
    throw new Error("User not found.");
  }

  if (targetUser.role === nextRole) {
    return {
      userId: targetUser.id,
      name: targetUser.name,
      role: targetUser.role,
    };
  }

  if (
    targetUser.role === AppUserRole.OWNER &&
    nextRole !== AppUserRole.OWNER
  ) {
    const ownerCount =
      await prisma.appUser.count({
        where: {
          clinicId:
            currentUser.clinicId,
          role: AppUserRole.OWNER,
        },
      });

    if (ownerCount <= 1) {
      throw new Error(
        "The last owner in a clinic cannot be reassigned."
      );
    }
  }

  const updatedUser =
    await prisma.appUser.update({
      where: {
        id: targetUser.id,
      },
      data: {
        role:
          nextRole as AppUserRole,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

  await safeRevalidatePath(
    "/dashboard/users"
  );

  return updatedUser;
}

export async function submitClinicUserRoleAction(
  formData: FormData
) {
  const userId = String(
    formData.get("userId") ?? ""
  );

  try {
    const updatedUser =
      await updateClinicUserRoleAction(
        formData
      );
    const params =
      new URLSearchParams({
        userRoleUpdated: "1",
        updatedUserId:
          updatedUser.id,
        updatedUserName:
          updatedUser.name,
        updatedRole:
          updatedUser.role,
      });

    redirect(
      `/dashboard/users?${params.toString()}`
    );
  } catch (error) {
    const params =
      new URLSearchParams({
        userRoleError:
          getErrorMessage(error),
      });

    if (userId) {
      params.set(
        "updatedUserId",
        userId
      );
    }

    redirect(
      `/dashboard/users?${params.toString()}`
    );
  }
}
