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
import { authenticateAppUser } from "@/features/auth/services/authenticate-app-user";
import { resetClinicMasterPassword } from "@/features/auth/services/clinic-master";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { createClinic } from "@/features/clinic/actions/create-clinic";
import { updateClinicBrandingAction } from "@/features/clinic/actions/update-clinic-branding";
import { clinicSchema } from "@/features/clinic/schemas/clinic.schema";
import { getClinics } from "@/features/clinic/services/get-clinics";

type FixtureState = {
  platformOwner: CurrentAppUser;
};

const createdClinicSlugs = [
  "clinic-bootstrap-alpha",
  "clinic-bootstrap-beta",
];

async function cleanupFixtures() {
  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: createdClinicSlugs,
        },
      },
      select: {
        id: true,
      },
    });
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
    prisma.authSession.deleteMany({
      where: {
        appUser: {
          clinicId: {
            in: clinicIds,
          },
        },
      },
    }),
    prisma.userInvite.deleteMany({
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
    prisma.patientPayment.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.clinicPayment.deleteMany({
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
    prisma.clinicInvoice.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
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
    prisma.patient.deleteMany({
      where: {
        clinicId: {
          in: clinicIds,
        },
      },
    }),
    prisma.membershipBenefit.deleteMany({
      where: {
        membershipPlan: {
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
  const email =
    "owner+workspace@membership-core.local";
  const owner =
    await prisma.appUser.findUniqueOrThrow({
      where: {
        email,
      },
    });

  return {
    platformOwner: {
      id: owner.id,
      clinicId: null,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      status: owner.status,
      mustChangePassword: false,
      isClinicMaster: false,
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
      "platform owner creates clinic without losing platform scope and bootstraps clinic master",
      async () => {
        asUser(fixtures.platformOwner);

        const result =
          await createClinic({
            name: "Clinic Bootstrap Alpha",
            brandName: "Bootstrap Alpha",
            slug: "clinic-bootstrap-alpha",
            document:
              "12.345.678/0001-95",
            email:
              "alpha.master@clinic.test",
            phone:
              "(11) 99999-0000",
            zipCode: "01000-000",
            city: "Sao Paulo",
            state: "SP",
            address:
              "Rua Bootstrap, 10",
          });

        const platformOwner =
          await prisma.appUser.findUniqueOrThrow(
            {
              where: {
                id: fixtures.platformOwner.id,
              },
            }
          );

        const clinicMaster =
          await prisma.appUser.findUniqueOrThrow(
            {
              where: {
                email:
                  "alpha.master@clinic.test",
              },
            }
          );

        const visibleClinics =
          await getClinics();
        const authenticatedMaster =
          await authenticateAppUser({
            email:
              "alpha.master@clinic.test",
            password:
              result.clinicMasterTemporaryPassword,
          });

        assert.equal(
          platformOwner.clinicId,
          null
        );
        assert.equal(
          clinicMaster.clinicId,
          result.clinicId
        );
        assert.equal(
          clinicMaster.role,
          AppUserRole.OWNER
        );
        assert.equal(
          clinicMaster.status,
          AppUserStatus.ACTIVE
        );
        assert.equal(
          clinicMaster.mustChangePassword,
          true
        );
        assert.equal(
          clinicMaster.isClinicMaster,
          true
        );
        assert.ok(
          visibleClinics.some(
            (clinic) =>
              clinic.id ===
              result.clinicId
          )
        );
        assert.equal(
          authenticatedMaster?.email,
          "alpha.master@clinic.test"
        );
      }
    );

    await runCase(
      "platform owner can reset only the clinic master password",
      async () => {
        asUser(fixtures.platformOwner);

        const clinic =
          await prisma.clinic.findFirstOrThrow({
            where: {
              slug:
                "clinic-bootstrap-alpha",
            },
          });

        const clinicMasterBefore =
          await prisma.appUser.findFirstOrThrow(
            {
              where: {
                clinicId: clinic.id,
                isClinicMaster: true,
              },
            }
          );

        const resetResult =
          await resetClinicMasterPassword(
            {
              clinicId: clinic.id,
              actorDisplayName:
                "Owner Operator <owner+workspace@membership-core.local>",
              actorUserId:
                fixtures.platformOwner.id,
            }
          );

        const authenticatedMaster =
          await authenticateAppUser({
            email:
              clinicMasterBefore.email,
            password:
              resetResult.temporaryPassword,
          });

        assert.equal(
          resetResult.clinicMaster.id,
          clinicMasterBefore.id
        );
        assert.equal(
          authenticatedMaster?.email,
          clinicMasterBefore.email
        );
      }
    );

    await runCase(
      "clinic schema rejects incompatible city and state combinations",
      async () => {
        const parsed =
          clinicSchema.safeParse({
            name: "Clinic Bootstrap Beta",
            brandName:
              "Bootstrap Beta",
            slug: "clinic-bootstrap-beta",
            document:
              "12.345.678/0001-95",
            email:
              "beta.master@clinic.test",
            phone:
              "(21) 99999-0000",
            zipCode: "20000-000",
            city: "Sao Paulo",
            state: "RJ",
            address:
              "Rua Bootstrap, 20",
          });

        assert.equal(
          parsed.success,
          false
        );
        assert.match(
          parsed.error.issues[0]?.message ??
            "",
          /cidade compatível/i
        );
      }
    );

    await runCase(
      "clinic schema rejects invalid cnpj values",
      async () => {
        const parsed =
          clinicSchema.safeParse({
            name: "Clinic Bootstrap Beta",
            brandName:
              "Bootstrap Beta",
            slug: "clinic-bootstrap-beta",
            document:
              "11.111.111/1111-11",
            email:
              "beta.master@clinic.test",
            phone:
              "(21) 99999-0000",
            zipCode: "20000-000",
            city: "Rio de Janeiro",
            state: "RJ",
            address:
              "Rua Bootstrap, 20",
          });

        assert.equal(
          parsed.success,
          false
        );
        assert.match(
          parsed.error.issues[0]?.message ??
            "",
          /cnpj válido/i
        );
      }
    );

    await runCase(
      "company branding update rejects unsafe logo sources",
      async () => {
        const clinic =
          await prisma.clinic.findFirstOrThrow({
            where: {
              slug:
                "clinic-bootstrap-alpha",
            },
          });
        const clinicMaster =
          await prisma.appUser.findFirstOrThrow(
            {
              where: {
                clinicId: clinic.id,
                isClinicMaster: true,
              },
            }
          );

        asUser({
          id: clinicMaster.id,
          clinicId: clinic.id,
          name: clinicMaster.name,
          email: clinicMaster.email,
          role: clinicMaster.role,
          status: clinicMaster.status,
          mustChangePassword:
            clinicMaster.mustChangePassword,
          isClinicMaster:
            clinicMaster.isClinicMaster,
        });

        const formData =
          new FormData();
        formData.set(
          "brandName",
          "Marca Segura"
        );
        formData.set(
          "logoUrl",
          "javascript:alert(1)"
        );

        await assert.rejects(
          () =>
            updateClinicBrandingAction(
              formData
            ),
          /SVG ou PNG/i
        );

        const refreshedClinic =
          await prisma.clinic.findUniqueOrThrow(
            {
              where: {
                id: clinic.id,
              },
              select: {
                brandName: true,
                logoUrl: true,
              },
            }
          );

        assert.notEqual(
          refreshedClinic.brandName,
          "Marca Segura"
        );
        assert.notEqual(
          refreshedClinic.logoUrl,
          "javascript:alert(1)"
        );
      }
    );

    await runCase(
      "company branding update rejects oversized data urls",
      async () => {
        const clinic =
          await prisma.clinic.findFirstOrThrow({
            where: {
              slug:
                "clinic-bootstrap-alpha",
            },
          });
        const clinicMaster =
          await prisma.appUser.findFirstOrThrow(
            {
              where: {
                clinicId: clinic.id,
                isClinicMaster: true,
              },
            }
          );

        asUser({
          id: clinicMaster.id,
          clinicId: clinic.id,
          name: clinicMaster.name,
          email: clinicMaster.email,
          role: clinicMaster.role,
          status: clinicMaster.status,
          mustChangePassword:
            clinicMaster.mustChangePassword,
          isClinicMaster:
            clinicMaster.isClinicMaster,
        });

        const formData =
          new FormData();
        formData.set(
          "brandName",
          "Marca Grande"
        );
        formData.set(
          "logoUrl",
          `data:image/png;base64,${"A".repeat(
            400_000
          )}`
        );

        await assert.rejects(
          () =>
            updateClinicBrandingAction(
              formData
            ),
          /muito grande/i
        );
      }
    );

    await runCase(
      "company branding update rejects inconsistent data url mime",
      async () => {
        const clinic =
          await prisma.clinic.findFirstOrThrow({
            where: {
              slug:
                "clinic-bootstrap-alpha",
            },
          });
        const clinicMaster =
          await prisma.appUser.findFirstOrThrow(
            {
              where: {
                clinicId: clinic.id,
                isClinicMaster: true,
              },
            }
          );

        asUser({
          id: clinicMaster.id,
          clinicId: clinic.id,
          name: clinicMaster.name,
          email: clinicMaster.email,
          role: clinicMaster.role,
          status: clinicMaster.status,
          mustChangePassword:
            clinicMaster.mustChangePassword,
          isClinicMaster:
            clinicMaster.isClinicMaster,
        });

        const formData =
          new FormData();
        formData.set(
          "brandName",
          "Marca Invalida"
        );
        formData.set(
          "logoUrl",
          "data:image/jpeg;base64,QUJD"
        );

        await assert.rejects(
          () =>
            updateClinicBrandingAction(
              formData
            ),
          /SVG ou PNG/i
        );
      }
    );

    await runCase(
      "company branding update allows safe clearing of branding fields",
      async () => {
        const clinic =
          await prisma.clinic.findFirstOrThrow({
            where: {
              slug:
                "clinic-bootstrap-alpha",
            },
          });
        const clinicMaster =
          await prisma.appUser.findFirstOrThrow(
            {
              where: {
                clinicId: clinic.id,
                isClinicMaster: true,
              },
            }
          );

        asUser({
          id: clinicMaster.id,
          clinicId: clinic.id,
          name: clinicMaster.name,
          email: clinicMaster.email,
          role: clinicMaster.role,
          status: clinicMaster.status,
          mustChangePassword:
            clinicMaster.mustChangePassword,
          isClinicMaster:
            clinicMaster.isClinicMaster,
        });

        const updateFormData =
          new FormData();
        updateFormData.set(
          "brandName",
          "Marca Limpa"
        );
        updateFormData.set(
          "logoUrl",
          "/uploads/company-alpha.svg"
        );

        await updateClinicBrandingAction(
          updateFormData
        );

        const clearFormData =
          new FormData();
        clearFormData.set("brandName", "");
        clearFormData.set("logoUrl", "");

        await updateClinicBrandingAction(
          clearFormData
        );

        const refreshedClinic =
          await prisma.clinic.findUniqueOrThrow(
            {
              where: {
                id: clinic.id,
              },
              select: {
                brandName: true,
                logoUrl: true,
              },
            }
          );

        assert.equal(
          refreshedClinic.brandName,
          null
        );
        assert.equal(
          refreshedClinic.logoUrl,
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
