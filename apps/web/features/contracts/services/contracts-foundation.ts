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

export type ResolvedContractTemplate = {
  id: string;
  type: ContractType;
  title: string;
  content: string;
  scope: "DEFAULT" | "CLINIC";
};

export type ClinicContractTemplateRecord = {
  id: string;
  type: ContractType;
  title: string;
  content: string;
  active: boolean;
  createdAt: Date;
};

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
      clinicId: null,
      active: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getEffectiveContractTemplate(
  clinicId: string,
  type: ContractType,
  client: ContractClient = prisma
): Promise<ResolvedContractTemplate | null> {
  const clinicTemplate =
    await client.contractTemplate.findFirst({
      where: {
        clinicId,
        type,
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
      },
    });

  if (clinicTemplate) {
    return {
      ...clinicTemplate,
      scope: "CLINIC",
    };
  }

  const defaultTemplates =
    await ensureDefaultContractTemplates(
      client
    );
  const defaultTemplate =
    defaultTemplates.find(
      (template) =>
        template.type === type
    );

  if (!defaultTemplate) {
    return null;
  }

  return {
    id: defaultTemplate.id,
    type: defaultTemplate.type,
    title: defaultTemplate.title,
    content: defaultTemplate.content,
    scope: "DEFAULT",
  };
}

export async function upsertClinicContractTemplate(
  input: {
    clinicId: string;
    type: ContractType;
    title: string;
    content: string;
    templateId?: string | null;
  },
  client: ContractClient = prisma
) {
  if (input.templateId) {
    return client.contractTemplate.update({
      where: {
        id: input.templateId,
      },
      data: {
        title: input.title,
        content: input.content,
      },
    });
  }

  const activeTemplate =
    await client.contractTemplate.findFirst({
      where: {
        clinicId: input.clinicId,
        type: input.type,
        active: true,
      },
      select: {
        id: true,
      },
    });

  if (!activeTemplate) {
    return client.contractTemplate.create({
      data: {
        clinicId: input.clinicId,
        type: input.type,
        title: input.title,
        content: input.content,
        active: true,
      },
    });
  }

  return client.contractTemplate.create({
    data: {
      clinicId: input.clinicId,
      type: input.type,
      title: input.title,
      content: input.content,
      active: false,
    },
  });
}

export async function getClinicContractTemplates(
  clinicId: string,
  type: ContractType,
  client: ContractClient = prisma
): Promise<
  ClinicContractTemplateRecord[]
> {
  return client.contractTemplate.findMany({
    where: {
      clinicId,
      type,
    },
    orderBy: [
      {
        active: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      type: true,
      title: true,
      content: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function setClinicContractTemplateActive(
  input: {
    clinicId: string;
    templateId: string;
    active: boolean;
  },
  client: ContractClient = prisma
) {
  const template =
    await client.contractTemplate.findFirst({
      where: {
        id: input.templateId,
        clinicId: input.clinicId,
      },
      select: {
        id: true,
        type: true,
        title: true,
        active: true,
      },
    });

  if (!template) {
    throw new Error(
      "Contract template not found."
    );
  }

  if (input.active) {
    await client.contractTemplate.updateMany({
      where: {
        clinicId: input.clinicId,
        type: template.type,
      },
      data: {
        active: false,
      },
    });
  }

  return client.contractTemplate.update({
    where: {
      id: template.id,
    },
    data: {
      active: input.active,
    },
  });
}

export async function ensureClinicContractRecord(
  clinicId: string,
  client: ContractClient = prisma
) {
  const clinicTemplate =
    await getEffectiveContractTemplate(
      clinicId,
      ContractType.CLINIC_PLATFORM,
      client
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
            ClinicContractStatus.DRAFT,
            ClinicContractStatus.PENDING_SIGNATURE,
            ClinicContractStatus.ACTIVE,
            ClinicContractStatus.SUSPENDED,
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
  const subscription =
    await client.subscription.findFirst({
      where: {
        id: input.subscriptionId,
        patientId: input.patientId,
        patient: {
          clinicId: input.clinicId,
        },
      },
      select: {
        id: true,
        patientId: true,
        patient: {
          select: {
            clinicId: true,
          },
        },
      },
    });

  if (!subscription) {
    throw new Error(
      "Subscription-to-contract linkage is invalid."
    );
  }

  const patientTemplate =
    await getEffectiveContractTemplate(
      input.clinicId,
      ContractType.PATIENT_MEMBERSHIP,
      client
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
        patient: {
          select: {
            id: true,
            clinicId: true,
          },
        },
      },
    });

  if (existing) {
    if (
      existing.patient.id !==
        input.patientId ||
      existing.patient.clinicId !==
        input.clinicId
    ) {
      throw new Error(
        "Subscription contract is already linked to another patient record."
      );
    }

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
        PatientContractStatus.ACTIVE,
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

  const [
    patientTemplate,
    clinicTemplate,
    patientContracts,
    clinicContracts,
    patientClinicTemplates,
    clinicClinicTemplates,
  ] =
    await Promise.all([
      getEffectiveContractTemplate(
        clinicId,
        ContractType.PATIENT_MEMBERSHIP
      ),
      getEffectiveContractTemplate(
        clinicId,
        ContractType.CLINIC_PLATFORM
      ),
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
          files: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      getClinicContractTemplates(
        clinicId,
        ContractType.PATIENT_MEMBERSHIP
      ),
      getClinicContractTemplates(
        clinicId,
        ContractType.CLINIC_PLATFORM
      ),
    ]);

  return {
    patientTemplate,
    clinicTemplate,
    patientContracts,
    clinicContracts,
    patientClinicTemplates,
    clinicClinicTemplates,
  };
}
