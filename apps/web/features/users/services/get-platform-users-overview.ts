import {
  AppUserRole,
  AppUserStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentWorkspace } from "@/features/auth/services/get-current-workspace";

export type PlatformUsersOverview = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: AppUserRole;
    status: AppUserStatus;
    createdAt: Date;
    accessStartsAt: Date | null;
    accessEndsAt: Date | null;
    lastLoginAt: Date | null;
  }>;
};

export async function getPlatformUsersOverview(): Promise<PlatformUsersOverview> {
  const workspace =
    await getCurrentWorkspace();

  if (
    workspace.type !== "platform" ||
    !workspace.canManagePlatform
  ) {
    throw new Error(
      "Apenas a plataforma pode acessar os usuários globais."
    );
  }

  const users =
    await prisma.appUser.findMany({
      where: {
        clinicId: null,
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        accessStartsAt: true,
        accessEndsAt: true,
        lastLoginAt: true,
      },
    });

  return {
    users,
  };
}
