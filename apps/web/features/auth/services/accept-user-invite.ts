import { AppUserStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashOpaqueToken } from "@/lib/auth/session";

export async function acceptUserInvite(
  token: string,
  name: string,
  password: string
) {
  const invite =
    await prisma.userInvite.findUnique({
      where: {
        tokenHash:
          hashOpaqueToken(token),
      },
    });

  if (
    !invite ||
    invite.revokedAt ||
    invite.acceptedAt ||
    invite.expiresAt.getTime() <=
      Date.now()
  ) {
    throw new Error(
      "Invalid or expired invite."
    );
  }

  const existingUser =
    await prisma.appUser.findUnique({
      where: {
        email: invite.email,
      },
      select: {
        id: true,
        clinicId: true,
      },
    });

  if (
    existingUser &&
    existingUser.clinicId !==
      (invite.clinicId ?? null)
  ) {
    throw new Error(
      "Invite email belongs to another clinic user."
    );
  }

  const user =
    await prisma.$transaction(
      async (tx) => {
        const resolvedUser =
          await tx.appUser.upsert({
            where: {
              email: invite.email,
            },
            update: {
              clinicId:
                invite.clinicId ?? null,
              name: name.trim(),
              role: invite.role,
              status:
                AppUserStatus.ACTIVE,
              passwordHash:
                hashPassword(password),
              mustChangePassword: false,
            },
            create: {
              clinicId:
                invite.clinicId ?? null,
              name: name.trim(),
              email: invite.email,
              role: invite.role,
              status:
                AppUserStatus.ACTIVE,
              passwordHash:
                hashPassword(password),
              mustChangePassword: false,
            },
          });

        await tx.userInvite.update({
          where: {
            id: invite.id,
          },
          data: {
            acceptedAt: new Date(),
          },
        });

        return resolvedUser;
      }
    );

  return user;
}
