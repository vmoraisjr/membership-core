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
  AuditEntity,
  ClinicStatus,
  SupportThreadCategory,
  SupportThreadStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { createSupportThreadAction } from "@/features/messages/actions/create-support-thread";
import { addSupportMessageAction } from "@/features/messages/actions/add-support-message";
import { getSupportThreadsOverview } from "@/features/messages/services/get-support-threads-overview";
import { getAuditLogs } from "@/features/audit-log/services/get-audit-logs";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";

type FixtureState = {
  clinicId: string;
  secondClinicId: string;
  clinicUser: CurrentAppUser;
  secondClinicUser: CurrentAppUser;
  platformUser: CurrentAppUser;
};

let fixtures: FixtureState;

function isRedirectErrorLike(
  error: unknown
) {
  return Boolean(
    typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (
        error as { digest?: unknown }
      ).digest === "string" &&
      (
        error as { digest: string }
      ).digest.startsWith(
        "NEXT_REDIRECT"
      )
  );
}

async function expectRedirect(
  callback: () => Promise<unknown>
) {
  await assert.rejects(
    callback,
    (error) => isRedirectErrorLike(error)
  );
}

async function cleanupFixtures() {
  await prisma.appUser.deleteMany({
    where: {
      email:
        "platform.support@test.local",
    },
  });

  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: [
            "support-regression",
            "support-regression-2",
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
    prisma.supportMessage.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.supportThread.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
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
  const [
    clinic,
    secondClinic,
  ] = await prisma.$transaction([
    prisma.clinic.create({
      data: {
        name: "Support Regression Clinic",
        brandName: "Support Regression",
        slug: "support-regression",
        document: "44.444.444/0001-44",
        email: "support@company.test",
        phone: "11444444444",
        zipCode: "04000-000",
        city: "Sao Paulo",
        state: "SP",
        address: "Rua Suporte, 44",
        status: ClinicStatus.ACTIVE,
      },
    }),
    prisma.clinic.create({
      data: {
        name: "Support Regression Clinic 2",
        brandName:
          "Support Regression 2",
        slug: "support-regression-2",
        document: "55.555.555/0001-55",
        email: "support2@company.test",
        phone: "11555555555",
        zipCode: "04100-000",
        city: "Sao Paulo",
        state: "SP",
        address: "Rua Suporte, 55",
        status: ClinicStatus.ACTIVE,
      },
    }),
  ]);

  const [
    clinicUserRecord,
    secondClinicUserRecord,
    platformUserRecord,
  ] =
    await Promise.all([
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Company Owner",
          email:
            "owner@support-regression.test",
          role: AppUserRole.OWNER,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: secondClinic.id,
          name: "Second Company Owner",
          email:
            "owner@support-regression-2.test",
          role: AppUserRole.OWNER,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: null,
          name: "Platform Support",
          email:
            "platform.support@test.local",
          role: AppUserRole.ADMIN,
        },
      }),
    ]);

  return {
    clinicId: clinic.id,
    secondClinicId: secondClinic.id,
    clinicUser: {
      id: clinicUserRecord.id,
      clinicId: clinic.id,
      name: clinicUserRecord.name,
      email: clinicUserRecord.email,
      role: clinicUserRecord.role,
    },
    secondClinicUser: {
      id: secondClinicUserRecord.id,
      clinicId: secondClinic.id,
      name: secondClinicUserRecord.name,
      email:
        secondClinicUserRecord.email,
      role: secondClinicUserRecord.role,
    },
    platformUser: {
      id: platformUserRecord.id,
      clinicId: null,
      name: platformUserRecord.name,
      email: platformUserRecord.email,
      role: platformUserRecord.role,
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
      "platform and company share support threads without cross-tenant leakage",
      async () => {
        asUser(fixtures.clinicUser);

        const createThreadForm =
          new FormData();
        createThreadForm.set(
          "subject",
          "Erro ao faturar assinatura"
        );
        createThreadForm.set(
          "body",
          "A cobranca ficou inconsistente para um titular."
        );
        createThreadForm.set(
          "category",
          SupportThreadCategory.INCIDENT
        );

        await expectRedirect(() =>
          createSupportThreadAction(
            createThreadForm
          )
        );

        const createdThread =
          await prisma.supportThread.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                subject:
                  "Erro ao faturar assinatura",
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          );

        asUser(fixtures.platformUser);

        const platformOverview =
          await getSupportThreadsOverview({
            clinicId:
              fixtures.clinicId,
            threadId:
              createdThread.id,
          });

        assert.equal(
          platformOverview.selectedClinicId,
          fixtures.clinicId
        );
        assert.ok(
          platformOverview.threads.some(
            (thread) =>
              thread.id ===
              createdThread.id
          )
        );

        const replyForm =
          new FormData();
        replyForm.set(
          "threadId",
          createdThread.id
        );
        replyForm.set(
          "body",
          "Recebemos o chamado e vamos analisar a cobranca."
        );

        await expectRedirect(() =>
          addSupportMessageAction(
            replyForm
          )
        );

        const updatedThread =
          await prisma.supportThread.findUniqueOrThrow(
            {
              where: {
                id: createdThread.id,
              },
              include: {
                messages: {
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            }
          );

        assert.equal(
          updatedThread.status,
          SupportThreadStatus.WAITING_CLINIC
        );
        assert.equal(
          updatedThread.messages.length,
          2
        );
        assert.equal(
          updatedThread.messages[1]
            ?.authorScope,
          "PLATFORM"
        );

        asUser(fixtures.clinicUser);

        const clinicOverview =
          await getSupportThreadsOverview({
            threadId:
              createdThread.id,
          });

        assert.equal(
          clinicOverview.threads.length,
          1
        );
        assert.equal(
          clinicOverview.selectedThread?.id,
          createdThread.id
        );
        assert.equal(
          clinicOverview.selectedThread
            ?.messages.length,
          2
        );

        asUser(fixtures.secondClinicUser);

        const secondClinicOverview =
          await getSupportThreadsOverview({
            threadId:
              createdThread.id,
          });

        assert.equal(
          secondClinicOverview.threads.length,
          0
        );
        assert.equal(
          secondClinicOverview
            .selectedThread,
          null
        );

        const secondClinicReplyForm =
          new FormData();
        secondClinicReplyForm.set(
          "threadId",
          createdThread.id
        );
        secondClinicReplyForm.set(
          "body",
          "Tentativa indevida de responder chamado alheio."
        );

        await assert.rejects(
          () =>
            addSupportMessageAction(
              secondClinicReplyForm
            ),
          /Chamado não encontrado/
        );
      }
    );

    await runCase(
      "clinic audit stays isolated from platform-authored actions while platform can inspect all logs",
      async () => {
        const thread =
          await prisma.supportThread.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          );

        asUser(fixtures.clinicUser);

        const clinicAudit =
          await getAuditLogs();

        assert.ok(
          clinicAudit.logs.some(
            (log) =>
              log.entity ===
                AuditEntity.SUPPORT_THREAD &&
              log.entityId === thread.id
          )
        );
        assert.ok(
          clinicAudit.logs.every(
            (log) =>
              !(
                log.entity ===
                  AuditEntity.SUPPORT_MESSAGE &&
                log.actorUserId ===
                  fixtures.platformUser.id
              )
          )
        );

        asUser(fixtures.platformUser);

        const platformAudit =
          await getAuditLogs({
            clinicId:
              fixtures.clinicId,
          });

        assert.ok(
          platformAudit.logs.some(
            (log) =>
              log.entity ===
                AuditEntity.SUPPORT_THREAD &&
              log.entityId === thread.id
          )
        );
        assert.ok(
          platformAudit.logs.some(
            (log) =>
              log.entity ===
                AuditEntity.SUPPORT_MESSAGE &&
              log.actorUserId ===
                fixtures.platformUser.id
          )
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
