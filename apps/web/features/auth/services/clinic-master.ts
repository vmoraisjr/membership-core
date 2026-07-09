import { randomBytes } from "node:crypto";

import {
  AppUserRole,
  AppUserStatus,
  AuditAction,
  AuditEntity,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/features/audit-log/services/create-audit-log";

type AuthClient =
  | typeof prisma
  | Prisma.TransactionClient;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createTemporaryClinicMasterPassword() {
  return `Clinic-${randomBytes(6).toString("hex")}!1`;
}

export async function createClinicMasterUser(
  input: {
    clinicId: string;
    clinicName: string;
    email: string;
    actorDisplayName: string;
    actorUserId: string;
  },
  client: AuthClient = prisma
) {
  const email = normalizeEmail(input.email);
  const existingUser =
    await client.appUser.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

  if (existingUser) {
    throw new Error(
      "Ja existe um usuario com o e-mail informado para a clinica."
    );
  }

  const temporaryPassword =
    createTemporaryClinicMasterPassword();
  const clinicMaster =
    await client.appUser.create({
      data: {
        clinicId: input.clinicId,
        name:
          input.clinicName.trim() ||
          email,
        email,
        role: AppUserRole.OWNER,
        status: AppUserStatus.ACTIVE,
        passwordHash:
          hashPassword(
            temporaryPassword
          ),
        mustChangePassword: true,
        isClinicMaster: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

  await createAuditLog(client, {
    clinicId: input.clinicId,
    actor: input.actorDisplayName,
    actorUserId: input.actorUserId,
    action: AuditAction.CREATE,
    entity: AuditEntity.APP_USER,
    entityId: clinicMaster.id,
    entityLabel: clinicMaster.email,
    metadata: {
      role: AppUserRole.OWNER,
      isClinicMaster: true,
      mustChangePassword: true,
    },
  });

  return {
    clinicMaster,
    temporaryPassword,
  };
}

export async function getClinicMasterUser(
  clinicId: string,
  client: AuthClient = prisma
) {
  return client.appUser.findFirst({
    where: {
      clinicId,
      isClinicMaster: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

export async function resetClinicMasterPassword(
  input: {
    clinicId: string;
    actorDisplayName: string;
    actorUserId: string;
  },
  client: AuthClient = prisma
) {
  const clinicMaster =
    await getClinicMasterUser(
      input.clinicId,
      client
    );

  if (!clinicMaster) {
    throw new Error(
      "Nenhum usuario master da clinica foi encontrado."
    );
  }

  const temporaryPassword =
    createTemporaryClinicMasterPassword();

  await client.appUser.update({
    where: {
      id: clinicMaster.id,
    },
    data: {
      passwordHash: hashPassword(
        temporaryPassword
      ),
      mustChangePassword: true,
      status: AppUserStatus.ACTIVE,
    },
  });

  await client.authSession.deleteMany({
    where: {
      appUserId: clinicMaster.id,
    },
  });

  await createAuditLog(client, {
    clinicId: input.clinicId,
    actor: input.actorDisplayName,
    actorUserId: input.actorUserId,
    action: AuditAction.UPDATE,
    entity: AuditEntity.APP_USER,
    entityId: clinicMaster.id,
    entityLabel: clinicMaster.email,
    metadata: {
      passwordReset: true,
      mustChangePassword: true,
      isClinicMaster: true,
    },
  });

  return {
    clinicMaster,
    temporaryPassword,
  };
}
