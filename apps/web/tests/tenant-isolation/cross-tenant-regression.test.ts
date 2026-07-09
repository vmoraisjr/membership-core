import "dotenv/config";

import assert from "node:assert/strict";

const baseDatabaseUrl =
  process.env.DATABASE_URL;

if (!baseDatabaseUrl) {
  throw new Error(
    "DATABASE_URL must be set before running tenant regression tests."
  );
}

(
  process.env as Record<
    string,
    string | undefined
  >
).NODE_ENV = "test";
process.env.APP_LOG_LEVEL = "error";

import {
  AppUserRole,
  BillingCycle,
  ClinicContractStatus,
  ClinicStatus,
  ClinicSubscriptionStatus,
  ContractType,
  ModuleKey,
  ModuleStatus,
  PatientContractStatus,
  PatientStatus,
  PaymentStatus,
  ResetPeriod,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { createUserInviteAction } from "@/features/auth/actions/create-user-invite";
import { getPatients } from "@/features/patients/services/get-patients";
import { getPatientProfile } from "@/features/patients/services/get-patient-profile";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";
import { getMembershipBenefits } from "@/features/membership-benefits/services/get-membership-benefits";
import { getSubscriptions } from "@/features/subscriptions/services/get-subscriptions";
import { getBenefitUsageHistory } from "@/features/benefit-usage/services/get-benefit-usage-history";
import { getPatientBenefitBalance } from "@/features/benefit-usage/services/get-patient-benefit-balance";
import { getBillingOverview } from "@/features/billing/services/billing-foundation";
import { getContractsOverview } from "@/features/contracts/services/contracts-foundation";
import { getDashboardMetrics } from "@/features/dashboard/services/get-dashboard-metrics";
import { updatePatient } from "@/features/patients/actions/update-patient";
import { deletePatientPermanently } from "@/features/patients/actions/delete-patient-permanently";
import { markPatientInvoiceOverdueAction } from "@/features/billing/actions/mark-patient-invoice-overdue";
import { acceptPatientContractAction } from "@/features/contracts/actions/accept-patient-contract";
import { getClinicUsersOverview } from "@/features/users/services/get-clinic-users-overview";
import { updateClinicUserRoleAction } from "@/features/users/actions/update-clinic-user-role";
import { ensureClinicModules } from "@/features/modules/services/module-access";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";

type FixtureState = {
  baselinePlatformMetrics: {
    activeClinics: number;
    trialClinics: number;
    pastDueClinics: number;
    monthlySaasRevenue: number;
    membershipEnabledClinicCount: number;
    crmEnabledClinicCount: number;
  };
  alphaClinic: {
    id: string;
    brandName: string | null;
    name: string;
  };
  betaClinic: {
    id: string;
  };
  gammaClinic: {
    id: string;
  };
  alphaUser: CurrentAppUser;
  betaUser: CurrentAppUser;
  alphaOwnerUser: CurrentAppUser;
  workspaceAdminUser: CurrentAppUser;
  alphaPatientId: string;
  betaPatientId: string;
  betaInactivePatientId: string;
  alphaPlanId: string;
  betaPlanId: string;
  alphaBenefitId: string;
  betaBenefitId: string;
  alphaSubscriptionId: string;
  betaSubscriptionId: string;
  alphaInvoiceId: string;
  betaInvoiceId: string;
  alphaPatientContractId: string;
  betaPatientContractId: string;
  alphaInviteId: string;
  betaInviteId: string;
};

let fixtures: FixtureState;

async function getPlatformBaseline() {
  const [
    activeClinics,
    trialClinics,
    pastDueClinics,
    monthlySaasRevenue,
    moduleCounts,
  ] = await Promise.all([
    prisma.clinic.count({
      where: {
        status: ClinicStatus.ACTIVE,
      },
    }),
    prisma.clinicSubscription.count({
      where: {
        status:
          ClinicSubscriptionStatus.TRIAL,
      },
    }),
    prisma.clinicSubscription.count({
      where: {
        status:
          ClinicSubscriptionStatus.PAST_DUE,
      },
    }),
    prisma.clinicInvoice.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ),
        },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.module.findMany({
      select: {
        key: true,
        _count: {
          select: {
            clinicModules: {
              where: {
                status:
                  ModuleStatus.ENABLED,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    activeClinics,
    trialClinics,
    pastDueClinics,
    monthlySaasRevenue:
      monthlySaasRevenue._sum.amount ??
      0,
    membershipEnabledClinicCount:
      moduleCounts.find(
        (moduleCount) =>
          moduleCount.key ===
          ModuleKey.MEMBERSHIP
      )?._count.clinicModules ?? 0,
    crmEnabledClinicCount:
      moduleCounts.find(
        (moduleCount) =>
          moduleCount.key ===
          ModuleKey.CRM
      )?._count.clinicModules ?? 0,
  };
}

async function cleanupFixtures() {
  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: [
            "clinic-alpha",
            "clinic-beta",
            "clinic-gamma",
          ],
        },
      },
      select: {
        id: true,
      },
    });
  const clinicIds = clinics.map(
    (clinic) => clinic.id
  );

  if (clinicIds.length === 0) {
    return;
  }

  await prisma.$transaction([
    prisma.auditLog.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.userInvite.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.patientContractAcceptance.deleteMany({
      where: {
        patientContract: {
          clinicId: {
            in: clinicIds,
          },
        },
      },
    }),
    prisma.clinicContractFile.deleteMany({
      where: {
        clinicContract: {
          clinicId: {
            in: clinicIds,
          },
        },
      },
    }),
    prisma.patientPayment.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicPayment.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.patientInvoice.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicInvoice.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.patientContract.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicContract.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.contractTemplate.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.benefitUsage.deleteMany({
      where: {
        subscription: {
          patient: {
            clinicId: {
              in: clinicIds,
            },
          },
        },
      },
    }),
    prisma.subscription.deleteMany({
      where: {
        patient: {
          clinicId: {
            in: clinicIds,
          },
        },
      },
    }),
    prisma.membershipBenefit.deleteMany({
      where: {
        membershipPlan: {
          clinicId: {
            in: clinicIds,
          },
        },
      },
    }),
    prisma.membershipPlan.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.patient.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicModule.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicSubscription.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.appUser.deleteMany({
      where: {
        OR: [
          {
            clinicId: {
              in: clinicIds,
            },
          },
          {
            email:
              "workspace.admin@test.local",
          },
        ],
      },
    }),
    prisma.clinic.deleteMany({
      where: {
        id: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicBillingPlan.deleteMany({
      where: {
        name:
          "Tenant Regression SaaS",
      },
    }),
  ]);
}

async function seedFixtures(): Promise<FixtureState> {
  const baselinePlatformMetrics =
    await getPlatformBaseline();
  const [
    alphaClinic,
    betaClinic,
    gammaClinic,
  ] =
    await Promise.all([
      prisma.clinic.create({
        data: {
          name: "Clinic Alpha",
          brandName: "Alpha",
          slug: "clinic-alpha",
          document: "11.111.111/0001-11",
          email: "alpha@clinic.test",
          phone: "11111111111",
          zipCode: "01000-000",
          city: "Sao Paulo",
          state: "SP",
          address: "Rua Alpha, 1",
          status: ClinicStatus.ACTIVE,
        },
      }),
      prisma.clinic.create({
        data: {
          name: "Clinic Beta",
          brandName: "Beta",
          slug: "clinic-beta",
          document: "22.222.222/0001-22",
          email: "beta@clinic.test",
          phone: "22222222222",
          zipCode: "02000-000",
          city: "Rio de Janeiro",
          state: "RJ",
          address: "Rua Beta, 2",
          status: ClinicStatus.ACTIVE,
        },
      }),
      prisma.clinic.create({
        data: {
          name: "Clinic Gamma",
          brandName: "Gamma",
          slug: "clinic-gamma",
          document: "33.333.333/0001-33",
          email: "gamma@clinic.test",
          phone: "33333333333",
          zipCode: "03000-000",
          city: "Belo Horizonte",
          state: "MG",
          address: "Rua Gamma, 3",
          status: ClinicStatus.ACTIVE,
        },
      }),
    ]);

  const [
    alphaOwnerRecord,
    alphaUserRecord,
    betaUserRecord,
    workspaceAdminRecord,
  ] =
    await Promise.all([
      prisma.appUser.create({
        data: {
          clinicId: alphaClinic.id,
          name: "Owner Alpha",
          email: "owner.alpha@test.local",
          role: AppUserRole.OWNER,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: alphaClinic.id,
          name: "User Alpha",
          email: "alpha.user@test.local",
          role: AppUserRole.ADMIN,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: betaClinic.id,
          name: "User Beta",
          email: "beta.user@test.local",
          role: AppUserRole.ADMIN,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: null,
          name: "Workspace Admin",
          email:
            "workspace.admin@test.local",
          role: AppUserRole.ADMIN,
        },
      }),
    ]);

  const [alphaPlan, betaPlan] =
    await Promise.all([
      prisma.membershipPlan.create({
        data: {
          clinicId: alphaClinic.id,
          name: "Alpha Prime",
          description:
            "Alpha clinic plan",
          monthlyPrice: 120,
          annualPrice: 1200,
          active: true,
        },
      }),
      prisma.membershipPlan.create({
        data: {
          clinicId: betaClinic.id,
          name: "Beta Prime",
          description:
            "Beta clinic plan",
          monthlyPrice: 90,
          annualPrice: 900,
          active: true,
        },
      }),
    ]);

  const [alphaBenefit, betaBenefit] =
    await Promise.all([
      prisma.membershipBenefit.create({
        data: {
          membershipPlanId:
            alphaPlan.id,
          type: "LIMITED",
          title:
            "Alpha Consultation",
          active: true,
          usageLimit: 2,
          resetPeriod:
            ResetPeriod.MONTHLY,
        },
      }),
      prisma.membershipBenefit.create({
        data: {
          membershipPlanId:
            betaPlan.id,
          type: "LIMITED",
          title:
            "Beta Consultation",
          active: true,
          usageLimit: 3,
          resetPeriod:
            ResetPeriod.MONTHLY,
        },
      }),
    ]);

  const [
    alphaPatient,
    betaPatient,
    betaInactivePatient,
  ] = await Promise.all([
    prisma.patient.create({
      data: {
        clinicId: alphaClinic.id,
        fullName: "Alice Alpha",
        email: "alice@alpha.test",
        phone: "11911111111",
        birthDate: new Date(
          "1991-01-01T00:00:00.000Z"
        ),
        document: "529.982.247-25",
        zipCode: "01000-000",
        city: "Sao Paulo",
        state: "SP",
        address: "Rua Alpha, 10",
        status: PatientStatus.ACTIVE,
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: betaClinic.id,
        fullName: "Bob Beta",
        email: "bob@beta.test",
        phone: "21922222222",
        birthDate: new Date(
          "1992-02-02T00:00:00.000Z"
        ),
        document: "111.444.777-35",
        zipCode: "02000-000",
        city: "Rio de Janeiro",
        state: "RJ",
        address: "Rua Beta, 20",
        status: PatientStatus.ACTIVE,
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: betaClinic.id,
        fullName:
          "Beatrice Beta Archive",
        email:
          "beatrice@beta.test",
        phone: "21933333333",
        birthDate: new Date(
          "1988-03-03T00:00:00.000Z"
        ),
        document: "123.456.789-09",
        zipCode: "02000-001",
        city: "Rio de Janeiro",
        state: "RJ",
        address: "Rua Beta, 21",
        status: PatientStatus.INACTIVE,
        inactiveReason:
          "Archived for tenant delete regression test.",
      },
    }),
  ]);

  const [alphaInvite, betaInvite] =
    await Promise.all([
      prisma.userInvite.create({
        data: {
          clinicId: alphaClinic.id,
          email: "invite.alpha@test.local",
          role: AppUserRole.STAFF,
          tokenHash:
            "tenant-alpha-invite",
          expiresAt: new Date(
            Date.now() +
              1000 * 60 * 60 * 24
          ),
          invitedByUserId:
            alphaOwnerRecord.id,
        },
      }),
      prisma.userInvite.create({
        data: {
          clinicId: betaClinic.id,
          email: "invite.beta@test.local",
          role: AppUserRole.STAFF,
          tokenHash:
            "tenant-beta-invite",
          expiresAt: new Date(
            Date.now() +
              1000 * 60 * 60 * 24
          ),
          invitedByUserId:
            betaUserRecord.id,
        },
      }),
    ]);

  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(
    inThirtyDays.getDate() + 30
  );

  const [alphaSubscription, betaSubscription] =
    await Promise.all([
      prisma.subscription.create({
        data: {
          patientId: alphaPatient.id,
          membershipPlanId:
            alphaPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: now,
          expiresAt: inThirtyDays,
        },
      }),
      prisma.subscription.create({
        data: {
          patientId: betaPatient.id,
          membershipPlanId:
            betaPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: now,
          expiresAt: inThirtyDays,
        },
      }),
    ]);

  await Promise.all([
    prisma.benefitUsage.create({
      data: {
        subscriptionId:
          alphaSubscription.id,
        membershipBenefitId:
          alphaBenefit.id,
        quantity: 1,
        usedBy: "Alpha Frontdesk",
      },
    }),
    prisma.benefitUsage.create({
      data: {
        subscriptionId:
          betaSubscription.id,
        membershipBenefitId:
          betaBenefit.id,
        quantity: 1,
        usedBy: "Beta Frontdesk",
      },
    }),
  ]);

  const [alphaInvoice, betaInvoice] =
    await Promise.all([
      prisma.patientInvoice.create({
        data: {
          clinicId: alphaClinic.id,
          patientId: alphaPatient.id,
          subscriptionId:
            alphaSubscription.id,
          status: PaymentStatus.PAID,
          billingCycle:
            BillingCycle.MONTHLY,
          amount: 120,
          dueDate: now,
          paidAt: now,
          description:
            "Alpha membership invoice",
        },
      }),
      prisma.patientInvoice.create({
        data: {
          clinicId: betaClinic.id,
          patientId: betaPatient.id,
          subscriptionId:
            betaSubscription.id,
          status: PaymentStatus.PENDING,
          billingCycle:
            BillingCycle.MONTHLY,
          amount: 90,
          dueDate: now,
          description:
            "Beta membership invoice",
        },
      }),
    ]);

  const billingPlan =
    await prisma.clinicBillingPlan.create({
      data: {
        name:
          "Tenant Regression SaaS",
        monthlyPrice: 249,
        annualPrice: 2490,
        trialDays: 14,
        active: true,
      },
    });

  const [
    alphaClinicSubscription,
    betaClinicSubscription,
    gammaClinicSubscription,
  ] = await Promise.all([
    prisma.clinicSubscription.create({
      data: {
        clinicId: alphaClinic.id,
        clinicBillingPlanId:
          billingPlan.id,
        status:
          ClinicSubscriptionStatus.ACTIVE,
        startedAt: now,
        expiresAt: inThirtyDays,
      },
    }),
    prisma.clinicSubscription.create({
      data: {
        clinicId: betaClinic.id,
        clinicBillingPlanId:
          billingPlan.id,
        status:
          ClinicSubscriptionStatus.PAST_DUE,
        startedAt: now,
        expiresAt: inThirtyDays,
      },
    }),
    prisma.clinicSubscription.create({
      data: {
        clinicId: gammaClinic.id,
        clinicBillingPlanId:
          billingPlan.id,
        status:
          ClinicSubscriptionStatus.TRIAL,
        startedAt: now,
        expiresAt: inThirtyDays,
      },
    }),
  ]);

  await Promise.all([
    ensureClinicModules(alphaClinic.id),
    ensureClinicModules(betaClinic.id),
    ensureClinicModules(gammaClinic.id),
  ]);

  await Promise.all([
    prisma.clinicInvoice.create({
      data: {
        clinicId: alphaClinic.id,
        clinicSubscriptionId:
          alphaClinicSubscription.id,
        status: PaymentStatus.PAID,
        amount: 249,
        dueDate: now,
        paidAt: now,
        description:
          "Alpha SaaS invoice",
      },
    }),
    prisma.clinicInvoice.create({
      data: {
        clinicId: betaClinic.id,
        clinicSubscriptionId:
          betaClinicSubscription.id,
        status: PaymentStatus.PENDING,
        amount: 249,
        dueDate: now,
        description:
          "Beta SaaS invoice",
      },
    }),
    prisma.clinicInvoice.create({
      data: {
        clinicId: gammaClinic.id,
        clinicSubscriptionId:
          gammaClinicSubscription.id,
        status: PaymentStatus.PENDING,
        amount: 249,
        dueDate: now,
        description:
          "Gamma SaaS invoice",
      },
    }),
  ]);

  const [
    alphaTemplate,
    betaTemplate,
  ] = await Promise.all([
    prisma.contractTemplate.create({
      data: {
        clinicId: alphaClinic.id,
        type:
          ContractType.PATIENT_MEMBERSHIP,
        title:
          "Alpha Membership Contract",
        content: "Alpha contract",
        active: true,
      },
    }),
    prisma.contractTemplate.create({
      data: {
        clinicId: betaClinic.id,
        type:
          ContractType.PATIENT_MEMBERSHIP,
        title:
          "Beta Membership Contract",
        content: "Beta contract",
        active: true,
      },
    }),
  ]);

  const [
    alphaPatientContract,
    betaPatientContract,
  ] = await Promise.all([
    prisma.patientContract.create({
      data: {
        clinicId: alphaClinic.id,
        patientId: alphaPatient.id,
        subscriptionId:
          alphaSubscription.id,
        templateId:
          alphaTemplate.id,
        title:
          "Alpha Patient Contract",
        contentSnapshot:
          "Alpha patient contract snapshot",
        status:
          PatientContractStatus.ACTIVE,
      },
    }),
    prisma.patientContract.create({
      data: {
        clinicId: betaClinic.id,
        patientId: betaPatient.id,
        subscriptionId:
          betaSubscription.id,
        templateId:
          betaTemplate.id,
        title:
          "Beta Patient Contract",
        contentSnapshot:
          "Beta patient contract snapshot",
        status:
          PatientContractStatus.ACTIVE,
      },
    }),
  ]);

  await Promise.all([
    prisma.clinicContract.create({
      data: {
        clinicId: alphaClinic.id,
        title:
          "Alpha Clinic Contract",
        contentSnapshot:
          "Alpha clinic contract snapshot",
        status:
          ClinicContractStatus.ACTIVE,
        effectiveAt: now,
      },
    }),
    prisma.clinicContract.create({
      data: {
        clinicId: betaClinic.id,
        title:
          "Beta Clinic Contract",
        contentSnapshot:
          "Beta clinic contract snapshot",
        status:
          ClinicContractStatus.ACTIVE,
        effectiveAt: now,
      },
    }),
  ]);

  return {
    baselinePlatformMetrics,
    alphaClinic: {
      id: alphaClinic.id,
      brandName:
        alphaClinic.brandName,
      name: alphaClinic.name,
    },
    betaClinic: {
      id: betaClinic.id,
    },
    gammaClinic: {
      id: gammaClinic.id,
    },
    alphaUser: {
      id: alphaUserRecord.id,
      clinicId: alphaClinic.id,
      name: alphaUserRecord.name,
      email: alphaUserRecord.email,
      role:
        alphaUserRecord.role,
    },
    alphaOwnerUser: {
      id: alphaOwnerRecord.id,
      clinicId: alphaClinic.id,
      name: alphaOwnerRecord.name,
      email: alphaOwnerRecord.email,
      role:
        alphaOwnerRecord.role,
    },
    betaUser: {
      id: betaUserRecord.id,
      clinicId: betaClinic.id,
      name: betaUserRecord.name,
      email: betaUserRecord.email,
      role: betaUserRecord.role,
    },
    workspaceAdminUser: {
      id: workspaceAdminRecord.id,
      clinicId: null,
      name: workspaceAdminRecord.name,
      email: workspaceAdminRecord.email,
      role:
        workspaceAdminRecord.role,
    },
    alphaPatientId: alphaPatient.id,
    betaPatientId: betaPatient.id,
    betaInactivePatientId:
      betaInactivePatient.id,
    alphaPlanId: alphaPlan.id,
    betaPlanId: betaPlan.id,
    alphaBenefitId: alphaBenefit.id,
    betaBenefitId: betaBenefit.id,
    alphaSubscriptionId:
      alphaSubscription.id,
    betaSubscriptionId:
      betaSubscription.id,
    alphaInvoiceId:
      alphaInvoice.id,
    betaInvoiceId: betaInvoice.id,
    alphaPatientContractId:
      alphaPatientContract.id,
    betaPatientContractId:
      betaPatientContract.id,
    alphaInviteId: alphaInvite.id,
    betaInviteId: betaInvite.id,
  };
}

function asUser(user: CurrentAppUser) {
  setCurrentAppUserForTests(user);
}

async function runCase(
  name: string,
  callback: () => Promise<void>
) {
  await callback();
  console.log(`PASS ${name}`);
}

async function main() {
  await cleanupFixtures();
  fixtures = await seedFixtures();

  try {
    await runCase(
      "Alpha users cannot list Beta tenant data",
      async () => {
        asUser(fixtures.alphaUser);

        const [
          patients,
          plans,
          benefits,
          subscriptions,
          usageHistory,
          benefitBalance,
          billingOverview,
          contractsOverview,
          usersOverview,
          profile,
        ] = await Promise.all([
          getPatients(),
          getMembershipPlans(),
          getMembershipBenefits(),
          getSubscriptions(),
          getBenefitUsageHistory(),
          getPatientBenefitBalance(),
          getBillingOverview(),
          getContractsOverview(),
          getClinicUsersOverview(),
          getPatientProfile(
            fixtures.alphaPatientId
          ),
        ]);

        assert.deepEqual(
          patients.map(
            (patient) => patient.id
          ),
          [fixtures.alphaPatientId]
        );
        assert.deepEqual(
          plans.map((plan) => plan.id),
          [fixtures.alphaPlanId]
        );
        assert.deepEqual(
          benefits.map(
            (benefit) => benefit.id
          ),
          [fixtures.alphaBenefitId]
        );
        assert.deepEqual(
          subscriptions.map(
            (subscription) =>
              subscription.id
          ),
          [fixtures.alphaSubscriptionId]
        );
        assert.deepEqual(
          usageHistory.map(
            (entry) =>
              entry.subscription.id
          ),
          [fixtures.alphaSubscriptionId]
        );
        assert.deepEqual(
          benefitBalance.map(
            (entry) =>
              entry.subscriptionId
          ),
          [fixtures.alphaSubscriptionId]
        );
        assert.deepEqual(
          billingOverview.patientInvoices.map(
            (invoice) => invoice.id
          ),
          [fixtures.alphaInvoiceId]
        );
        assert.equal(
          billingOverview.clinicInvoices.length,
          1
        );
        assert.deepEqual(
          contractsOverview.patientContracts.map(
            (contract) =>
              contract.id
          ),
          [
            fixtures
              .alphaPatientContractId,
          ]
        );
        assert.equal(
          contractsOverview
            .clinicContracts.length,
          1
        );
        assert.deepEqual(
          usersOverview.users
            .map((user) => user.email)
            .sort(),
          [
            "alpha.user@test.local",
            "owner.alpha@test.local",
          ].sort()
        );
        assert.deepEqual(
          usersOverview.invites.map(
            (invite) => invite.id
          ),
          [fixtures.alphaInviteId]
        );
        assert.equal(
          profile.patient.id,
          fixtures.alphaPatientId
        );
        assert.ok(
          profile.timeline.every(
            (entry) =>
              entry.entityId !==
                fixtures.betaPatientId &&
              entry.entityId !==
                fixtures.betaSubscriptionId &&
              entry.entityId !==
                fixtures.betaInvoiceId &&
              entry.entityId !==
                fixtures.betaPatientContractId
          )
        );
      }
    );

    await runCase(
      "Alpha owner invite stays scoped to Alpha clinic",
      async () => {
        asUser(fixtures.alphaOwnerUser);

        const formData = new FormData();
        formData.set(
          "email",
          "scoped.alpha.invite@test.local"
        );
        formData.set("role", "STAFF");

        await createUserInviteAction(
          formData
        );

        const createdInvite =
          await prisma.userInvite.findFirstOrThrow(
            {
              where: {
                email:
                  "scoped.alpha.invite@test.local",
              },
            }
          );

        assert.equal(
          createdInvite.clinicId,
          fixtures.alphaClinic.id
        );

        const alphaOverview =
          await getClinicUsersOverview();

        assert.ok(
          alphaOverview.invites.some(
            (invite) =>
              invite.id ===
              createdInvite.id
          )
        );

        asUser(fixtures.betaUser);

        const betaOverview =
          await getClinicUsersOverview();

        assert.ok(
          betaOverview.invites.every(
            (invite) =>
              invite.id !==
              createdInvite.id
          )
        );
      }
    );

    await runCase(
      "Alpha cannot access Beta patient detail",
      async () => {
        asUser(fixtures.alphaUser);

        await assert.rejects(
          () =>
            getPatientProfile(
              fixtures.betaPatientId
            ),
          /Patient not found\./
        );
      }
    );

    await runCase(
      "Dashboard metrics are scoped to Alpha only",
      async () => {
        asUser(fixtures.alphaUser);

        const metrics =
          await getDashboardMetrics();

        assert.equal(
          metrics.clinicName,
          fixtures.alphaClinic
            .brandName ??
            fixtures.alphaClinic.name
        );
        assert.equal(
          metrics.activePatients,
          1
        );
        assert.equal(
          metrics.activeSubscriptionsCount,
          1
        );
        assert.equal(
          metrics.overduePatientInvoices,
          0
        );
        assert.equal(
          metrics.monthlyPatientRevenue,
          120
        );
        assert.equal(
          metrics.activePlansCount,
          1
        );
        assert.equal(
          metrics.benefitUsageEvents,
          1
        );
        assert.equal(
          metrics.platformMetrics,
          null
        );
      }
    );

    await runCase(
      "Platform dashboard metrics stay production-relevant and scoped to real SaaS data",
      async () => {
        asUser(
          fixtures.workspaceAdminUser
        );

        const [
          expectedActiveClinics,
          expectedTrialClinics,
          expectedPastDueClinics,
          expectedMonthlySaasRevenue,
        ] = await Promise.all([
          prisma.clinic.count({
            where: {
              status: ClinicStatus.ACTIVE,
            },
          }),
          prisma.clinicSubscription.count({
            where: {
              status:
                ClinicSubscriptionStatus.TRIAL,
            },
          }),
          prisma.clinicSubscription.count({
            where: {
              status:
                ClinicSubscriptionStatus.PAST_DUE,
            },
          }),
          prisma.clinicInvoice.aggregate({
            where: {
              status: PaymentStatus.PAID,
              paidAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        const metrics =
          await getDashboardMetrics();

        assert.equal(
          metrics.scope,
          "platform"
        );
        assert.equal(
          metrics.platformMetrics
            ?.activeClinics,
          expectedActiveClinics
        );
        assert.equal(
          metrics.platformMetrics
            ?.trialClinics,
          expectedTrialClinics
        );
        assert.equal(
          metrics.platformMetrics
            ?.pastDueClinics,
          expectedPastDueClinics
        );
        assert.equal(
          metrics.platformMetrics
            ?.monthlySaasRevenue,
          expectedMonthlySaasRevenue
            ._sum.amount ?? 0
        );

        const membershipModuleMetric =
          metrics.platformMetrics?.activeModuleCounts.find(
            (moduleMetric) =>
              moduleMetric.key ===
              "MEMBERSHIP"
          );
        const crmModuleMetric =
          metrics.platformMetrics?.activeModuleCounts.find(
            (moduleMetric) =>
              moduleMetric.key ===
              "CRM"
          );

        assert.equal(
          membershipModuleMetric?.enabledClinicCount,
          fixtures
            .baselinePlatformMetrics
            .membershipEnabledClinicCount +
            2
        );
        assert.equal(
          crmModuleMetric?.enabledClinicCount,
          fixtures
            .baselinePlatformMetrics
            .crmEnabledClinicCount
        );
      }
    );

    await runCase(
      "Billing and contracts stay scoped to the current clinic",
      async () => {
        asUser(fixtures.alphaUser);

        const [
          billingOverview,
          contractsOverview,
        ] = await Promise.all([
          getBillingOverview(),
          getContractsOverview(),
        ]);

        assert.ok(
          billingOverview.patientInvoices.every(
            (invoice) =>
              invoice.patient
                .fullName ===
              "Alice Alpha"
          )
        );
        assert.ok(
          billingOverview.clinicInvoices.every(
            (invoice) =>
              invoice.clinicId ===
              fixtures.alphaClinic.id
          )
        );
        assert.ok(
          contractsOverview.patientContracts.every(
            (contract) =>
              contract.patient
                .fullName ===
              "Alice Alpha"
          )
        );
        assert.ok(
          contractsOverview.clinicContracts.every(
            (contract) =>
              contract.clinicId ===
              fixtures.alphaClinic.id
          )
        );
      }
    );

    await runCase(
      "Alpha users cannot update Beta patient data",
      async () => {
        asUser(fixtures.alphaUser);

        await assert.rejects(
          () =>
            updatePatient(
              fixtures.betaPatientId,
              {
                fullName:
                  "Intrusion Attempt",
                email:
                  "intrusion@test.local",
                phone:
                  "11999999999",
                birthDate:
                  "1992-02-02",
                document:
                  "390.533.447-05",
                zipCode:
                  "01000-999",
                city: "Sao Paulo",
                state: "SP",
                address:
                  "Rua Teste, 999",
              }
            ),
          /Patient not found\./
        );
      }
    );

    await runCase(
      "Alpha users cannot delete Beta patient data",
      async () => {
        asUser(fixtures.alphaUser);

        await assert.rejects(
          () =>
            deletePatientPermanently(
              fixtures.betaInactivePatientId
            ),
          /Patient not found\./
        );
      }
    );

    await runCase(
      "Alpha users cannot mutate Beta billing records",
      async () => {
        asUser(fixtures.alphaUser);

        const formData = new FormData();
        formData.set(
          "invoiceId",
          fixtures.betaInvoiceId
        );

        await assert.rejects(
          () =>
            markPatientInvoiceOverdueAction(
              formData
            ),
          /permission|Patient invoice not found\./i
        );
      }
    );

    await runCase(
      "Alpha users cannot accept Beta contracts",
      async () => {
        asUser(fixtures.alphaUser);

        const formData = new FormData();
        formData.set(
          "contractId",
          fixtures.betaPatientContractId
        );

        await assert.rejects(
          () =>
            acceptPatientContractAction(
              formData
            ),
          /Patient contract not found\./
        );
      }
    );

    await runCase(
      "Alpha owners cannot update Beta clinic users",
      async () => {
        asUser(fixtures.alphaOwnerUser);

        const formData = new FormData();
        formData.set(
          "userId",
          fixtures.betaUser.id
        );
        formData.set(
          "role",
          "STAFF"
        );

        await assert.rejects(
          () =>
            updateClinicUserRoleAction(
              formData
            ),
          /User not found\./
        );
      }
    );
  } finally {
    clearCurrentAppUserForTests();
    await cleanupFixtures();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
