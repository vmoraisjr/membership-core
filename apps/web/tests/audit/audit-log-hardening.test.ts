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
  ContractType,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { createUserInviteAction } from "@/features/auth/actions/create-user-invite";
import { createAuthSession } from "@/features/auth/services/create-auth-session";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { ensureClinicBillingFoundation } from "@/features/billing/services/billing-foundation";
import { saveContractTemplateAction } from "@/features/contracts/actions/save-contract-template";
import { createSubscription } from "@/features/subscriptions/actions/create-subscription";
import { updateClinicUserRoleAction } from "@/features/users/actions/update-clinic-user-role";

type FixtureState = {
  clinicId: string;
  ownerUser: CurrentAppUser;
  adminUser: CurrentAppUser;
  patientId: string;
  planId: string;
};

let fixtures: FixtureState;

async function getClinicAuditLogs() {
  return prisma.auditLog.findMany({
    where: {
      clinicId: fixtures.clinicId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function cleanupFixtures() {
  const clinic =
    await prisma.clinic.findFirst({
      where: {
        slug: "audit-alpha",
      },
      select: {
        id: true,
      },
    });

  await prisma.appUser.deleteMany({
    where: {
      email:
        "workspace.audit@test.local",
    },
  });

  if (!clinic) {
    return;
  }

  await prisma.$transaction([
    prisma.auditLog.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.authSession.deleteMany({
      where: {
        appUser: {
          clinicId: clinic.id,
        },
      },
    }),
    prisma.userInvite.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.patientContractAcceptance.deleteMany({
      where: {
        patientContract: {
          clinicId: clinic.id,
        },
      },
    }),
    prisma.patientInvoice.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.clinicInvoice.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.patientContract.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.contractTemplate.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.subscription.deleteMany({
      where: {
        patient: {
          clinicId: clinic.id,
        },
      },
    }),
    prisma.membershipPlan.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.patient.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.clinicSubscription.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.appUser.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.clinic.deleteMany({
      where: {
        id: clinic.id,
      },
    }),
  ]);
}

async function seedFixtures(): Promise<FixtureState> {
  const clinic = await prisma.clinic.create({
    data: {
      name: "Audit Alpha",
      brandName: "Audit Alpha",
      slug: "audit-alpha",
      document: "77.777.777/0001-77",
      email: "audit@clinic.test",
      phone: "11777777777",
      zipCode: "07000-000",
      city: "Sao Paulo",
      state: "SP",
      address: "Rua Auditoria, 77",
      status: ClinicStatus.ACTIVE,
    },
  });

  const [ownerRecord, adminRecord] =
    await Promise.all([
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Audit Owner",
          email:
            "owner@audit-alpha.test",
          role: AppUserRole.OWNER,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Audit Admin",
          email:
            "admin@audit-alpha.test",
          role: AppUserRole.ADMIN,
        },
      }),
    ]);

  const patient =
    await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        fullName: "Audit Patient",
        email:
          "patient@audit-alpha.test",
        phone: "11988888888",
        birthDate: new Date(
          "1990-01-01T00:00:00.000Z"
        ),
        document: "777.777.777-77",
        zipCode: "07000-000",
        city: "Sao Paulo",
        state: "SP",
        address: "Rua Paciente, 7",
      },
    });

  const plan =
    await prisma.membershipPlan.create({
      data: {
        clinicId: clinic.id,
        name: "Audit Prime",
        monthlyPrice: 150,
        annualPrice: 1500,
        active: true,
      },
    });

  return {
    clinicId: clinic.id,
    ownerUser: {
      id: ownerRecord.id,
      clinicId: clinic.id,
      name: ownerRecord.name,
      email: ownerRecord.email,
      role: ownerRecord.role,
    },
    adminUser: {
      id: adminRecord.id,
      clinicId: clinic.id,
      name: adminRecord.name,
      email: adminRecord.email,
      role: adminRecord.role,
    },
    patientId: patient.id,
    planId: plan.id,
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
      "user invites generate audit records",
      async () => {
        asUser(fixtures.ownerUser);

        const formData =
          new FormData();
        formData.set(
          "email",
          "invite@audit-alpha.test"
        );
        formData.set("role", "STAFF");

        await createUserInviteAction(
          formData
        );

        const log = (
          await getClinicAuditLogs()
        ).find(
          (entry) =>
            entry.entity ===
              "USER_INVITE" &&
            entry.action === "CREATE"
        );

        assert.ok(log);
        assert.equal(
          log.entityLabel,
          "invite@audit-alpha.test"
        );
      }
    );

    await runCase(
      "role changes generate audit records",
      async () => {
        asUser(fixtures.ownerUser);

        const formData =
          new FormData();
        formData.set(
          "userId",
          fixtures.adminUser.id
        );
        formData.set("role", "STAFF");

        await updateClinicUserRoleAction(
          formData
        );

        const log = (
          await getClinicAuditLogs()
        ).find(
          (entry) =>
            entry.entity === "APP_USER" &&
            entry.action === "UPDATE" &&
            entry.entityId ===
              fixtures.adminUser.id
        );

        assert.ok(log);
        assert.deepEqual(log.metadata, {
          previousRole: "ADMIN",
          nextRole: "STAFF",
          targetStatus: "ACTIVE",
        });
      }
    );

    await runCase(
      "auth session creation logs login events",
      async () => {
        asUser(fixtures.ownerUser);

        await createAuthSession(
          fixtures.ownerUser.id
        );

        const log = (
          await getClinicAuditLogs()
        ).find(
          (entry) =>
            entry.entity === "APP_USER" &&
            entry.action === "LOGIN" &&
            entry.entityId ===
              fixtures.ownerUser.id
        );

        assert.ok(log);
        assert.equal(
          log.entityLabel,
          fixtures.ownerUser.email
        );
      }
    );

    await runCase(
      "patient subscription invoices generate audit records",
      async () => {
        asUser(fixtures.ownerUser);

        await createSubscription({
          patientId:
            fixtures.patientId,
          membershipPlanId:
            fixtures.planId,
          startedAt: new Date(
            "2026-06-01T00:00:00.000Z"
          ).toISOString(),
          expiresAt: new Date(
            "2026-07-01T00:00:00.000Z"
          ).toISOString(),
        });

        const invoiceLog =
          await prisma.auditLog.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                entity:
                  "PATIENT_INVOICE",
                action: "CREATE",
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          );

        const subscriptionLog =
          await prisma.auditLog.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                entity:
                  "SUBSCRIPTION",
                action: "CREATE",
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          );

        assert.equal(
          invoiceLog.actor,
          `${fixtures.ownerUser.name} <${fixtures.ownerUser.email}>`
        );
        assert.equal(
          subscriptionLog.action,
          "CREATE"
        );
      }
    );

    await runCase(
      "clinic billing foundation invoices generate system audit records",
      async () => {
        clearCurrentAppUserForTests();

        await ensureClinicBillingFoundation(
          fixtures.clinicId
        );

        const log =
          await prisma.auditLog.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                entity:
                  "CLINIC_INVOICE",
                action: "CREATE",
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          );

        assert.equal(
          log.actor,
          "System"
        );
      }
    );

    await runCase(
      "contract template create and update are distinguished in the audit log",
      async () => {
        asUser(fixtures.ownerUser);

        const createForm =
          new FormData();
        createForm.set(
          "type",
          ContractType.PATIENT_MEMBERSHIP
        );
        createForm.set(
          "title",
          "Audit Membership Contract"
        );
        createForm.set(
          "content",
          "Initial contract content."
        );

        await saveContractTemplateAction(
          createForm
        );

        const createdTemplate =
          await prisma.contractTemplate.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                type:
                  ContractType.PATIENT_MEMBERSHIP,
                title:
                  "Audit Membership Contract",
              },
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
              },
            }
          );

        const updateForm =
          new FormData();
        updateForm.set(
          "templateId",
          createdTemplate.id
        );
        updateForm.set(
          "type",
          ContractType.PATIENT_MEMBERSHIP
        );
        updateForm.set(
          "title",
          "Audit Membership Contract v2"
        );
        updateForm.set(
          "content",
          "Updated contract content."
        );

        await saveContractTemplateAction(
          updateForm
        );

        const logs =
          await prisma.auditLog.findMany({
            where: {
              clinicId:
                fixtures.clinicId,
              entity:
                "CONTRACT_TEMPLATE",
            },
            orderBy: {
              createdAt: "asc",
            },
          });

        assert.equal(
          logs.at(-2)?.action,
          "CREATE"
        );
        assert.equal(
          logs.at(-1)?.action,
          "UPDATE"
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
