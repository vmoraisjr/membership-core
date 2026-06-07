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
  ClinicSubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  PatientStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  clearCurrentAppUserForTests,
  setCurrentAppUserForTests,
  type CurrentAppUser,
} from "@/features/auth/services/get-current-app-user";
import { getBillingOverview } from "@/features/billing/services/billing-foundation";
import { updateClinicSubscriptionStatus } from "@/features/billing/services/billing-foundation";
import { markClinicInvoiceOverdueAction } from "@/features/billing/actions/mark-clinic-invoice-overdue";
import { markClinicInvoicePaidAction } from "@/features/billing/actions/mark-clinic-invoice-paid";
import { cancelPatientInvoiceAction } from "@/features/billing/actions/cancel-patient-invoice";
import { markPatientInvoiceOverdueAction } from "@/features/billing/actions/mark-patient-invoice-overdue";
import { markPatientInvoicePaidAction } from "@/features/billing/actions/mark-patient-invoice-paid";
import { updatePatientInvoicePaymentMethodAction } from "@/features/billing/actions/update-patient-invoice-payment-method";
import { cancelSubscription } from "@/features/subscriptions/actions/cancel-subscription";

type FixtureState = {
  alphaClinicId: string;
  betaClinicId: string;
  alphaOwner: CurrentAppUser;
  alphaFinance: CurrentAppUser;
  alphaStaff: CurrentAppUser;
  betaOwner: CurrentAppUser;
  alphaPatientInvoiceId: string;
  alphaClinicInvoiceId: string;
  alphaSubscriptionId: string;
  alphaClinicSubscriptionId: string;
};

let fixtures: FixtureState;

async function cleanupFixtures() {
  const clinics =
    await prisma.clinic.findMany({
      where: {
        slug: {
          in: [
            "billing-alpha",
            "billing-beta",
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
    prisma.subscription.deleteMany({
      where: {
        patient: {
          clinicId: {
            in: clinicIds,
          },
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
    prisma.clinicBillingPlan.deleteMany({
      where: {
        name:
          "Billing Hardening SaaS",
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
          name: "Billing Alpha",
          brandName: "Alpha",
          slug: "billing-alpha",
          document:
            "88.888.888/0001-88",
          email:
            "alpha@billing.test",
          phone: "11888888888",
          zipCode: "08000-000",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Billing Alpha, 8",
          status: ClinicStatus.ACTIVE,
        },
      }),
      prisma.clinic.create({
        data: {
          name: "Billing Beta",
          brandName: "Beta",
          slug: "billing-beta",
          document:
            "99.999.999/0001-99",
          email:
            "beta@billing.test",
          phone: "11999999999",
          zipCode: "09000-000",
          city: "Rio de Janeiro",
          state: "RJ",
          address:
            "Rua Billing Beta, 9",
          status: ClinicStatus.ACTIVE,
        },
      }),
    ]);

  const [
    alphaOwner,
    alphaFinance,
    alphaStaff,
    betaOwner,
  ] = await Promise.all([
    prisma.appUser.create({
      data: {
        clinicId: alphaClinic.id,
        name: "Alpha Owner",
        email:
          "owner@billing-alpha.test",
        role: AppUserRole.OWNER,
      },
    }),
    prisma.appUser.create({
      data: {
        clinicId: alphaClinic.id,
        name: "Alpha Finance",
        email:
          "finance@billing-alpha.test",
        role: AppUserRole.FINANCE,
      },
    }),
    prisma.appUser.create({
      data: {
        clinicId: alphaClinic.id,
        name: "Alpha Staff",
        email:
          "staff@billing-alpha.test",
        role: AppUserRole.STAFF,
      },
    }),
    prisma.appUser.create({
      data: {
        clinicId: betaClinic.id,
        name: "Beta Owner",
        email:
          "owner@billing-beta.test",
        role: AppUserRole.OWNER,
      },
    }),
  ]);

  const [alphaPatient, betaPatient] =
    await Promise.all([
      prisma.patient.create({
        data: {
          clinicId: alphaClinic.id,
          fullName: "Alice Billing",
          email:
            "alice@billing.test",
          phone: "11911111111",
          birthDate: new Date(
            "1991-01-01T00:00:00.000Z"
          ),
          document:
            "111.111.111-11",
          zipCode: "08000-000",
          city: "Sao Paulo",
          state: "SP",
          address:
            "Rua Alice Billing, 10",
          status: PatientStatus.ACTIVE,
        },
      }),
      prisma.patient.create({
        data: {
          clinicId: betaClinic.id,
          fullName: "Bob Billing",
          email:
            "bob@billing.test",
          phone: "21922222222",
          birthDate: new Date(
            "1992-02-02T00:00:00.000Z"
          ),
          document:
            "222.222.222-22",
          zipCode: "09000-000",
          city: "Rio de Janeiro",
          state: "RJ",
          address:
            "Rua Bob Billing, 20",
          status: PatientStatus.ACTIVE,
        },
      }),
    ]);

  const [alphaPlan, betaPlan] =
    await Promise.all([
      prisma.membershipPlan.create({
        data: {
          clinicId: alphaClinic.id,
          name: "Alpha Billing Plan",
          monthlyPrice: 150,
          active: true,
        },
      }),
      prisma.membershipPlan.create({
        data: {
          clinicId: betaClinic.id,
          name: "Beta Billing Plan",
          monthlyPrice: 175,
          active: true,
        },
      }),
    ]);

  const [alphaSubscription, betaSubscription] =
    await Promise.all([
      prisma.subscription.create({
        data: {
          patientId: alphaPatient.id,
          membershipPlanId:
            alphaPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          expiresAt: new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                30
          ),
        },
      }),
      prisma.subscription.create({
        data: {
          patientId: betaPatient.id,
          membershipPlanId:
            betaPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          expiresAt: new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                30
          ),
        },
      }),
    ]);

  const [alphaPatientInvoice] =
    await Promise.all([
      prisma.patientInvoice.create({
        data: {
          clinicId: alphaClinic.id,
          patientId: alphaPatient.id,
          subscriptionId:
            alphaSubscription.id,
          status: PaymentStatus.PENDING,
          billingCycle:
            BillingCycle.MONTHLY,
          amount: 150,
          dueDate: new Date(),
          description:
            "Alpha patient invoice",
        },
      }),
      prisma.patientInvoice.create({
        data: {
          clinicId: betaClinic.id,
          patientId: betaPatient.id,
          subscriptionId:
            betaSubscription.id,
          status: PaymentStatus.PENDING,
          billingCycle:
            BillingCycle.MONTHLY,
          amount: 175,
          dueDate: new Date(),
          description:
            "Beta patient invoice",
        },
      }),
    ]);

  const billingPlan =
    await prisma.clinicBillingPlan.create({
      data: {
        name:
          "Billing Hardening SaaS",
        monthlyPrice: 249,
        annualPrice: 2490,
        trialDays: 14,
        active: true,
      },
    });

  const [alphaClinicSubscription] =
    await Promise.all([
      prisma.clinicSubscription.create({
        data: {
          clinicId: alphaClinic.id,
          clinicBillingPlanId:
            billingPlan.id,
          status:
            ClinicSubscriptionStatus.TRIAL,
          startedAt: new Date(),
          trialEndsAt: new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                14
          ),
          expiresAt: new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                14
          ),
        },
      }),
      prisma.clinicSubscription.create({
        data: {
          clinicId: betaClinic.id,
          clinicBillingPlanId:
            billingPlan.id,
          status:
            ClinicSubscriptionStatus.TRIAL,
          startedAt: new Date(),
          trialEndsAt: new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                14
          ),
          expiresAt: new Date(
            Date.now() +
              1000 *
                60 *
                60 *
                24 *
                14
          ),
        },
      }),
    ]);

  const [alphaClinicInvoice] =
    await Promise.all([
      prisma.clinicInvoice.create({
        data: {
          clinicId: alphaClinic.id,
          clinicSubscriptionId:
            alphaClinicSubscription.id,
          status: PaymentStatus.PENDING,
          amount: 249,
          dueDate: new Date(),
          description:
            "Alpha SaaS invoice",
        },
      }),
      prisma.clinicInvoice.create({
        data: {
          clinicId: betaClinic.id,
          clinicSubscriptionId:
            (
              await prisma.clinicSubscription.findFirstOrThrow(
                {
                  where: {
                    clinicId:
                      betaClinic.id,
                  },
                }
              )
            ).id,
          status: PaymentStatus.PENDING,
          amount: 249,
          dueDate: new Date(),
          description:
            "Beta SaaS invoice",
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
    alphaFinance: {
      id: alphaFinance.id,
      clinicId: alphaClinic.id,
      name: alphaFinance.name,
      email: alphaFinance.email,
      role: alphaFinance.role,
    },
    alphaStaff: {
      id: alphaStaff.id,
      clinicId: alphaClinic.id,
      name: alphaStaff.name,
      email: alphaStaff.email,
      role: alphaStaff.role,
    },
    betaOwner: {
      id: betaOwner.id,
      clinicId: betaClinic.id,
      name: betaOwner.name,
      email: betaOwner.email,
      role: betaOwner.role,
    },
    alphaPatientInvoiceId:
      alphaPatientInvoice.id,
    alphaClinicInvoiceId:
      alphaClinicInvoice.id,
    alphaSubscriptionId:
      alphaSubscription.id,
    alphaClinicSubscriptionId:
      alphaClinicSubscription.id,
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
      "finance can manage patient billing without duplicate payment records",
      async () => {
        asUser(fixtures.alphaFinance);

        const methodForm =
          new FormData();
        methodForm.set(
          "invoiceId",
          fixtures.alphaPatientInvoiceId
        );
        methodForm.set(
          "paymentMethod",
          PaymentMethod.PIX
        );

        await updatePatientInvoicePaymentMethodAction(
          methodForm
        );

        const overdueForm =
          new FormData();
        overdueForm.set(
          "invoiceId",
          fixtures.alphaPatientInvoiceId
        );

        await markPatientInvoiceOverdueAction(
          overdueForm
        );

        let invoice =
          await prisma.patientInvoice.findUniqueOrThrow(
            {
              where: {
                id: fixtures.alphaPatientInvoiceId,
              },
            }
          );

        assert.equal(
          invoice.status,
          PaymentStatus.OVERDUE
        );

        const payForm = new FormData();
        payForm.set(
          "invoiceId",
          fixtures.alphaPatientInvoiceId
        );
        payForm.set(
          "paymentMethod",
          PaymentMethod.PIX
        );

        await markPatientInvoicePaidAction(
          payForm
        );
        await markPatientInvoicePaidAction(
          payForm
        );

        invoice =
          await prisma.patientInvoice.findUniqueOrThrow(
            {
              where: {
                id: fixtures.alphaPatientInvoiceId,
              },
            }
          );

        const payments =
          await prisma.patientPayment.findMany(
            {
              where: {
                patientInvoiceId:
                  fixtures.alphaPatientInvoiceId,
              },
            }
          );

        assert.equal(
          invoice.status,
          PaymentStatus.PAID
        );
        assert.ok(invoice.paidAt);
        assert.equal(
          invoice.paymentMethod,
          PaymentMethod.PIX
        );
        assert.equal(
          payments.length,
          1
        );
        assert.equal(
          payments[0]?.paymentMethod,
          PaymentMethod.PIX
        );

        await assert.rejects(
          () =>
            markPatientInvoiceOverdueAction(
              overdueForm
            ),
          /Only pending patient invoices can be marked as overdue\./
        );

        const overview =
          await getBillingOverview();
        const paidOverviewInvoice =
          overview.patientInvoices.find(
            (entry) =>
              entry.id ===
              fixtures.alphaPatientInvoiceId
          );

        assert.equal(
          paidOverviewInvoice?.subscription
            ?.membershipPlan.name,
          "Alpha Billing Plan"
        );
        assert.equal(
          paidOverviewInvoice?.payments[0]
            ?.paymentMethod,
          PaymentMethod.PIX
        );
      }
    );

    await runCase(
      "finance can update payment method and cancel pending invoices manually",
      async () => {
        asUser(fixtures.alphaFinance);

        const invoice =
          await prisma.patientInvoice.create({
            data: {
              clinicId:
                fixtures.alphaClinicId,
              patientId:
                (
                  await prisma.patient.findFirstOrThrow(
                    {
                      where: {
                        clinicId:
                          fixtures.alphaClinicId,
                      },
                    }
                  )
                ).id,
              subscriptionId:
                fixtures.alphaSubscriptionId,
              status:
                PaymentStatus.PENDING,
              billingCycle:
                BillingCycle.MONTHLY,
              amount: 150,
              dueDate: new Date(),
              description:
                "Alpha patient cancelable invoice",
            },
          });

        const methodForm =
          new FormData();
        methodForm.set(
          "invoiceId",
          invoice.id
        );
        methodForm.set(
          "paymentMethod",
          PaymentMethod.CARD
        );

        await updatePatientInvoicePaymentMethodAction(
          methodForm
        );

        let updatedInvoice =
          await prisma.patientInvoice.findUniqueOrThrow(
            {
              where: {
                id: invoice.id,
              },
            }
          );

        assert.equal(
          updatedInvoice.paymentMethod,
          PaymentMethod.CARD
        );

        const cancelForm =
          new FormData();
        cancelForm.set(
          "invoiceId",
          invoice.id
        );

        await cancelPatientInvoiceAction(
          cancelForm
        );

        updatedInvoice =
          await prisma.patientInvoice.findUniqueOrThrow(
            {
              where: {
                id: invoice.id,
              },
            }
          );

        assert.equal(
          updatedInvoice.status,
          PaymentStatus.CANCELED
        );
        assert.equal(
          updatedInvoice.paymentMethod,
          PaymentMethod.CARD
        );

        await assert.rejects(
          () =>
            markPatientInvoicePaidAction(
              cancelForm
            ),
          /Only pending or overdue patient invoices can be marked as paid\./
        );
      }
    );

    await runCase(
      "staff cannot manage billing and tenant scope is preserved",
      async () => {
        asUser(fixtures.alphaStaff);

        const form = new FormData();
        form.set(
          "invoiceId",
          fixtures.alphaPatientInvoiceId
        );

        await assert.rejects(
          () =>
            markPatientInvoicePaidAction(
              form
            ),
          /permission/i
        );

        asUser(fixtures.betaOwner);

        await assert.rejects(
          () =>
            markPatientInvoicePaidAction(
              form
            ),
          /Patient invoice not found\./
        );
      }
    );

    await runCase(
      "clinic billing transitions update SaaS subscription state safely",
      async () => {
        asUser(fixtures.alphaOwner);

        const overdueForm =
          new FormData();
        overdueForm.set(
          "invoiceId",
          fixtures.alphaClinicInvoiceId
        );

        await markClinicInvoiceOverdueAction(
          overdueForm
        );

        const overdueClinicInvoice =
          await prisma.clinicInvoice.findUniqueOrThrow(
            {
              where: {
                id: fixtures.alphaClinicInvoiceId,
              },
              include: {
                clinicSubscription: true,
              },
            }
          );

        assert.equal(
          overdueClinicInvoice.status,
          PaymentStatus.OVERDUE
        );
        assert.equal(
          overdueClinicInvoice
            .clinicSubscription
            .status,
          ClinicSubscriptionStatus.PAST_DUE
        );

        const payForm = new FormData();
        payForm.set(
          "invoiceId",
          fixtures.alphaClinicInvoiceId
        );

        await markClinicInvoicePaidAction(
          payForm
        );
        await markClinicInvoicePaidAction(
          payForm
        );

        const paidClinicInvoice =
          await prisma.clinicInvoice.findUniqueOrThrow(
            {
              where: {
                id: fixtures.alphaClinicInvoiceId,
              },
              include: {
                clinicSubscription: true,
                payments: true,
              },
            }
          );

        assert.equal(
          paidClinicInvoice.status,
          PaymentStatus.PAID
        );
        assert.equal(
          paidClinicInvoice
            .clinicSubscription
            .status,
          ClinicSubscriptionStatus.ACTIVE
        );
        assert.equal(
          paidClinicInvoice.payments.length,
          1
        );

        await assert.rejects(
          () =>
            markClinicInvoiceOverdueAction(
              overdueForm
            ),
          /Only pending clinic invoices can be marked as overdue\./
        );
      }
    );

    await runCase(
      "billing overview keeps canceled subscription invoice history visible to the clinic only",
      async () => {
        asUser(fixtures.alphaOwner);

        await cancelSubscription(
          fixtures.alphaSubscriptionId
        );

        const overview =
          await getBillingOverview();

        const invoice =
          overview.patientInvoices.find(
            (entry) =>
              entry.id ===
              fixtures.alphaPatientInvoiceId
          );

        assert.ok(invoice);
        assert.equal(
          invoice?.subscription?.status,
          SubscriptionStatus.CANCELED
        );

        asUser(fixtures.betaOwner);

        const betaOverview =
          await getBillingOverview();

        assert.equal(
          betaOverview.patientInvoices.some(
            (entry) =>
              entry.id ===
              fixtures.alphaPatientInvoiceId
          ),
          false
        );
      }
    );

    await runCase(
      "manual SaaS lifecycle transitions are explicit and canceled subscriptions are not auto-recreated",
      async () => {
        asUser(fixtures.alphaOwner);

        const suspended =
          await updateClinicSubscriptionStatus(
            {
              clinicId:
                fixtures.alphaClinicId,
              subscriptionId:
                fixtures.alphaClinicSubscriptionId,
              status:
                ClinicSubscriptionStatus.SUSPENDED,
            }
          );

        assert.equal(
          suspended.status,
          ClinicSubscriptionStatus.SUSPENDED
        );

        const reactivated =
          await updateClinicSubscriptionStatus(
            {
              clinicId:
                fixtures.alphaClinicId,
              subscriptionId:
                fixtures.alphaClinicSubscriptionId,
              status:
                ClinicSubscriptionStatus.ACTIVE,
            }
          );

        assert.equal(
          reactivated.status,
          ClinicSubscriptionStatus.ACTIVE
        );

        const canceled =
          await updateClinicSubscriptionStatus(
            {
              clinicId:
                fixtures.alphaClinicId,
              subscriptionId:
                fixtures.alphaClinicSubscriptionId,
              status:
                ClinicSubscriptionStatus.CANCELED,
            }
          );

        assert.equal(
          canceled.status,
          ClinicSubscriptionStatus.CANCELED
        );
        assert.ok(canceled.canceledAt);

        await assert.rejects(
          () =>
            updateClinicSubscriptionStatus(
              {
                clinicId:
                  fixtures.alphaClinicId,
                subscriptionId:
                  fixtures.alphaClinicSubscriptionId,
                status:
                  ClinicSubscriptionStatus.ACTIVE,
              }
            ),
          /cannot transition from CANCELED to ACTIVE/
        );

        const overview =
          await getBillingOverview();

        assert.equal(
          overview.clinicSubscription?.id,
          fixtures.alphaClinicSubscriptionId
        );
        assert.equal(
          overview.clinicSubscription
            ?.status,
          ClinicSubscriptionStatus.CANCELED
        );
      }
    );

    await runCase(
      "paying a clinic invoice does not resurrect a canceled SaaS subscription",
      async () => {
        asUser(fixtures.alphaOwner);

        await prisma.clinicInvoice.update({
          where: {
            id: fixtures.alphaClinicInvoiceId,
          },
          data: {
            status: PaymentStatus.OVERDUE,
            paidAt: null,
          },
        });

        const payForm = new FormData();
        payForm.set(
          "invoiceId",
          fixtures.alphaClinicInvoiceId
        );

        await markClinicInvoicePaidAction(
          payForm
        );

        const subscription =
          await prisma.clinicSubscription.findUniqueOrThrow(
            {
              where: {
                id: fixtures.alphaClinicSubscriptionId,
              },
            }
          );

        assert.equal(
          subscription.status,
          ClinicSubscriptionStatus.CANCELED
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
