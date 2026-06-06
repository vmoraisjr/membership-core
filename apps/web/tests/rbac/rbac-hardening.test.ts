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
  BillingCycle,
  ClinicStatus,
  ModuleKey,
  ModuleStatus,
  PatientContractStatus,
  PatientStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { createUserInviteAction } from "@/features/auth/actions/create-user-invite";
import { updateClinicUserRoleAction } from "@/features/users/actions/update-clinic-user-role";
import { markPatientInvoicePaidAction } from "@/features/billing/actions/mark-patient-invoice-paid";
import { acceptPatientContractAction } from "@/features/contracts/actions/accept-patient-contract";
import { deletePatientPermanently } from "@/features/patients/actions/delete-patient-permanently";
import {
  clearAdminBillingAccessForTests,
  hasPermission,
  setAdminBillingAccessForTests,
} from "@/features/rbac/permissions";
import { enableClinicModuleAction } from "@/features/modules/actions/enable-clinic-module";

type FixtureState = {
  clinicId: string;
  ownerUser: CurrentAppUser;
  adminUser: CurrentAppUser;
  staffUser: CurrentAppUser;
  inactivePatientId: string;
  invoiceId: string;
  contractId: string;
};

let fixtures: FixtureState;

async function cleanupFixtures() {
  const clinic =
    await prisma.clinic.findFirst({
      where: {
        slug: "clinic-rbac",
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
    prisma.patientPayment.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.patientInvoice.deleteMany({
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
    prisma.clinicModule.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.appUser.deleteMany({
      where: {
        clinicId: clinic.id,
      },
    }),
    prisma.clinic.delete({
      where: {
        id: clinic.id,
      },
    }),
  ]);
}

async function seedFixtures(): Promise<FixtureState> {
  const clinic = await prisma.clinic.create({
    data: {
      name: "Clinic RBAC",
      brandName: "RBAC",
      slug: "clinic-rbac",
      document: "44.444.444/0001-44",
      email: "rbac@clinic.test",
      phone: "11444444444",
      zipCode: "04000-000",
      city: "Sao Paulo",
      state: "SP",
      address: "Rua RBAC, 4",
      status: ClinicStatus.ACTIVE,
    },
  });

  const [ownerUser, adminUser, staffUser] =
    await Promise.all([
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Owner User",
          email: "owner@rbac.test",
          role: AppUserRole.OWNER,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Admin User",
          email: "admin@rbac.test",
          role: AppUserRole.ADMIN,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: clinic.id,
          name: "Staff User",
          email: "staff@rbac.test",
          role: AppUserRole.STAFF,
        },
      }),
    ]);

  const plan =
    await prisma.membershipPlan.create({
      data: {
        clinicId: clinic.id,
        name: "RBAC Prime",
        monthlyPrice: 130,
        active: true,
      },
    });

  const inactivePatient =
    await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        fullName: "Inactive Patient",
        email: "inactive@rbac.test",
        phone: "11900000000",
        birthDate: new Date(
          "1990-01-01T00:00:00.000Z"
        ),
        document: "444.444.444-44",
        zipCode: "04000-000",
        city: "Sao Paulo",
        state: "SP",
        address: "Rua Inativa, 10",
        status: PatientStatus.INACTIVE,
        inactiveReason:
          "Fixture for RBAC delete checks.",
      },
    });

  const activePatient =
    await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        fullName: "Active Patient",
        email: "active@rbac.test",
        phone: "11911111111",
        birthDate: new Date(
          "1991-01-01T00:00:00.000Z"
        ),
        document: "555.555.555-55",
        zipCode: "04000-001",
        city: "Sao Paulo",
        state: "SP",
        address: "Rua Ativa, 11",
        status: PatientStatus.ACTIVE,
      },
    });

  const subscription =
    await prisma.subscription.create({
      data: {
        patientId: activePatient.id,
        membershipPlanId: plan.id,
        startedAt: new Date(),
        status: SubscriptionStatus.ACTIVE,
      },
    });

  const invoice =
    await prisma.patientInvoice.create({
      data: {
        clinicId: clinic.id,
        patientId: activePatient.id,
        subscriptionId:
          subscription.id,
        status: PaymentStatus.PENDING,
        billingCycle:
          BillingCycle.MONTHLY,
        amount: 130,
        dueDate: new Date(),
        description:
          "RBAC fixture invoice",
      },
    });

  const template =
    await prisma.contractTemplate.create({
      data: {
        clinicId: clinic.id,
        type: "PATIENT_MEMBERSHIP",
        title:
          "RBAC Patient Contract",
        content:
          "RBAC patient contract content",
        active: true,
      },
    });

  const patientContract =
    await prisma.patientContract.create({
      data: {
        clinicId: clinic.id,
        patientId: activePatient.id,
        subscriptionId:
          subscription.id,
        templateId: template.id,
        title:
          "RBAC Patient Contract",
        contentSnapshot:
          "RBAC patient contract snapshot",
        status:
          PatientContractStatus.PENDING_ACCEPTANCE,
      },
    });

  const crmModule =
    await prisma.module.upsert({
      where: {
        key: ModuleKey.CRM,
      },
      update: {
        name: "CRM",
        description:
          "RBAC fixture module",
        isV1Active: false,
      },
      create: {
        key: ModuleKey.CRM,
        name: "CRM",
        description:
          "RBAC fixture module",
        isV1Active: false,
      },
    });

  await prisma.clinicModule.create({
    data: {
      clinicId: clinic.id,
      moduleId: crmModule.id,
      status: ModuleStatus.DISABLED,
      disabledAt: new Date(),
    },
  });

  return {
    clinicId: clinic.id,
    ownerUser: {
      id: ownerUser.id,
      clinicId: clinic.id,
      name: ownerUser.name,
      email: ownerUser.email,
      role: ownerUser.role,
    },
    adminUser: {
      id: adminUser.id,
      clinicId: clinic.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    },
    staffUser: {
      id: staffUser.id,
      clinicId: clinic.id,
      name: staffUser.name,
      email: staffUser.email,
      role: staffUser.role,
    },
    inactivePatientId:
      inactivePatient.id,
    invoiceId: invoice.id,
    contractId:
      patientContract.id,
  };
}

function asUser(user: CurrentAppUser) {
  setCurrentAppUserForTests(user);
}

async function runCase(
  name: string,
  callback: () => Promise<void> | void
) {
  await callback();
  console.log(`PASS ${name}`);
}

async function main() {
  await cleanupFixtures();
  fixtures = await seedFixtures();

  try {
    await runCase(
      "permission matrix reflects the hardened roles",
      () => {
        clearAdminBillingAccessForTests();

        assert.equal(
          hasPermission(
            "OWNER",
            "users",
            "manage"
          ),
          true
        );
        assert.equal(
          hasPermission(
            "ADMIN",
            "users",
            "manage"
          ),
          false
        );
        assert.equal(
          hasPermission(
            "STAFF",
            "patients",
            "deletePermanent"
          ),
          false
        );
        assert.equal(
          hasPermission(
            "STAFF",
            "plans",
            "view"
          ),
          false
        );
        assert.equal(
          hasPermission(
            "STAFF",
            "benefits",
            "view"
          ),
          true
        );
        assert.equal(
          hasPermission(
            "ADMIN",
            "billing",
            "view"
          ),
          false
        );

        setAdminBillingAccessForTests(
          true
        );

        assert.equal(
          hasPermission(
            "ADMIN",
            "billing",
            "manage"
          ),
          true
        );
      }
    );

    await runCase(
      "owner can execute owner-only operations",
      async () => {
        asUser(fixtures.ownerUser);

        const inviteFormData =
          new FormData();
        inviteFormData.set(
          "email",
          "new.user@rbac.test"
        );
        inviteFormData.set(
          "role",
          "STAFF"
        );

        const invite =
          await createUserInviteAction(
            inviteFormData
          );

        assert.ok(invite.token);

        const moduleFormData =
          new FormData();
        moduleFormData.set(
          "moduleKey",
          ModuleKey.CRM
        );

        await enableClinicModuleAction(
          moduleFormData
        );

        const roleFormData =
          new FormData();
        roleFormData.set(
          "userId",
          fixtures.adminUser.id
        );
        roleFormData.set(
          "role",
          "STAFF"
        );

        await updateClinicUserRoleAction(
          roleFormData
        );

        const clinicModule =
          await prisma.clinicModule.findFirst({
            where: {
              clinicId:
                fixtures.clinicId,
              module: {
                key: ModuleKey.CRM,
              },
            },
          });

        assert.equal(
          clinicModule?.status,
          ModuleStatus.ENABLED
        );

        const updatedAdmin =
          await prisma.appUser.findUnique({
            where: {
              id: fixtures.adminUser.id,
            },
          });

        assert.equal(
          updatedAdmin?.role,
          AppUserRole.STAFF
        );
      }
    );

    await runCase(
      "admin is blocked from restricted owner-only operations",
      async () => {
        asUser(fixtures.adminUser);
        clearAdminBillingAccessForTests();

        const inviteFormData =
          new FormData();
        inviteFormData.set(
          "email",
          "blocked.user@rbac.test"
        );
        inviteFormData.set(
          "role",
          "STAFF"
        );

        await assert.rejects(
          () =>
            createUserInviteAction(
              inviteFormData
            ),
          /permission/i
        );

        const roleFormData =
          new FormData();
        roleFormData.set(
          "userId",
          fixtures.ownerUser.id
        );
        roleFormData.set(
          "role",
          "STAFF"
        );

        await assert.rejects(
          () =>
            updateClinicUserRoleAction(
              roleFormData
            ),
          /permission|last owner/i
        );

        const moduleFormData =
          new FormData();
        moduleFormData.set(
          "moduleKey",
          ModuleKey.CRM
        );

        await assert.rejects(
          () =>
            enableClinicModuleAction(
              moduleFormData
            ),
          /permission/i
        );

        const billingFormData =
          new FormData();
        billingFormData.set(
          "invoiceId",
          fixtures.invoiceId
        );

        await assert.rejects(
          () =>
            markPatientInvoicePaidAction(
              billingFormData
            ),
          /permission/i
        );

        setAdminBillingAccessForTests(
          true
        );

        await markPatientInvoicePaidAction(
          billingFormData
        );

        const paidInvoice =
          await prisma.patientInvoice.findUnique({
            where: {
              id: fixtures.invoiceId,
            },
          });

        assert.equal(
          paidInvoice?.status,
          PaymentStatus.PAID
        );
      }
    );

    await runCase(
      "staff is blocked from destructive and protected operations",
      async () => {
        asUser(fixtures.staffUser);
        clearAdminBillingAccessForTests();

        await assert.rejects(
          () =>
            deletePatientPermanently(
              fixtures
                .inactivePatientId
            ),
          /permission/i
        );

        const roleFormData =
          new FormData();
        roleFormData.set(
          "userId",
          fixtures.adminUser.id
        );
        roleFormData.set(
          "role",
          "READ_ONLY"
        );

        await assert.rejects(
          () =>
            updateClinicUserRoleAction(
              roleFormData
            ),
          /permission/i
        );

        const billingFormData =
          new FormData();
        billingFormData.set(
          "invoiceId",
          fixtures.invoiceId
        );

        await assert.rejects(
          () =>
            markPatientInvoicePaidAction(
              billingFormData
            ),
          /permission/i
        );

        const moduleFormData =
          new FormData();
        moduleFormData.set(
          "moduleKey",
          ModuleKey.CRM
        );

        await assert.rejects(
          () =>
            enableClinicModuleAction(
              moduleFormData
            ),
          /permission/i
        );

        const contractFormData =
          new FormData();
        contractFormData.set(
          "contractId",
          fixtures.contractId
        );

        await assert.rejects(
          () =>
            acceptPatientContractAction(
              contractFormData
            ),
          /permission/i
        );
      }
    );
  } finally {
    clearCurrentAppUserForTests();
    clearAdminBillingAccessForTests();
    await cleanupFixtures();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
