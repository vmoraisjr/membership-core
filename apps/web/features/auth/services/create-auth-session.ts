import prisma from "@/lib/prisma";
import {
  createOpaqueToken,
  getSessionExpiryDate,
  hashOpaqueToken,
} from "@/lib/auth/session";
import { createAuditLogSafely } from "@/features/audit-log/services/create-audit-log";

export async function createAuthSession(
  appUserId: string
) {
  const token = createOpaqueToken();
  const expiresAt =
    getSessionExpiryDate();

  const actor =
    await prisma.appUser.findUnique({
      where: {
        id: appUserId,
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
      },
    });

  if (!actor) {
    throw new Error("User not found.");
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.authSession.create({
        data: {
          appUserId,
          sessionTokenHash:
            hashOpaqueToken(token),
          expiresAt,
        },
      });

      await tx.appUser.update({
        where: {
          id: appUserId,
        },
        data: {
          lastLoginAt: new Date(),
        },
      });
    }
  );

  await createAuditLogSafely(prisma, {
    clinicId:
      actor.clinicId ?? null,
    actor: `${actor.name} <${actor.email}>`,
    actorUserId: actor.id,
    action: "LOGIN",
    entity: "APP_USER",
    entityId: actor.id,
    entityLabel: actor.email,
    metadata: {
      loginSource: "auth_session",
    },
  });

  return {
    token,
    expiresAt,
  };
}
