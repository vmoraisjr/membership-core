import {
  ModuleKey,
  ModuleStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";

type ModuleClient =
  | typeof prisma
  | Prisma.TransactionClient;

const DEFAULT_MODULES: Array<{
  key: ModuleKey;
  name: string;
  description: string;
  isV1Active: boolean;
}> = [
  {
    key: ModuleKey.MEMBERSHIP,
    name: "Membership",
    description:
      "Core membership, billing, benefits and contract operations.",
    isV1Active: true,
  },
  {
    key: ModuleKey.CRM,
    name: "CRM",
    description:
      "Future pipeline and lead management module.",
    isV1Active: false,
  },
  {
    key: ModuleKey.SCHEDULING,
    name: "Scheduling",
    description:
      "Future appointment scheduling module.",
    isV1Active: false,
  },
  {
    key: ModuleKey.COMMUNICATION,
    name: "Communication",
    description:
      "Future communication and automation module.",
    isV1Active: false,
  },
  {
    key: ModuleKey.PATIENT_PORTAL,
    name: "Patient Portal",
    description:
      "Future self-service portal for patients.",
    isV1Active: false,
  },
  {
    key: ModuleKey.ANALYTICS,
    name: "Analytics",
    description:
      "Future cross-clinic analytics module.",
    isV1Active: false,
  },
];

export async function ensureDefaultModules(
  client: ModuleClient = prisma
) {
  await Promise.all(
    DEFAULT_MODULES.map((moduleDefinition) =>
      client.module.upsert({
        where: {
          key: moduleDefinition.key,
        },
        update: {
          name: moduleDefinition.name,
          description:
            moduleDefinition.description,
          isV1Active:
            moduleDefinition.isV1Active,
        },
        create: moduleDefinition,
      })
    )
  );

  return client.module.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function ensureClinicModules(
  clinicId: string,
  client: ModuleClient = prisma
) {
  const modules =
    await ensureDefaultModules(client);

  await Promise.all(
    modules.map((moduleRecord) =>
      client.clinicModule.upsert({
        where: {
          clinicId_moduleId: {
            clinicId,
            moduleId: moduleRecord.id,
          },
        },
        update: {
          status:
            moduleRecord.key ===
            ModuleKey.MEMBERSHIP
              ? ModuleStatus.ENABLED
              : ModuleStatus.DISABLED,
          enabledAt:
            moduleRecord.key ===
            ModuleKey.MEMBERSHIP
              ? new Date()
              : null,
          disabledAt:
            moduleRecord.key ===
            ModuleKey.MEMBERSHIP
              ? null
              : new Date(),
        },
        create: {
          clinicId,
          moduleId: moduleRecord.id,
          status:
            moduleRecord.key ===
            ModuleKey.MEMBERSHIP
              ? ModuleStatus.ENABLED
              : ModuleStatus.DISABLED,
          enabledAt:
            moduleRecord.key ===
            ModuleKey.MEMBERSHIP
              ? new Date()
              : null,
          disabledAt:
            moduleRecord.key ===
            ModuleKey.MEMBERSHIP
              ? null
              : new Date(),
        },
      })
    )
  );

  return client.clinicModule.findMany({
    where: {
      clinicId,
    },
    include: {
      module: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getClinicModules() {
  const clinicId =
    await getCurrentClinicId();

  return ensureClinicModules(clinicId);
}

export async function isModuleEnabled(
  key: ModuleKey,
  clinicId?: string
) {
  const resolvedClinicId =
    clinicId ??
    (await getCurrentClinicId());

  const clinicModules =
    await ensureClinicModules(
      resolvedClinicId
    );
  const matchedModule =
    clinicModules.find(
      (entry) =>
        entry.module.key === key
    );

  return (
    matchedModule?.status ===
    ModuleStatus.ENABLED
  );
}

export async function assertModuleEnabled(
  key: ModuleKey
) {
  const enabled =
    await isModuleEnabled(key);

  if (!enabled) {
    throw new Error(
      `The ${key.toLowerCase().replace(/_/g, " ")} module is disabled for this clinic.`
    );
  }
}
