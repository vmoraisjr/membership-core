import {
  ClinicContractStatus,
  ContractType,
  PatientContractStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";

type ContractClient =
  | typeof prisma
  | Prisma.TransactionClient;

const DEFAULT_CONTRACT_TEMPLATES = [
  {
    type: ContractType.PATIENT_MEMBERSHIP,
    title:
      "Membership Subscription Agreement",
    content:
      "This agreement records the patient membership enrollment, billing obligations, benefit usage rules and cancellation terms for the selected clinic plan.",
  },
  {
    type: ContractType.CLINIC_PLATFORM,
    title:
      "Clinic SaaS Service Agreement",
    content:
      "This agreement records the commercial platform subscription between Nortex and the clinic, including billing, module access and platform support terms.",
  },
] as const;

export async function ensureDefaultContractTemplates(
  client: ContractClient = prisma
) {
  await Promise.all(
    DEFAULT_CONTRACT_TEMPLATES.map(
      async (template) => {
        const existing =
          await client.contractTemplate.findFirst(
            {
              where: {
                clinicId: null,
                type: template.type,
                title: template.title,
              },
              select: {
                id: true,
              },
            }
          );

        if (existing) {
          return client.contractTemplate.update(
            {
              where: {
                id: existing.id,
              },
              data: {
                content:
                  template.content,
                active: true,
              },
            }
          );
        }

        return client.contractTemplate.create({
          data: {
            clinicId: null,
            type: template.type,
            title: template.title,
            content:
              template.content,
            active: true,
          },
        });
      }
    )
  );

  return client.contractTemplate.findMany({
    where: {
      active: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function ensureClinicContractRecord(
  clinicId: string,
  client: ContractClient = prisma
) {
  const templates =
    await ensureDefaultContractTemplates(
      client
    );
  const clinicTemplate =
    templates.find(
      (template) =>
        template.type ===
        ContractType.CLINIC_PLATFORM
    );

  if (!clinicTemplate) {
    return null;
  }

  const existing =
    await client.clinicContract.findFirst({
      where: {
        clinicId,
        status: {
          in: [
            ClinicContractStatus.PENDING_SIGNATURE,
            ClinicContractStatus.ACTIVE,
          ],
        },
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return client.clinicContract.findUnique(
      {
        where: {
          id: existing.id,
        },
      }
    );
  }

  return client.clinicContract.create({
    data: {
      clinicId,
      templateId: clinicTemplate.id,
      title: clinicTemplate.title,
      contentSnapshot:
        clinicTemplate.content,
      status:
        ClinicContractStatus.PENDING_SIGNATURE,
    },
  });
}

export async function generatePatientContractForSubscription(
  input: {
    clinicId: string;
    patientId: string;
    subscriptionId: string;
  },
  client: ContractClient = prisma
) {
  const templates =
    await ensureDefaultContractTemplates(
      client
    );
  const patientTemplate =
    templates.find(
      (template) =>
        template.type ===
        ContractType.PATIENT_MEMBERSHIP
    );

  if (!patientTemplate) {
    return null;
  }

  const existing =
    await client.patientContract.findFirst({
      where: {
        subscriptionId:
          input.subscriptionId,
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return client.patientContract.findUnique(
      {
        where: {
          id: existing.id,
        },
      }
    );
  }

  return client.patientContract.create({
    data: {
      clinicId: input.clinicId,
      patientId: input.patientId,
      subscriptionId:
        input.subscriptionId,
      templateId:
        patientTemplate.id,
      title:
        patientTemplate.title,
      contentSnapshot:
        patientTemplate.content,
      status:
        PatientContractStatus.PENDING_ACCEPTANCE,
    },
  });
}

export async function getContractsOverview() {
  const clinicId =
    await getCurrentClinicId();

  await ensureDefaultContractTemplates();
  await ensureClinicContractRecord(
    clinicId
  );

  const [patientContracts, clinicContracts] =
    await Promise.all([
      prisma.patientContract.findMany({
        where: {
          clinicId,
        },
        include: {
          patient: {
            select: {
              fullName: true,
            },
          },
          subscription: {
            select: {
              id: true,
            },
          },
          acceptances: {
            select: {
              id: true,
              acceptedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clinicContract.findMany({
        where: {
          clinicId,
        },
        include: {
          files: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  return {
    patientContracts,
    clinicContracts,
  };
}
