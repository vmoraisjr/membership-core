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
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { authenticateAppUser } from "@/features/auth/services/authenticate-app-user";

const fixtureEmails = [
  "auth.active@test.local",
  "auth.inactive@test.local",
  "auth.future@test.local",
  "auth.expired@test.local",
];

async function cleanupFixtures() {
  await prisma.authSession.deleteMany({
    where: {
      appUser: {
        email: {
          in: fixtureEmails,
        },
      },
    },
  });

  await prisma.appUser.deleteMany({
    where: {
      email: {
        in: fixtureEmails,
      },
    },
  });
}

async function seedFixtures() {
  const now = Date.now();
  const passwordHash =
    hashPassword("StrongPass123!");

  await prisma.appUser.createMany({
    data: [
      {
        clinicId: null,
        name: "Active Auth",
        email:
          "auth.active@test.local",
        role: AppUserRole.ADMIN,
        status: AppUserStatus.ACTIVE,
        passwordHash,
      },
      {
        clinicId: null,
        name: "Inactive Auth",
        email:
          "auth.inactive@test.local",
        role: AppUserRole.ADMIN,
        status: AppUserStatus.INACTIVE,
        passwordHash,
      },
      {
        clinicId: null,
        name: "Future Auth",
        email:
          "auth.future@test.local",
        role: AppUserRole.ADMIN,
        status: AppUserStatus.ACTIVE,
        passwordHash,
        accessStartsAt: new Date(
          now + 1000 * 60 * 60
        ),
      },
      {
        clinicId: null,
        name: "Expired Auth",
        email:
          "auth.expired@test.local",
        role: AppUserRole.ADMIN,
        status: AppUserStatus.ACTIVE,
        passwordHash,
        accessEndsAt: new Date(
          now - 1000 * 60 * 60
        ),
      },
    ],
  });
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
  await seedFixtures();

  try {
    await runCase(
      "authenticateAppUser accepts valid active credentials",
      async () => {
        const user =
          await authenticateAppUser({
            email:
              " AUTH.ACTIVE@test.local ",
            password:
              "StrongPass123!",
          });

        assert.equal(
          user?.email,
          "auth.active@test.local"
        );
      }
    );

    await runCase(
      "authenticateAppUser rejects invalid passwords",
      async () => {
        const user =
          await authenticateAppUser({
            email:
              "auth.active@test.local",
            password:
              "WrongPass123!",
          });

        assert.equal(user, null);
      }
    );

    await runCase(
      "authenticateAppUser rejects inactive users",
      async () => {
        const user =
          await authenticateAppUser({
            email:
              "auth.inactive@test.local",
            password:
              "StrongPass123!",
          });

        assert.equal(user, null);
      }
    );

    await runCase(
      "authenticateAppUser rejects users outside future access window",
      async () => {
        const user =
          await authenticateAppUser({
            email:
              "auth.future@test.local",
            password:
              "StrongPass123!",
          });

        assert.equal(user, null);
      }
    );

    await runCase(
      "authenticateAppUser rejects users whose access expired",
      async () => {
        const user =
          await authenticateAppUser({
            email:
              "auth.expired@test.local",
            password:
              "StrongPass123!",
          });

        assert.equal(user, null);
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
