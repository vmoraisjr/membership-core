import prisma from "@/lib/prisma";
import { getCurrentClinicContext } from "@/lib/auth/tenant";
import { filterByClinic } from "@/lib/auth/tenant";
import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function getMembershipPlans() {
  const { clinicId } =
    await getCurrentClinicContext();

  return prisma.membershipPlan.findMany({
    where: filterByClinic(clinicId),
    include: {
      benefits: {
        orderBy: {
          title: "asc",
        },
      },
      subscriptions: {
        where: {
          status: {
            in: [
              ...MANAGEABLE_SUBSCRIPTION_STATUSES,
            ],
          },
        },
        select: {
          id: true,
          patientId: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
