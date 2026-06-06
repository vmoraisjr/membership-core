import { AppUserRole } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  createOpaqueToken,
  getUserInviteExpiryDate,
  hashOpaqueToken,
} from "@/lib/auth/session";

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
}: CreateUserInviteInput) {
  const rawToken = createOpaqueToken();
  const expiresAt =
    getUserInviteExpiryDate();

  await prisma.userInvite.create({
    data: {
      clinicId: clinicId ?? null,
      email: normalizeEmail(email),
      role,
      tokenHash: hashOpaqueToken(
        rawToken
      ),
      expiresAt,
      invitedByUserId:
        invitedByUserId ?? null,
    },
  });

  return {
    token: rawToken,
    expiresAt,
  };
}
