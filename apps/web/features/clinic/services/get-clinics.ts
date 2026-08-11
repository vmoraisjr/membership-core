import { PaymentStatus } from "@prisma/client";

import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

import prisma from "@/lib/prisma";

function withMonthlyRevenue<
  T extends {
    id: string;
    clinicInvoices: Array<{
      amount: number;
    }>;
  },
>(clinics: T[]) {
  return clinics.map((clinic) => ({
    ...clinic,
    monthlyRevenue:
      clinic.clinicInvoices.reduce(
        (total, invoice) =>
          total + invoice.amount,
        0
      ),
  }));
}

function clinicIncludeArgs() {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  return {
    _count: {
      select: {
        patients: true,
        membershipPlans: true,
        appUsers: true,
      },
    },
    clinicSubscriptions: {
      orderBy: {
        createdAt: "desc" as const,
      },
      take: 1,
      include: {
        clinicBillingPlan: {
          select: {
            name: true,
          },
        },
      },
    },
    clinicInvoices: {
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startOfMonth,
        },
      },
      select: {
        amount: true,
      },
    },
  };
}

export async function getClinics() {
  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.clinicId) {
    if (
      currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN"
    ) {
      return [];
    }

    const clinics =
      await prisma.clinic.findMany({
        include: clinicIncludeArgs(),
        orderBy: {
          createdAt: "desc",
        },
      });

    return withMonthlyRevenue(clinics);
  }

  const clinics =
    await prisma.clinic.findMany({
      where: {
        id: currentUser.clinicId,
      },
      include: clinicIncludeArgs(),
      orderBy: {
        createdAt: "desc",
      },
    });

  return withMonthlyRevenue(clinics);
}
