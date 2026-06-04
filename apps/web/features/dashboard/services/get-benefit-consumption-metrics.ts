import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getBenefitConsumptionMetrics() {
  const clinic = await getCurrentClinic();
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
  const nextMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const [monthlyUsage, totalUsageEvents] =
    await Promise.all([
      prisma.benefitUsage.aggregate({
        where: {
          subscription: {
            patient: {
              clinicId: clinic.id,
            },
          },
          usedAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: {
          quantity: true,
        },
      }),
      prisma.benefitUsage.count({
        where: {
          subscription: {
            patient: {
              clinicId: clinic.id,
            },
          },
        },
      }),
    ]);

  return {
    consumedThisMonth:
      monthlyUsage._sum.quantity ?? 0,
    totalUsageEvents,
  };
}
