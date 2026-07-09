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
  ClinicContractStatus,
  ClinicStatus,
  ContractType,
  PatientContractStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { createMembershipPlan } from "@/features/membership-plans/actions/create-membership-plan";
import { createPatient } from "@/features/patients/actions/create-patient";
import { createSubscription } from "@/features/subscriptions/actions/create-subscription";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { addClinicContractFileReferenceAction } from "@/features/contracts/actions/add-clinic-contract-file-reference";
import { activateContractTemplateAction } from "@/features/contracts/actions/activate-contract-template";
import { acceptPatientContractAction } from "@/features/contracts/actions/accept-patient-contract";
import { deactivateContractTemplateAction } from "@/features/contracts/actions/deactivate-contract-template";
import { saveContractTemplateAction } from "@/features/contracts/actions/save-contract-template";
import { updateClinicContractStatusAction } from "@/features/contracts/actions/update-clinic-contract-status";
import { updatePatientContractStatusAction } from "@/features/contracts/actions/update-patient-contract-status";
import {
  generatePatientContractForSubscription,
  getContractsOverview,
} from "@/features/contracts/services/contracts-foundation";

type FixtureState = {
  alphaClinicId: string;
  betaClinicId: string;
  alphaOwner: CurrentAppUser;
  betaOwner: CurrentAppUser;
};

let fixtures: FixtureState;

function formatDateOnly(
  value: Date
) {
  return value
    .toISOString()
    .slice(0, 10);
}

function addDays(
  value: Date,
  days: number
) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

async function cleanupFixtures() {
  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: [
            "contracts-alpha",
            "contracts-beta",
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
    prisma.patientInvoice.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
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
          name: "Contracts Alpha",
          brandName: "Alpha",
          slug: "contracts-alpha",
          document:
            "66.666.666/0001-66",
          email:
            "alpha@contracts.test",
          phone: "11666666666",
          zipCode: "06000-000",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Alpha Contracts, 6",
          status: ClinicStatus.ACTIVE,
        },
      }),
      prisma.clinic.create({
        data: {
          name: "Contracts Beta",
          brandName: "Beta",
          slug: "contracts-beta",
          document:
            "77.777.777/0001-77",
          email:
            "beta@contracts.test",
          phone: "11777777777",
          zipCode: "07000-000",
          city: "Rio de Janeiro",
          state: "RJ",
          address:
            "Rua Beta Contracts, 7",
          status: ClinicStatus.ACTIVE,
        },
      }),
    ]);

  const [alphaOwner, betaOwner] =
    await Promise.all([
      prisma.appUser.create({
        data: {
          clinicId: alphaClinic.id,
          name: "Alpha Owner",
          email:
            "owner.alpha@contracts.test",
          role: AppUserRole.OWNER,
        },
      }),
      prisma.appUser.create({
        data: {
          clinicId: betaClinic.id,
          name: "Beta Owner",
          email:
            "owner.beta@contracts.test",
          role: AppUserRole.OWNER,
        },
      }),
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
  asUser(fixtures.alphaOwner);

  try {
    await runCase(
      "clinic overrides are used for future patient and clinic contracts",
      async () => {
        const patientTemplateForm =
          new FormData();
        patientTemplateForm.set(
          "type",
          ContractType.PATIENT_MEMBERSHIP
        );
        patientTemplateForm.set(
          "title",
          "Alpha Patient Terms"
        );
        patientTemplateForm.set(
          "content",
          "Alpha patient contract content for V1 hardening coverage."
        );

        await saveContractTemplateAction(
          patientTemplateForm
        );

        const clinicTemplateForm =
          new FormData();
        clinicTemplateForm.set(
          "type",
          ContractType.CLINIC_PLATFORM
        );
        clinicTemplateForm.set(
          "title",
          "Alpha Clinic Terms"
        );
        clinicTemplateForm.set(
          "content",
          "Alpha clinic contract content for Nortex platform coverage."
        );

        await saveContractTemplateAction(
          clinicTemplateForm
        );

        const inactivePatientTemplateForm =
          new FormData();
        inactivePatientTemplateForm.set(
          "type",
          ContractType.PATIENT_MEMBERSHIP
        );
        inactivePatientTemplateForm.set(
          "title",
          "Alpha Patient Terms Draft"
        );
        inactivePatientTemplateForm.set(
          "content",
          "Alpha patient contract content draft version for template selection coverage."
        );

        await saveContractTemplateAction(
          inactivePatientTemplateForm
        );

        const overviewBefore =
          await getContractsOverview();

        assert.equal(
          overviewBefore
            .patientTemplate?.scope,
          "CLINIC"
        );
        assert.equal(
          overviewBefore
            .clinicTemplate?.scope,
          "CLINIC"
        );
        assert.equal(
          overviewBefore
            .clinicContracts[0]
            ?.contentSnapshot,
          "Alpha clinic contract content for Nortex platform coverage."
        );
        assert.equal(
          overviewBefore
            .patientClinicTemplates
            .length,
          2
        );

        const inactiveTemplate =
          overviewBefore.patientClinicTemplates.find(
            (template) =>
              template.title ===
              "Alpha Patient Terms Draft"
          );

        assert.equal(
          inactiveTemplate?.active,
          false
        );

        const activateTemplateForm =
          new FormData();
        activateTemplateForm.set(
          "templateId",
          inactiveTemplate!.id
        );

        await activateContractTemplateAction(
          activateTemplateForm
        );

        await createPatient({
          fullName:
            "Contracts Patient",
          email:
            "patient@contracts.test",
          phone: "11911111111",
          birthDate: "1991-01-01",
          document:
            "529.982.247-25",
          zipCode: "06000-000",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Patient Contracts, 10",
        });

        await createMembershipPlan({
          name: "Contracts Prime",
          description:
            "Contracts hardening plan",
          monthlyPrice: 199,
        });

        const patient =
          await prisma.patient.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
                email:
                  "patient@contracts.test",
              },
            }
          );
        const plan =
          await prisma.membershipPlan.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
                name:
                  "Contracts Prime",
              },
            }
          );

        const now = new Date();

        await createSubscription({
          patientId: patient.id,
          membershipPlanId: plan.id,
          startedAt:
            formatDateOnly(now),
          expiresAt:
            formatDateOnly(
              addDays(now, 30)
            ),
        });

        const patientContract =
          await prisma.patientContract.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
                patientId: patient.id,
              },
            }
          );

        assert.equal(
          patientContract.title,
          "Alpha Patient Terms Draft"
        );
        assert.equal(
          patientContract.contentSnapshot,
          "Alpha patient contract content draft version for template selection coverage."
        );
        assert.equal(
          patientContract.status,
          PatientContractStatus.ACTIVE
        );

        await deactivateContractTemplateAction(
          activateTemplateForm
        );
      }
    );

    await runCase(
      "patient acceptance is idempotent and blocks invalid statuses",
      async () => {
        const patientContract =
          await prisma.patientContract.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
              },
            }
          );

        const acceptForm =
          new FormData();
        acceptForm.set(
          "contractId",
          patientContract.id
        );

        await acceptPatientContractAction(
          acceptForm
        );
        await acceptPatientContractAction(
          acceptForm
        );

        const accepted =
          await prisma.patientContract.findUniqueOrThrow(
            {
              where: {
                id: patientContract.id,
              },
              include: {
                acceptances: true,
              },
            }
          );

        assert.equal(
          accepted.status,
          PatientContractStatus.ACCEPTED
        );
        assert.equal(
          accepted.acceptances.length,
          1
        );

        const invalidContract =
          await prisma.patientContract.create({
            data: {
              clinicId:
                fixtures.alphaClinicId,
              patientId:
                accepted.patientId,
              subscriptionId:
                accepted.subscriptionId,
              title:
                "Draft Contract",
              contentSnapshot:
                "Draft contract snapshot",
              status:
                PatientContractStatus.DRAFT,
            },
          });

        const invalidForm =
          new FormData();
        invalidForm.set(
          "contractId",
          invalidContract.id
        );

        await assert.rejects(
          () =>
            acceptPatientContractAction(
              invalidForm
            ),
          /Only active patient contracts can be accepted\./
        );
      }
    );

    await runCase(
      "patient contracts support lifecycle transitions and linkage validation",
      async () => {
        const acceptedContract =
          await prisma.patientContract.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
                status:
                  PatientContractStatus.ACCEPTED,
              },
            }
          );

        const archiveForm =
          new FormData();
        archiveForm.set(
          "contractId",
          acceptedContract.id
        );
        archiveForm.set(
          "status",
          PatientContractStatus.ARCHIVED
        );

        await updatePatientContractStatusAction(
          archiveForm
        );

        const archived =
          await prisma.patientContract.findUniqueOrThrow(
            {
              where: {
                id: acceptedContract.id,
              },
            }
          );

        assert.equal(
          archived.status,
          PatientContractStatus.ARCHIVED
        );

        const draftContract =
          await prisma.patientContract.create({
            data: {
              clinicId:
                fixtures.alphaClinicId,
              patientId:
                archived.patientId,
              subscriptionId:
                archived.subscriptionId,
              title:
                "Draft Lifecycle Contract",
              contentSnapshot:
                "Draft lifecycle contract snapshot",
              status:
                PatientContractStatus.DRAFT,
            },
          });

        const activateDraftForm =
          new FormData();
        activateDraftForm.set(
          "contractId",
          draftContract.id
        );
        activateDraftForm.set(
          "status",
          PatientContractStatus.ACTIVE
        );

        await updatePatientContractStatusAction(
          activateDraftForm
        );

        const activatedDraft =
          await prisma.patientContract.findUniqueOrThrow(
            {
              where: {
                id: draftContract.id,
              },
            }
          );

        assert.equal(
          activatedDraft.status,
          PatientContractStatus.ACTIVE
        );

        const linkedSubscription =
          await prisma.subscription.create({
            data: {
              patientId:
                archived.patientId,
              membershipPlanId:
                (
                  await prisma.membershipPlan.findFirstOrThrow(
                    {
                      where: {
                        clinicId:
                          fixtures.alphaClinicId,
                      },
                    }
                  )
                ).id,
              startedAt:
                new Date("2026-06-01T00:00:00.000Z"),
              expiresAt:
                new Date("2026-07-01T00:00:00.000Z"),
            },
          });

        const anotherPatient =
          await prisma.patient.create({
          data: {
            clinicId:
              fixtures.alphaClinicId,
            fullName:
              "Mismatch Patient",
            email:
              "mismatch@contracts.test",
            phone: "11922222222",
            birthDate:
              new Date("1992-02-02T00:00:00.000Z"),
            document:
              "111.444.777-35",
            zipCode:
              "06000-001",
            city: "Sao Paulo",
            state: "SP",
            address:
              "Rua Mismatch, 22",
          },
        });

        await assert.rejects(
          () =>
            generatePatientContractForSubscription(
              {
                clinicId:
                  fixtures.alphaClinicId,
                patientId:
                  anotherPatient.id,
                subscriptionId:
                  linkedSubscription.id,
              }
            ),
          /Subscription-to-contract linkage is invalid\./
        );
      }
    );

    await runCase(
      "clinic contracts support status updates and file references",
      async () => {
        const clinicContract =
          await prisma.clinicContract.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
              },
            }
          );

        const activateForm =
          new FormData();
        activateForm.set(
          "contractId",
          clinicContract.id
        );
        activateForm.set(
          "status",
          ClinicContractStatus.ACTIVE
        );

        await updateClinicContractStatusAction(
          activateForm
        );

        const fileForm =
          new FormData();
        fileForm.set(
          "contractId",
          clinicContract.id
        );
        fileForm.set(
          "fileName",
          "signed-agreement.pdf"
        );
        fileForm.set(
          "fileUrl",
          "https://example.com/contracts/signed-agreement.pdf"
        );

        await addClinicContractFileReferenceAction(
          fileForm
        );
        await addClinicContractFileReferenceAction(
          fileForm
        );

        const suspendForm =
          new FormData();
        suspendForm.set(
          "contractId",
          clinicContract.id
        );
        suspendForm.set(
          "status",
          ClinicContractStatus.SUSPENDED
        );

        await updateClinicContractStatusAction(
          suspendForm
        );

        const updated =
          await prisma.clinicContract.findUniqueOrThrow(
            {
              where: {
                id: clinicContract.id,
              },
              include: {
                files: true,
              },
            }
          );

        assert.equal(
          updated.status,
          ClinicContractStatus.SUSPENDED
        );
        assert.ok(updated.signedAt);
        assert.ok(updated.effectiveAt);
        assert.equal(
          updated.files.length,
          1
        );
      }
    );

    await runCase(
      "clinic contract mutations stay tenant scoped",
      async () => {
        asUser(fixtures.betaOwner);

        const alphaClinicContract =
          await prisma.clinicContract.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.alphaClinicId,
              },
            }
          );

        const statusForm =
          new FormData();
        statusForm.set(
          "contractId",
          alphaClinicContract.id
        );
        statusForm.set(
          "status",
          ClinicContractStatus.ACTIVE
        );

        await assert.rejects(
          () =>
            updateClinicContractStatusAction(
              statusForm
            ),
          /Clinic contract not found\./
        );

        const fileForm =
          new FormData();
        fileForm.set(
          "contractId",
          alphaClinicContract.id
        );
        fileForm.set(
          "fileName",
          "intrusion.pdf"
        );
        fileForm.set(
          "fileUrl",
          "https://example.com/intrusion.pdf"
        );

        await assert.rejects(
          () =>
            addClinicContractFileReferenceAction(
              fileForm
            ),
          /Clinic contract not found\./
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
