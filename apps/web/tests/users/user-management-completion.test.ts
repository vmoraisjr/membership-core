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
import { createUserInviteAction } from "@/features/auth/actions/create-user-invite";
import { acceptUserInvite } from "@/features/auth/services/accept-user-invite";
import { authenticateAppUser } from "@/features/auth/services/authenticate-app-user";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { removeClinicUserAction } from "@/features/users/actions/remove-clinic-user";
import { revokeUserInviteAction } from "@/features/users/actions/revoke-user-invite";
import { updateClinicUserRoleAction } from "@/features/users/actions/update-clinic-user-role";
import { updateClinicUserStatusAction } from "@/features/users/actions/update-clinic-user-status";
import { getClinicUsersOverview } from "@/features/users/services/get-clinic-users-overview";

type FixtureState = {
  clinicId: string;
  ownerUser: CurrentAppUser;
  secondOwnerUser: CurrentAppUser;
  adminUser: CurrentAppUser;
};

let fixtures: FixtureState;

async function cleanupFixtures() {
  const clinic =
    await prisma.clinic.findFirst({
      where: {
        slug: "users-alpha",
      },
      select: {
        id: true,
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
      name: "Users Alpha",
      brandName: "Users",
      slug: "users-alpha",
      document: "88.888.888/0001-88",
      email: "users@clinic.test",
      phone: "11888888888",
      zipCode: "08000-000",
      city: "Sao Paulo",
      state: "SP",
      address: "Rua Users, 8",
      status: ClinicStatus.ACTIVE,
    },
  });

  const [owner, secondOwner, admin] =
    await Promise.all([
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Users Owner",
          email: "owner@users.test",
          role: AppUserRole.OWNER,
          status: AppUserStatus.ACTIVE,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Second Owner",
          email: "owner2@users.test",
          role: AppUserRole.OWNER,
          status: AppUserStatus.ACTIVE,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Users Admin",
          email: "admin@users.test",
          role: AppUserRole.ADMIN,
          status: AppUserStatus.ACTIVE,
        },
      }),
    ]);

  return {
    clinicId: clinic.id,
    ownerUser: {
      id: owner.id,
      clinicId: clinic.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      status: owner.status,
    },
    secondOwnerUser: {
      id: secondOwner.id,
      clinicId: clinic.id,
      name: secondOwner.name,
      email: secondOwner.email,
      role: secondOwner.role,
      status: secondOwner.status,
    },
    adminUser: {
      id: admin.id,
      clinicId: clinic.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
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
      "invite lifecycle covers pending accepted revoked and expired states",
      async () => {
        asUser(fixtures.ownerUser);

        const pendingForm =
          new FormData();
        pendingForm.set(
          "email",
          "pending@users.test"
        );
        pendingForm.set("role", "STAFF");

        const pendingInvite =
          await createUserInviteAction(
            pendingForm
          );

        const pendingInviteRecord =
          await prisma.userInvite.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                email:
                  "pending@users.test",
              },
            }
          );

        assert.equal(
          pendingInviteRecord.clinicId,
          fixtures.clinicId
        );

        const acceptedForm =
          new FormData();
        acceptedForm.set(
          "email",
          "accepted@users.test"
        );
        acceptedForm.set("role", "STAFF");

        const acceptedInvite =
          await createUserInviteAction(
            acceptedForm
          );

        const revokedForm =
          new FormData();
        revokedForm.set(
          "email",
          "revoked@users.test"
        );
        revokedForm.set("role", "STAFF");

        await createUserInviteAction(
          revokedForm
        );

        const revokedInviteRecord =
          await prisma.userInvite.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                email:
                  "revoked@users.test",
              },
            }
          );

        const revokeActionForm =
          new FormData();
        revokeActionForm.set(
          "inviteId",
          revokedInviteRecord.id
        );

        await revokeUserInviteAction(
          revokeActionForm
        );

        await acceptUserInvite(
          acceptedInvite.token,
          "Accepted User",
          "StrongPass123!"
        );

        const expiredInvite =
          await prisma.userInvite.create({
            data: {
              clinicId:
                fixtures.clinicId,
              email:
                "expired@users.test",
              role: AppUserRole.STAFF,
              tokenHash:
                "expired-token-hash",
              expiresAt: new Date(
                "2026-01-01T00:00:00.000Z"
              ),
              invitedByUserId:
                fixtures.ownerUser.id,
            },
          });

        await prisma.appUser.create({
          data: {
            clinicId:
              fixtures.clinicId,
            name: "expired@users.test",
            email:
              "expired@users.test",
            role: AppUserRole.STAFF,
            status:
              AppUserStatus.PENDING,
          },
        });

        assert.ok(expiredInvite.id);
        assert.ok(pendingInvite.token);

        const overview =
          await getClinicUsersOverview();

        assert.equal(
          overview.clinic.id,
          fixtures.clinicId
        );

        const statuses = new Map(
          overview.invites.map((invite) => [
            invite.email,
            invite.status,
          ])
        );

        assert.equal(
          statuses.get("pending@users.test"),
          "PENDING"
        );
        assert.equal(
          statuses.get("accepted@users.test"),
          "ACCEPTED"
        );
        assert.equal(
          statuses.get("revoked@users.test"),
          "REVOKED"
        );
        assert.equal(
          statuses.get("expired@users.test"),
          "EXPIRED"
        );
      }
    );

    await runCase(
      "invited users move from pending to active and inactive users cannot authenticate",
      async () => {
        asUser(fixtures.ownerUser);

        const inactiveUser =
          await prisma.appUser.findUniqueOrThrow(
            {
              where: {
                email:
                  "accepted@users.test",
              },
            }
          );

        assert.equal(
          inactiveUser.status,
          AppUserStatus.ACTIVE
        );

        const deactivateForm =
          new FormData();
        deactivateForm.set(
          "userId",
          inactiveUser.id
        );
        deactivateForm.set(
          "status",
          AppUserStatus.INACTIVE
        );

        await updateClinicUserStatusAction(
          deactivateForm
        );

        const blockedLogin =
          await authenticateAppUser({
            email:
              "accepted@users.test",
            password:
              "StrongPass123!",
          });

        assert.equal(
          blockedLogin,
          null
        );

        const reactivateForm =
          new FormData();
        reactivateForm.set(
          "userId",
          inactiveUser.id
        );
        reactivateForm.set(
          "status",
          AppUserStatus.ACTIVE
        );

        await updateClinicUserStatusAction(
          reactivateForm
        );

        const restoredLogin =
          await authenticateAppUser({
            email:
              "accepted@users.test",
            password:
              "StrongPass123!",
          });

        assert.equal(
          restoredLogin?.email,
          "accepted@users.test"
        );
      }
    );

    await runCase(
      "owner protection blocks removing demoting and deactivating the last active owner",
      async () => {
        asUser(fixtures.ownerUser);

        await prisma.appUser.update({
          where: {
            id: fixtures.secondOwnerUser.id,
          },
          data: {
            status:
              AppUserStatus.INACTIVE,
          },
        });

        const demoteForm =
          new FormData();
        demoteForm.set(
          "userId",
          fixtures.ownerUser.id
        );
        demoteForm.set("role", "ADMIN");

        await assert.rejects(
          () =>
            updateClinicUserRoleAction(
              demoteForm
            ),
          /own role|last active owner/i
        );

        const deactivateOwnerForm =
          new FormData();
        deactivateOwnerForm.set(
          "userId",
          fixtures.secondOwnerUser.id
        );
        deactivateOwnerForm.set(
          "status",
          AppUserStatus.ACTIVE
        );
        await updateClinicUserStatusAction(
          deactivateOwnerForm
        );

        asUser(fixtures.secondOwnerUser);

        const deactivateLastOwnerForm =
          new FormData();
        deactivateLastOwnerForm.set(
          "userId",
          fixtures.ownerUser.id
        );
        deactivateLastOwnerForm.set(
          "status",
          AppUserStatus.INACTIVE
        );

        await prisma.appUser.update({
          where: {
            id: fixtures.secondOwnerUser.id,
          },
          data: {
            status:
              AppUserStatus.INACTIVE,
          },
        });

        await assert.rejects(
          () =>
            updateClinicUserStatusAction(
              deactivateLastOwnerForm
            ),
          /last active owner/i
        );

        const removeForm =
          new FormData();
        removeForm.set(
          "userId",
          fixtures.ownerUser.id
        );

        await assert.rejects(
          () =>
            removeClinicUserAction(
              removeForm
            ),
          /last active owner/i
        );
      }
    );

    await runCase(
      "owners can remove non-owner users",
      async () => {
        asUser(fixtures.ownerUser);

        const removableUser =
          await prisma.appUser.findUniqueOrThrow(
            {
              where: {
                email:
                  "pending@users.test",
              },
            }
          );

        const removeForm =
          new FormData();
        removeForm.set(
          "userId",
          removableUser.id
        );

        await removeClinicUserAction(
          removeForm
        );

        const deletedUser =
          await prisma.appUser.findUnique({
            where: {
              id: removableUser.id,
            },
          });

        assert.equal(
          deletedUser,
          null
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
