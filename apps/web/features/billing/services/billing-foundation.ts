import {
  AuditAction,
  AuditEntity,
  BillingCycle,
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
    ClinicSubscriptionStatus.SUSPENDED,
    ClinicSubscriptionStatus.CANCELED,
  ],
  ACTIVE: [
    ClinicSubscriptionStatus.PAST_DUE,
    ClinicSubscriptionStatus.SUSPENDED,
    ClinicSubscriptionStatus.CANCELED,
  ],
  PAST_DUE: [
    ClinicSubscriptionStatus.ACTIVE,
    ClinicSubscriptionStatus.SUSPENDED,
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

  const latestInvoice =
    subscription.invoices?.[0];

  if (
    latestInvoice?.status ===
      PaymentStatus.OVERDUE &&
    latestInvoice.dueDate.getTime() <
      now.getTime() - 1000 * 60 * 60 * 24 * 30
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
    return ClinicSubscriptionStatus.ACTIVE;
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

async function reconcileClinicSubscriptionAutomation(
  client: BillingClient = prisma
) {
  const subscriptions =
    await client.clinicSubscription.findMany({
      where: {
        status: {
          not:
            ClinicSubscriptionStatus.CANCELED,
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
      ClinicSubscriptionStatus.TRIAL
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
        trialDays: 14,
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
      trialDays: 14,
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

export async function ensureClinicBillingFoundation(
  clinicId: string,
  client: BillingClient = prisma
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

  const startedAt = new Date();
  const trialEndsAt = new Date(
    startedAt
  );
  trialEndsAt.setDate(
    trialEndsAt.getDate() +
      defaultPlan.trialDays
  );

  const clinicSubscription =
    await client.clinicSubscription.create({
      data: {
        clinicId,
        clinicBillingPlanId:
          defaultPlan.id,
        status:
          ClinicSubscriptionStatus.PENDING,
        startedAt,
        trialEndsAt,
        expiresAt: trialEndsAt,
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
      },
      include: {
        clinicBillingPlan: true,
        invoices: true,
      },
    });

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
