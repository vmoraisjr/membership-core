import {
  randomBytes,
  scryptSync,
} from "node:crypto";

import {
  AppUserRole,
  AppUserStatus,
  ClinicStatus,
  ClinicSubscriptionStatus,
  ModuleKey,
  ModuleStatus,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORM_OWNER_EMAIL =
  "owner+workspace@membership-core.local";
const PLATFORM_OWNER_PASSWORD =
  "ChangeMe123!";
const FIRST_ACCESS_CLINIC_EMAIL =
  "first-access@browser-journeys.local";
const FIRST_ACCESS_CLINIC_PASSWORD =
  "TempClinic123!";
const OPERATIONS_CLINIC_EMAIL =
  "operations@browser-journeys.local";
const OPERATIONS_CLINIC_PASSWORD =
  "ClinicReady123!";

function hashPassword(password) {
  const salt =
    randomBytes(16).toString("hex");
  const derivedKey = scryptSync(
    password.normalize("NFKC"),
    salt,
    64
  ).toString("hex");

  return `${salt}:${derivedKey}`;
}

async function resetDatabase() {
  await prisma.$transaction(async (tx) => {
    await tx.authSession.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.userInvite.deleteMany();
    await tx.supportMessage.deleteMany();
    await tx.supportThread.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.leadActivity.deleteMany();
    await tx.leadNote.deleteMany();
    await tx.patientContractAcceptance.deleteMany();
    await tx.clinicContractFile.deleteMany();
    await tx.patientPayment.deleteMany();
    await tx.clinicPayment.deleteMany();
    await tx.benefitUsage.deleteMany();
    await tx.patientInvoice.deleteMany();
    await tx.clinicInvoice.deleteMany();
    await tx.patientContract.deleteMany();
    await tx.clinicContract.deleteMany();
    await tx.subscription.deleteMany();
    await tx.membershipBenefit.deleteMany();
    await tx.membershipPlan.deleteMany();
    await tx.patient.deleteMany();
    await tx.lead.deleteMany();
    await tx.clinicModule.deleteMany();
    await tx.module.deleteMany();
    await tx.clinicSubscription.deleteMany();
    await tx.clinicBillingPlan.deleteMany();
    await tx.contractTemplate.deleteMany();
    await tx.clinic.deleteMany();
    await tx.appUser.deleteMany();
  });
}

async function seedPlatformOwner() {
  return prisma.appUser.create({
    data: {
      clinicId: null,
      name: "Owner Operator",
      email: PLATFORM_OWNER_EMAIL,
      role: AppUserRole.OWNER,
      status: AppUserStatus.ACTIVE,
      mustChangePassword: false,
      isClinicMaster: false,
      passwordHash: hashPassword(
        PLATFORM_OWNER_PASSWORD
      ),
    },
  });
}

async function ensureMembershipModule() {
  return prisma.module.create({
    data: {
      key: ModuleKey.MEMBERSHIP,
      name: "Membership",
      description:
        "Modulo principal operacional.",
      isV1Active: true,
    },
  });
}

async function ensureBillingPlan() {
  return prisma.clinicBillingPlan.create({
    data: {
      name: "Sheep Growth",
      description:
        "Plano comercial padrao do Sheep.",
      monthlyPrice: 249,
      annualPrice: 2490,
      trialDays: 14,
      active: true,
    },
  });
}

async function seedClinic(input) {
  const clinic = await prisma.clinic.create({
    data: {
      name: input.name,
      brandName: input.brandName,
      slug: input.slug,
      document: input.document,
      email: input.email,
      phone: input.phone,
      zipCode: input.zipCode,
      city: input.city,
      state: input.state,
      address: input.address,
      status: ClinicStatus.ACTIVE,
    },
  });

  await prisma.appUser.create({
    data: {
      clinicId: clinic.id,
      name: input.masterName,
      email: input.masterEmail,
      role: AppUserRole.OWNER,
      status: AppUserStatus.ACTIVE,
      mustChangePassword:
        input.mustChangePassword,
      isClinicMaster: true,
      passwordHash: hashPassword(
        input.masterPassword
      ),
    },
  });

  return clinic;
}

async function attachActiveSubscription(
  clinicId,
  clinicBillingPlanId,
  moduleId
) {
  const startedAt = new Date();
  startedAt.setDate(
    startedAt.getDate() - 10
  );
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + 20
  );

  const subscription =
    await prisma.clinicSubscription.create({
      data: {
        clinicId,
        clinicBillingPlanId,
        status:
          ClinicSubscriptionStatus.ACTIVE,
        startedAt,
        expiresAt,
      },
    });

  await prisma.clinicInvoice.create({
    data: {
      clinicId,
      clinicSubscriptionId:
        subscription.id,
      amount: 249,
      description:
        "Fatura ativa do Sheep Growth",
      dueDate: expiresAt,
      status: PaymentStatus.PAID,
      paidAt: startedAt,
    },
  });

  await prisma.clinicModule.create({
    data: {
      clinicId,
      moduleId,
      status: ModuleStatus.ENABLED,
      enabledAt: new Date(),
    },
  });
}

async function main() {
  await resetDatabase();

  const [billingPlan, membershipModule] =
    await Promise.all([
      ensureBillingPlan(),
      ensureMembershipModule(),
    ]);

  await seedPlatformOwner();

  await seedClinic({
    name: "Sheep Browser First Access",
    brandName: "First Access Co.",
    slug: "browser-first-access",
    document: "38.060.438/0001-10",
    email: "contato+first@sheep.local",
    phone: "(11) 98888-1111",
    zipCode: "01000-000",
    city: "Sao Paulo",
    state: "SP",
    address: "Rua Primeiro Acesso, 10",
    masterName: "First Access Owner",
    masterEmail:
      FIRST_ACCESS_CLINIC_EMAIL,
    masterPassword:
      FIRST_ACCESS_CLINIC_PASSWORD,
    mustChangePassword: true,
  });

  const operationsClinic =
    await seedClinic({
      name: "Sheep Browser Operations",
      brandName: "Operations Co.",
      slug: "browser-operations",
      document: "02.450.992/0001-74",
      email:
        "contato+operations@sheep.local",
      phone: "(21) 97777-2222",
      zipCode: "20000-000",
      city: "Rio de Janeiro",
      state: "RJ",
      address: "Avenida Operacao, 25",
      masterName: "Operations Owner",
      masterEmail:
        OPERATIONS_CLINIC_EMAIL,
      masterPassword:
        OPERATIONS_CLINIC_PASSWORD,
      mustChangePassword: false,
    });

  await attachActiveSubscription(
    operationsClinic.id,
    billingPlan.id,
    membershipModule.id
  );

  console.log(
    JSON.stringify(
      {
        platform: {
          email: PLATFORM_OWNER_EMAIL,
          password:
            PLATFORM_OWNER_PASSWORD,
        },
        firstAccessClinic: {
          email:
            FIRST_ACCESS_CLINIC_EMAIL,
          password:
            FIRST_ACCESS_CLINIC_PASSWORD,
        },
        operationsClinic: {
          email:
            OPERATIONS_CLINIC_EMAIL,
          password:
            OPERATIONS_CLINIC_PASSWORD,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
