import {
  AppUserRole,
  AppUserStatus,
} from "@prisma/client";

import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";
import prisma from "@/lib/prisma";

export type ClinicUsersOverview = {
  clinic: {
    id: string;
    name: string;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: AppUserRole;
    status: AppUserStatus;
    isClinicMaster: boolean;
    createdAt: Date;
    accessStartsAt: Date | null;
    accessEndsAt: Date | null;
    lastLoginAt: Date | null;
  }>;
  invites: Array<{
    id: string;
    email: string;
    role: AppUserRole;
    createdAt: Date;
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
    invitedByName: string | null;
    status:
      | "PENDING"
      | "ACCEPTED"
      | "REVOKED"
      | "EXPIRED";
  }>;
};

function getInviteStatus(invite: {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}) {
  if (invite.acceptedAt) {
    return "ACCEPTED" as const;
  }

  if (invite.revokedAt) {
    return "REVOKED" as const;
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    return "EXPIRED" as const;
  }

  return "PENDING" as const;
}

export async function getClinicUsersOverview(): Promise<ClinicUsersOverview> {
  const clinicId = await getCurrentClinicId();
  const [clinic, users, invites, inviters] =
    await Promise.all([
      prisma.clinic.findUniqueOrThrow({
        where: {
          id: clinicId,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.appUser.findMany({
        where: {
          clinicId,
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
          isClinicMaster: true,
          createdAt: true,
          accessStartsAt: true,
          accessEndsAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.userInvite.findMany({
        where: {
          clinicId,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
        ],
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
          invitedByUserId: true,
        },
      }),
      prisma.appUser.findMany({
        where: {
          clinicId,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  const inviterMap = new Map(
    inviters.map((user) => [
      user.id,
      user.name,
    ])
  );

  return {
    clinic,
    users,
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
      revokedAt: invite.revokedAt,
      invitedByName:
        invite.invitedByUserId
          ? inviterMap.get(
              invite.invitedByUserId
            ) ?? null
          : null,
      status: getInviteStatus(invite),
    })),
  };
}
