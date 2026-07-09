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
  PatientKind,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { clinicSchema } from "@/features/clinic/schemas/clinic.schema";
import { membershipPlanSchema } from "@/features/membership-plans/schemas/membership-plan.schema";
import { membershipBenefitSchema } from "@/features/membership-benefits/schemas/membership-benefit.schema";
import { patientSchema } from "@/features/patients/schemas/patient.schema";
import { subscriptionSchema } from "@/features/subscriptions/schemas/subscription.schema";
import { createClinicUserAction } from "@/features/users/actions/create-clinic-user";
import { createSupportThreadAction } from "@/features/messages/actions/create-support-thread";
import { addSupportMessageAction } from "@/features/messages/actions/add-support-message";

type FixtureState = {
  clinicId: string;
  ownerUser: CurrentAppUser;
};

const fixtureSlug =
  "validation-hardening-clinic";
const fixtureEmail =
  "validation.owner@test.local";

async function cleanupFixtures() {
  const clinic =
    await prisma.clinic.findFirst({
      where: {
        slug: fixtureSlug,
      },
      select: {
        id: true,
      },
    });

  await prisma.appUser.deleteMany({
    where: {
      email: fixtureEmail,
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
    prisma.authSession.deleteMany({
      where: {
        appUser: {
          clinicId: clinic.id,
        },
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
      name:
        "Validation Hardening Clinic",
      brandName: "Validation",
      slug: fixtureSlug,
      document:
        "45.723.174/0001-10",
      email:
        "validation@clinic.test",
      phone: "11999998888",
      zipCode: "01000-000",
      city: "Sao Paulo",
      state: "SP",
      address:
        "Rua Validacao, 10",
      status: ClinicStatus.ACTIVE,
    },
  });

  const owner =
    await prisma.appUser.create({
      data: {
        clinicId: clinic.id,
        name:
          "Validation Owner",
        email: fixtureEmail,
        role: AppUserRole.OWNER,
      },
    });

  return {
    clinicId: clinic.id,
    ownerUser: {
      id: owner.id,
      clinicId: clinic.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
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
  const fixtures =
    await seedFixtures();

  try {
    await runCase(
      "clinic schema rejects invalid cnpj and incompatible city state",
      async () => {
        const parsed =
          clinicSchema.safeParse({
            name: "Empresa",
            brandName: "Marca",
            document:
              "11.111.111/1111-11",
            email:
              "empresa@test.local",
            phone:
              "(11) 99999-9999",
            zipCode: "01000-000",
            city: "Sao Paulo",
            state: "RJ",
            address: "Rua A",
          });

        assert.equal(
          parsed.success,
          false
        );
      }
    );

    await runCase(
      "patient schema rejects minors as titular and dependents without responsible document",
      async () => {
        const minorTitular =
          patientSchema.safeParse({
            fullName: "Paciente Jovem",
            email:
              "paciente@test.local",
            phone:
              "(11) 99999-9999",
            birthDate:
              "2015-01-01",
            document:
              "529.982.247-25",
            zipCode: "01000-000",
            city: "Sao Paulo",
            state: "SP",
            address:
              "Rua Paciente, 10",
            kind:
              PatientKind.TITULAR,
          });
        const missingResponsible =
          patientSchema.safeParse({
            fullName:
              "Paciente Dependente",
            email:
              "dependente@test.local",
            phone:
              "(11) 99999-9999",
            birthDate:
              "2010-01-01",
            document:
              "390.533.447-05",
            zipCode: "01000-000",
            city: "Sao Paulo",
            state: "SP",
            address:
              "Rua Paciente, 20",
            kind:
              PatientKind.DEPENDENT,
          });

        assert.equal(
          minorTitular.success,
          false
        );
        assert.equal(
          missingResponsible.success,
          false
        );
      }
    );

    await runCase(
      "membership plan and subscription schemas reject invalid chronology and values",
      async () => {
        const invalidPlan =
          membershipPlanSchema.safeParse({
            name: "AB",
            monthlyPrice: -1,
          });
        const invalidSubscription =
          subscriptionSchema.safeParse({
            patientId: "patient-1",
            membershipPlanId:
              "plan-1",
            startedAt:
              "2026-07-10",
            expiresAt:
              "2026-07-09",
          });

        assert.equal(
          invalidPlan.success,
          false
        );
        assert.equal(
          invalidSubscription.success,
          false
        );
      }
    );

    await runCase(
      "membership benefit schema rejects inconsistent discount and usage combinations",
      async () => {
        const invalidDiscount =
          membershipBenefitSchema.safeParse({
            membershipPlanId: "plan-1",
            type:
              "PERCENTAGE_DISCOUNT",
            title: "Desconto",
          });
        const invalidUsage =
          membershipBenefitSchema.safeParse({
            membershipPlanId: "plan-1",
            type: "LIMITED",
            title: "Uso mensal",
            usagePolicy: "MONTHLY",
            usageLimit: 0,
            resetPeriod: "YEARLY",
          });

        assert.equal(
          invalidDiscount.success,
          false
        );
        assert.equal(
          invalidUsage.success,
          false
        );
      }
    );

    await runCase(
      "clinic user creation rejects inverted access window",
      async () => {
        asUser(fixtures.ownerUser);

        const formData =
          new FormData();
        formData.set(
          "name",
          "Operador"
        );
        formData.set(
          "email",
          "operador@test.local"
        );
        formData.set(
          "role",
          AppUserRole.STAFF
        );
        formData.set(
          "accessStartsAt",
          "2026-07-10"
        );
        formData.set(
          "accessEndsAt",
          "2026-07-09"
        );

        await assert.rejects(
          () =>
            createClinicUserAction(
              formData
            ),
          /data fim/i
        );
      }
    );

    await runCase(
      "support thread creation rejects short subject body and invalid category",
      async () => {
        asUser(fixtures.ownerUser);

        const shortSubject =
          new FormData();
        shortSubject.set(
          "subject",
          "abc"
        );
        shortSubject.set(
          "body",
          "Mensagem inicial válida"
        );
        shortSubject.set(
          "category",
          "REQUEST"
        );

        await assert.rejects(
          () =>
            createSupportThreadAction(
              shortSubject
            ),
          /pelo menos 4 caracteres/i
        );

        const invalidCategory =
          new FormData();
        invalidCategory.set(
          "subject",
          "Assunto válido"
        );
        invalidCategory.set(
          "body",
          "Mensagem inicial válida"
        );
        invalidCategory.set(
          "category",
          "INVALID"
        );

        await assert.rejects(
          () =>
            createSupportThreadAction(
              invalidCategory
            ),
          /Categoria inválida/i
        );
      }
    );

    await runCase(
      "support message creation rejects empty payload and unknown thread",
      async () => {
        asUser(fixtures.ownerUser);

        const shortMessage =
          new FormData();
        shortMessage.set(
          "threadId",
          "thread-1"
        );
        shortMessage.set(
          "body",
          "x"
        );

        await assert.rejects(
          () =>
            addSupportMessageAction(
              shortMessage
            ),
          /pelo menos 2 caracteres/i
        );

        const unknownThread =
          new FormData();
        unknownThread.set(
          "threadId",
          "thread-unknown"
        );
        unknownThread.set(
          "body",
          "Mensagem válida"
        );

        await assert.rejects(
          () =>
            addSupportMessageAction(
              unknownThread
            ),
          /Chamado não encontrado/i
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
