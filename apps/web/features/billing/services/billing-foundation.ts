import {
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
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

type BillingClient =
  | typeof prisma
  | Prisma.TransactionClient;

function getDefaultDueDate(days = 7) {
  const dueDate = new Date();
  dueDate.setDate(
    dueDate.getDate() + days
  );

  return dueDate;
}

function getClinicStatusFromInvoiceStatus(
  status: PaymentStatus
) {
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
            "Nortex Membership Platform",
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
          "Default commercial platform plan for V1 membership clinics.",
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
        "Nortex Membership Platform",
      description:
        "Default commercial platform plan for V1 membership clinics.",
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
  client: BillingClient = prisma
) {
  return client.clinicInvoice.create({
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
}

export async function ensureClinicBillingFoundation(
  clinicId: string,
  client: BillingClient = prisma
) {
  const defaultPlan =
    await ensureDefaultClinicBillingPlan(
      client
    );

  const existing =
    await client.clinicSubscription.findFirst(
      {
        where: {
          clinicId,
          status: {
            in: [
              ClinicSubscriptionStatus.TRIAL,
              ClinicSubscriptionStatus.ACTIVE,
              ClinicSubscriptionStatus.PAST_DUE,
              ClinicSubscriptionStatus.SUSPENDED,
            ],
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
          ClinicSubscriptionStatus.TRIAL,
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
        "Initial Nortex platform invoice",
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
  client: BillingClient = prisma
) {
  const terms =
    resolveMembershipInvoiceTerms(
      input.plan,
      input.billingCycle
    );

  return client.patientInvoice.create({
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
}

export async function getBillingOverview() {
  const { clinicId } =
    await getCurrentClinicContext();
  const currentUser =
    await requireCurrentAppUser();

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
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.clinicInvoice.findMany({
      where: filterByClinic(clinicId),
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
      },
    });

  if (!invoice) {
    return;
  }

  await client.clinicSubscription.update({
    where: {
      id: invoice.clinicSubscriptionId,
    },
    data: {
      status:
        getClinicStatusFromInvoiceStatus(
          status
        ),
    },
  });
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
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}
