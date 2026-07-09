import "dotenv/config";

import assert from "node:assert/strict";

(
  process.env as Record<
    string,
    string | undefined
  >
).NODE_ENV = "test";
process.env.APP_LOG_LEVEL = "error";

import {
  AppUserRole,
  ClinicStatus,
  ClinicSubscriptionStatus,
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { disableClinicModuleAction } from "@/features/modules/actions/disable-clinic-module";
import { enableClinicModuleAction } from "@/features/modules/actions/enable-clinic-module";
import {
  ensureClinicModules,
  isModuleEnabled,
} from "@/features/modules/services/module-access";

type FixtureState = {
  alphaClinicId: string;
  betaClinicId: string;
  alphaOwner: CurrentAppUser;
  alphaStaff: CurrentAppUser;
  betaOwner: CurrentAppUser;
};

let fixtures: FixtureState;

async function cleanupFixtures() {
  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: [
            "modules-alpha",
            "modules-beta",
          ],
        },
      },
      select: {
        id: true,
      },
    });

  if (clinics.length === 0) {
    return;
  }

  const clinicIds = clinics.map(
    (clinic) => clinic.id
  );

  await prisma.$transaction([
    prisma.auditLog.deleteMany({
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
    prisma.clinicBillingPlan.deleteMany({
      where: {
        name: "Module Hardening SaaS",
      },
    }),
    prisma.appUser.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinic.deleteMany({
      where: {
        id: {
          in: clinicIds,
        },
      },
    }),
  ]);
}

async function seedFixtures(): Promise<FixtureState> {
  const [alphaClinic, betaClinic] =
    await Promise.all([
      prisma.clinic.create({
        data: {
          name: "Modules Alpha",
          brandName: "Alpha",
          slug: "modules-alpha",
          document:
            "10.000.000/0001-10",
          email:
            "alpha@modules.test",
          phone: "11111111111",
          zipCode: "01000-000",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Modules Alpha, 1",
          status: ClinicStatus.ACTIVE,
        },
      }),
      prisma.clinic.create({
        data: {
          name: "Modules Beta",
          brandName: "Beta",
          slug: "modules-beta",
          document:
            "20.000.000/0001-20",
          email:
            "beta@modules.test",
          phone: "22222222222",
          zipCode: "02000-000",
          city: "Rio de Janeiro",
          state: "RJ",
          address:
            "Rua Modules Beta, 2",
          status: ClinicStatus.ACTIVE,
        },
      }),
    ]);

  const [
    alphaOwner,
    alphaStaff,
    betaOwner,
    billingPlan,
  ] = await Promise.all([
    prisma.appUser.create({
      data: {
        clinicId: alphaClinic.id,
        name: "Alpha Owner",
        email:
          "owner@modules-alpha.test",
        role: AppUserRole.OWNER,
      },
    }),
    prisma.appUser.create({
      data: {
        clinicId: alphaClinic.id,
        name: "Alpha Staff",
        email:
          "staff@modules-alpha.test",
        role: AppUserRole.STAFF,
      },
    }),
    prisma.appUser.create({
      data: {
        clinicId: betaClinic.id,
        name: "Beta Owner",
        email:
          "owner@modules-beta.test",
        role: AppUserRole.OWNER,
      },
    }),
    prisma.clinicBillingPlan.create({
      data: {
        name: "Module Hardening SaaS",
        monthlyPrice: 249,
        annualPrice: 2490,
        trialDays: 14,
        active: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.clinicSubscription.create({
      data: {
        clinicId: alphaClinic.id,
        clinicBillingPlanId:
          billingPlan.id,
        status:
          ClinicSubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt: new Date(
          Date.now() +
            1000 * 60 * 60 * 24 * 30
        ),
      },
    }),
    prisma.clinicSubscription.create({
      data: {
        clinicId: betaClinic.id,
        clinicBillingPlanId:
          billingPlan.id,
        status:
          ClinicSubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt: new Date(
          Date.now() +
            1000 * 60 * 60 * 24 * 30
        ),
      },
    }),
  ]);

  await Promise.all([
    ensureClinicModules(alphaClinic.id),
    ensureClinicModules(betaClinic.id),
  ]);

  return {
    alphaClinicId: alphaClinic.id,
    betaClinicId: betaClinic.id,
    alphaOwner: {
      id: alphaOwner.id,
      clinicId: alphaClinic.id,
      name: alphaOwner.name,
      email: alphaOwner.email,
      role: alphaOwner.role,
    },
    alphaStaff: {
      id: alphaStaff.id,
      clinicId: alphaClinic.id,
      name: alphaStaff.name,
      email: alphaStaff.email,
      role: alphaStaff.role,
    },
    betaOwner: {
      id: betaOwner.id,
      clinicId: betaClinic.id,
      name: betaOwner.name,
      email: betaOwner.email,
      role: betaOwner.role,
    },
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
      "only membership is active in V1 even if future modules exist in data",
      async () => {
        const alphaModules =
          await ensureClinicModules(
            fixtures.alphaClinicId
          );

        const membership =
          alphaModules.find(
            (entry) =>
              entry.module.key ===
              ModuleKey.MEMBERSHIP
          );
        const crm = alphaModules.find(
          (entry) =>
            entry.module.key ===
            ModuleKey.CRM
        );
        const scheduling =
          alphaModules.find(
            (entry) =>
              entry.module.key ===
              ModuleKey.SCHEDULING
          );
        const communication =
          alphaModules.find(
            (entry) =>
              entry.module.key ===
              ModuleKey.COMMUNICATION
          );

        assert.equal(
          membership?.status,
          ModuleStatus.ENABLED
        );
        assert.equal(
          crm?.status,
          ModuleStatus.DISABLED
        );
        assert.equal(
          scheduling?.status,
          ModuleStatus.DISABLED
        );
        assert.equal(
          communication?.status,
          ModuleStatus.DISABLED
        );
        assert.equal(
          await isModuleEnabled(
            ModuleKey.MEMBERSHIP,
            fixtures.alphaClinicId
          ),
          true
        );
        assert.equal(
          await isModuleEnabled(
            ModuleKey.CRM,
            fixtures.alphaClinicId
          ),
          false
        );
      }
    );

    await runCase(
      "owners cannot enable future modules in V1",
      async () => {
        asUser(fixtures.alphaOwner);

        const form = new FormData();
        form.set(
          "moduleKey",
          ModuleKey.CRM
        );

        await assert.rejects(
          () =>
            enableClinicModuleAction(
              form
            ),
          /cannot be enabled in V1/i
        );

        const crm =
          await prisma.clinicModule.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
                module: {
                  key: ModuleKey.CRM,
                },
              },
            }
          );

        assert.equal(
          crm.status,
          ModuleStatus.DISABLED
        );
      }
    );

    await runCase(
      "membership cannot be disabled and future module state remains tenant safe",
      async () => {
        asUser(fixtures.alphaOwner);

        const membershipForm =
          new FormData();
        membershipForm.set(
          "moduleKey",
          ModuleKey.MEMBERSHIP
        );

        await assert.rejects(
          () =>
            disableClinicModuleAction(
              membershipForm
            ),
          /cannot be disabled in V1/i
        );

        const betaCrm =
          await prisma.clinicModule.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.betaClinicId,
                module: {
                  key: ModuleKey.CRM,
                },
              },
            }
          );

        const betaCrmForm =
          new FormData();
        betaCrmForm.set(
          "moduleKey",
          ModuleKey.CRM
        );

        asUser(fixtures.betaOwner);

        await assert.rejects(
          () =>
            enableClinicModuleAction(
              betaCrmForm
            ),
          /cannot be enabled in V1/i
        );

        const unchangedBetaCrm =
          await prisma.clinicModule.findUniqueOrThrow(
            {
              where: {
                id: betaCrm.id,
              },
            }
          );

        assert.equal(
          unchangedBetaCrm.status,
          ModuleStatus.DISABLED
        );
      }
    );

    await runCase(
      "staff cannot manage modules",
      async () => {
        asUser(fixtures.alphaStaff);

        const form = new FormData();
        form.set(
          "moduleKey",
          ModuleKey.CRM
        );

        await assert.rejects(
          () =>
            enableClinicModuleAction(
              form
            ),
          /permission/i
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
