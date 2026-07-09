import {
  AuditEntity,
  ClinicSubscriptionStatus,
  PaymentStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

export async function getPlatformClinicDetails(
  clinicId: string
) {
  const currentUser =
    await requireCurrentAppUser();

  if (
    currentUser.clinicId ||
    (currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN")
  ) {
    throw new Error(
      "Apenas a plataforma pode acessar os detalhes operacionais da clínica."
    );
  }

  const clinic =
    await prisma.clinic.findUniqueOrThrow({
      where: {
        id: clinicId,
      },
      include: {
        _count: {
          select: {
            patients: true,
            membershipPlans: true,
            appUsers: true,
          },
        },
        appUsers: {
          where: {
            isClinicMaster: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            lastLoginAt: true,
            mustChangePassword: true,
            status: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        clinicSubscriptions: {
          include: {
            clinicBillingPlan: true,
            invoices: {
              include: {
                payments: {
                  orderBy: {
                    paidAt: "desc",
                  },
                  take: 3,
                },
              },
              orderBy: {
                dueDate: "desc",
              },
              take: 6,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 6,
        },
      },
    });

  const auditLogs =
    await prisma.auditLog.findMany({
      where: {
        clinicId,
        entity: {
          in: [
            AuditEntity.CLINIC,
            AuditEntity.CLINIC_SUBSCRIPTION,
            AuditEntity.CLINIC_INVOICE,
            AuditEntity.CLINIC_PAYMENT,
            AuditEntity.APP_USER,
            AuditEntity.MODULE,
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

  const latestSubscription =
    clinic.clinicSubscriptions[0] ?? null;
  const latestInvoice =
    latestSubscription?.invoices[0] ?? null;

  const metrics = {
    patients: clinic._count.patients,
    plans: clinic._count.membershipPlans,
    users: clinic._count.appUsers,
    platformPlan:
      latestSubscription
        ?.clinicBillingPlan.name ??
      "Sem plano",
    platformStatus:
      latestSubscription?.status ??
      ClinicSubscriptionStatus.PENDING,
    nextDueDate:
      latestInvoice?.dueDate ?? null,
    latestPaymentStatus:
      latestInvoice?.status ??
      PaymentStatus.PENDING,
  };

  return {
    clinic,
    metrics,
    auditLogs,
  };
}
