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
  clinicUser: CurrentAppUser;
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
  const clinic =
    await prisma.clinic.findFirst({
      where: {
        slug: "support-regression",
      },
      select: {
        id: true,
      },
    });

  await prisma.appUser.deleteMany({
    where: {
      email:
        "platform.support@test.local",
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
    prisma.supportMessage.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.supportThread.deleteMany({
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
  });

  const [clinicUserRecord, platformUserRecord] =
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
    clinicUser: {
      id: clinicUserRecord.id,
      clinicId: clinic.id,
      name: clinicUserRecord.name,
      email: clinicUserRecord.email,
      role: clinicUserRecord.role,
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
