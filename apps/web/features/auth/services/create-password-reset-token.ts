import prisma from "@/lib/prisma";
import {
  createOpaqueToken,
  getPasswordResetExpiryDate,
  hashOpaqueToken,
} from "@/lib/auth/session";

export async function createPasswordResetToken(
  appUserId: string
) {
  const rawToken = createOpaqueToken();
  const expiresAt =
    getPasswordResetExpiryDate();

  await prisma.passwordResetToken.create({
    data: {
      appUserId,
      tokenHash: hashOpaqueToken(
        rawToken
      ),
      expiresAt,
    },
  });

  return {
    token: rawToken,
    expiresAt,
  };
}
