import "dotenv/config";

import {
  AppUserRole,
  AppUserStatus,
  BenefitType,
  BillingCycle,
  ClinicContractStatus,
  ClinicSubscriptionStatus,
  ContractType,
  ModuleKey,
  ModuleStatus,
  PatientContractStatus,
  PatientStatus,
  PaymentStatus,
  PrismaClient,
  ResetPeriod,
  SubscriptionStatus,
} from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  await upsertPlatformOwner();
  const clinic = await upsertClinic();
  const plan = await upsertMembershipPlan(
    clinic.id
  );
  const benefits = await upsertBenefits(
    plan.id
  );
  const patient = await upsertPatient(
    clinic.id
  );
  const subscription =
    await upsertSubscription(
      patient.id,
      plan.id
    );

  await upsertPatientInvoices({
    clinicId: clinic.id,
    patientId: patient.id,
    subscriptionId: subscription.id,
  });
  await upsertClinicBilling(clinic.id);
  await upsertModules(clinic.id);
  await upsertContracts({
    clinicId: clinic.id,
    patientId: patient.id,
    subscriptionId: subscription.id,
  });
  await upsertAppUsers(clinic.id);
  await upsertBenefitUsage(
    subscription.id,
    benefits.activeBenefitId
  );

  console.log(
    "Seed completed for Nortex Medical demo environment."
  );
}

async function upsertPlatformOwner() {
  const email =
    "owner+workspace@membership-core.local";
  const passwordHash =
    hashPassword("ChangeMe123!");
  const existing =
    await prisma.appUser.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

  if (existing) {
    await prisma.appUser.update({
      where: {
        id: existing.id,
      },
      data: {
        clinicId: null,
        name: "Owner Operator",
        role: AppUserRole.OWNER,
        status: AppUserStatus.ACTIVE,
        passwordHash:
          existing.passwordHash ??
          passwordHash,
      },
    });

    return;
  }

  await prisma.appUser.create({
    data: {
      clinicId: null,
      name: "Owner Operator",
      email,
      role: AppUserRole.OWNER,
      status: AppUserStatus.ACTIVE,
      passwordHash,
    },
  });
}

async function upsertClinic() {
  const existing =
    await prisma.clinic.findFirst({
      where: {
        slug: "nortex-medical",
      },
    });

  if (existing) {
    return prisma.clinic.update({
      where: {
        id: existing.id,
      },
      data: {
        name: "Nortex Medical",
        brandName: "Nortex",
        document: "00.000.000/0001-00",
        email: "contato@nortex.com",
        phone: "11999999999",
        zipCode: "06454-000",
        city: "Barueri",
        state: "SP",
        address: "Alphaville",
      },
    });
  }

  return prisma.clinic.create({
    data: {
      name: "Nortex Medical",
      brandName: "Nortex",
      slug: "nortex-medical",
      document: "00.000.000/0001-00",
      email: "contato@nortex.com",
      phone: "11999999999",
      zipCode: "06454-000",
      city: "Barueri",
      state: "SP",
      address: "Alphaville",
    },
  });
}

async function upsertMembershipPlan(
  clinicId: string
) {
  const existing =
    await prisma.membershipPlan.findFirst({
      where: {
        clinicId,
        name: "Premium Health",
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.membershipPlan.update({
      where: {
        id: existing.id,
      },
      data: {
        description:
          "Premium membership plan for Nortex demo flows.",
        monthlyPrice: 99.9,
        annualPrice: 999,
        active: true,
      },
    });
  }

  return prisma.membershipPlan.create({
    data: {
      clinicId,
      name: "Premium Health",
      description:
        "Premium membership plan for Nortex demo flows.",
      monthlyPrice: 99.9,
      annualPrice: 999,
      active: true,
    },
  });
}

async function upsertBenefits(
  membershipPlanId: string
) {
  const activeBenefit =
    await upsertBenefit({
      membershipPlanId,
      title: "Monthly consultation credit",
      description:
        "One discounted consultation per month.",
      usageLimit: 1,
      active: true,
    });
  await upsertBenefit({
    membershipPlanId,
    title: "Legacy inactive benefit",
    description:
      "Used to validate inactive benefit protection.",
    usageLimit: 1,
    active: false,
  });

  return {
    activeBenefitId: activeBenefit.id,
  };
}

async function upsertBenefit(input: {
  membershipPlanId: string;
  title: string;
  description: string;
  usageLimit: number;
  active: boolean;
}) {
  const existing =
    await prisma.membershipBenefit.findFirst({
      where: {
        membershipPlanId:
          input.membershipPlanId,
        title: input.title,
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.membershipBenefit.update({
      where: {
        id: existing.id,
      },
      data: {
        type: BenefitType.LIMITED,
        description:
          input.description,
        usageLimit: input.usageLimit,
        resetPeriod:
          ResetPeriod.MONTHLY,
        active: input.active,
      },
    });
  }

  return prisma.membershipBenefit.create({
    data: {
      membershipPlanId:
        input.membershipPlanId,
      type: BenefitType.LIMITED,
      title: input.title,
      description: input.description,
      usageLimit: input.usageLimit,
      resetPeriod: ResetPeriod.MONTHLY,
      active: input.active,
    },
  });
}

async function upsertPatient(
  clinicId: string
) {
  const existing =
    await prisma.patient.findFirst({
      where: {
        clinicId,
        document: "123.456.789-10",
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.patient.update({
      where: {
        id: existing.id,
      },
      data: {
        fullName: "Ana Souza",
        email: "ana@nortex-demo.local",
        phone: "11988887777",
        birthDate: new Date(
          "1990-05-20T00:00:00.000Z"
        ),
        zipCode: "06454-000",
        city: "Barueri",
        state: "SP",
        address: "Alameda Demo, 100",
        status: PatientStatus.ACTIVE,
        inactiveReason: null,
      },
    });
  }

  return prisma.patient.create({
    data: {
      clinicId,
      fullName: "Ana Souza",
      email: "ana@nortex-demo.local",
      phone: "11988887777",
      birthDate: new Date(
        "1990-05-20T00:00:00.000Z"
      ),
      document: "123.456.789-10",
      zipCode: "06454-000",
      city: "Barueri",
      state: "SP",
      address: "Alameda Demo, 100",
      status: PatientStatus.ACTIVE,
    },
  });
}

async function upsertSubscription(
  patientId: string,
  membershipPlanId: string
) {
  const existing =
    await prisma.subscription.findFirst({
      where: {
        patientId,
        membershipPlanId,
      },
      select: {
        id: true,
      },
    });

  const startedAt = new Date();
  startedAt.setDate(
    startedAt.getDate() - 15
  );
  const expiresAt = new Date();
  expiresAt.setMonth(
    expiresAt.getMonth() + 1
  );

  if (existing) {
    return prisma.subscription.update({
      where: {
        id: existing.id,
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startedAt,
        expiresAt,
        canceledAt: null,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      patientId,
      membershipPlanId,
      status: SubscriptionStatus.ACTIVE,
      startedAt,
      expiresAt,
    },
  });
}

async function upsertPatientInvoices(input: {
  clinicId: string;
  patientId: string;
  subscriptionId: string;
}) {
  const paidInvoice =
    await upsertPatientInvoice({
      clinicId: input.clinicId,
      patientId: input.patientId,
      subscriptionId:
        input.subscriptionId,
      description:
        "Premium Health - paid enrollment invoice",
      amount: 99.9,
      status: PaymentStatus.PAID,
      billingCycle:
        BillingCycle.MONTHLY,
      dueOffsetDays: -10,
      paidOffsetDays: -8,
    });

  const existingPayment =
    await prisma.patientPayment.findFirst({
      where: {
        patientInvoiceId:
          paidInvoice.id,
      },
      select: {
        id: true,
      },
    });

  if (!existingPayment) {
    await prisma.patientPayment.create({
      data: {
        clinicId: input.clinicId,
        patientInvoiceId:
          paidInvoice.id,
        amount: 99.9,
        status: PaymentStatus.PAID,
        paidAt:
          paidInvoice.paidAt ??
          new Date(),
        notes:
          "Seeded payment confirmation.",
      },
    });
  }

  await upsertPatientInvoice({
    clinicId: input.clinicId,
    patientId: input.patientId,
    subscriptionId:
      input.subscriptionId,
    description:
      "Premium Health - overdue renewal invoice",
    amount: 99.9,
    status: PaymentStatus.OVERDUE,
    billingCycle:
      BillingCycle.MONTHLY,
    dueOffsetDays: -2,
  });
}

async function upsertPatientInvoice(input: {
  clinicId: string;
  patientId: string;
  subscriptionId: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  billingCycle: BillingCycle;
  dueOffsetDays: number;
  paidOffsetDays?: number;
}) {
  const existing =
    await prisma.patientInvoice.findFirst({
      where: {
        clinicId: input.clinicId,
        patientId: input.patientId,
        description:
          input.description,
      },
      select: {
        id: true,
      },
    });

  const dueDate = new Date();
  dueDate.setDate(
    dueDate.getDate() +
      input.dueOffsetDays
  );
  const paidAt =
    input.paidOffsetDays == null
      ? null
      : new Date(
          Date.now() +
            input.paidOffsetDays *
              24 *
              60 *
              60 *
              1000
        );

  if (existing) {
    return prisma.patientInvoice.update({
      where: {
        id: existing.id,
      },
      data: {
        subscriptionId:
          input.subscriptionId,
        amount: input.amount,
        status: input.status,
        billingCycle:
          input.billingCycle,
        dueDate,
        paidAt,
      },
    });
  }

  return prisma.patientInvoice.create({
    data: {
      clinicId: input.clinicId,
      patientId: input.patientId,
      subscriptionId:
        input.subscriptionId,
      amount: input.amount,
      billingCycle:
        input.billingCycle,
      description:
        input.description,
      dueDate,
      status: input.status,
      paidAt,
    },
  });
}

async function upsertClinicBilling(
  clinicId: string
) {
  const billingPlan =
    await upsertClinicBillingPlan();
  const clinicSubscription =
    await upsertClinicSubscription({
      clinicId,
      clinicBillingPlanId:
        billingPlan.id,
    });

  await upsertClinicInvoice({
    clinicId,
    clinicSubscriptionId:
      clinicSubscription.id,
    description:
      "Initial Nortex platform invoice",
    amount: 249,
    status: PaymentStatus.PENDING,
    dueOffsetDays: 7,
  });
}

async function upsertClinicBillingPlan() {
  const existing =
    await prisma.clinicBillingPlan.findFirst({
      where: {
        name:
          "Nortex Membership Platform",
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.clinicBillingPlan.update({
      where: {
        id: existing.id,
      },
      data: {
        description:
          "Default commercial platform plan for V1 membership clinics.",
        monthlyPrice: 249,
        annualPrice: 2490,
        trialDays: 14,
        active: true,
      },
    });
  }

  return prisma.clinicBillingPlan.create({
    data: {
      name:
        "Nortex Membership Platform",
      description:
        "Default commercial platform plan for V1 membership clinics.",
      monthlyPrice: 249,
      annualPrice: 2490,
      trialDays: 14,
      active: true,
    },
  });
}

async function upsertClinicSubscription(input: {
  clinicId: string;
  clinicBillingPlanId: string;
}) {
  const existing =
    await prisma.clinicSubscription.findFirst({
      where: {
        clinicId: input.clinicId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

  const startedAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(
    trialEndsAt.getDate() + 14
  );

  if (existing) {
    return prisma.clinicSubscription.update({
      where: {
        id: existing.id,
      },
      data: {
        clinicBillingPlanId:
          input.clinicBillingPlanId,
        status:
          ClinicSubscriptionStatus.TRIAL,
        startedAt,
        trialEndsAt,
        expiresAt: trialEndsAt,
        canceledAt: null,
      },
    });
  }

  return prisma.clinicSubscription.create({
    data: {
      clinicId: input.clinicId,
      clinicBillingPlanId:
        input.clinicBillingPlanId,
      status:
        ClinicSubscriptionStatus.TRIAL,
      startedAt,
      trialEndsAt,
      expiresAt: trialEndsAt,
    },
  });
}

async function upsertClinicInvoice(input: {
  clinicId: string;
  clinicSubscriptionId: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  dueOffsetDays: number;
}) {
  const existing =
    await prisma.clinicInvoice.findFirst({
      where: {
        clinicId: input.clinicId,
        description:
          input.description,
      },
      select: {
        id: true,
      },
    });

  const dueDate = new Date();
  dueDate.setDate(
    dueDate.getDate() +
      input.dueOffsetDays
  );

  if (existing) {
    return prisma.clinicInvoice.update({
      where: {
        id: existing.id,
      },
      data: {
        clinicSubscriptionId:
          input.clinicSubscriptionId,
        amount: input.amount,
        status: input.status,
        dueDate,
      },
    });
  }

  return prisma.clinicInvoice.create({
    data: {
      clinicId: input.clinicId,
      clinicSubscriptionId:
        input.clinicSubscriptionId,
      amount: input.amount,
      description:
        input.description,
      dueDate,
      status: input.status,
    },
  });
}

async function upsertModules(
  clinicId: string
) {
  const moduleDefinitions = [
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
      key:
        ModuleKey.PATIENT_PORTAL,
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
  ] as const;

  for (const definition of moduleDefinitions) {
    const moduleRecord =
      await prisma.module.upsert({
        where: {
          key: definition.key,
        },
        update: {
          name: definition.name,
          description:
            definition.description,
          isV1Active:
            definition.isV1Active,
        },
        create: definition,
      });

    await prisma.clinicModule.upsert({
      where: {
        clinicId_moduleId: {
          clinicId,
          moduleId: moduleRecord.id,
        },
      },
      update: {
        status:
          definition.key ===
          ModuleKey.MEMBERSHIP
            ? ModuleStatus.ENABLED
            : ModuleStatus.DISABLED,
        enabledAt:
          definition.key ===
          ModuleKey.MEMBERSHIP
            ? new Date()
            : null,
        disabledAt:
          definition.key ===
          ModuleKey.MEMBERSHIP
            ? null
            : new Date(),
      },
      create: {
        clinicId,
        moduleId: moduleRecord.id,
        status:
          definition.key ===
          ModuleKey.MEMBERSHIP
            ? ModuleStatus.ENABLED
            : ModuleStatus.DISABLED,
        enabledAt:
          definition.key ===
          ModuleKey.MEMBERSHIP
            ? new Date()
            : null,
        disabledAt:
          definition.key ===
          ModuleKey.MEMBERSHIP
            ? null
            : new Date(),
      },
    });
  }
}

async function upsertContracts(input: {
  clinicId: string;
  patientId: string;
  subscriptionId: string;
}) {
  const patientTemplate =
    await upsertContractTemplate({
      clinicId: null,
      type:
        ContractType.PATIENT_MEMBERSHIP,
      title:
        "Membership Subscription Agreement",
      content:
        "This agreement records the patient membership enrollment, billing obligations, benefit usage rules and cancellation terms for the selected clinic plan.",
    });
  const clinicTemplate =
    await upsertContractTemplate({
      clinicId: null,
      type: ContractType.CLINIC_PLATFORM,
      title:
        "Clinic SaaS Service Agreement",
      content:
        "This agreement records the commercial platform subscription between Nortex and the clinic, including billing, module access and platform support terms.",
    });

  const existingPatientContract =
    await prisma.patientContract.findFirst({
      where: {
        subscriptionId:
          input.subscriptionId,
      },
      select: {
        id: true,
      },
    });

  if (existingPatientContract) {
    await prisma.patientContract.update({
      where: {
        id: existingPatientContract.id,
      },
      data: {
        clinicId: input.clinicId,
        patientId: input.patientId,
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
  } else {
    await prisma.patientContract.create({
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

  const existingClinicContract =
    await prisma.clinicContract.findFirst({
      where: {
        clinicId: input.clinicId,
      },
      select: {
        id: true,
      },
    });

  if (existingClinicContract) {
    await prisma.clinicContract.update({
      where: {
        id: existingClinicContract.id,
      },
      data: {
        templateId:
          clinicTemplate.id,
        title:
          clinicTemplate.title,
        contentSnapshot:
          clinicTemplate.content,
        status:
          ClinicContractStatus.PENDING_SIGNATURE,
        effectiveAt: null,
        signedAt: null,
      },
    });
  } else {
    await prisma.clinicContract.create({
      data: {
        clinicId: input.clinicId,
        templateId:
          clinicTemplate.id,
        title:
          clinicTemplate.title,
        contentSnapshot:
          clinicTemplate.content,
        status:
          ClinicContractStatus.PENDING_SIGNATURE,
      },
    });
  }
}

async function upsertContractTemplate(input: {
  clinicId: string | null;
  type: ContractType;
  title: string;
  content: string;
}) {
  const existing =
    await prisma.contractTemplate.findFirst({
      where: {
        clinicId: input.clinicId,
        type: input.type,
        title: input.title,
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.contractTemplate.update({
      where: {
        id: existing.id,
      },
      data: {
        content: input.content,
        active: true,
      },
    });
  }

  return prisma.contractTemplate.create({
    data: {
      clinicId: input.clinicId,
      type: input.type,
      title: input.title,
      content: input.content,
      active: true,
    },
  });
}

async function upsertAppUsers(
  clinicId: string
) {
  const passwordHash =
    hashPassword("ChangeMe123!");
  const demoUsers: Array<{
    role: AppUserRole;
    email: string;
    name: string;
  }> = [
    {
      role: AppUserRole.OWNER,
      email:
        "owner+nortex-medical@membership-core.local",
      name: "Owner Operator",
    },
    {
      role: AppUserRole.ADMIN,
      email:
        "admin+nortex-medical@membership-core.local",
      name: "Admin Operator",
    },
    {
      role: AppUserRole.STAFF,
      email:
        "staff+nortex-medical@membership-core.local",
      name: "Staff Operator",
    },
    {
      role: AppUserRole.FINANCE,
      email:
        "finance+nortex-medical@membership-core.local",
      name: "Finance Operator",
    },
    {
      role: AppUserRole.READ_ONLY,
      email:
        "readonly+nortex-medical@membership-core.local",
      name: "Read Only Operator",
    },
  ];

  for (const demoUser of demoUsers) {
    const existing =
      await prisma.appUser.findUnique({
        where: {
          email: demoUser.email,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      await prisma.appUser.update({
        where: {
          id: existing.id,
        },
        data: {
          clinicId,
          name: demoUser.name,
          role: demoUser.role,
          passwordHash,
        },
      });
      continue;
    }

    await prisma.appUser.create({
      data: {
        clinicId,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        passwordHash,
      },
    });
  }
}

async function upsertBenefitUsage(
  subscriptionId: string,
  membershipBenefitId: string
) {
  const existing =
    await prisma.benefitUsage.findFirst({
      where: {
        subscriptionId,
        membershipBenefitId,
        usedBy: "Dr. Demo",
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.benefitUsage.update({
      where: {
        id: existing.id,
      },
      data: {
        quantity: 1,
        notes:
          "Seeded benefit usage event for dashboard metrics.",
      },
    });
  }

  return prisma.benefitUsage.create({
    data: {
      subscriptionId,
      membershipBenefitId,
      quantity: 1,
      usedBy: "Dr. Demo",
      notes:
        "Seeded benefit usage event for dashboard metrics.",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
