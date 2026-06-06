import prisma from "@/lib/prisma";
import {
  createOpaqueToken,
  getSessionExpiryDate,
  hashOpaqueToken,
} from "@/lib/auth/session";

export async function createAuthSession(
  appUserId: string
) {
  const token = createOpaqueToken();
  const expiresAt =
    getSessionExpiryDate();

  await prisma.authSession.create({
    data: {
      appUserId,
      sessionTokenHash:
        hashOpaqueToken(token),
      expiresAt,
    },
  });

  await prisma.appUser.update({
    where: {
      id: appUserId,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  return {
    token,
    expiresAt,
  };
}
