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
  BenefitType,
  ClinicStatus,
  PatientStatus,
  ResetPeriod,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { consumeBenefit } from "@/features/benefit-usage/actions/consume-benefit";
import { createMembershipBenefit } from "@/features/membership-benefits/actions/create-membership-benefit";
import { deactivateMembershipBenefit } from "@/features/membership-benefits/actions/deactivate-membership-benefit";
import { reactivateMembershipBenefit } from "@/features/membership-benefits/actions/reactivate-membership-benefit";
import { createMembershipPlan } from "@/features/membership-plans/actions/create-membership-plan";
import { deactivateMembershipPlan } from "@/features/membership-plans/actions/deactivate-membership-plan";
import { reactivateMembershipPlan } from "@/features/membership-plans/actions/reactivate-membership-plan";
import { createPatient } from "@/features/patients/actions/create-patient";
import { cancelSubscription } from "@/features/subscriptions/actions/cancel-subscription";
import { createSubscription } from "@/features/subscriptions/actions/create-subscription";
import { expireSubscription } from "@/features/subscriptions/actions/expire-subscription";
import { pauseSubscription } from "@/features/subscriptions/actions/pause-subscription";
import { renewSubscription } from "@/features/subscriptions/actions/renew-subscription";
import { resumeSubscription } from "@/features/subscriptions/actions/resume-subscription";

type FixtureState = {
  clinicId: string;
  ownerUser: CurrentAppUser;
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
  const clinic =
    await prisma.clinic.findFirst({
      where: {
        slug:
          "membership-regression",
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
    prisma.benefitUsage.deleteMany({
      where: {
        subscription: {
          patient: {
            clinicId: clinic.id,
          },
        },
      },
    }),
    prisma.subscription.deleteMany({
      where: {
        patient: {
          clinicId: clinic.id,
        },
      },
    }),
    prisma.membershipBenefit.deleteMany({
      where: {
        membershipPlan: {
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
      name:
        "Membership Regression Clinic",
      brandName: "Membership QA",
      slug:
        "membership-regression",
      document:
        "55.555.555/0001-55",
      email:
        "membership@clinic.test",
      phone: "11555555555",
      zipCode: "05000-000",
      city: "Sao Paulo",
      state: "SP",
      address:
        "Rua Membership, 5",
      status: ClinicStatus.ACTIVE,
    },
  });

  const ownerUser =
    await prisma.appUser.create({
      data: {
        clinicId: clinic.id,
        name: "Membership Owner",
        email:
          "owner@membership.test",
        role: AppUserRole.OWNER,
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
  asUser(fixtures.ownerUser);

  const now = new Date();
  const startedAt = formatDateOnly(
    now
  );
  const expiresAt = formatDateOnly(
    addDays(now, 30)
  );

  try {
    await runCase(
      "membership foundation can create patient, plan, benefit and subscription side effects",
      async () => {
        await createPatient({
          fullName:
            "Alice Membership",
          email:
            "alice.membership@test.local",
          phone: "11911111111",
          birthDate: "1991-01-01",
          document:
            "111.111.111-11",
          zipCode: "05000-000",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Alice, 10",
        });

        await createMembershipPlan({
          name: "Regression Prime",
          description:
            "Membership regression base plan",
          monthlyPrice: 199,
        });

        const patient =
          await prisma.patient.findFirst({
            where: {
              clinicId:
                fixtures.clinicId,
              email:
                "alice.membership@test.local",
            },
          });
        const plan =
          await prisma.membershipPlan.findFirst({
            where: {
              clinicId:
                fixtures.clinicId,
              name:
                "Regression Prime",
            },
          });

        assert.ok(patient);
        assert.equal(
          patient?.status,
          PatientStatus.ACTIVE
        );
        assert.ok(plan);
        assert.equal(
          plan?.active,
          true
        );

        await createMembershipBenefit({
          membershipPlanId:
            plan!.id,
          type: BenefitType.LIMITED,
          title:
            "Monthly Consultation",
          description:
            "Limited monthly consults",
          usageLimit: 3,
          resetPeriod:
            ResetPeriod.MONTHLY,
        });

        const benefit =
          await prisma.membershipBenefit.findFirst(
            {
              where: {
                membershipPlanId:
                  plan!.id,
                title:
                  "Monthly Consultation",
              },
            }
          );

        assert.ok(benefit);
        assert.equal(
          benefit?.active,
          true
        );

        await createSubscription({
          patientId: patient!.id,
          membershipPlanId:
            plan!.id,
          startedAt,
          expiresAt,
        });

        const subscription =
          await prisma.subscription.findFirst({
            where: {
              patientId: patient!.id,
              membershipPlanId:
                plan!.id,
            },
          });
        const invoices =
          await prisma.patientInvoice.findMany(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                patientId:
                  patient!.id,
              },
            }
          );
        const contracts =
          await prisma.patientContract.findMany(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                patientId:
                  patient!.id,
              },
            }
          );

        assert.ok(subscription);
        assert.equal(
          subscription?.status,
          SubscriptionStatus.ACTIVE
        );
        assert.equal(
          invoices.length,
          1
        );
        assert.equal(
          invoices[0]?.subscriptionId,
          subscription?.id
        );
        assert.equal(
          contracts.length,
          1
        );
        assert.equal(
          contracts[0]?.subscriptionId,
          subscription?.id
        );
      }
    );

    await runCase(
      "benefit consumption respects subscription state, benefit state and usage limits",
      async () => {
        const patient =
          await prisma.patient.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                email:
                  "alice.membership@test.local",
              },
            }
          );
        const plan =
          await prisma.membershipPlan.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                name:
                  "Regression Prime",
              },
            }
          );
        const benefit =
          await prisma.membershipBenefit.findFirstOrThrow(
            {
              where: {
                membershipPlanId:
                  plan.id,
                title:
                  "Monthly Consultation",
              },
            }
          );
        const subscription =
          await prisma.subscription.findFirstOrThrow(
            {
              where: {
                patientId: patient.id,
                membershipPlanId:
                  plan.id,
              },
            }
          );

        await pauseSubscription(
          subscription.id
        );

        await assert.rejects(
          () =>
            consumeBenefit({
              subscriptionId:
                subscription.id,
              membershipBenefitId:
                benefit.id,
              quantity: 1,
              usedBy:
                "Frontdesk QA",
            }),
          /Only active subscriptions can consume benefits\./
        );

        await resumeSubscription(
          subscription.id
        );

        await consumeBenefit({
          subscriptionId:
            subscription.id,
          membershipBenefitId:
            benefit.id,
          quantity: 2,
          usedBy: "Frontdesk QA",
        });

        await deactivateMembershipBenefit(
          benefit.id
        );

        await assert.rejects(
          () =>
            consumeBenefit({
              subscriptionId:
                subscription.id,
              membershipBenefitId:
                benefit.id,
              quantity: 1,
              usedBy:
                "Frontdesk QA",
            }),
          /This benefit does not belong to the subscription plan\./
        );

        await reactivateMembershipBenefit(
          benefit.id
        );

        await consumeBenefit({
          subscriptionId:
            subscription.id,
          membershipBenefitId:
            benefit.id,
          quantity: 1,
          usedBy: "Frontdesk QA",
        });

        await assert.rejects(
          () =>
            consumeBenefit({
              subscriptionId:
                subscription.id,
              membershipBenefitId:
                benefit.id,
              quantity: 1,
              usedBy:
                "Frontdesk QA",
            }),
          /Benefit usage limit exceeded/
        );

        const usages =
          await prisma.benefitUsage.findMany(
            {
              where: {
                subscriptionId:
                  subscription.id,
                membershipBenefitId:
                  benefit.id,
              },
              orderBy: {
                usedAt: "asc",
              },
            }
          );

        assert.equal(
          usages.length,
          2
        );
        assert.deepEqual(
          usages.map(
            (usage) =>
              usage.quantity
          ),
          [2, 1]
        );
      }
    );

    await runCase(
      "subscription lifecycle keeps billing history and blocks renewal after cancelation",
      async () => {
        const patient =
          await prisma.patient.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                email:
                  "alice.membership@test.local",
              },
            }
          );
        const plan =
          await prisma.membershipPlan.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                name:
                  "Regression Prime",
              },
            }
          );
        const subscriptionBefore =
          await prisma.subscription.findFirstOrThrow(
            {
              where: {
                patientId: patient.id,
                membershipPlanId:
                  plan.id,
              },
            }
          );

        await expireSubscription(
          subscriptionBefore.id
        );

        let subscription =
          await prisma.subscription.findUniqueOrThrow(
            {
              where: {
                id: subscriptionBefore.id,
              },
            }
          );

        assert.equal(
          subscription.status,
          SubscriptionStatus.EXPIRED
        );

        const previousExpiry =
          subscription.expiresAt;

        await renewSubscription(
          subscription.id,
          { days: 15 }
        );

        subscription =
          await prisma.subscription.findUniqueOrThrow(
            {
              where: {
                id: subscription.id,
              },
            }
          );

        assert.equal(
          subscription.status,
          SubscriptionStatus.ACTIVE
        );
        assert.ok(
          previousExpiry &&
            subscription.expiresAt &&
            subscription.expiresAt.getTime() >
              previousExpiry.getTime()
        );

        const invoicesAfterRenewal =
          await prisma.patientInvoice.count({
            where: {
              clinicId:
                fixtures.clinicId,
              subscriptionId:
                subscription.id,
            },
          });

        assert.equal(
          invoicesAfterRenewal,
          2
        );

        await cancelSubscription(
          subscription.id
        );

        subscription =
          await prisma.subscription.findUniqueOrThrow(
            {
              where: {
                id: subscription.id,
              },
            }
          );

        assert.equal(
          subscription.status,
          SubscriptionStatus.CANCELED
        );
        assert.ok(
          subscription.canceledAt
        );

        await assert.rejects(
          () =>
            renewSubscription(
              subscription.id
            ),
          /Canceled subscriptions cannot be renewed\./
        );
      }
    );

    await runCase(
      "plan deactivation cascades and reactivation restores future enrollment paths",
      async () => {
        await createPatient({
          fullName:
            "Bob Membership",
          email:
            "bob.membership@test.local",
          phone: "11922222222",
          birthDate: "1992-02-02",
          document:
            "222.222.222-22",
          zipCode: "05000-001",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Bob, 20",
        });

        const bob =
          await prisma.patient.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                email:
                  "bob.membership@test.local",
              },
            }
          );
        const plan =
          await prisma.membershipPlan.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                name:
                  "Regression Prime",
              },
            }
          );
        const benefit =
          await prisma.membershipBenefit.findFirstOrThrow(
            {
              where: {
                membershipPlanId:
                  plan.id,
                title:
                  "Monthly Consultation",
              },
            }
          );

        await createSubscription({
          patientId: bob.id,
          membershipPlanId:
            plan.id,
          startedAt,
          expiresAt,
        });

        const bobSubscription =
          await prisma.subscription.findFirstOrThrow(
            {
              where: {
                patientId: bob.id,
                membershipPlanId:
                  plan.id,
              },
            }
          );

        assert.equal(
          bobSubscription.status,
          SubscriptionStatus.ACTIVE
        );

        await deactivateMembershipPlan(
          plan.id,
          "Regression Prime"
        );

        const deactivatedPlan =
          await prisma.membershipPlan.findUniqueOrThrow(
            {
              where: {
                id: plan.id,
              },
            }
          );
        const deactivatedBenefit =
          await prisma.membershipBenefit.findUniqueOrThrow(
            {
              where: {
                id: benefit.id,
              },
            }
          );
        const deactivatedBobSubscription =
          await prisma.subscription.findUniqueOrThrow(
            {
              where: {
                id: bobSubscription.id,
              },
            }
          );

        assert.equal(
          deactivatedPlan.active,
          false
        );
        assert.equal(
          deactivatedBenefit.active,
          false
        );
        assert.equal(
          deactivatedBobSubscription.status,
          SubscriptionStatus.CANCELED
        );

        await assert.rejects(
          () =>
            createSubscription({
              patientId: bob.id,
              membershipPlanId:
                plan.id,
              startedAt,
              expiresAt,
            }),
          /Only active plans can receive subscriptions\./
        );

        await reactivateMembershipPlan(
          plan.id
        );
        await reactivateMembershipBenefit(
          benefit.id
        );

        await createPatient({
          fullName:
            "Carol Membership",
          email:
            "carol.membership@test.local",
          phone: "11933333333",
          birthDate: "1993-03-03",
          document:
            "333.333.333-33",
          zipCode: "05000-002",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Carol, 30",
        });

        const carol =
          await prisma.patient.findFirstOrThrow(
            {
              where: {
                clinicId:
                  fixtures.clinicId,
                email:
                  "carol.membership@test.local",
              },
            }
          );

        await createSubscription({
          patientId: carol.id,
          membershipPlanId:
            plan.id,
          startedAt,
          expiresAt,
        });

        const reactivatedPlan =
          await prisma.membershipPlan.findUniqueOrThrow(
            {
              where: {
                id: plan.id,
              },
            }
          );
        const reactivatedBenefit =
          await prisma.membershipBenefit.findUniqueOrThrow(
            {
              where: {
                id: benefit.id,
              },
            }
          );
        const carolSubscription =
          await prisma.subscription.findFirstOrThrow(
            {
              where: {
                patientId:
                  carol.id,
                membershipPlanId:
                  plan.id,
              },
            }
          );

        assert.equal(
          reactivatedPlan.active,
          true
        );
        assert.equal(
          reactivatedBenefit.active,
          true
        );
        assert.equal(
          carolSubscription.status,
          SubscriptionStatus.ACTIVE
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
