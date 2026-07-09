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
  AppUserStatus,
  ClinicStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  createOpaqueToken,
  hashOpaqueToken,
} from "@/lib/auth/session";
import { authenticateAppUser } from "@/features/auth/services/authenticate-app-user";
import { createAuthSession } from "@/features/auth/services/create-auth-session";
import { requestPasswordResetAction } from "@/features/auth/actions/request-password-reset";
import { createPasswordResetToken } from "@/features/auth/services/create-password-reset-token";
import { resetPasswordWithToken } from "@/features/auth/services/reset-password-with-token";
import { createClinicMasterUser } from "@/features/auth/services/clinic-master";
import { completeFirstAccessPassword } from "@/features/auth/services/complete-first-access-password";

const fixtureEmails = [
  "password-reset.user@test.local",
  "first-access.master@test.local",
];
const fixtureSlugs = [
  "auth-first-access-clinic",
];

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

async function cleanupFixtures() {
  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: fixtureSlugs,
        },
      },
      select: {
        id: true,
      },
    });
  const clinicIds = clinics.map(
    (clinic) => clinic.id
  );

  await prisma.authSession.deleteMany({
    where: {
      OR: [
        {
          appUser: {
            email: {
              in: fixtureEmails,
            },
          },
        },
        {
          appUser: {
            clinicId: {
              in: clinicIds,
            },
          },
        },
      ],
    },
  });

  await prisma.passwordResetToken.deleteMany({
    where: {
      appUser: {
        OR: [
          {
            email: {
              in: fixtureEmails,
            },
          },
          {
            clinicId: {
              in: clinicIds,
            },
          },
        ],
      },
    },
  });

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        {
          clinicId: {
            in: clinicIds,
          },
        },
        {
          actor: {
            contains:
              "first-access.master@test.local",
          },
        },
      ],
    },
  });

  await prisma.appUser.deleteMany({
    where: {
      OR: [
        {
          email: {
            in: fixtureEmails,
          },
        },
        {
          clinicId: {
            in: clinicIds,
          },
        },
      ],
    },
  });

  await prisma.clinic.deleteMany({
    where: {
      id: {
        in: clinicIds,
      },
    },
  });
}

async function seedFixtures() {
  const user =
    await prisma.appUser.create({
      data: {
        clinicId: null,
        name: "Password Reset User",
        email:
          "password-reset.user@test.local",
        role: AppUserRole.ADMIN,
        status: AppUserStatus.ACTIVE,
        passwordHash:
          (
            await import(
              "@/lib/auth/password"
            )
          ).hashPassword(
            "OldPassword123!"
          ),
      },
    });

  const clinic =
    await prisma.clinic.create({
      data: {
        name:
          "Auth First Access Clinic",
        brandName: "Auth First Access",
        slug: "auth-first-access-clinic",
        document:
          "45.723.174/0001-10",
        email:
          "first-access@clinic.test",
        phone: "11999990000",
        zipCode: "01000-000",
        city: "Sao Paulo",
        state: "SP",
        address:
          "Rua Primeiro Acesso, 10",
        status: ClinicStatus.ACTIVE,
      },
    });

  const clinicMaster =
    await createClinicMasterUser({
      clinicId: clinic.id,
      clinicName: clinic.name,
      email:
        "first-access.master@test.local",
      actorDisplayName:
        "System Seeder <system@test.local>",
      actorUserId: user.id,
    });

  return {
    user,
    clinic,
    clinicMaster,
  };
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
  const fixtures =
    await seedFixtures();

  try {
    await runCase(
      "request password reset is neutral for existing and unknown emails",
      async () => {
        const knownForm =
          new FormData();
        knownForm.set(
          "email",
          "password-reset.user@test.local"
        );

        await assert.rejects(
          () =>
            requestPasswordResetAction(
              knownForm
            ),
          (error) =>
            isRedirectErrorLike(error)
        );

        const knownTokens =
          await prisma.passwordResetToken.count({
            where: {
              appUserId:
                fixtures.user.id,
            },
          });

        const unknownForm =
          new FormData();
        unknownForm.set(
          "email",
          "ghost@test.local"
        );

        await assert.rejects(
          () =>
            requestPasswordResetAction(
              unknownForm
            ),
          (error) =>
            isRedirectErrorLike(error)
        );

        const totalTokens =
          await prisma.passwordResetToken.count();

        assert.equal(knownTokens, 1);
        assert.equal(totalTokens, 1);
      }
    );

    await runCase(
      "password reset token is single-use and clears active sessions",
      async () => {
        await createAuthSession(
          fixtures.user.id
        );

        const { token } =
          await createPasswordResetToken(
            fixtures.user.id
          );

        await resetPasswordWithToken(
          token,
          "NewPassword123!"
        );

        const [
          sessions,
          storedToken,
          oldAuth,
          newAuth,
          updatedUser,
        ] = await Promise.all([
          prisma.authSession.count({
            where: {
              appUserId:
                fixtures.user.id,
            },
          }),
          prisma.passwordResetToken.findUniqueOrThrow(
            {
              where: {
                tokenHash:
                  hashOpaqueToken(
                    token
                  ),
              },
            }
          ),
          authenticateAppUser({
            email:
              fixtures.user.email,
            password:
              "OldPassword123!",
          }),
          authenticateAppUser({
            email:
              fixtures.user.email,
            password:
              "NewPassword123!",
          }),
          prisma.appUser.findUniqueOrThrow(
            {
              where: {
                id: fixtures.user.id,
              },
            }
          ),
        ]);

        assert.equal(sessions, 0);
        assert.ok(storedToken.usedAt);
        assert.equal(oldAuth, null);
        assert.equal(
          newAuth?.email,
          fixtures.user.email
        );
        assert.equal(
          updatedUser.mustChangePassword,
          false
        );

        await assert.rejects(
          () =>
            resetPasswordWithToken(
              token,
              "AnotherPassword123!"
            ),
          /Invalid or expired/
        );
      }
    );

    await runCase(
      "expired password reset tokens are rejected",
      async () => {
        const rawToken =
          createOpaqueToken();

        await prisma.passwordResetToken.create(
          {
            data: {
              appUserId:
                fixtures.user.id,
              tokenHash:
                hashOpaqueToken(
                  rawToken
                ),
              expiresAt: new Date(
                Date.now() - 1000
              ),
            },
          }
        );

        await assert.rejects(
          () =>
            resetPasswordWithToken(
              rawToken,
              "ExpiredPassword123!"
            ),
          /Invalid or expired/
        );
      }
    );

    await runCase(
      "first access completion replaces temporary password and drops previous sessions",
      async () => {
        const masterRecord =
          await prisma.appUser.findUniqueOrThrow(
            {
              where: {
                email:
                  "first-access.master@test.local",
              },
            }
          );

        await createAuthSession(
          masterRecord.id
        );

        const beforeAuth =
          await authenticateAppUser({
            email:
              masterRecord.email,
            password:
              fixtures.clinicMaster
                .temporaryPassword,
          });

        assert.equal(
          beforeAuth?.email,
          masterRecord.email
        );

        await completeFirstAccessPassword({
          appUserId: masterRecord.id,
          clinicId:
            fixtures.clinic.id,
          email: masterRecord.email,
          actorDisplayName: `${masterRecord.name} <${masterRecord.email}>`,
          actorUserId: masterRecord.id,
          nextPassword:
            "FirstAccessDone123!",
        });

        const [
          refreshedMaster,
          remainingSessions,
          oldAuth,
          newAuth,
        ] = await Promise.all([
          prisma.appUser.findUniqueOrThrow(
            {
              where: {
                id: masterRecord.id,
              },
            }
          ),
          prisma.authSession.count({
            where: {
              appUserId:
                masterRecord.id,
            },
          }),
          authenticateAppUser({
            email:
              masterRecord.email,
            password:
              fixtures.clinicMaster
                .temporaryPassword,
          }),
          authenticateAppUser({
            email:
              masterRecord.email,
            password:
              "FirstAccessDone123!",
          }),
        ]);

        assert.equal(
          refreshedMaster.mustChangePassword,
          false
        );
        assert.equal(
          remainingSessions,
          0
        );
        assert.equal(oldAuth, null);
        assert.equal(
          newAuth?.email,
          masterRecord.email
        );
      }
    );
  } finally {
    await cleanupFixtures();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
