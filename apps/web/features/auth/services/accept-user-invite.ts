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
    invite.acceptedAt ||
    invite.expiresAt.getTime() <=
      Date.now()
  ) {
    throw new Error(
      "Invalid or expired invite."
    );
  }

  const user = await prisma.appUser.upsert({
    where: {
      email: invite.email,
    },
    update: {
      clinicId:
        invite.clinicId ?? null,
      name: name.trim(),
      role: invite.role,
      passwordHash:
        hashPassword(password),
    },
    create: {
      clinicId:
        invite.clinicId ?? null,
      name: name.trim(),
      email: invite.email,
      role: invite.role,
      passwordHash:
        hashPassword(password),
    },
  });

  await prisma.userInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      acceptedAt: new Date(),
    },
  });

  return user;
}
