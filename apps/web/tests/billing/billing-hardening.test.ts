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
import {
  canClinicOperate,
  ensureClinicBillingFoundation,
  reconcileClinicSubscriptionAutomation,
} from "@/features/billing/services/billing-foundation";
import { BILLING_POLICY } from "@/features/billing/constants/billing-policy";
import {
  fakeBillingGateway,
  signFakeWebhookPayload,
} from "@/features/billing/gateway/fake-billing-gateway";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";
import {
  pauseCompanySubscriptionAction,
  requestCompanySubscriptionCancellationAction,
  resumeCompanySubscriptionAction,
  undoCompanySubscriptionCancellationAction,
} from "@/features/billing/actions/company-subscription-actions";
import { platformResyncClinicSubscriptionAction } from "@/features/billing/actions/platform-resync-clinic-subscription";
import { platformCheckClinicSubscriptionDivergenceAction } from "@/features/billing/actions/platform-check-clinic-subscription-divergence";
import {
  platformMarkClinicInvoicePaidAction,
  platformUpdateClinicSubscriptionStatusAction,
} from "@/features/billing/actions/platform-manage-clinic-subscription";
import { NextRequest } from "next/server";
import { POST as billingWebhookPOST } from "@/app/api/webhooks/billing/route";

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
            "529.982.247-25",
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
            "111.444.777-35",
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

async function postSignedBillingWebhook(
  payload: Record<string, unknown>
) {
  const body = JSON.stringify(payload);
  const signature =
    signFakeWebhookPayload(body);
  const request = new NextRequest(
    "http://localhost/api/webhooks/billing",
    {
      method: "POST",
      headers: {
        "x-billing-webhook-signature":
          signature,
      },
      body,
    }
  );

  return billingWebhookPOST(request);
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

    await runCase(
      "fake billing gateway is deterministic and its webhook signature verification rejects tampered payloads",
      async () => {
        fakeBillingGateway.__reset();

        const customerA =
          await fakeBillingGateway.createCustomer(
            {
              clinicId: "gateway-det-1",
              email: "a@example.com",
              name: "Clinic A",
            }
          );
        const customerAAgain =
          await fakeBillingGateway.createCustomer(
            {
              clinicId: "gateway-det-1",
              email: "a@example.com",
              name: "Clinic A",
            }
          );
        const customerB =
          await fakeBillingGateway.createCustomer(
            {
              clinicId: "gateway-det-2",
              email: "b@example.com",
              name: "Clinic B",
            }
          );

        assert.equal(
          customerA.externalCustomerId,
          customerAAgain.externalCustomerId
        );
        assert.notEqual(
          customerA.externalCustomerId,
          customerB.externalCustomerId
        );

        const gateway =
          getBillingGateway();

        assert.equal(
          gateway.kind,
          "FAKE"
        );

        const body = JSON.stringify({
          id: "evt_1",
          type: "invoice.paid",
          externalSubscriptionId:
            "fake_sub_gateway-det-1",
          data: { amount: 249 },
        });
        const validSignature =
          signFakeWebhookPayload(body);

        const event =
          gateway.verifyWebhookSignature(
            {
              rawBody: body,
              signatureHeader:
                validSignature,
            }
          );

        assert.equal(
          event.externalEventId,
          "evt_1"
        );
        assert.equal(
          event.type,
          "invoice.paid"
        );

        assert.throws(() =>
          gateway.verifyWebhookSignature({
            rawBody: body,
            signatureHeader:
              "0".repeat(
                validSignature.length
              ),
          })
        );
        assert.throws(() =>
          gateway.verifyWebhookSignature({
            rawBody: body,
            signatureHeader: null,
          })
        );

        fakeBillingGateway.__reset();
      }
    );

    await runCase(
      "provisioning a clinic starts a single gateway trial and is idempotent against a second call",
      async () => {
        clearCurrentAppUserForTests();

        const clinic =
          await prisma.clinic.create({
            data: {
              name: "Billing Gateway Co",
              brandName: "Gateway Co",
              slug: "billing-gateway",
              document:
                "77.777.777/0001-77",
              email:
                "gateway@billing.test",
              phone: "11777777777",
              zipCode: "07000-000",
              city: "Sao Paulo",
              state: "SP",
              address:
                "Rua Billing Gateway, 7",
              status:
                ClinicStatus.ACTIVE,
            },
          });

        try {
          const firstCall =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.ok(firstCall);
          assert.equal(
            firstCall!.status,
            ClinicSubscriptionStatus.TRIAL
          );
          assert.equal(
            firstCall!.providerKind,
            "FAKE"
          );
          assert.ok(
            firstCall!.externalCustomerId
          );
          assert.ok(
            firstCall!.externalSubscriptionId
          );

          const trialLengthMs =
            firstCall!.trialEndsAt!.getTime() -
            firstCall!.startedAt.getTime();
          const trialLengthDays =
            Math.round(
              trialLengthMs /
                (1000 * 60 * 60 * 24)
            );

          assert.equal(
            trialLengthDays,
            BILLING_POLICY.trialDays
          );

          const secondCall =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.equal(
            secondCall!.id,
            firstCall!.id
          );
          assert.equal(
            secondCall!
              .externalSubscriptionId,
            firstCall!
              .externalSubscriptionId
          );

          const subscriptionCount =
            await prisma.clinicSubscription.count(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            );

          assert.equal(
            subscriptionCount,
            1
          );
        } finally {
          await prisma.$transaction([
            prisma.auditLog.deleteMany({
              where: {
                clinicId: clinic.id,
              },
            }),
            prisma.clinicInvoice.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinicSubscription.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinic.deleteMany({
              where: {
                id: clinic.id,
              },
            }),
          ]);
        }
      }
    );

    await runCase(
      "company self-service pause/resume/cancel act only on the caller's own gateway subscription, staff cannot manage it, and a scheduled cancellation reconciles only after the paid period ends",
      async () => {
        clearCurrentAppUserForTests();

        const clinic =
          await prisma.clinic.create({
            data: {
              name: "Billing Selfservice Co",
              brandName:
                "Selfservice Co",
              slug: "billing-selfservice",
              document:
                "66.666.666/0001-66",
              email:
                "selfservice@billing.test",
              phone: "11666666666",
              zipCode: "06000-000",
              city: "Sao Paulo",
              state: "SP",
              address:
                "Rua Billing Selfservice, 6",
              status:
                ClinicStatus.ACTIVE,
            },
          });

        try {
          const subscription =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.ok(subscription);

          const owner =
            await prisma.appUser.create(
              {
                data: {
                  clinicId: clinic.id,
                  name: "Selfservice Owner",
                  email:
                    "owner@billing-selfservice.test",
                  role: AppUserRole.OWNER,
                },
              }
            );
          const staff =
            await prisma.appUser.create(
              {
                data: {
                  clinicId: clinic.id,
                  name: "Selfservice Staff",
                  email:
                    "staff@billing-selfservice.test",
                  role: AppUserRole.STAFF,
                },
              }
            );

          // Activate the trial into a paid, active subscription so pause
          // has something meaningful to act on.
          await prisma.clinicSubscription.update(
            {
              where: {
                id: subscription!.id,
              },
              data: {
                status:
                  ClinicSubscriptionStatus.ACTIVE,
              },
            }
          );

          asUser(staff);
          await assert.rejects(() =>
            pauseCompanySubscriptionAction()
          );

          asUser(owner);
          await pauseCompanySubscriptionAction();

          let current =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            current.status,
            ClinicSubscriptionStatus.PAUSED
          );
          assert.equal(
            current.syncStatus,
            "SYNCED"
          );

          await resumeCompanySubscriptionAction();

          current =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            current.status,
            ClinicSubscriptionStatus.ACTIVE
          );

          // Requesting cancellation on an ACTIVE subscription must not
          // cancel it immediately — access continues until period end.
          await requestCompanySubscriptionCancellationAction();

          current =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            current.status,
            ClinicSubscriptionStatus.ACTIVE
          );
          assert.equal(
            current.cancelAtPeriodEnd,
            true
          );

          // Reconciliation must not cancel it early, while the period is
          // still in the future.
          await reconcileClinicSubscriptionAutomation();

          current =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            current.status,
            ClinicSubscriptionStatus.ACTIVE
          );

          // Undo works while the cancellation is still pending.
          await undoCompanySubscriptionCancellationAction();

          current =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            current.cancelAtPeriodEnd,
            false
          );

          // Now request cancellation again and simulate the period
          // already having ended — only then must reconciliation cancel.
          await requestCompanySubscriptionCancellationAction();
          await prisma.clinicSubscription.update(
            {
              where: {
                id: subscription!.id,
              },
              data: {
                expiresAt: new Date(
                  Date.now() -
                    1000 * 60 * 60
                ),
              },
            }
          );

          await reconcileClinicSubscriptionAutomation();

          current =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            current.status,
            ClinicSubscriptionStatus.CANCELED
          );

          clearCurrentAppUserForTests();
        } finally {
          await prisma.$transaction([
            prisma.auditLog.deleteMany({
              where: {
                clinicId: clinic.id,
              },
            }),
            prisma.clinicInvoice.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinicSubscription.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
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
      }
    );

    await runCase(
      "billing webhook: invalid signature and unknown-tenant events change nothing; a signed payment_succeeded reconciles the invoice, extends the period, and a replay is a no-op",
      async () => {
        clearCurrentAppUserForTests();

        const clinic =
          await prisma.clinic.create({
            data: {
              name: "Billing Webhook Co",
              brandName: "Webhook Co",
              slug: "billing-webhook",
              document:
                "55.555.555/0001-55",
              email:
                "webhook@billing.test",
              phone: "11555555555",
              zipCode: "05000-000",
              city: "Sao Paulo",
              state: "SP",
              address:
                "Rua Billing Webhook, 5",
              status:
                ClinicStatus.ACTIVE,
            },
          });

        try {
          const subscription =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.ok(subscription);
          assert.ok(
            subscription!
              .externalSubscriptionId
          );

          const invalidResponse =
            await billingWebhookPOST(
              new NextRequest(
                "http://localhost/api/webhooks/billing",
                {
                  method: "POST",
                  headers: {
                    "x-billing-webhook-signature":
                      "not-a-real-signature",
                  },
                  body: JSON.stringify({
                    id: "evt_bad",
                    type: "invoice.paid",
                    externalSubscriptionId:
                      subscription!
                        .externalSubscriptionId,
                  }),
                }
              )
            );

          assert.equal(
            invalidResponse.status,
            400
          );

          const eventAfterInvalid =
            await prisma.billingWebhookEvent.findUnique(
              {
                where: {
                  externalEventId:
                    "evt_bad",
                },
              }
            );

          assert.equal(
            eventAfterInvalid,
            null
          );

          const unknownResponse =
            await postSignedBillingWebhook(
              {
                id: "evt_unknown_sub",
                type: "invoice.paid",
                externalSubscriptionId:
                  "fake_sub_does-not-exist",
              }
            );

          assert.equal(
            unknownResponse.status,
            200
          );

          const unknownEvent =
            await prisma.billingWebhookEvent.findUniqueOrThrow(
              {
                where: {
                  externalEventId:
                    "evt_unknown_sub",
                },
              }
            );

          assert.equal(
            unknownEvent.clinicId,
            null
          );
          assert.equal(
            unknownEvent.error,
            "unknown_subscription"
          );

          const untouchedSubscription =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            untouchedSubscription.status,
            ClinicSubscriptionStatus.TRIAL
          );

          const eventId = `evt_paid_${subscription!.id}`;
          const paidResponse =
            await postSignedBillingWebhook(
              {
                id: eventId,
                type: "payment.succeeded",
                externalSubscriptionId:
                  subscription!
                    .externalSubscriptionId,
              }
            );

          assert.equal(
            paidResponse.status,
            200
          );

          const afterPaid =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
                include: {
                  invoices: true,
                },
              }
            );

          assert.equal(
            afterPaid.status,
            ClinicSubscriptionStatus.ACTIVE
          );
          assert.equal(
            afterPaid.invoices.filter(
              (invoice) =>
                invoice.status ===
                "PAID"
            ).length,
            1
          );
          assert.equal(
            afterPaid.invoices.filter(
              (invoice) =>
                invoice.status ===
                "PENDING"
            ).length,
            1
          );

          const invoiceCountAfterFirstPaid =
            afterPaid.invoices.length;

          // Replay of the exact same event must not duplicate anything.
          const replayResponse =
            await postSignedBillingWebhook(
              {
                id: eventId,
                type: "payment.succeeded",
                externalSubscriptionId:
                  subscription!
                    .externalSubscriptionId,
              }
            );
          const replayBody =
            await replayResponse.json();

          assert.equal(
            replayBody.duplicate,
            true
          );

          const afterReplay =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
                include: {
                  invoices: true,
                },
              }
            );

          assert.equal(
            afterReplay.invoices.length,
            invoiceCountAfterFirstPaid
          );

          // A failed charge on the next cycle: access must continue
          // (PAY-003 tolerance) and only escalate once the tolerance
          // window has actually elapsed.
          const failedResponse =
            await postSignedBillingWebhook(
              {
                id: `evt_failed_${subscription!.id}`,
                type: "payment.failed",
                externalSubscriptionId:
                  subscription!
                    .externalSubscriptionId,
              }
            );

          assert.equal(
            failedResponse.status,
            200
          );

          const afterFailed =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            afterFailed.status,
            ClinicSubscriptionStatus.PAST_DUE
          );
          assert.equal(
            canClinicOperate(
              afterFailed.status
            ),
            true
          );

          await reconcileClinicSubscriptionAutomation();

          const stillWithinTolerance =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            stillWithinTolerance.status,
            ClinicSubscriptionStatus.PAST_DUE
          );

          // Simulate the tolerance window having elapsed.
          const overdueInvoice =
            await prisma.clinicInvoice.findFirst(
              {
                where: {
                  clinicSubscriptionId:
                    subscription!.id,
                  status: "OVERDUE",
                },
              }
            );

          assert.ok(overdueInvoice);

          const toleranceElapsedDueDate =
            new Date(
              Date.now() -
                1000 *
                  60 *
                  60 *
                  24 *
                  (BILLING_POLICY.paymentRetryToleranceDays +
                    1)
            );

          // `reconcileClinicSubscriptionAutomation` looks at the invoice
          // with the latest `dueDate` — push every other invoice on this
          // subscription further into the past first, so the OVERDUE one
          // stays "latest" once backdated to simulate the tolerance
          // window having elapsed.
          await prisma.clinicInvoice.updateMany(
            {
              where: {
                clinicSubscriptionId:
                  subscription!.id,
                id: {
                  not: overdueInvoice!
                    .id,
                },
              },
              data: {
                dueDate: new Date(
                  toleranceElapsedDueDate.getTime() -
                    1000 *
                      60 *
                      60 *
                      24 *
                      365
                ),
              },
            }
          );
          await prisma.clinicInvoice.update(
            {
              where: {
                id: overdueInvoice!.id,
              },
              data: {
                dueDate:
                  toleranceElapsedDueDate,
              },
            }
          );

          await reconcileClinicSubscriptionAutomation();

          const afterTolerance =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            afterTolerance.status,
            ClinicSubscriptionStatus.SUSPENDED
          );
          assert.equal(
            canClinicOperate(
              afterTolerance.status
            ),
            false
          );

          clearCurrentAppUserForTests();
        } finally {
          await prisma.$transaction([
            prisma.billingWebhookEvent.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.auditLog.deleteMany({
              where: {
                clinicId: clinic.id,
              },
            }),
            prisma.clinicInvoice.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinicSubscription.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinic.deleteMany({
              where: {
                id: clinic.id,
              },
            }),
          ]);
        }
      }
    );

    await runCase(
      "platform manual resync applies the gateway's truth and is a no-op when already in sync",
      async () => {
        clearCurrentAppUserForTests();

        const clinic =
          await prisma.clinic.create({
            data: {
              name: "Billing Resync Co",
              brandName: "Resync Co",
              slug: "billing-resync",
              document:
                "44.444.444/0001-44",
              email:
                "resync@billing.test",
              phone: "11444444444",
              zipCode: "04000-000",
              city: "Sao Paulo",
              state: "SP",
              address:
                "Rua Billing Resync, 4",
              status:
                ClinicStatus.ACTIVE,
            },
          });

        let platformOwnerUserId:
          | string
          | undefined;

        try {
          const subscription =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.ok(subscription);

          const platformOwnerUser =
            await prisma.appUser.create(
              {
                data: {
                  clinicId: null,
                  name: "Platform Owner Resync",
                  email:
                    "owner@platform-resync.test",
                  role: AppUserRole.OWNER,
                },
              }
            );

          platformOwnerUserId =
            platformOwnerUser.id;

          asUser(platformOwnerUser);

          const formData = new FormData();
          formData.set(
            "subscriptionId",
            subscription!.id
          );

          // Gateway and local already agree (both TRIAL) — a resync must
          // not fabricate a change.
          await platformResyncClinicSubscriptionAction(
            formData
          );

          const unchanged =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            unchanged.status,
            ClinicSubscriptionStatus.TRIAL
          );

          // Force the gateway's own record out of sync with local, then
          // resync must pull local back in line with the gateway.
          fakeBillingGateway.__setSubscriptionState(
            subscription!
              .externalSubscriptionId!,
            "active"
          );

          await platformResyncClinicSubscriptionAction(
            formData
          );

          const synced =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            synced.status,
            ClinicSubscriptionStatus.ACTIVE
          );

          clearCurrentAppUserForTests();
        } finally {
          await prisma.$transaction([
            prisma.billingWebhookEvent.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.auditLog.deleteMany({
              where: {
                clinicId: clinic.id,
              },
            }),
            prisma.clinicInvoice.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinicSubscription.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinic.deleteMany({
              where: {
                id: clinic.id,
              },
            }),
            ...(platformOwnerUserId
              ? [
                  prisma.appUser.deleteMany(
                    {
                      where: {
                        id: platformOwnerUserId,
                      },
                    }
                  ),
                ]
              : []),
          ]);
        }
      }
    );

    await runCase(
      "platform cannot manually mark a gateway-linked invoice as paid or force its status, but can for a legacy MANUAL subscription",
      async () => {
        clearCurrentAppUserForTests();

        const clinic =
          await prisma.clinic.create({
            data: {
              name: "Billing Guard Co",
              brandName: "Guard Co",
              slug: "billing-guard",
              document:
                "33.333.333/0001-33",
              email:
                "guard@billing.test",
              phone: "11333333333",
              zipCode: "03000-000",
              city: "Sao Paulo",
              state: "SP",
              address:
                "Rua Billing Guard, 3",
              status:
                ClinicStatus.ACTIVE,
            },
          });

        let platformOwnerUserId:
          | string
          | undefined;

        try {
          const subscription =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.ok(subscription);
          assert.equal(
            subscription!.providerKind,
            "FAKE"
          );

          const platformOwnerUser =
            await prisma.appUser.create(
              {
                data: {
                  clinicId: null,
                  name: "Platform Owner Guard",
                  email:
                    "owner@platform-guard.test",
                  role: AppUserRole.OWNER,
                },
              }
            );

          platformOwnerUserId =
            platformOwnerUser.id;
          asUser(platformOwnerUser);

          const invoice =
            subscription!.invoices[0];

          const invoiceForm =
            new FormData();
          invoiceForm.set(
            "invoiceId",
            invoice.id
          );

          await assert.rejects(() =>
            platformMarkClinicInvoicePaidAction(
              invoiceForm
            )
          );

          const statusForm =
            new FormData();
          statusForm.set(
            "clinicId",
            clinic.id
          );
          statusForm.set(
            "subscriptionId",
            subscription!.id
          );
          statusForm.set(
            "status",
            ClinicSubscriptionStatus.ACTIVE
          );

          await assert.rejects(() =>
            platformUpdateClinicSubscriptionStatusAction(
              statusForm
            )
          );

          const untouchedInvoice =
            await prisma.clinicInvoice.findUniqueOrThrow(
              {
                where: {
                  id: invoice.id,
                },
              }
            );

          assert.equal(
            untouchedInvoice.status,
            "PENDING"
          );

          // The legacy MANUAL fixture (alpha) must still work exactly as
          // before — this guard is additive, not a regression for
          // clinics with no gateway involved.
          await platformMarkClinicInvoicePaidAction(
            (() => {
              const form =
                new FormData();
              form.set(
                "invoiceId",
                fixtures.alphaClinicInvoiceId
              );
              return form;
            })()
          );

          const manualInvoice =
            await prisma.clinicInvoice.findUniqueOrThrow(
              {
                where: {
                  id: fixtures.alphaClinicInvoiceId,
                },
              }
            );

          assert.equal(
            manualInvoice.status,
            "PAID"
          );

          clearCurrentAppUserForTests();
        } finally {
          await prisma.$transaction([
            prisma.billingWebhookEvent.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.auditLog.deleteMany({
              where: {
                clinicId: clinic.id,
              },
            }),
            prisma.clinicInvoice.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinicSubscription.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinic.deleteMany({
              where: {
                id: clinic.id,
              },
            }),
            ...(platformOwnerUserId
              ? [
                  prisma.appUser.deleteMany(
                    {
                      where: {
                        id: platformOwnerUserId,
                      },
                    }
                  ),
                ]
              : []),
          ]);
        }
      }
    );

    await runCase(
      "platform divergence check flags but does not correct a mismatch, and resync applies it afterward",
      async () => {
        clearCurrentAppUserForTests();

        const clinic =
          await prisma.clinic.create({
            data: {
              name: "Billing Diverge Co",
              brandName: "Diverge Co",
              slug: "billing-diverge",
              document:
                "22.222.222/0001-22",
              email:
                "diverge@billing.test",
              phone: "11222222222",
              zipCode: "02000-000",
              city: "Sao Paulo",
              state: "SP",
              address:
                "Rua Billing Diverge, 2",
              status:
                ClinicStatus.ACTIVE,
            },
          });

        let platformOwnerUserId:
          | string
          | undefined;

        try {
          const subscription =
            await ensureClinicBillingFoundation(
              clinic.id
            );

          assert.ok(subscription);

          const platformOwnerUser =
            await prisma.appUser.create(
              {
                data: {
                  clinicId: null,
                  name: "Platform Owner Diverge",
                  email:
                    "owner@platform-diverge.test",
                  role: AppUserRole.OWNER,
                },
              }
            );

          platformOwnerUserId =
            platformOwnerUser.id;
          asUser(platformOwnerUser);

          fakeBillingGateway.__setSubscriptionState(
            subscription!
              .externalSubscriptionId!,
            "active"
          );

          const checkForm =
            new FormData();
          checkForm.set(
            "subscriptionId",
            subscription!.id
          );

          await platformCheckClinicSubscriptionDivergenceAction(
            checkForm
          );

          const flagged =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            flagged.syncStatus,
            "DIVERGED"
          );
          // Detect-only: local status must NOT have been auto-corrected.
          assert.equal(
            flagged.status,
            ClinicSubscriptionStatus.TRIAL
          );

          await platformResyncClinicSubscriptionAction(
            checkForm
          );

          const corrected =
            await prisma.clinicSubscription.findUniqueOrThrow(
              {
                where: {
                  id: subscription!.id,
                },
              }
            );

          assert.equal(
            corrected.status,
            ClinicSubscriptionStatus.ACTIVE
          );
          assert.equal(
            corrected.syncStatus,
            "SYNCED"
          );

          clearCurrentAppUserForTests();
        } finally {
          await prisma.$transaction([
            prisma.billingWebhookEvent.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.auditLog.deleteMany({
              where: {
                clinicId: clinic.id,
              },
            }),
            prisma.clinicInvoice.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinicSubscription.deleteMany(
              {
                where: {
                  clinicId: clinic.id,
                },
              }
            ),
            prisma.clinic.deleteMany({
              where: {
                id: clinic.id,
              },
            }),
            ...(platformOwnerUserId
              ? [
                  prisma.appUser.deleteMany(
                    {
                      where: {
                        id: platformOwnerUserId,
                      },
                    }
                  ),
                ]
              : []),
          ]);
        }
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
