import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashOpaqueToken } from "@/lib/auth/session";

export async function resetPasswordWithToken(
  token: string,
  nextPassword: string
) {
  const record =
    await prisma.passwordResetToken.findUnique(
      {
        where: {
          tokenHash:
            hashOpaqueToken(token),
        },
      }
    );

  if (
    !record ||
    record.usedAt ||
    record.expiresAt.getTime() <=
      Date.now()
  ) {
    throw new Error(
      "Invalid or expired password reset token."
    );
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: {
        id: record.appUserId,
      },
      data: {
        passwordHash:
          hashPassword(
            nextPassword
          ),
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
    prisma.authSession.deleteMany({
      where: {
        appUserId:
          record.appUserId,
      },
    }),
  ]);
}
