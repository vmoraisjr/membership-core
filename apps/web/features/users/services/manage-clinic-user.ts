import {
  AppUserRole,
  AppUserStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";

type UserManagementClient =
  | typeof prisma
  | Prisma.TransactionClient;

export async function getManagedClinicUser(
  clinicId: string,
  userId: string,
  client: UserManagementClient = prisma
) {
  return client.appUser.findFirst({
    where: {
      id: userId,
      clinicId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isClinicMaster: true,
      role: true,
      status: true,
    },
  });
}

export async function assertUserIsNotClinicMaster(
  clinicId: string,
  userId: string,
  client: UserManagementClient = prisma
) {
  const targetUser =
    await getManagedClinicUser(
      clinicId,
      userId,
      client
    );

  if (!targetUser) {
    throw new Error("User not found.");
  }

  if (targetUser.isClinicMaster) {
    throw new Error(
      "O usuario master da clinica nao pode ser alterado por esta tela."
    );
  }

  return targetUser;
}

export async function assertNotLastActiveOwner(
  clinicId: string,
  userId: string,
  client: UserManagementClient = prisma
) {
  const targetUser =
    await getManagedClinicUser(
      clinicId,
      userId,
      client
    );

  if (!targetUser) {
    throw new Error("User not found.");
  }

  if (
    targetUser.role !== AppUserRole.OWNER ||
    targetUser.status !== AppUserStatus.ACTIVE
  ) {
    return targetUser;
  }

  const activeOwnerCount =
    await client.appUser.count({
      where: {
        clinicId,
        role: AppUserRole.OWNER,
        status: AppUserStatus.ACTIVE,
      },
    });

  if (activeOwnerCount <= 1) {
    throw new Error(
      "The last active owner in a clinic cannot be changed."
    );
  }

  return targetUser;
}
