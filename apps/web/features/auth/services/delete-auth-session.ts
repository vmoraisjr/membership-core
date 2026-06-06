import prisma from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/session";

export async function deleteAuthSession(
  token?: string
) {
  if (!token) {
    return;
  }

  await prisma.authSession.deleteMany({
    where: {
      sessionTokenHash:
        hashOpaqueToken(token),
    },
  });
}
