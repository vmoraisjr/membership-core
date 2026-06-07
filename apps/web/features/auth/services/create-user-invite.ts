import {
  AppUserStatus,
  AppUserRole,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  createOpaqueToken,
  getUserInviteExpiryDate,
  hashOpaqueToken,
} from "@/lib/auth/session";

type InviteClient =
  | typeof prisma
  | Prisma.TransactionClient;

type CreateUserInviteInput = {
  clinicId?: string | null;
  email: string;
  role: AppUserRole;
  invitedByUserId?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createUserInvite({
  clinicId,
  email,
  role,
  invitedByUserId,
}: CreateUserInviteInput,
client: InviteClient = prisma) {
  const rawToken = createOpaqueToken();
  const expiresAt =
    getUserInviteExpiryDate();
  const normalizedEmail =
    normalizeEmail(email);

  const existingUser =
    await client.appUser.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        clinicId: true,
        status: true,
      },
    });

  if (
    existingUser &&
    existingUser.clinicId !==
      (clinicId ?? null)
  ) {
    throw new Error(
      "This email is already assigned to another clinic user."
    );
  }

  if (
    existingUser?.status ===
    AppUserStatus.ACTIVE
  ) {
    throw new Error(
      "An active clinic user already exists with this email."
    );
  }

  if (!existingUser) {
    await client.appUser.create({
      data: {
        clinicId: clinicId ?? null,
        name: normalizedEmail,
        email: normalizedEmail,
        role,
        status: AppUserStatus.PENDING,
      },
    });
  } else {
    await client.appUser.update({
      where: {
        id: existingUser.id,
      },
      data: {
        clinicId: clinicId ?? null,
        role,
        status: AppUserStatus.PENDING,
      },
    });
  }

  const invite =
    await client.userInvite.create({
    data: {
      clinicId: clinicId ?? null,
      email: normalizedEmail,
      role,
      tokenHash: hashOpaqueToken(
        rawToken
      ),
      expiresAt,
      invitedByUserId:
        invitedByUserId ?? null,
    },
    select: {
      id: true,
      clinicId: true,
      email: true,
      role: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  return {
    invite,
    token: rawToken,
    expiresAt: invite.expiresAt,
  };
}
