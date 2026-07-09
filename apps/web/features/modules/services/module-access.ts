import {
  ModuleKey,
  ModuleStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";
import { canClinicOperate } from "@/features/billing/services/billing-foundation";

import { isModuleV1Active } from "./module-policy";

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
  const clinicSubscription =
    await client.clinicSubscription.findFirst({
      where: {
        clinicId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
      },
    });
  const enableOperationalModules =
    canClinicOperate(
      clinicSubscription?.status
    );

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
          ...(isModuleV1Active(
            moduleRecord.key
          )
            ? {
                status:
                  enableOperationalModules
                    ? ModuleStatus.ENABLED
                    : ModuleStatus.DISABLED,
                enabledAt:
                  enableOperationalModules
                    ? new Date()
                    : null,
                disabledAt:
                  enableOperationalModules
                    ? null
                    : new Date(),
              }
            : {}),
        },
        create: {
          clinicId,
          moduleId: moduleRecord.id,
          status: isModuleV1Active(
            moduleRecord.key
          )
            ? enableOperationalModules
              ? ModuleStatus.ENABLED
              : ModuleStatus.DISABLED
            : ModuleStatus.DISABLED,
          enabledAt: isModuleV1Active(
            moduleRecord.key
          )
            ? enableOperationalModules
              ? new Date()
              : null
            : null,
          disabledAt:
            !isModuleV1Active(
              moduleRecord.key
            ) ||
            !enableOperationalModules
              ? new Date()
              : null,
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
  if (!isModuleV1Active(key)) {
    return false;
  }

  const resolvedClinicId =
    clinicId ??
    (await getCurrentClinicId());

  const clinicModules =
    await ensureClinicModules(
      resolvedClinicId
    );
  const clinicSubscription =
    await prisma.clinicSubscription.findFirst({
      where: {
        clinicId: resolvedClinicId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
      },
    });
  const matchedModule =
    clinicModules.find(
      (entry) =>
        entry.module.key === key
    );

  return (
    canClinicOperate(
      clinicSubscription?.status
    ) &&
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
