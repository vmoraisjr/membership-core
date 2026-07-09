import {
  createAuditLogSafely,
} from "@/features/audit-log/services/create-audit-log";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

type CompleteFirstAccessPasswordInput =
  {
    appUserId: string;
    clinicId: string | null;
    email: string;
    actorDisplayName: string;
    actorUserId: string;
    nextPassword: string;
  };

export async function completeFirstAccessPassword(
  input: CompleteFirstAccessPasswordInput
) {
  await prisma.$transaction(
    async (tx) => {
      await tx.appUser.update({
        where: {
          id: input.appUserId,
        },
        data: {
          passwordHash:
            hashPassword(
              input.nextPassword
            ),
          mustChangePassword: false,
        },
      });

      await tx.authSession.deleteMany({
        where: {
          appUserId: input.appUserId,
        },
      });
    }
  );

  await createAuditLogSafely(prisma, {
    clinicId: input.clinicId,
    actor: input.actorDisplayName,
    actorUserId: input.actorUserId,
    action: "UPDATE",
    entity: "APP_USER",
    entityId: input.appUserId,
    entityLabel: input.email,
    metadata: {
      firstAccessPasswordUpdated: true,
    },
  });
}
