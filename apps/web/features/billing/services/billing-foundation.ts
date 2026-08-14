import {
  AuditAction,
  AuditEntity,
  BillingCycle,
  BillingSyncStatus,
  ClinicStatus,
  ClinicSubscriptionStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  getCurrentClinicId,
} from "@/lib/auth/get-current-clinic";
import {
  filterByClinic,
  getCurrentClinicContext,
} from "@/lib/auth/tenant";
import { createAuditLog } from "@/features/audit-log/services/create-audit-log";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { BILLING_POLICY } from "@/features/billing/constants/billing-policy";
import { getBillingGateway } from "@/features/billing/gateway/get-billing-gateway";
import type {
  BillingGatewaySubscription,
  BillingGatewaySubscriptionState,
} from "@/features/billing/gateway/billing-gateway.types";

type BillingClient =
  | typeof prisma
  | Prisma.TransactionClient;

type AuditContext = {
  actor: string;
  actorUserId?: string | null;
};

const CLINIC_SUBSCRIPTION_REUSABLE_STATUSES = [
  ClinicSubscriptionStatus.PENDING,
  ClinicSubscriptionStatus.TRIAL,
  ClinicSubscriptionStatus.ACTIVE,
  ClinicSubscriptionStatus.PAST_DUE,
  ClinicSubscriptionStatus.PAUSED,
  ClinicSubscriptionStatus.SUSPENDED,
  ClinicSubscriptionStatus.CANCELED,
] as const;

const CLINIC_SUBSCRIPTION_TRANSITIONS: Record<
  ClinicSubscriptionStatus,
  readonly ClinicSubscriptionStatus[]
> = {
  PENDING: [
    ClinicSubscriptionStatus.TRIAL,
    ClinicSubscriptionStatus.ACTIVE,
    ClinicSubscriptionStatus.CANCELED,
  ],
  TRIAL: [
    ClinicSubscriptionStatus.ACTIVE,
    ClinicSubscriptionStatus.PAST_DUE,
    ClinicSubscriptionStatus.PAUSED,
    ClinicSubscriptionStatus.SUSPENDED,
    ClinicSubscriptionStatus.CANCELED,
  ],
  ACTIVE: [
    ClinicSubscriptionStatus.PAST_DUE,
    ClinicSubscriptionStatus.PAUSED,
    ClinicSubscriptionStatus.SUSPENDED,
    ClinicSubscriptionStatus.CANCELED,
  ],
  PAST_DUE: [
    ClinicSubscriptionStatus.ACTIVE,
    ClinicSubscriptionStatus.PAUSED,
    ClinicSubscriptionStatus.SUSPENDED,
    ClinicSubscriptionStatus.CANCELED,
  ],
  PAUSED: [
    ClinicSubscriptionStatus.ACTIVE,
    ClinicSubscriptionStatus.CANCELED,
  ],
  SUSPENDED: [
    ClinicSubscriptionStatus.ACTIVE,
    ClinicSubscriptionStatus.CANCELED,
  ],
  CANCELED: [],
};

function getDefaultDueDate(days = 7) {
  const dueDate = new Date();
  dueDate.setDate(
    dueDate.getDate() + days
  );

  return dueDate;
}

function getClinicStatusFromInvoiceStatus(
  currentStatus: ClinicSubscriptionStatus,
  status: PaymentStatus
) {
  if (
    currentStatus ===
    ClinicSubscriptionStatus.CANCELED
  ) {
    return currentStatus;
  }

  switch (status) {
    case PaymentStatus.PAID:
      return ClinicSubscriptionStatus.ACTIVE;
    case PaymentStatus.OVERDUE:
      return ClinicSubscriptionStatus.PAST_DUE;
    case PaymentStatus.CANCELED:
    case PaymentStatus.FAILED:
      return ClinicSubscriptionStatus.SUSPENDED;
    default:
      return ClinicSubscriptionStatus.ACTIVE;
  }
}

function deriveAutomatedClinicSubscriptionStatus(
  subscription: {
    status: ClinicSubscriptionStatus;
    trialEndsAt?: Date | null;
    expiresAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
    providerKind?: string;
    invoices?: Array<{
      dueDate: Date;
      status: PaymentStatus;
      paidAt?: Date | null;
    }>;
  },
  now = new Date()
) {
  if (
    subscription.status ===
    ClinicSubscriptionStatus.CANCELED
  ) {
    return subscription.status;
  }

  // A customer-requested cancellation only takes effect once the paid
  // period actually ends — never mid-period (PAY-002 "não surpreende o
  // cliente"). This check must win over the invoice-based heuristics
  // below, which would otherwise keep nudging the status around.
  if (
    subscription.cancelAtPeriodEnd &&
    subscription.expiresAt &&
    subscription.expiresAt.getTime() <=
      now.getTime()
  ) {
    return ClinicSubscriptionStatus.CANCELED;
  }

  const latestInvoice =
    subscription.invoices?.[0];

  if (
    latestInvoice?.status ===
      PaymentStatus.OVERDUE &&
    latestInvoice.dueDate.getTime() <
      now.getTime() -
        1000 *
          60 *
          60 *
          24 *
          BILLING_POLICY.paymentRetryToleranceDays
  ) {
    return ClinicSubscriptionStatus.SUSPENDED;
  }

  if (
    latestInvoice?.status ===
      PaymentStatus.OVERDUE &&
    latestInvoice.dueDate.getTime() <=
      now.getTime()
  ) {
    return ClinicSubscriptionStatus.PAST_DUE;
  }

  if (
    subscription.status ===
      ClinicSubscriptionStatus.TRIAL &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt.getTime() <=
      now.getTime()
  ) {
    // Legacy manually-administered subscriptions have no automated
    // billing behind them — ending the trial just means "treat as
    // active", same as always. A gateway-linked subscription's first
    // charge is the gateway's job (PAY-003 webhook); until that webhook
    // confirms payment, the trial ending without one is itself a
    // failure to charge, so it starts the same retry/tolerance clock a
    // declined card would — never a silent, unpaid "ACTIVE".
    return subscription.providerKind ===
      "MANUAL" ||
      subscription.providerKind ==
        null
      ? ClinicSubscriptionStatus.ACTIVE
      : ClinicSubscriptionStatus.PAST_DUE;
  }

  if (
    subscription.status ===
      ClinicSubscriptionStatus.ACTIVE &&
    subscription.expiresAt &&
    subscription.expiresAt.getTime() <
      now.getTime() &&
    latestInvoice?.status !==
      PaymentStatus.PAID
  ) {
    return ClinicSubscriptionStatus.PAST_DUE;
  }

  return subscription.status;
}

export async function reconcileClinicSubscriptionAutomation(
  client: BillingClient = prisma
) {
  const subscriptions =
    await client.clinicSubscription.findMany({
      where: {
        status: {
          notIn: [
            ClinicSubscriptionStatus.CANCELED,
            // Paused is customer-controlled (PAY-002): billing/invoice
            // heuristics must not silently move it, only an explicit
            // "Retomar" action (or its own cancellation) does.
            ClinicSubscriptionStatus.PAUSED,
          ],
        },
      },
      include: {
        invoices: {
          orderBy: {
            dueDate: "desc",
          },
          take: 1,
        },
      },
    });

  for (const subscription of subscriptions) {
    const automatedStatus =
      deriveAutomatedClinicSubscriptionStatus(
        subscription
      );

    if (
      automatedStatus !==
      subscription.status
    ) {
      await client.clinicSubscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: automatedStatus,
        },
      });
      await syncClinicModulesForSubscription(
        subscription.id,
        client
      );
    }
  }
}

export function canClinicOperate(
  status:
    | ClinicSubscriptionStatus
    | null
    | undefined
) {
  return (
    status ===
      ClinicSubscriptionStatus.ACTIVE ||
    status ===
      ClinicSubscriptionStatus.TRIAL ||
    // A failed charge does not cut access immediately — the company
    // keeps operating through the retry/tolerance window (PAY-003) and
    // only loses access once that window expires and the automated
    // reconciliation escalates to SUSPENDED.
    status ===
      ClinicSubscriptionStatus.PAST_DUE
  );
}

export function resolveMembershipInvoiceTerms(
  plan: {
    monthlyPrice: number | null;
    annualPrice: number | null;
  },
  preferredCycle?: BillingCycle
) {
  if (
    preferredCycle ===
      BillingCycle.ANNUAL &&
    plan.annualPrice != null
  ) {
    return {
      amount: plan.annualPrice,
      billingCycle:
        BillingCycle.ANNUAL,
    };
  }

  if (plan.monthlyPrice != null) {
    return {
      amount: plan.monthlyPrice,
      billingCycle:
        BillingCycle.MONTHLY,
    };
  }

  if (plan.annualPrice != null) {
    return {
      amount: plan.annualPrice,
      billingCycle:
        BillingCycle.ANNUAL,
    };
  }

  return {
    amount: 0,
    billingCycle:
      BillingCycle.MANUAL,
  };
}

export async function ensureDefaultClinicBillingPlan(
  client: BillingClient = prisma
) {
  const existing =
    await client.clinicBillingPlan.findFirst(
      {
        where: {
          name:
            "Sheep Growth",
        },
        select: {
          id: true,
        },
      }
    );

  if (existing) {
    return client.clinicBillingPlan.update({
      where: {
        id: existing.id,
      },
      data: {
        description:
          "Plano comercial padrão da plataforma Sheep para contas clientes.",
        monthlyPrice: 249,
        annualPrice: 2490,
        trialDays: BILLING_POLICY.trialDays,
        active: true,
      },
    });
  }

  return client.clinicBillingPlan.create({
    data: {
      name:
        "Sheep Growth",
      description:
        "Plano comercial padrão da plataforma Sheep para contas clientes.",
      monthlyPrice: 249,
      annualPrice: 2490,
      trialDays: BILLING_POLICY.trialDays,
      active: true,
    },
  });
}

export async function createClinicInvoiceForSubscription(
  input: {
    clinicId: string;
    clinicSubscriptionId: string;
    amount: number;
    description: string;
    dueDate?: Date;
  },
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const invoice =
    await client.clinicInvoice.create({
    data: {
      clinicId: input.clinicId,
      clinicSubscriptionId:
        input.clinicSubscriptionId,
      amount: input.amount,
      description:
        input.description,
      dueDate:
        input.dueDate ??
        getDefaultDueDate(),
      status: PaymentStatus.PENDING,
    },
  });

  await createAuditLog(client, {
    clinicId: input.clinicId,
    actor:
      audit?.actor ?? "System",
    actorUserId:
      audit?.actorUserId ?? null,
    action: AuditAction.CREATE,
    entity: AuditEntity.CLINIC_INVOICE,
    entityId: invoice.id,
    entityLabel:
      invoice.description,
    metadata: {
      clinicSubscriptionId:
        input.clinicSubscriptionId,
      amount: invoice.amount,
      dueDate:
        invoice.dueDate.toISOString(),
      status: invoice.status,
    },
  });

  return invoice;
}

/**
 * Idempotent: a clinic with any pre-existing subscription (including a
 * CANCELED one) reuses it rather than provisioning a new gateway
 * customer/subscription — this is what keeps a company from ever getting a
 * second automatic trial (PAY-001). Granting a second trial is a deliberate
 * owner action, not something this function will do on its own.
 */
export async function ensureClinicBillingFoundation(
  clinicId: string,
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const existing =
    await client.clinicSubscription.findFirst(
      {
        where: {
          clinicId,
          status: {
            in: CLINIC_SUBSCRIPTION_REUSABLE_STATUSES.slice(),
          },
        },
        include: {
          clinicBillingPlan: true,
          invoices: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }
    );

  if (existing) {
    return existing;
  }

  const defaultPlan =
    await ensureDefaultClinicBillingPlan(
      client
    );

  const clinic =
    await client.clinic.findUniqueOrThrow({
      where: {
        id: clinicId,
      },
      select: {
        email: true,
        name: true,
        brandName: true,
      },
    });

  const gateway = getBillingGateway();
  const customer =
    await gateway.createCustomer({
      clinicId,
      email: clinic.email,
      name:
        clinic.brandName ?? clinic.name,
    });
  const gatewaySubscription =
    await gateway.createTrialSubscription(
      {
        clinicId,
        externalCustomerId:
          customer.externalCustomerId,
        trialDays: defaultPlan.trialDays,
      }
    );

  const startedAt = new Date();
  const trialEndsAt =
    gatewaySubscription.trialEndsAt ??
    (() => {
      const fallback = new Date(
        startedAt
      );
      fallback.setDate(
        fallback.getDate() +
          defaultPlan.trialDays
      );
      return fallback;
    })();

  const clinicSubscription =
    await client.clinicSubscription.create({
      data: {
        clinicId,
        clinicBillingPlanId:
          defaultPlan.id,
        status:
          ClinicSubscriptionStatus.TRIAL,
        startedAt,
        trialEndsAt,
        expiresAt: trialEndsAt,
        providerKind: gateway.kind,
        externalCustomerId:
          customer.externalCustomerId,
        externalSubscriptionId:
          gatewaySubscription.externalSubscriptionId,
        syncStatus:
          BillingSyncStatus.SYNCED,
        lastSyncedAt: startedAt,
      },
      include: {
        clinicBillingPlan: true,
        invoices: true,
      },
    });

  const invoiceAmount =
    defaultPlan.monthlyPrice ??
    defaultPlan.annualPrice ??
    0;

  await createClinicInvoiceForSubscription(
    {
      clinicId,
      clinicSubscriptionId:
        clinicSubscription.id,
      amount: invoiceAmount,
      description:
        "Primeira fatura da plataforma Sheep",
      dueDate: trialEndsAt,
    },
    client
  );

  await createAuditLog(client, {
    clinicId,
    actor: audit?.actor ?? "System",
    actorUserId:
      audit?.actorUserId ?? null,
    action: AuditAction.CREATE,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: clinicSubscription.id,
    entityLabel: defaultPlan.name,
    metadata: {
      providerKind: gateway.kind,
      externalCustomerId:
        customer.externalCustomerId,
      externalSubscriptionId:
        gatewaySubscription.externalSubscriptionId,
      status: clinicSubscription.status,
      trialDays: defaultPlan.trialDays,
      trialEndsAt:
        trialEndsAt.toISOString(),
    },
  });

  return client.clinicSubscription.findUnique(
    {
      where: {
        id: clinicSubscription.id,
      },
      include: {
        clinicBillingPlan: true,
        invoices: true,
      },
    }
  );
}

const GATEWAY_STATE_TO_LOCAL_STATUS: Record<
  BillingGatewaySubscriptionState,
  ClinicSubscriptionStatus
> = {
  trialing: ClinicSubscriptionStatus.TRIAL,
  active: ClinicSubscriptionStatus.ACTIVE,
  past_due:
    ClinicSubscriptionStatus.PAST_DUE,
  paused: ClinicSubscriptionStatus.PAUSED,
  canceled:
    ClinicSubscriptionStatus.CANCELED,
};

/**
 * Single place that turns "what the gateway just told us" into local
 * state. Never trust an optimistic local-only flip for pause/resume/
 * cancel/checkout — always come back through here with the gateway's own
 * response (PAY-002's checkout-return verification, PAY-003's webhooks,
 * PAY-004's manual resync all call this same function).
 */
export async function syncClinicSubscriptionFromGateway(
  subscriptionId: string,
  gatewaySubscription: BillingGatewaySubscription,
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const current =
    await client.clinicSubscription.findUniqueOrThrow(
      {
        where: {
          id: subscriptionId,
        },
      }
    );

  const nextStatus =
    GATEWAY_STATE_TO_LOCAL_STATUS[
      gatewaySubscription.state
    ];
  const now = new Date();

  const updated =
    await client.clinicSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        status: nextStatus,
        expiresAt:
          gatewaySubscription.currentPeriodEndsAt ??
          current.expiresAt,
        canceledAt:
          gatewaySubscription.canceledAt ??
          current.canceledAt,
        syncStatus:
          BillingSyncStatus.SYNCED,
        lastSyncedAt: now,
      },
    });

  if (nextStatus !== current.status) {
    await createAuditLog(client, {
      clinicId: current.clinicId,
      actor: audit?.actor ?? "System",
      actorUserId:
        audit?.actorUserId ?? null,
      action: AuditAction.UPDATE,
      entity:
        AuditEntity.CLINIC_SUBSCRIPTION,
      entityId: subscriptionId,
      metadata: {
        previousStatus: current.status,
        nextStatus,
        source: "gateway_sync",
        externalSubscriptionId:
          gatewaySubscription.externalSubscriptionId,
      },
    });
    await syncClinicModulesForSubscription(
      subscriptionId,
      client
    );
  }

  return updated;
}

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * A gateway payment succeeded (PAY-003 webhook: invoice.paid /
 * payment.succeeded). Reconciles the current invoice, creates the next
 * period's invoice, extends the subscription, and resets the retry
 * counter — all idempotent against re-delivery: every write here first
 * checks whether it already happened (same invoice already PAID, next
 * invoice already exists for that due date) before creating anything.
 */
export async function recordSuccessfulGatewayPayment(
  subscriptionId: string,
  gatewaySubscription: BillingGatewaySubscription,
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const subscription =
    await client.clinicSubscription.findUniqueOrThrow(
      {
        where: {
          id: subscriptionId,
        },
        include: {
          clinicBillingPlan: true,
          invoices: {
            orderBy: {
              dueDate: "desc",
            },
            take: 1,
          },
        },
      }
    );

  const actor = audit?.actor ?? "System";
  const actorUserId =
    audit?.actorUserId ?? null;
  const now = new Date();
  const periodAmount =
    subscription.clinicBillingPlan
      .monthlyPrice ??
    subscription.clinicBillingPlan
      .annualPrice ??
    0;

  let invoice =
    subscription.invoices[0] ?? null;

  if (
    !invoice ||
    invoice.status ===
      PaymentStatus.PAID
  ) {
    invoice =
      await client.clinicInvoice.create(
        {
          data: {
            clinicId:
              subscription.clinicId,
            clinicSubscriptionId:
              subscription.id,
            amount: periodAmount,
            description:
              "Cobrança recorrente da plataforma Sheep",
            dueDate: now,
            status:
              PaymentStatus.PENDING,
          },
        }
      );
  }

  if (
    invoice.status !==
    PaymentStatus.PAID
  ) {
    await client.clinicInvoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: PaymentStatus.PAID,
        paidAt: now,
      },
    });

    const existingPayment =
      await client.clinicPayment.findFirst(
        {
          where: {
            clinicInvoiceId: invoice.id,
            status: PaymentStatus.PAID,
          },
          select: {
            id: true,
          },
        }
      );

    if (!existingPayment) {
      await client.clinicPayment.create({
        data: {
          clinicId:
            subscription.clinicId,
          clinicInvoiceId: invoice.id,
          amount: invoice.amount,
          status: PaymentStatus.PAID,
          paidAt: now,
        },
      });
    }
  }

  // Anchor the next period off the invoice we just paid, not off
  // whatever the gateway reports as its own current period — a fake (or
  // even a real) gateway's period field can lag a webhook by a beat, and
  // trusting it blindly here risks computing a "next period" that
  // collides with the invoice date we just marked PAID. Only let the
  // gateway push the date later than our own computation, never earlier.
  const localNextPeriodEnd =
    addOneMonth(invoice.dueDate);
  const nextPeriodEnd =
    gatewaySubscription.currentPeriodEndsAt &&
    gatewaySubscription.currentPeriodEndsAt.getTime() >
      localNextPeriodEnd.getTime()
      ? gatewaySubscription.currentPeriodEndsAt
      : localNextPeriodEnd;

  const existingNextInvoice =
    await client.clinicInvoice.findFirst(
      {
        where: {
          clinicSubscriptionId:
            subscription.id,
          dueDate: nextPeriodEnd,
        },
      }
    );

  if (!existingNextInvoice) {
    await client.clinicInvoice.create({
      data: {
        clinicId: subscription.clinicId,
        clinicSubscriptionId:
          subscription.id,
        amount: periodAmount,
        description:
          "Próxima cobrança recorrente da plataforma Sheep",
        dueDate: nextPeriodEnd,
        status: PaymentStatus.PENDING,
      },
    });
  }

  await client.clinicSubscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status:
        ClinicSubscriptionStatus.ACTIVE,
      expiresAt: nextPeriodEnd,
      paymentRetryCount: 0,
      nextPaymentAttemptAt: null,
      syncStatus:
        BillingSyncStatus.SYNCED,
      lastSyncedAt: now,
    },
  });

  await syncClinicModulesForSubscription(
    subscription.id,
    client
  );

  await createAuditLog(client, {
    clinicId: subscription.clinicId,
    actor,
    actorUserId,
    action: AuditAction.MARK_INVOICE_PAID,
    entity: AuditEntity.CLINIC_INVOICE,
    entityId: invoice.id,
    entityLabel: invoice.description,
    metadata: {
      source: "webhook",
      event: "payment_succeeded",
      nextPeriodEnd:
        nextPeriodEnd.toISOString(),
      externalSubscriptionId:
        gatewaySubscription.externalSubscriptionId,
    },
  });
}

/**
 * A gateway payment failed (PAY-003 webhook: invoice.payment_failed /
 * payment.failed). Marks the invoice OVERDUE and bumps the retry
 * counter — access stays open (`canClinicOperate` allows PAST_DUE) until
 * the tolerance window in `BILLING_POLICY` elapses, at which point the
 * existing time-based reconciliation (`deriveAutomatedClinicSubscriptionStatus`)
 * escalates to SUSPENDED on its own the next time it runs.
 */
export async function recordFailedGatewayPayment(
  subscriptionId: string,
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const subscription =
    await client.clinicSubscription.findUniqueOrThrow(
      {
        where: {
          id: subscriptionId,
        },
        include: {
          invoices: {
            orderBy: {
              dueDate: "desc",
            },
            take: 1,
          },
        },
      }
    );

  const actor = audit?.actor ?? "System";
  const actorUserId =
    audit?.actorUserId ?? null;
  const invoice =
    subscription.invoices[0] ?? null;

  if (
    invoice &&
    invoice.status !==
      PaymentStatus.PAID &&
    invoice.status !==
      PaymentStatus.OVERDUE
  ) {
    await client.clinicInvoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  }

  const nextAttemptCount =
    subscription.paymentRetryCount + 1;
  const withinAttempts =
    nextAttemptCount <
    BILLING_POLICY.maxPaymentRetryAttempts;
  const intervalDays = Math.max(
    1,
    Math.floor(
      BILLING_POLICY.paymentRetryToleranceDays /
        BILLING_POLICY.maxPaymentRetryAttempts
    )
  );
  const nextPaymentAttemptAt =
    withinAttempts
      ? new Date(
          Date.now() +
            intervalDays *
              24 *
              60 *
              60 *
              1000
        )
      : null;

  await client.clinicSubscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status:
        ClinicSubscriptionStatus.PAST_DUE,
      paymentRetryCount:
        nextAttemptCount,
      nextPaymentAttemptAt,
      syncStatus:
        BillingSyncStatus.SYNCED,
      lastSyncedAt: new Date(),
    },
  });

  await syncClinicModulesForSubscription(
    subscription.id,
    client
  );

  await createAuditLog(client, {
    clinicId: subscription.clinicId,
    actor,
    actorUserId,
    action:
      AuditAction.MARK_INVOICE_OVERDUE,
    entity:
      AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    metadata: {
      source: "webhook",
      event: "payment_failed",
      attempt: nextAttemptCount,
      nextPaymentAttemptAt:
        nextPaymentAttemptAt?.toISOString() ??
        null,
    },
  });
}

/**
 * Self-service data for the company's own "Assinatura" tab (PAY-002).
 * `verifyWithGateway` re-asks the gateway for the live subscription state
 * before returning — this is what makes a checkout/portal return trip
 * trustworthy on its own (never just believing a `?checkout=success`
 * query string), and it's a plain read-through-then-sync, safe to call on
 * every page load.
 */
export async function getCompanySubscriptionOverview(
  input: {
    verifyWithGateway?: boolean;
  } = {}
) {
  const clinicId =
    await getCurrentClinicId();

  let subscription =
    await ensureClinicBillingFoundation(
      clinicId
    );

  if (!subscription) {
    throw new Error(
      "Billing foundation is missing for this clinic."
    );
  }

  if (
    input.verifyWithGateway &&
    subscription.providerKind !==
      "MANUAL" &&
    subscription.externalSubscriptionId
  ) {
    const gateway = getBillingGateway();
    const live =
      await gateway.getSubscription(
        subscription.externalSubscriptionId
      );

    if (live) {
      await syncClinicSubscriptionFromGateway(
        subscription.id,
        live
      );
      subscription =
        await prisma.clinicSubscription.findUnique(
          {
            where: {
              id: subscription.id,
            },
            include: {
              clinicBillingPlan: true,
              invoices: true,
            },
          }
        );
    }
  }

  return subscription;
}

export async function createPatientInvoiceForSubscription(
  input: {
    clinicId: string;
    patientId: string;
    subscriptionId: string;
    plan: {
      id: string;
      name: string;
      monthlyPrice: number | null;
      annualPrice: number | null;
    };
    billingCycle?: BillingCycle;
    dueDate?: Date;
    description?: string;
  },
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const terms =
    resolveMembershipInvoiceTerms(
      input.plan,
      input.billingCycle
    );

  const invoice =
    await client.patientInvoice.create({
    data: {
      clinicId: input.clinicId,
      patientId: input.patientId,
      subscriptionId:
        input.subscriptionId,
      billingCycle:
        terms.billingCycle,
      amount: terms.amount,
      dueDate:
        input.dueDate ??
        getDefaultDueDate(),
      description:
        input.description ??
        `${input.plan.name} subscription invoice`,
      status: PaymentStatus.PENDING,
    },
  });

  await createAuditLog(client, {
    clinicId: input.clinicId,
    actor:
      audit?.actor ?? "System",
    actorUserId:
      audit?.actorUserId ?? null,
    action: AuditAction.CREATE,
    entity: AuditEntity.PATIENT_INVOICE,
    entityId: invoice.id,
    entityLabel:
      invoice.description,
    metadata: {
      patientId: input.patientId,
      subscriptionId:
        input.subscriptionId,
      billingCycle:
        invoice.billingCycle,
      amount: invoice.amount,
      dueDate:
        invoice.dueDate.toISOString(),
      status: invoice.status,
    },
  });

  return invoice;
}

export async function getBillingOverview() {
  const { clinicId } =
    await getCurrentClinicContext();
  const currentUser =
    await requireCurrentAppUser();

  await reconcileClinicSubscriptionAutomation();

  const clinicSubscription =
    await ensureClinicBillingFoundation(
      clinicId
    );

  const [
    patientInvoices,
    clinicInvoices,
    overduePatientInvoiceCount,
    monthlyPatientRevenue,
    platformMetrics,
  ] = await Promise.all([
    prisma.patientInvoice.findMany({
      where: filterByClinic(clinicId),
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            membershipPlan: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            paidAt: "desc",
          },
          select: {
            id: true,
            amount: true,
            paidAt: true,
            status: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.clinicInvoice.findMany({
      where: filterByClinic(clinicId),
      include: {
        clinicSubscription: {
          select: {
            id: true,
            status: true,
          },
        },
        payments: {
          orderBy: {
            paidAt: "desc",
          },
          select: {
            id: true,
            amount: true,
            paidAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.patientInvoice.count({
      where: filterByClinic(clinicId, {
        status: PaymentStatus.OVERDUE,
      }),
    }),
    prisma.patientInvoice.aggregate({
      where: filterByClinic(clinicId, {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ),
        },
      }),
      _sum: {
        amount: true,
      },
    }),
    currentUser.clinicId == null &&
    (currentUser.role === "OWNER" ||
      currentUser.role === "ADMIN")
      ? Promise.all([
          prisma.clinic.count({
            where: {
              status: ClinicStatus.ACTIVE,
            },
          }),
          prisma.clinicSubscription.count({
            where: {
              status:
                ClinicSubscriptionStatus.TRIAL,
            },
          }),
          prisma.clinicSubscription.count({
            where: {
              status:
                ClinicSubscriptionStatus.PAST_DUE,
            },
          }),
          prisma.clinicInvoice.aggregate({
            where: {
              status: PaymentStatus.PAID,
              paidAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
            _sum: {
              amount: true,
            },
          }),
        ]).then(
          ([
            activeClinics,
            trialClinics,
            pastDueClinics,
            monthlySaasRevenue,
          ]) => ({
            activeClinics,
            trialClinics,
            pastDueClinics,
            monthlySaasRevenue:
              monthlySaasRevenue
                ._sum.amount ?? 0,
          })
        )
      : Promise.resolve(null),
  ]);

  return {
    patientInvoices,
    clinicSubscription,
    clinicInvoices,
    overduePatientInvoiceCount,
    monthlyPatientRevenue:
      monthlyPatientRevenue._sum
        .amount ?? 0,
    platformMetrics,
  };
}

export async function getPlatformClinicBillingOverview() {
  await ensureDefaultClinicBillingPlan();
  await reconcileClinicSubscriptionAutomation();

  const [
    availablePlans,
    allPlans,
    clinicSubscriptions,
    platformMetrics,
  ] = await Promise.all([
    prisma.clinicBillingPlan.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.clinicBillingPlan.findMany({
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.clinicSubscription.findMany({
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            brandName: true,
            email: true,
            status: true,
            logoUrl: true,
          },
        },
        clinicBillingPlan: true,
        invoices: {
          orderBy: {
            dueDate: "desc",
          },
          take: 3,
          include: {
            payments: {
              orderBy: {
                paidAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    }),
    Promise.all([
      prisma.clinic.count({
        where: {
          status: ClinicStatus.ACTIVE,
        },
      }),
      prisma.clinicSubscription.count({
        where: {
          status:
            ClinicSubscriptionStatus.TRIAL,
        },
      }),
      prisma.clinicSubscription.count({
        where: {
          status:
            ClinicSubscriptionStatus.PAST_DUE,
        },
      }),
      prisma.clinicInvoice.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]).then(
      ([
        activeClinics,
        trialClinics,
        pastDueClinics,
        monthlySaasRevenue,
      ]) => ({
        activeClinics,
        trialClinics,
        pastDueClinics,
        monthlySaasRevenue:
          monthlySaasRevenue._sum
            .amount ?? 0,
      })
    ),
  ]);

  return {
    availablePlans,
    allPlans,
    clinicSubscriptions,
    platformMetrics,
  };
}

/**
 * Full (uncapped) subscription/invoice/payment history for a single clinic
 * — used by the "Plano e cobrança" tab of the empresa workspace. Unlike
 * `getPlatformClinicBillingOverview`, this does not fetch or reconcile the
 * whole platform on every call.
 */
export async function getClinicBillingDetail(
  clinicId: string
) {
  const [subscriptions, allPlans] =
    await Promise.all([
      prisma.clinicSubscription.findMany({
        where: {
          clinicId,
        },
        include: {
          clinicBillingPlan: true,
          invoices: {
            include: {
              payments: {
                orderBy: {
                  paidAt: "desc",
                },
              },
            },
            orderBy: {
              dueDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clinicBillingPlan.findMany({
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

  return {
    subscriptions,
    allPlans,
  };
}

export async function syncClinicSubscriptionStatusFromInvoice(
  clinicInvoiceId: string,
  status: PaymentStatus,
  client: BillingClient = prisma,
  clinicId?: string
) {
  const invoice =
    await client.clinicInvoice.findFirst({
      where: {
        id: clinicInvoiceId,
        ...(clinicId
          ? {
              clinicId,
            }
          : {}),
      },
      select: {
        clinicSubscriptionId: true,
        clinicSubscription: {
          select: {
            status: true,
          },
        },
      },
    });

  if (!invoice) {
    return;
  }

  const updatedSubscription =
    await client.clinicSubscription.update({
    where: {
      id: invoice.clinicSubscriptionId,
    },
    data: {
      status:
        getClinicStatusFromInvoiceStatus(
          invoice.clinicSubscription
            .status,
          status
        ),
    },
  });

  await syncClinicModulesForSubscription(
    updatedSubscription.id,
    client
  );
}

export function canTransitionClinicSubscriptionStatus(
  currentStatus: ClinicSubscriptionStatus,
  nextStatus: ClinicSubscriptionStatus
) {
  return CLINIC_SUBSCRIPTION_TRANSITIONS[
    currentStatus
  ].includes(nextStatus);
}

export async function updateClinicSubscriptionStatus(
  input: {
    clinicId: string;
    subscriptionId: string;
    status: ClinicSubscriptionStatus;
    trialEndsAt?: Date;
  },
  client: BillingClient = prisma,
  audit?: AuditContext
) {
  const subscription =
    await client.clinicSubscription.findFirst({
      where: {
        id: input.subscriptionId,
        clinicId: input.clinicId,
      },
      include: {
        clinicBillingPlan: true,
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

  if (!subscription) {
    throw new Error(
      "Clinic subscription not found."
    );
  }

  if (subscription.status === input.status) {
    return subscription;
  }

  if (
    !canTransitionClinicSubscriptionStatus(
      subscription.status,
      input.status
    )
  ) {
    throw new Error(
      `Clinic subscription cannot transition from ${subscription.status} to ${input.status}.`
    );
  }

  const now = new Date();
  const isActivatingTrial =
    input.status ===
      ClinicSubscriptionStatus.TRIAL &&
    Boolean(input.trialEndsAt);
  const updated =
    await client.clinicSubscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: input.status,
        canceledAt:
          input.status ===
          ClinicSubscriptionStatus.CANCELED
            ? now
            : null,
        ...(isActivatingTrial
          ? {
              trialEndsAt:
                input.trialEndsAt,
              expiresAt:
                input.trialEndsAt,
            }
          : {}),
      },
      include: {
        clinicBillingPlan: true,
        invoices: true,
      },
    });

  if (isActivatingTrial && input.trialEndsAt) {
    const nextInstallmentAmount =
      updated.clinicBillingPlan
        .monthlyPrice ??
      updated.clinicBillingPlan
        .annualPrice ??
      0;

    await createClinicInvoiceForSubscription(
      {
        clinicId: input.clinicId,
        clinicSubscriptionId:
          updated.id,
        amount: nextInstallmentAmount,
        description:
          "Cobrança após período de testes",
        dueDate: input.trialEndsAt,
      },
      client,
      audit
    );
  }

  await createAuditLog(client, {
    clinicId: input.clinicId,
    actor:
      audit?.actor ?? "System",
    actorUserId:
      audit?.actorUserId ?? null,
    action:
      input.status ===
      ClinicSubscriptionStatus.CANCELED
        ? AuditAction.DEACTIVATE
        : AuditAction.UPDATE,
    entity: AuditEntity.CLINIC_SUBSCRIPTION,
    entityId: subscription.id,
    entityLabel:
      subscription.clinicBillingPlan.name,
    metadata: {
      previousStatus:
        subscription.status,
      nextStatus: input.status,
      lastInvoiceStatus:
        subscription.invoices[0]?.status ??
        null,
    },
  });

  await syncClinicModulesForSubscription(
    updated.id,
    client
  );

  return updated;
}

export async function syncClinicModulesForSubscription(
  subscriptionId: string,
  client: BillingClient = prisma
) {
  const subscription =
    await client.clinicSubscription.findUnique({
      where: {
        id: subscriptionId,
      },
      select: {
        id: true,
        clinicId: true,
        status: true,
      },
    });

  if (!subscription) {
    return null;
  }

  const membershipModule =
    await client.module.findFirst({
      where: {
        key: "MEMBERSHIP",
      },
      select: {
        id: true,
      },
    });

  if (!membershipModule) {
    return subscription;
  }

  await client.clinicModule.upsert({
    where: {
      clinicId_moduleId: {
        clinicId: subscription.clinicId,
        moduleId: membershipModule.id,
      },
    },
    update: {
      status: canClinicOperate(
        subscription.status
      )
        ? "ENABLED"
        : "DISABLED",
      enabledAt: canClinicOperate(
        subscription.status
      )
        ? new Date()
        : null,
      disabledAt: canClinicOperate(
        subscription.status
      )
        ? null
        : new Date(),
    },
    create: {
      clinicId: subscription.clinicId,
      moduleId: membershipModule.id,
      status: canClinicOperate(
        subscription.status
      )
        ? "ENABLED"
        : "DISABLED",
      enabledAt: canClinicOperate(
        subscription.status
      )
        ? new Date()
        : null,
      disabledAt: canClinicOperate(
        subscription.status
      )
        ? null
        : new Date(),
    },
  });

  return subscription;
}

export async function getPatientInvoicesByFilters(
  input: {
    patientId?: string;
    subscriptionId?: string;
  } = {}
) {
  const clinicId =
    await getCurrentClinicId();

  return prisma.patientInvoice.findMany({
    where: filterByClinic(clinicId, {
      ...(input.patientId
        ? {
            patientId:
              input.patientId,
          }
        : {}),
      ...(input.subscriptionId
        ? {
            subscriptionId:
              input.subscriptionId,
          }
        : {}),
    }),
    include: {
      patient: {
        select: {
          fullName: true,
        },
      },
      subscription: {
        select: {
          id: true,
          membershipPlan: {
            select: {
              name: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          paidAt: "desc",
        },
        select: {
          id: true,
          amount: true,
          paidAt: true,
          status: true,
          paymentMethod: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}
